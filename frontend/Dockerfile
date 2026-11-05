# ========================================================
# STAGE 1: Build React App dengan Node.js
# ========================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Salin package.json & package-lock.json
COPY package*.json ./

# Install dependensi (termasuk Vite & Tailwind)
RUN npm ci

# Salin seluruh source code frontend
COPY . .

# Build aplikasi untuk mode produksi (output ke folder /app/dist)
RUN npm run build

# ========================================================
# STAGE 2: Serve dengan Nginx Alpine Ringan & Cepat
# ========================================================
FROM nginx:alpine

# Salin konfigurasi Nginx khusus SPA & Reverse Proxy API
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin hasil build dari Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port HTTP Nginx
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]

