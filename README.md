# 🍷 Bodegas — Arquitectura del Proyecto

## 🗺️ Visión General

La aplicación está dividida en dos servicios principales (**frontend** y **backend**) que se comunican entre sí a través de un **proxy Nginx** inverso. Ambos corren en contenedores Docker dentro de la misma red interna (`bodegas-network`), junto a una base de datos MySQL y un panel phpMyAdmin.

```
Usuario (navegador)
       │
       ▼
  [Frontend – Angular]  :4200 → sirve el SPA via Nginx
       │
       │   /auth  →  proxy_pass  →  [Backend – Node.js]  :3000
       │   /api   →  proxy_pass  →  [Backend – Node.js]  :3000
       ▼
  [MySQL]  (red interna)          [n8n Webhook]  (externo)
```

---

## 🖥️ Frontend (Angular + Nginx)

**Tecnología:** Angular 19, TypeScript, CSS  
**Imagen Docker:** `cataruca/bodegas-frontend`  
**Puerto:** `4200` (externo) → `80` (interno Nginx)

### Estructura de rutas (`app.routes.ts`)

| Ruta | Componente | Protegida |
|------|-----------|-----------|
| `/login` | `LoginComponent` | No |
| `/verify` | `VerifyComponent` | No |
| `/form` | `BodegaFormComponent` | ✅ Sí (`authGuard`) |
| `**` | Redirige a `/form` | — |

### Flujo de autenticación (Magic Link / OTP)

1. El usuario introduce su email en `/login`.
2. El `AuthService` llama a `POST /auth/request-code` → el backend genera un código de 6 dígitos, lo hashea con **bcrypt** y lo envía por email vía n8n.
3. El usuario introduce el código en `/verify`.
4. El `AuthService` llama a `POST /auth/verify-code` → el backend valida el código, crea el usuario si no existe y devuelve un **JWT** (válido 7 días).
5. El token se almacena en `localStorage` (`bodega_token`). El `authGuard` bloquea rutas protegidas si no hay token.

### Comunicación con el backend

El frontend usa rutas **relativas** (`/auth`, `/api`) para todas las llamadas HTTP. El Nginx del contenedor actúa como proxy inverso:

- `location /auth` → `proxy_pass http://backend:3000`
- `location /api`  → `proxy_pass http://backend:3000`

Esto significa que **no hay peticiones cross-origin** en producción: todo pasa por el mismo origen (puerto 4200).

Un **HTTP interceptor** (`AuthInterceptor`) inyecta automáticamente el header `Authorization: Bearer <token>` en cada petición saliente cuando el usuario está autenticado.

---

## ⚙️ Backend (Node.js / Express)

**Tecnología:** Node.js, Express, MySQL2, Multer, bcrypt, JWT  
**Imagen Docker:** `cataruca/bodegas-backend`  
**Puerto:** `3000`

### Endpoints de la API

#### Autenticación (`/auth`) — con rate limiting (10 req / 15 min)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/request-code` | Genera y envía código OTP al email |
| `POST` | `/auth/verify-code` | Valida el código y devuelve un JWT |

