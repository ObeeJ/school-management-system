# Multi-Stage Build Dockerfile for Railway & Containerized Deployments
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# Step 1: Install dependencies with extended network timeouts
FROM base AS dependencies
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
RUN pnpm config set fetch-retries 10 && \
    pnpm config set fetch-retry-maxtimeout 300000 && \
    (pnpm install --frozen-lockfile || pnpm install)

# Step 2: Build applications
FROM dependencies AS builder
COPY . .
RUN pnpm build

# Step 3: Production Runner for NestJS Backend
FROM base AS backend-runner
WORKDIR /app
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules
ENV PORT=4000
EXPOSE 4000
CMD ["node", "dist/main.js"]
