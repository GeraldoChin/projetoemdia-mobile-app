# ProjetoEmDia — App móvel (React Native + Expo)

App móvel que consome a API NestJS (`../api`). Os 7 ecrãs dos protótipos (`../prototipos`) estão implementados e ligados à API.

- **Expo SDK 58** · React Native 0.88 · **Expo Router** (rotas por ficheiros) · TypeScript
- **TanStack Query** (cache e pedidos) · **axios** (com renovação automática do token) · `expo-secure-store` (sessão)

## Arrancar

1. Ponha a API a correr (ver `../api/README.md`): `docker compose up --build` → `http://localhost:3050`
2. Neste directório:
```bash
npm install
copy .env.example .env      # opcional (ver "URL da API")
npx expo start
```
3. Abra com **Expo Go** (telemóvel real, mesma rede Wi-Fi) ou prima `a` (emulador Android) / `i` (simulador iOS).

> **Expo Go e versão do SDK:** esta app usa o SDK 58. O Expo Go do telemóvel tem de suportar o SDK 58 (actualize-o na loja). Se precisar de ficar noutra versão, diga-me e fixo as dependências.

### URL da API
Por omissão a app descobre sozinha:
- **Telemóvel real (Expo Go):** usa o IP do computador que serve a app (`http://<IP>:3050/api/v1`).
- **Emulador Android:** `http://10.0.2.2:3050/api/v1`. **Simulador iOS:** `http://localhost:3050/api/v1`.

Para forçar outro endereço, defina no `.env`: `EXPO_PUBLIC_API_URL=http://192.168.1.10:3050/api/v1` e reinicie com `npx expo start -c`.

**No Windows**, deixe o Node/Expo (porta 8081) e a API (porta 3050) passarem na firewall. O telemóvel e o computador precisam estar na mesma rede Wi-Fi.

Utilizador de teste (depois de `docker compose exec api npx prisma db seed`): `samira.nguenha@empresa.co.mz` / `Segredo123`.

## Estrutura

```text
app/                           Rotas Expo Router e layouts de navegação
  (auth)/                      Entrada, registo e layout de autenticação
  (tabs)/                      Separadores Início, Projectos, Tarefas e Perfil
  project/[id].tsx             Rota para detalhes do projecto
  task/[id].tsx                Rota para detalhes da tarefa
  calendar.tsx, team.tsx, ...  Rotas para os restantes ecrãs

src/
  screens/                      Ecrãs organizados por domínio
    auth/                       LoginScreen
    dashboard/                  HomeScreen
    projects/                   ProjectsScreen, ProjectDetailScreen
    tasks/                      TasksScreen, TaskDetailScreen
    profile/, team/, calendar/  Ecrãs de perfil e utilitários
    stats/, help/, terms/       Estatísticas e informação
  features/                     Fluxos e componentes específicos
    projects/                   Formulários de projecto e convite
    tasks/                      Formulário de tarefa e estado
    profile/                    Edição de perfil e palavra-passe
  components/                   Peças reutilizáveis: texto, botões, cartões, formulários
  api/                          Cliente HTTP, hooks de dados e tipos
  auth/                         Sessão e armazenamento de tokens
  theme/                        Cores, tipografia, espaçamentos e sombras
  utils/                        Formatação de datas e etiquetas
```

Os ficheiros em `app/` mantêm apenas a rota Expo Router e encaminham para o ecrã correspondente em `src/screens/`. Coloque a lógica visual do ecrã na pasta do seu domínio; deixe em `src/components/` apenas elementos reutilizados e em `src/features/` os fluxos específicos de cada área.
## Como funciona

- **Sessão:** `accessToken` (15 min) e `refreshToken` ficam no SecureStore (se "Lembrar de mim" estiver ligado). Quando um pedido dá `401`, o interceptor do axios chama `/auth/refresh` **uma só vez** (mesmo com vários pedidos em simultâneo) e repete o pedido. Se falhar, a sessão termina e a app volta ao login.
- **Dados:** cada ecrã usa um hook (`useProjects`, `useTasks`, ...). Ao criar/alterar tarefas ou projectos, as listas relacionadas (Início, Projectos, Tarefas, detalhes) são actualizadas automaticamente. Puxe para baixo para actualizar.
- **Contadores e progresso** vêm calculados da API (chips, segmentos, percentagens, "faltam N dias").
- **Permissões:** só o líder vê "Convidar membro", as opções do projecto (concluir/arquivar/eliminar) e o botão de remover membros.
- **Atalhos do Início:** "Projecto" e "Nova Tarefa" abrem os ecrãs correspondentes já com a folha de criação.

## Diferenças em relação aos protótipos

| Protótipo | Nesta versão |
|---|---|
| Toque no cartão de projecto abria uma folha de resumo | Abre directamente os Detalhes do Projecto |
| 3 formulários diferentes de nova tarefa | Um só (`TaskFormSheet`), com projecto, responsável, prazo e prioridade Baixa/Média/Alta |
| Imagem de faixa no Início, logótipo e fotos (URLs do Stitch) | Sem faixa; logótipo provisório (`Logo` em `components/primitives.tsx`); avatar com foto ou iniciais |
| Google/Apple, 2FA e recuperação de palavra-passe | Dependem de credenciais de OAuth, configuração de segurança e serviço de email; a app informa quando não estão configurados |
| Agenda, Equipa, Estatísticas, Ajuda e Termos | Implementados com dados da API e conteúdo local |
| Sino sem ecrã | Ecrã de notificações (lista, marcar como lida) |

## Falta fazer (próximos passos)
Ícone e splash da app (`assets/`, necessários para gerar APK/IPA) · notificações push reais (`expo-notifications` + o `pushToken` que a API já guarda) · login Google/Apple · recuperar palavra-passe por email · autenticação em dois passos · editar projecto (título/prazo) · testes.

## Verificação feita
`npm run typecheck` sem erros e `npx expo export --platform android` gera o bundle com sucesso. **Ainda não foi executada num telemóvel/emulador**: a primeira execução é o teste real.
