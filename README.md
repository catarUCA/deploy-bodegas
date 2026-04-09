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

*Nota: El nombre de usuario `cataruca` ya está configurado en el archivo `.github/workflows/deploy.yml`.*

## 2. Configuración del Servidor

En tu servidor personal, sigue estos pasos:

### Preparación
1. Clona este repositorio o copia los archivos `docker-compose.yml` y `.env.example`.
2. Renombra `.env.example` a `.env` y rellena las variables de entorno:
   ```bash
   cp .env.example .env
   nano .env
   ```

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
