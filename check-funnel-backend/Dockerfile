# ─────────────────────────────────────────
# Stage 1: Build NestJS App
# ─────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app
ENV npm_config_update_notifier=false

# Install all deps (including devDeps for build)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# ─────────────────────────────────────────
# Stage 2: Production Image
# ─────────────────────────────────────────
FROM node:20-bookworm-slim

WORKDIR /app
ENV npm_config_update_notifier=false

# Only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy built dist
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