#### Bodegas (`/api/bodegas`) — requieren JWT válido

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/api/bodegas` | Obtiene los datos de la bodega del usuario autenticado |
| `POST` | `/api/bodegas` | Guarda o actualiza los datos (incluye subida de PDF) |

### Middleware de autenticación

`authMiddleware.js` extrae el token del header `Authorization`, lo verifica con `jsonwebtoken` y adjunta el `userId` al objeto `req` para que los controladores puedan usarlo.

### Gestión de archivos PDF (`/api/bodegas POST`)

- Se usa **Multer** con `diskStorage` para recibir el PDF del historial de la bodega.
- Los archivos se nombran automáticamente a partir del nombre de la bodega (sanitizado: minúsculas, sin caracteres especiales).
- Límite de tamaño: **100 MB**.
- Si el nombre de la bodega cambia, el fichero en disco se **renombra** físicamente.
- El fichero antiguo se **elimina** cuando ya no corresponde con el nuevo.

### Webhook de ingesta (n8n)

Cuando se sube o cambia un PDF, el backend lanza una petición `POST` asíncrona al webhook `INGESTA_WEBHOOK_URL` (n8n externo) con los siguientes datos:

```json
{
  "old_file": "nombre_anterior.pdf",
  "new_file": "nombre_nuevo.pdf",
  "user_id": 1,
  "bodega_name": "nombre_bodega"
}
```

Esto desencadena el pipeline de ingesta/procesamiento del documento en n8n.

---

## 🗄️ Base de Datos (MySQL 8.0)

**Imagen Docker:** `mysql:8.0`  
**Puerto externo:** `9000` (mapeado al `3306` interno)

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios registrados (id, email, verified, created_at) |
| `login_codes` | Códigos OTP temporales hasheados (expiran en 10 min) |
| `bodegas` | Datos de cada bodega (1 bodega por usuario — `UNIQUE KEY user_id`) |

La tabla `bodegas` tiene FK sobre `users(id)` con `ON DELETE CASCADE`. El esquema inicial se carga automáticamente desde `db/init.sql` al arrancar el contenedor por primera vez.

---

## 🔄 CI/CD y Despliegue Automático

1. Un **push** a la rama principal dispara el workflow de **GitHub Actions**.
2. GitHub Actions construye las imágenes Docker del frontend y backend y las publica en Docker Hub (`cataruca/bodegas-frontend` y `cataruca/bodegas-backend`).
3. **Watchtower** (corriendo en el servidor) comprueba cada 60 segundos si hay nuevas imágenes en Docker Hub y, si las hay, reemplaza los contenedores automáticamente sin downtime manual.

---

# 🍷 Guía de Despliegue - Bodegas CI/CD

Esta guía detalla cómo configurar el repositorio y el servidor para el despliegue automático.

## 1. Configuración de GitHub (Secrets)

Para que el workflow de GitHub Actions funcione, debes añadir el token de Docker Hub a los secretos de tu repositorio en GitHub:

1. Ve a tu repositorio en GitHub.
2. Navega a **Settings** > **Secrets and variables** > **Actions**.
3. Haz clic en **New repository secret**.
4. Añade el siguiente secreto:
   - **Name**: `DOCKER_PASSWORD`
   - **Value**: `token` (el token que generaste en Docker Hub)


## 2. Configuración del Servidor

En tu servidor personal, sigue estos pasos:

### Preparación
1. Clona este repositorio o copia los archivos `docker-compose.yml` y `.env.example`.
2. Renombra `.env.example` a `.env` y rellena las variables de entorno.

### Levantar el entorno
Ejecuta el siguiente comando para iniciar todos los servicios:
```bash
docker compose up -d
```

## 3. Auto-actualización con Watchtower

El archivo `docker-compose.yml` ya incluye un servicio de **Watchtower**.

- **¿Qué hace?**: Revisa cada 5 minutos si hay una nueva imagen en Docker Hub (`cataruca/bodegas-backend` o `cataruca/bodegas-frontend`).
- **Comportamiento**: Si detecta una imagen nueva (subida automáticamente por GitHub Actions), detiene el contenedor antiguo, descarga la nueva imagen y arranca el contenedor de nuevo con la misma configuración.
- **Limpieza**: Usa el flag `--cleanup` para borrar las imágenes antiguas y no llenar el disco.

## 4. Acceso a los Servicios
- **Frontend**: `http://tu-ip-servidor:4200`
- **Backend API**: `http://tu-ip-servidor:3000`
- **phpMyAdmin**: `http://tu-ip-servidor:8080` (Usuario: `root`, Password: el que pongas en `MYSQL_ROOT_PASSWORD`)

## 5. Troubleshooting
Si necesitas ver los logs para depurar:
```bash
docker compose logs -f backend
docker compose logs -f watchtower
```

