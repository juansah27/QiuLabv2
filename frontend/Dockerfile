# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /deps

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /deps/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build

# Stage 3: Runtime
FROM nginx:alpine

# Tambahkan non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy hasil build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy konfigurasi nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

# Atur izin pada file yang diperlukan
RUN chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /etc/nginx/conf.d

# Port aplikasi
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"] 