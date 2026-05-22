# GrepAI

> Catch risky code before it ships.

GrepAI is an architecture-aware pull request intelligence platform for engineering teams. It monitors GitHub pull requests, builds repository-level context around changed files, runs AI-powered risk analysis, and posts concise merge guidance directly back into the PR thread.

[![Frontend](https://img.shields.io/badge/frontend-Next.js_16-111111?style=flat-square)](./frontend)
[![Backend](https://img.shields.io/badge/backend-NestJS_11-111111?style=flat-square)](./backend)
[![Database](https://img.shields.io/badge/database-MySQL-111111?style=flat-square)](./backend)
[![AI](https://img.shields.io/badge/analysis-Claude-111111?style=flat-square)](./backend)

## Why GrepAI Exists

Modern pull request review still fails in predictable ways:

- reviewers inspect files, not systems
- risky changes hide inside shared middleware, boundary mutations, and downstream service propagation
- architecture impact is rarely reconstructed during review
- documentation, runtime paths, and operational commands drift silently
- teams discover merge risk after deploy, not before merge

GrepAI treats a pull request as a system event, not a diff blob. It reconstructs the blast radius around changed code and returns a technical risk review where engineers already work: inside GitHub.

## What GrepAI Does

- connects repositories using GitHub OAuth
- registers pull-request webhooks automatically
- listens for `pull_request` open and synchronize events
- fetches PR metadata, files, and patch context
- builds architecture-aware analysis context
- runs AI risk analysis with constrained structured output
- posts a compact GrepAI comment back to the PR
- stores analysis history for dashboard visibility and future repository intelligence

## Product Screens

> Replace these placeholders with final screenshots or demo GIFs as the product evolves.

| Surface | Preview | Suggested Asset Path |
| --- | --- | --- |
| Landing page | Product positioning + proof artifact | `docs/images/landing-page.png` |
| Dashboard | Live merge intelligence console | `docs/images/dashboard.png` |
| Connect repository | GitHub-native onboarding flow | `docs/images/connect-page.png` |
| PR comment | GrepAI review posted in GitHub | `docs/images/github-pr-comment.png` |

### Current in-repo visual assets

- Logo: [`frontend/public/grepai-logo.png`](./frontend/public/grepai-logo.png)
- Landing proof image: [`frontend/public/github-pr-proof.png`](./frontend/public/github-pr-proof.png)
- Architecture background: [`frontend/public/architecture-bg.png`](./frontend/public/architecture-bg.png)

## Architecture Overview

### Frontend

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Shared `lib`, `types`, `constants`, and reusable layout components
- GitHub-native dark UI built for an infrastructure-tool aesthetic

### Backend

- NestJS 11
- TypeORM
- MySQL
- GitHub OAuth via Passport
- GitHub Webhooks
- Octokit for repository, PR, webhook, and comment operations
- Claude API for PR risk analysis

## End-to-End Flow

```text
GitHub OAuth
  -> repository connected
  -> webhook registered

Pull request opened / updated
  -> GitHub webhook received
  -> signature verified
  -> repository and user resolved
  -> PR files + diff fetched
  -> repository context + architecture impact analyzed
  -> GrepAI review formatted
  -> GitHub PR comment posted
  -> analysis persisted for dashboard history
```

## Core Features

- GitHub OAuth authentication
- Real repository discovery from the authenticated GitHub account
- Automatic webhook creation on repository connection
- PR event ingestion for opened and updated pull requests
- Architecture-aware merge risk analysis
- Compact AI-generated GitHub PR comments
- Repository intelligence dashboard
- Recent analysis history and live risk stream
- Webhook-secured backend processing

## Local Development

GrepAI runs as two apps:

- `frontend/` -> Next.js app on `http://localhost:3000`
- `backend/` -> NestJS API on `http://localhost:3001`

### 1. Install dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure backend environment

Copy and populate:

```bash
cp backend/.env.example backend/.env
```

Required backend values:

- MySQL connection
- GitHub OAuth app credentials
- JWT secret
- Claude API key
- ngrok-backed webhook URL

### 3. Start MySQL

Use a local MySQL instance and create the target database from `DATABASE_NAME`.

### 4. Expose the backend to GitHub

If you are running locally, expose the backend with ngrok:

```bash
ngrok http 3001
```

Set:

- `WEBHOOK_URL=https://<your-ngrok-domain>/webhook/github`
- `GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback`
- `FRONTEND_BASE_URL=http://localhost:3000`

### 5. Start the backend

```bash
cd backend
npm run start:dev
```

### 6. Start the frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Backend

Defined in [`backend/.env.example`](./backend/.env.example):

| Variable | Purpose |
| --- | --- |
| `DATABASE_HOST` | MySQL host |
| `DATABASE_PORT` | MySQL port |
| `DATABASE_USER` | MySQL username |
| `DATABASE_PASS` | MySQL password |
| `DATABASE_NAME` | MySQL database name |
| `PORT` | NestJS API port |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `GITHUB_CALLBACK_URL` | OAuth callback URL |
| `WEBHOOK_URL` | Public GitHub webhook endpoint |
| `GITHUB_WEBHOOK_SECRET` | Secret used to validate webhook signatures |
| `JWT_SECRET` | Backend JWT signing secret |
| `CLAUDE_API_KEY` | Anthropic API key |
| `CLAUDE_MODEL` | Claude model name |
| `FRONTEND_BASE_URL` | Frontend base URL used for deep links and logo URL generation |

### Frontend

The frontend currently relies on fixed local API endpoints wired through `constants/routes.ts`. If you later introduce deploy-time configuration, move those values into `NEXT_PUBLIC_*` environment variables.

## Project Structure

```text
GrepAI/
├── frontend/
│   ├── app/
│   ├── components/
│   │   ├── layout/
│   │   └── shared/
│   ├── constants/
│   ├── lib/
│   ├── public/
│   └── types/
└── backend/
    └── src/
        ├── analysis/
        ├── auth/
        ├── database/
        ├── github/
        ├── repos/
        ├── users/
        └── webhook/
```

## Technical Notes

- The frontend is intentionally minimal, dark, and GitHub-native.
- The backend keeps webhook processing resilient: repository connection should succeed even if webhook creation fails temporarily.
- PR analysis is intentionally structured before formatting so GitHub comments stay concise and high-signal.
- The dashboard is optimized around live merge risk, not generic analytics.

## Roadmap

- repository graph intelligence beyond changed files
- semantic code retrieval for richer PR context
- architecture drift detection across merges
- team-level risk patterns and service ownership insights
- vector search over prior analyses and code history
- confidence-aware merge gates and scoring engine
- deployment-aware blast radius mapping

## Contributing

Contributions should preserve the core GrepAI product philosophy:

- architecture-aware, not generic
- GitHub-native, not workflow-replacing
- concise, technical, and operational
- dark, premium, infrastructure-grade UI

Recommended contribution flow:

```bash
git checkout -b feat/your-change
```

Then:

- update docs when behavior changes
- keep UI restrained and consistent with the current design system
- keep backend modules feature-oriented
- run lint/build before opening a PR

## License

This repository is currently private and marked `UNLICENSED`.
