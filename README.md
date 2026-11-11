# ProjetoEmDia

Gestão ágil de projectos e tarefas — app móvel (React Native / Expo) + API (NestJS).

```
api/          Backend NestJS + Prisma + PostgreSQL, tudo em Docker   → api/README.md
mobile/       App React Native (Expo SDK 58 + Expo Router)           → mobile/README.md
prototipos/   Protótipos do Stitch (HTML, capturas, tokens)          → prototipos/README.md
```

## Arranque rápido

```bash
# 1) API (Docker)
cd api
copy .env.example .env
docker compose up -d db
docker compose run --rm api npx prisma migrate dev --name init
docker compose up --build
docker compose exec api npx prisma db seed     # dados de exemplo (noutro terminal)

# 2) App
cd ../mobile
npm install
npx expo start
```
Swagger: http://localhost:3000/docs · Utilizador de teste: `samira.nguenha@empresa.co.mz` / `Segredo123`
