# TowIt — Rider App

Aplicación de solicitud de remolques (grúas) para el rol de **Rider** — Proyecto IAW 2026 — tipo **A (Plataforma de Transporte)**.

## Deploy

[https://towit-customerview.vercel.app/](https://towit-customerview.vercel.app/)

## Tipos de usuario y acceso

- Admin:
  - Mail: admin_rider+clerk_test@iaw.com
  - Contraseña: iawuser#
  - Código de acceso: 424242
- Rider: 
  - Mail: rider+clerk_test@iaw.com
  - Contraseña: iawuser#
  - Código de acceso: 424242

### Cliente (usuario final)
- Crear cuenta desde la pantalla de inicio (`/auth/sign-up`) o iniciar sesión (`/auth/sign-in`).
- Accede a: home, solicitar viaje, historial de viajes, gestión de vehículos.

### Administrador
- Ir a `/admin` e iniciar sesión.
- Requiere que el usuario tenga el rol `admin` en Clerk (`publicMetadata.role = "admin"`).
- Accede a: dashboard con estadísticas, gestión de clientes, viajes y vehículos.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Clerk (auth) · Neon (PostgreSQL) · Drizzle ORM · Leaflet (mapas)


