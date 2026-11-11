# ProjetoEmDia — API (NestJS + Prisma + PostgreSQL)

Backend da app móvel **ProjetoEmDia** (gestão de projectos e tarefas), pensado para ser consumido por uma app **React Native / Expo**.

- **NestJS 10** · **Prisma 5.22** · **PostgreSQL 16** · JWT (access + refresh) · Swagger · Docker

## Arrancar com Docker (recomendado)

```bash
copy .env.example .env            # Windows (PowerShell/CMD).  Linux/macOS: cp .env.example .env

# 1) só a base de dados
docker compose up -d db

# 2) cria a migração inicial (gera a pasta prisma/migrations; faça isto UMA vez e faça commit dela)
docker compose run --rm api npx prisma migrate dev --name init

# 3) sobe tudo (API com hot reload em http://localhost:3000)
docker compose up --build

# 4) (opcional) dados de exemplo
docker compose exec api npx prisma db seed
```

| URL | O quê |
|---|---|
| http://localhost:3050/docs | Swagger (testar todos os endpoints, botão **Authorize** para o token) |
| http://localhost:3050/api/v1/health | Healthcheck (API + base de dados) |
| http://localhost:8080 | Adminer (`docker compose --profile tools up`) — Sistema: PostgreSQL, Servidor: `db` |

Utilizador de teste do seed: `samira.nguenha@empresa.co.mz` / `Segredo123`

> **Se saltar o passo 2**, o compose usa `prisma db push` (cria as tabelas sem histórico). Funciona para experimentar, mas para produção precisa das migrações.

### Dicas para Windows
- Guarde o projecto **dentro do WSL2** (`\\wsl$\Ubuntu\home\...`) se o hot reload ficar lento. Já está configurado *polling* para funcionar também em pastas do Windows.
- Depois de mudar o `package.json`: `docker compose up --build --renew-anon-volumes`.
- Depois de mudar o `schema.prisma`: `docker compose exec api npx prisma migrate dev --name descricao`.

### Produção
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Imagem final sem root, com healthcheck, aplica `prisma migrate deploy` ao arrancar e **não expõe** a porta da base de dados. Defina segredos JWT fortes no `.env`.

## Sem Docker
Precisa de um PostgreSQL local e do `DATABASE_URL` com `localhost` no `.env`:
```bash
npm install
npx prisma migrate dev
npm run seed
npm run start:dev
```

## Estrutura

```
src/
  main.ts                    prefixo /api/v1, validação global, Swagger, helmet, CORS
  app.module.ts              JWT global (tudo protegido, excepto @Public()), rate limit, filtro de erros Prisma
  prisma/                    PrismaService (módulo global)
  common/                    @CurrentUser, @Public, JwtAuthGuard, PrismaExceptionFilter
  auth/                      register, login, refresh, logout
  users/                     perfil, estatísticas, definições, palavra-passe, push token, pesquisa
  projects/                  CRUD, membros, progresso calculado
  tasks/                     CRUD, filtros, estado, contadores
  comments/                  comentários de uma tarefa
  notifications/             lista, não lidas, marcar como lida
  dashboard/                 GET /dashboard/home (ecrã Início numa só chamada)
  health/                    healthcheck para o Docker
prisma/
  schema.prisma  seed.ts
```

## Endpoints (prefixo `/api/v1`)

| Ecrã da app | Método e rota |
|---|---|
| **Entrar / Criar Conta** | `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` |
| **Início** | `GET /dashboard/home` |
| **Projectos** | `GET /projects?status=ACTIVE&search=` (devolve `items` e `counts` para os chips) · `POST /projects` |
| **Detalhes do Projecto** | `GET /projects/:id` · `PATCH /projects/:id` · `DELETE /projects/:id` · `POST /projects/:id/members` · `DELETE /projects/:id/members/:memberId` · `GET /tasks?projectId=:id` |
| **Tarefas** | `GET /tasks?state=pending\|completed&priority=HIGH&search=` (devolve `items` e `counts`) · `POST /tasks` |
| **Detalhe da Tarefa** | `GET /tasks/:id` · `PATCH /tasks/:id` · `PATCH /tasks/:id/status` · `DELETE /tasks/:id` · `GET/POST /tasks/:id/comments` · `DELETE /comments/:id` |
| **Perfil** | `GET /users/me` (inclui `stats`) · `PATCH /users/me` · `PATCH /users/me/settings` · `POST /users/me/password` · `PUT /users/me/push-token` · `GET /users/search?q=` |
| **Notificações (sino)** | `GET /notifications` · `GET /notifications/unread-count` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all` |

Valores dos enums: `TaskStatus` = `TODO` `IN_PROGRESS` `IN_REVIEW` `DONE` · `Priority` = `LOW` `MEDIUM` `HIGH` · `ProjectStatus` = `ACTIVE` `COMPLETED` `ARCHIVED`.

## Notas para a app React Native

- **URL base no desenvolvimento com Docker Compose:** emulador Android `http://10.0.2.2:3050/api/v1`; simulador iOS `http://localhost:3050/api/v1`; telemóvel real (Expo Go) `http://<IP-do-PC>:3050/api/v1` (mesma rede Wi-Fi; abra a porta 3050 na firewall do Windows). A porta interna do contentor continua a ser 3000.
- **Tokens:** guarde `accessToken` e `refreshToken` com `expo-secure-store`. O access token dura 15 min: ao receber `401`, chame `POST /auth/refresh` com o `refreshToken` e repita o pedido (um interceptor do axios resolve isto).
- **Autorização:** só membros de um projecto vêem os dados dele; só o líder (OWNER) edita/elimina o projecto e gere membros.
- **Progresso e contadores são calculados** no servidor (nunca guardados): `progress.percent`, `daysLeft`, `counts`, `isOverdue`, `code` (`MP-12`).
- **Datas** viajam em ISO 8601 (UTC). Formate `DD/MM/AAAA` na app. "Tarefas para Hoje" usa o fuso `APP_UTC_OFFSET_MINUTES` (Maputo = 120).
- **Erros:** respostas `{ statusCode, message, error }`; erros de validação trazem `message` como lista de textos.

## Fora do âmbito desta versão (próximos passos)
Login com Google/Apple · recuperação de palavra-passe por email · envio real de push (Expo Push API, usando o `pushToken` e as notificações já criadas) · lembretes de prazo agendados (`@nestjs/schedule`) · upload de avatar · testes automáticos.
