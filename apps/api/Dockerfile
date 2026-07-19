# Documento 14, sección 1 — backend NestJS en Railway, contenedores estándar.
# Multi-stage para un monorepo pnpm/Turborepo: instala en la raíz del repo
# (así los workspaces resuelven bien), compila solo apps/api, y la imagen
# final corre nada más que el runtime compilado (dist/) + node_modules.

FROM node:22-slim AS base
# Prisma necesita openssl para detectar el motor de query engine correcto —
# sin esto, node:22-slim genera warnings y puede fallar en runtime.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @cursonube/api exec prisma generate
RUN pnpm --filter @cursonube/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api
EXPOSE 3000
# Documento 14, sección 5 — migraciones antes de levantar la app, nunca con
# un esquema desincronizado.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/src/main"]
