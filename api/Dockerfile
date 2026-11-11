# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# base: Node 20 + OpenSSL (o motor do Prisma precisa dele no Debian slim)
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS base
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------------------------------------------------------------------------
# dev: usado pelo docker-compose.yml (código montado por volume + hot reload)
# ---------------------------------------------------------------------------
FROM base AS dev
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ---------------------------------------------------------------------------
# build: compila o TypeScript e remove as dependências de desenvolvimento
# ---------------------------------------------------------------------------
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build \
 && npm prune --omit=dev \
 && npx prisma generate

# ---------------------------------------------------------------------------
# prod: imagem final, pequena e sem root
# ---------------------------------------------------------------------------
FROM base AS prod
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# aplica as migrações pendentes e arranca a API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
