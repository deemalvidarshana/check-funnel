# ─────────────────────────────────────────
# Stage 1: Build React (Vite) App
# ─────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app
ENV npm_config_update_notifier=false

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# ─────────────────────────────────────────
# Stage 2: Serve with Nginx
# ─────────────────────────────────────────
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config for React Router support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
