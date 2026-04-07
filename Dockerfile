# Frontend — Dockerfile (multi-stage build)
# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build app — VITE_API_URL se inyecta en tiempo de build
ARG VITE_API_URL=http://localhost/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve static files with nginx
FROM nginx:alpine

# Copiar los archivos compilados al directorio de nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx personalizada
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
