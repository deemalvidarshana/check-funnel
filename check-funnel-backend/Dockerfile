# ─────────────────────────────────────────
# Stage 1: Build NestJS App
# ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all deps (including devDeps for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ─────────────────────────────────────────
# Stage 2: Production Image
# ─────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built dist
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
