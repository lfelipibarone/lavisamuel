# API — Lavi & Samuel

Hono + Prisma + PostgreSQL backend for guest names, game history, and Drive photos.

## Docker / Dokploy

| Item | Value |
|------|--------|
| **Build context** | `apps/api` |
| **Dockerfile** | `apps/api/Dockerfile` |
| **Port** | `3002` |
| **Compose (repo root)** | `docker-compose.yml` → services `api` + `web` |

Front (`web`) faz proxy de `/api/*` → `api:3002`. Build do front usa `VITE_API_URL=/api`.

### Env vars obrigatórias no serviço `api`

| Variável | Exemplo / nota |
|----------|----------------|
| `DATABASE_URL` | URL **internal** do Postgres no Dokploy |
| `PORT` | `3002` |
| `CORS_ORIGIN` | URL do front sslip.io |
| `DRIVE_FOLDER_ID` | ID da pasta do Drive |
| `GOOGLE_OAUTH_CLIENT_ID` | ID do cliente OAuth |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Segredo OAuth |
| `GOOGLE_OAUTH_REDIRECT_URI` | `https://<backend>/oauth/google/callback` |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | Depois de autorizar 1x em `https://<backend>/oauth/google` |
| `ALLOW_OAUTH_SETUP` | `true` só para autorizar; depois `false` |

Homolog atual:
- Front: `https://lavi-samuel-frontend-yy68kq-99b4d5-177-7-39-127.sslip.io`
- API: `https://lavi-samuel-backend-sbzxln-cdf361-177-7-39-127.sslip.io`
- Front build: `VITE_API_URL=https://lavi-samuel-backend-sbzxln-cdf361-177-7-39-127.sslip.io`

**Não** monte `.secrets` na imagem. Em Docker use só variáveis de ambiente.

No start do container roda `prisma migrate deploy` e sobe a API.

## Setup local

```bash
# from repo root — start Postgres (host port 5434)
docker compose -f docker-compose.dev.yml up -d

# from apps/api
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

API defaults to `http://localhost:3002`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/photos` | Lista fotos dos convidados |
| `GET` | `/photos/:id/file` | Arquivo da foto |
| `POST` | `/photos` | Upload multipart (`file`, `uploadedBy`) |

### Fotos (Google Drive via OAuth)

Uploads **não** ficam no disco do servidor. Vão para a pasta do Drive usando a conta dona (OAuth + refresh token).

**Setup (uma vez) em homologação (sslip.io):**
1. No Google Cloud → cliente OAuth → URI de redirecionamento (exato):
   `https://lavi-samuel-backend-sbzxln-cdf361-177-7-39-127.sslip.io/oauth/google/callback`
2. Origem JavaScript (front):
   `https://lavi-samuel-frontend-yy68kq-99b4d5-177-7-39-127.sslip.io`
3. Abra: `https://lavi-samuel-backend-sbzxln-cdf361-177-7-39-127.sslip.io/oauth/google`
4. Autorize com a conta dona da pasta; copie o refresh token para o secret `GOOGLE_OAUTH_REFRESH_TOKEN`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/oauth/google` | Inicia autorização (dono do Drive) |
| `GET` | `/oauth/google/callback` | Callback OAuth |
| `GET` | `/photos` | Lista imagens da pasta do Drive |
| `GET` | `/photos/:id/file` | Proxy da imagem (sem gravar no disco) |
| `POST` | `/photos` | Upload multipart → Drive |

## Env

See `.env.example`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres (host port **5434** locally) |
| `PORT` | API port (**3002**) |
| `CORS_ORIGIN` | Allowed front origins |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local path to service-account JSON |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Deploy: full JSON string as secret (prefer this in production) |
| `DRIVE_FOLDER_ID` | Google Drive folder id |

### Secrets (Google Drive)

- Local file lives in `apps/api/.secrets/google-service-account.json` (**gitignored**).
- **Never** commit `*-service-account*.json`, `flowjifinance*.json`, or paste private keys into the repo.
- On Railway/Render/Fly/Dokploy: create secret `GOOGLE_SERVICE_ACCOUNT_JSON` with the JSON contents (one line). Do not upload the file into the git build context.
