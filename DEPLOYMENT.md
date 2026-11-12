# Publicar o ProjetoEmDia

O mobile usa Expo e a API usa NestJS, Prisma e PostgreSQL. Para o APK funcionar fora da rede local, publique a API com HTTPS e use o Neon como banco remoto.

## 1. Criar as variáveis de conexão no Neon

No projeto Neon, abra **Connect** e selecione a branch `production` e a database criada. Copie a connection string **pooled** para `DATABASE_URL` e a connection string **direct** para `DIRECT_URL`. O pooler é recomendado para as conexões da aplicação; a conexão direta é usada pelo Prisma nas migrações (`directUrl` em `api/prisma/schema.prisma`). Mantenha ambas privadas.

## 2. Publicar a API

O Neon hospeda somente o PostgreSQL; publique a API NestJS como um serviço separado (por exemplo, Railway), usando a pasta `api` como raiz. O `Dockerfile` existente compila a API e executa `prisma migrate deploy` ao iniciar.

Configure no serviço da API:

- `DATABASE_URL` e `DIRECT_URL`: as strings copiadas do Neon.
- `NODE_ENV=production`
- `APP_UTC_OFFSET_MINUTES=120`
- `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`: valores aleatórios fortes e diferentes.
- `JWT_ACCESS_TTL=15m` e `JWT_REFRESH_TTL=30d`

Gere um domínio público HTTPS para a API e confirme que `https://<dominio>/api/v1/health` responde com estado saudável. Não coloque strings do banco no APK nem publique o PostgreSQL diretamente.

## 3. Configurar o APK

Na pasta `mobile`, configure `EXPO_PUBLIC_API_URL=https://<dominio>/api/v1` nos ambientes `preview` e `production` do EAS. Esta variável é incorporada no bundle durante a compilação.

Vincule a pasta a um projeto Expo com `npx eas-cli@latest init` e inicie sessão com `npx eas-cli@latest login`.

## 4. Criar e instalar o APK Android

Na pasta `mobile`:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

O perfil `preview` gera um APK instalável. Para a Google Play, use o perfil `production`, que gera um Android App Bundle:

```powershell
npx eas-cli@latest build --platform android --profile production
```

## Dados de exemplo

O seed atual cria contas e dados demonstrativos. Não execute o seed no banco online com dados reais e defina credenciais seguras para as contas existentes.
