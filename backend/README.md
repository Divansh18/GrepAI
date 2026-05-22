# GrepAI Backend

The GrepAI backend is a NestJS service that powers GitHub-native repository onboarding, webhook processing, AI risk analysis, PR comment generation, and dashboard data access.

This service is designed around a simple operational promise:

> when a pull request changes architecture boundaries, shared runtime paths, or downstream behavior, GrepAI should catch it before merge and post a concise technical review directly into GitHub.

## Stack

- NestJS 11
- TypeScript
- TypeORM
- MySQL
- Passport GitHub OAuth
- JWT authentication
- Octokit
- GitHub Webhooks
- Anthropic Claude API

## Backend Responsibilities

- authenticate users with GitHub
- store user session/JWT context
- fetch the authenticated user’s repositories from GitHub
- connect repositories and register webhooks
- receive pull request webhook events
- fetch PR files and context from GitHub
- run AI analysis
- render premium, compact PR comments
- persist analysis history for the dashboard

## Module Architecture

The backend now follows feature-based organization plus a dedicated database layer:

```text
backend/src/
├── analysis/
│   ├── controllers/
│   ├── dto/
│   ├── entities/
│   ├── modules/
│   └── services/
├── auth/
│   ├── controllers/
│   ├── dto/
│   ├── guards/
│   ├── modules/
│   ├── services/
│   └── strategies/
├── database/
│   ├── config/
│   └── modules/
├── github/
│   ├── modules/
│   └── services/
├── repos/
│   ├── controllers/
│   ├── dto/
│   ├── entities/
│   ├── modules/
│   └── services/
├── users/
│   └── entities/
└── webhook/
    ├── controllers/
    ├── dto/
    ├── modules/
    └── services/
```

## Major Flows

### 1. GitHub OAuth

```text
frontend CTA
  -> /auth/github
  -> GitHub OAuth consent
  -> /auth/github/callback
  -> JWT issued
  -> frontend /auth/callback stores token
```

### 2. Repository Connection

```text
authenticated user
  -> GET /repos/github-repos
  -> choose repository
  -> POST /repos/connect
  -> verify repository exists on GitHub
  -> save repo
  -> create or reconcile webhook
```

### 3. PR Analysis Lifecycle

```text
GitHub pull_request webhook
  -> webhook signature verified
  -> repository + user resolved
  -> PR files and patch fetched
  -> Claude analysis executed
  -> GitHub comment body rendered
  -> issues.createComment()
  -> analysis persisted to MySQL
```

## Database Architecture

Database bootstrapping has been moved out of `app.module.ts` and into:

- [`src/database/config/typeorm.config.ts`](./src/database/config/typeorm.config.ts)
- [`src/database/modules/database.module.ts`](./src/database/modules/database.module.ts)

Current behavior:

- MySQL connection
- entities loaded through glob discovery
- `synchronize: true` for now

Environment variable names remain:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASS`
- `DATABASE_NAME`

## Core Feature Areas

### `auth`

- GitHub OAuth entry + callback
- JWT issue/validation
- protected API routes through `JwtAuthGuard`

### `repos`

- connected repository persistence
- GitHub repository discovery for the authenticated user
- webhook-aware repository connection flow

### `github`

- Octokit integration
- repo existence checks
- webhook creation/reconciliation
- PR file fetches
- PR comment posting

### `analysis`

- AI prompt construction
- structured risk report parsing
- recent analysis API

### `webhook`

- GitHub signature validation
- pull request event handling
- analysis orchestration
- comment formatting + persistence

## API Routes

### Authentication

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/auth/github` | Begin GitHub OAuth |
| `GET` | `/auth/github/callback` | OAuth callback and JWT issue |

### Repositories

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/repos` | Connected repositories for the authenticated user |
| `GET` | `/repos/github-repos` | Live repository list from GitHub |
| `POST` | `/repos/connect` | Connect a repository and register a webhook |

### Analysis

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/analysis/recent` | Latest dashboard-ready PR analyses |

### Webhooks

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/webhook/github` | GitHub webhook receiver |

## Environment Variables

Defined in [`./.env.example`](./.env.example):

```env
DATABASE_HOST=
DATABASE_PORT=
DATABASE_USER=
DATABASE_PASS=
DATABASE_NAME=
PORT=3001

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
WEBHOOK_URL=https://xxxxx.ngrok-free.app/webhook/github
GITHUB_WEBHOOK_SECRET=grepai_webhook_secret_123
JWT_SECRET=
CLAUDE_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-20250514
FRONTEND_BASE_URL=http://localhost:3000
```

## Local Setup

Install dependencies:

```bash
npm install
```

Start development mode:

```bash
npm run start:dev
```

Build:

```bash
npm run build
```

Start compiled app:

```bash
npm run start:prod
```

Lint:

```bash
npm run lint
```

## GitHub + ngrok Setup

For local webhook development:

1. Start the backend on port `3001`
2. Expose it publicly:

```bash
ngrok http 3001
```

3. Set:

```env
WEBHOOK_URL=https://<your-ngrok-domain>/webhook/github
```

4. Reconnect the repository if the ngrok URL changes so webhook reconciliation can update the existing hook.

## Comment Formatting Strategy

Claude does not post directly to GitHub. Instead:

1. analysis returns structured JSON
2. backend normalizes the result
3. webhook service formats the final GitHub comment

This keeps GrepAI comments:

- concise
- consistent
- architecture-aware
- easy to scan in GitHub dark mode

## Troubleshooting

### `Repository not found on GitHub`

The authenticated user’s GitHub token cannot access the target repository, or the repo name is invalid.

### Webhook connected but PR comments not posting

Check:

- `WEBHOOK_URL` still matches the active ngrok domain
- repository webhook exists on GitHub
- pull request event delivery is succeeding
- GitHub access token is still valid

### `Cannot find module dist/main` in watch mode

This was resolved by moving the TypeScript incremental build info into `dist` so Nest watch mode always re-emits after `dist` is cleared.

### MySQL connection failures

Verify:

- MySQL is running
- `DATABASE_*` values are correct
- local sandbox or firewall is not blocking `3306`

## Engineering Notes

- webhook reliability is prioritized over strict coupling to auxiliary operations
- repository connection should not hard-fail on temporary webhook creation issues
- analysis persistence should not block GitHub webhook response reliability
- logs should remain explicit at each stage of the PR analysis pipeline

## Related Docs

- Product overview: [`../README.md`](../README.md)
- Frontend architecture: [`../frontend/README.md`](../frontend/README.md)
