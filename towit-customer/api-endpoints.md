# API Endpoints — TowIt Customer App

## Endpoints que esta App CONSUME (Outgoing)

### Tower App (`proyecto-a-driver2-towit.vercel.app`)

| Método | Endpoint                          | Quién lo llama                       | Para qué                                                          |
| ------- | --------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| POST    | `/api/tower/requests`           | `confirmPaymentAction`              | Enviar solicitud de grúa después de confirmar pago               |
| GET     | `/api/tower/requests/{trip_id}` | `startPolling` (cliente cada 800ms) | Consultar estado y ubicación de la grúa asignada                 |
| PATCH   | `/api/tower/requests/{trip_id}` | `cancelTripAction`                  | Cancelar solicitud de grúa                                        |
| GET     | `/api/tower/drivers/{tower_id}` | `getTripsAction` (historial)        | Obtener datos del conductor (nombre, teléfono, vehículo, rating) |

**Auth:** `x-api-key`

---

### Payments App (`payments-towit-six.vercel.app`)

| Método        | Endpoint                            | Quién lo llama      | Para qué                                |
| -------------- | ----------------------------------- | -------------------- | ---------------------------------------- |
| POST           | `/api/payments`                   | `createTripAction` | Registrar cobro pendiente al crear viaje |
| POST           | `/api/refunds`                    | `cancelTripAction` | Solicitar reembolso al cancelar viaje    |
| GET (redirect) | `/payments/{trip_id}?return_url=` | `RequestRideForm`  | Redirigir usuario a pagar                |

**Auth (server-to-server):** `Authorization: Bearer {api_secret}`
**Redirect:** sin auth (público, usuario en browser)

---

### Feedback App (`proyecto-a-feedback2-towit.vercel.app`)

| Método        | Endpoint                               | Quién lo llama          | Para qué                                     |
| -------------- | -------------------------------------- | ------------------------ | --------------------------------------------- |
| POST           | `/api/feedback`                      | `getTripsAction`       | Obtener calificación de un viaje completado  |
| POST           | `/api/feedback`                      | `submitFeedbackAction` | Enviar calificación y comentario del usuario |
| GET            | `/api/feedback/avg_rating/{user_id}` | `getAvgRatingAction`   | Obtener rating promedio del usuario           |
| GET (redirect) | `/rate/{trip_id}?return_url=`        | `RequestRideForm`      | Redirigir usuario a calificar el viaje        |

**Auth (server-to-server):** `x-api-key`
**Redirect:** sin auth (público, usuario en browser)

---

### OSRM (Open Source Routing Machine)

| Método | Endpoint                             | Quién lo llama                  | Para qué                                                                    |
| ------- | ------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------- |
| GET     | `/{lon1},{lat1};{lon2},{lat2}?...` | `fetchOsrmRoute` / `Map.tsx` | Obtener ruta entre origen y destino (animación de grúa + polyline en mapa) |

**Auth:** ninguna (pública, rate-limited)

---

### Nominatim (OpenStreetMap Geocoding)

| Método | Endpoint                                 | Quién lo llama                 | Para qué                                                         |
| ------- | ---------------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| GET     | `/search?q={query}&countrycodes=ar...` | `AddressSearch.tsx` (cliente) | Geocoding directo: buscar direcciones mientras el usuario escribe |
| GET     | `/reverse?lat={lat}&lon={lon}...`      | `geocodeAction` (servidor)    | Geocoding inverso: mostrar dirección legible en el historial     |

**Auth:** ninguna (pública, requiere `User-Agent`)

---

### Clerk (SDK)

| Endpoint                                     | Quién lo llama           | Para qué                                 |
| -------------------------------------------- | ------------------------- | ----------------------------------------- |
| `currentUser()`                            | Múltiples server actions | Obtener usuario autenticado               |
| `clerkClient().users.updateUserMetadata()` | Webhook `user.created`  | Asignar rol `customer` al nuevo usuario |

---

### Neon Database (PostgreSQL vía Drizzle ORM)

| Tablas                              | Para qué                                                         |
| ----------------------------------- | ----------------------------------------------------------------- |
| `Customer`, `Vehicle`, `Trip` | Toda la lógica de negocio (CRUD de viajes, vehículos, clientes) |

---

## Endpoints que esta App EXPONE (Incoming)

Todas las rutas internas requieren `x-api-key` + `INTERNAL_API_SECRET` (excepto admin y webhook de Clerk que tienen su propia validación).

### Usados por Tower App

| Método         | Ruta                               | Para qué                                    |
| --------------- | ---------------------------------- | -------------------------------------------- |
| **GET**   | `/api/customer/trips/{clerk_id}` | Obtener viajes de un cliente                 |
| **PATCH** | `/api/customer/trips/{trip_id}`  | Asignar tower a un viaje y actualizar estado |

### Usados por Payments App

| Método        | Ruta                                                   | Para qué                  |
| -------------- | ------------------------------------------------------ | -------------------------- |
| **POST** | `/api/customer/trips/{trip_id}/payment-confirmation` | Confirmar pago exitoso     |
| **GET**  | `/api/customer/trips/{trip_id}/payment-status`       | Consultar estado de pago   |
| **GET**  | `/api/customer/{customer_id}/name`                   | Obtener nombre del cliente |

### Usados por Admin UI

| Método       | Ruta                     | Para qué                             |
| ------------- | ------------------------ | ------------------------------------- |
| **GET** | `/api/admin/trips`     | Listar viajes (paginated, searchable) |
| **GET** | `/api/admin/customers` | Listar clientes                       |
| **GET** | `/api/admin/vehicles`  | Listar vehículos                     |
| **GET** | `/api/admin/dashboard` | Estadísticas del dashboard           |

### Usados por Clerk

| Método        | Ruta                    | Para qué                                           |
| -------------- | ----------------------- | --------------------------------------------------- |
| **POST** | `/api/webhooks/clerk` | Webhook `user.created` — asigna rol `customer` |

---
