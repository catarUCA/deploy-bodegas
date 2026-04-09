# ─── BUILD STAGE ──────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copiamos archivos de dependencias primero para aprovechar el cache de Docker
COPY package*.json ./
RUN npm install

# Copiamos el resto del código
COPY . .

# ─── RUNTIME STAGE ────────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /usr/src/app

# Copiamos solo lo necesario desde el builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app ./

# Exponemos el puerto del backend (detectado en server.js)
EXPOSE 3000

# Iniciamos la aplicación
CMD [ "npm", "start" ]
