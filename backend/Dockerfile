# ========================================================
# DOCKERFILE BACKEND (Node.js Express API)
# ========================================================
FROM node:20-alpine

# Set direktori kerja
WORKDIR /app

# Salin package.json & package-lock.json terlebih dahulu untuk efisiensi layer cache
COPY package*.json ./

# Install dependensi produksi (tanpa devDependencies)
RUN npm ci --omit=dev

# Salin seluruh source code backend
COPY . .

# Expose port API
EXPOSE 5000

# Jalankan server
CMD ["node", "server.js"]

