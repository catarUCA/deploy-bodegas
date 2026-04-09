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

# Configuramos Nginx para Angular (Single Page Application)
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache de assets estáticos
    location ~* \.(?:ico|css|js|gif|jpe?g|png)$ {
        expires 30d;
        add_header Cache-Control "public";
    }
}
EOF

# Copiamos los archivos compilados desde la etapa de build
# Basado en la estructura dist/frontend/browser detectada previamente
COPY --from=build /usr/src/app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
