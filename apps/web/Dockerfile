# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configurations and package files
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

RUN npm ci

COPY . .

# Set memory limits for webpack builds during build phase
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build --workspace=apps/web

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]
