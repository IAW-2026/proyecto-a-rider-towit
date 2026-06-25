# Guía de Uso de la API de Customer App para Tower App

Este documento describe los endpoints que la **Customer App** expone para que la **Tower App** los consuma. Permite asignar torres a viajes y consultar información de viajes.

## Autenticación

Todos los endpoints requieren una clave API secreta (`x-api-key`) en el encabezado de la solicitud para autenticación.

**Header Requerido:**
`x-api-key: [TU_API_KEY]`

Si la clave es inválida o no se envía, la API responde con `401 Unauthorized`.

---

## Endpoints Implementados

### 1. Asignar Torre a un Viaje

La **Tower App** debe llamar a este endpoint cuando un conductor acepta un viaje. Asigna el `tower_id` al viaje y actualiza su estado (ej: de `"pago confirmado"` a `"en proceso"`).

*   **Endpoint:** `/api/customer/trips/{trip_id}`
*   **Método:** `PATCH`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `x-api-key: [TU_API_KEY]`

*   **Parámetros de Ruta:**
    *   `trip_id` (number, **requerido**): El **ID numérico** del viaje (ej: `42`). No usar el Clerk ID del usuario. Este valor es el mismo que se envía como `trip.id` en el POST `/api/tower/requests`.

*   **Cuerpo de la Solicitud (JSON):**
    ```json
    {
      "tower_id": "string",
      "status": "string"
    }
    ```
    *   `tower_id` (requerido): ID único de la torre/conductor que acepta el viaje.
    *   `status` (requerido): Nuevo estado del viaje (se mapea automáticamente):

        | Valor TowerApp | Almacenado en DB |
        |---|---|
        | `"pending"` | `"pago confirmado"` |
        | `"accepted"` | `"en proceso"` |
        | `"completed"` / `"finalizado"` | `"finalizado"` |
        | `"cancelled"` / `"canceled"` / `"cancelado"` | `"cancelado"` |

        También se puede enviar el valor en español directamente (ej: `"en proceso"`, `"cancelado"`).

*   **Respuestas Posibles:**

    *   **200 OK - Torre Asignada Exitosamente**
        ```json
        {}
        ```

    *   **400 Bad Request - Faltan Campos Requeridos**
        ```json
        {
          "error": "tower_id and status are required"
        }
        ```

    *   **401 Unauthorized - No Autorizado**
        ```json
        {
          "error": "Unauthorized"
        }
        ```

    *   **404 Not Found - Viaje No Encontrado**
        ```json
        {
          "error": "Trip not found"
        }
        ```

    *   **500 Internal Server Error - Error Interno del Servidor**
        ```json
        {
          "error": "Internal server error"
        }
        ```

*   **Ejemplo `curl`:**
    ```bash
    curl -X PATCH \
      http://localhost:3001/api/customer/trips/42 \
      -H "x-api-key: TU_API_KEY_AQUI" \
      -H "Content-Type: application/json" \
      -d '{
            "tower_id": "tow_uuid_abc123",
            "status": "en proceso"
          }'
    ```

---

### 2. Consultar Viajes de un Usuario

La **Tower App** puede consultar los viajes asociados a un usuario (ya sea como cliente o como conductor/torre).

*   **Endpoint:** `/api/customer/trips/{clerk_id}`
*   **Método:** `GET`
*   **Headers:**
    *   `x-api-key: [TU_API_KEY]`

*   **Parámetros de Ruta:**
    *   `clerk_id` (string): El ID de Clerk del usuario (puede ser el ID del cliente o el ID de la torre).

*   **Cuerpo de la Solicitud (JSON):** Vacío (no aplica para GET).

*   **Respuestas Posibles:**

    *   **200 OK - Lista de Viajes**
        ```json
        [
          {
            "trip_id": "string",
            "customer_id": "string",
            "customer_clerk_id": "string",
            "vehicle_id": "string | null",
            "tower_id": "string",
            "origin": {
              "lat": "string",
              "long": "string"
            },
            "destination": {
              "lat": "string",
              "long": "string"
            },
            "status": "string",
            "estimated_price": "number | null",
            "date": "string"
          }
        ]
        ```
        Los viajes se retornan ordenados por fecha descendente (más reciente primero).
        **Estados posibles:** `"pendiente pago"`, `"pago confirmado"`, `"en proceso"`, `"finalizado"`, `"cancelado"`.

    *   **401 Unauthorized - No Autorizado**
        ```json
        {
          "error": "Unauthorized"
        }
        ```

    *   **404 Not Found - Viajes No Encontrados**
        ```json
        {
          "error": "No trips found for the given clerk_id"
        }
        ```

    *   **500 Internal Server Error - Error Interno del Servidor**
        ```json
        {
          "error": "<mensaje de error>"
        }
        ```

*   **Ejemplo `curl`:**
    ```bash
    curl -X GET \
      http://localhost:3001/api/customer/trips/user_2abc123def \
      -H "x-api-key: TU_API_KEY_AQUI"
    ```

---

## Flujo de Integración Típico

1. **Customer App** crea un viaje y solicita una torre via `POST /api/tower/requests`.
2. La **Tower App** almacena la solicitud en Redis con estado `"pending"`.
3. Un conductor acepta el viaje → **Tower App** llama a `PATCH /api/customer/trips/{trip_id}` con `tower_id` y `status: "en proceso"`.
4. La **Customer App** actualiza el viaje en su DB local.
5. La **Customer App** consulta el estado periodicamente via `GET /api/tower/requests/{trip_id}` para obtener ubicación en vivo.
6. Si el cliente cancela, la **Customer App** llama a `PATCH /api/tower/requests/{trip_id}` para notificar a la **Tower App**.

---

## Consideraciones

- La URL base de la **Customer App** puede variar según el entorno (`localhost:3000` en desarrollo, URL de producción en deploy).
- Todas las fechas se devuelven en formato ISO (`YYYY-MM-DD`).
- Los estados de viaje usan español: `"pendiente pago"`, `"pago confirmado"`, `"en proceso"`, `"finalizado"`, `"cancelado"`.
