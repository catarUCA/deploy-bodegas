# ─── BUILD STAGE ──────────────────────────────────────────────────────────────
FROM node:20 AS build

WORKDIR /usr/src/app

# Instalamos dependencias primero
COPY package*.json ./
RUN npm install

# Copiamos el código fuente
COPY . .

# Generamos el build de producción
# Nota: npm run build ejecuta 'ng build' y el prebuild de Tailwind
RUN npm run build

# ─── RUNTIME STAGE ────────────────────────────────────────────────────────────
FROM nginx:alpine

# Configuramos Nginx
COPY default.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos compilados desde la etapa de build
# Basado en la estructura dist/frontend/browser detectada previamente
COPY --from=build /usr/src/app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
