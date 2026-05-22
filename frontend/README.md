# GrepAI Frontend

The GrepAI frontend is a Next.js application that presents the product as a dark, architecture-aware engineering tool rather than a generic SaaS dashboard. It covers four core surfaces:

- landing page
- GitHub OAuth callback
- repository connection flow
- live merge intelligence dashboard

## Frontend Philosophy

The UI is intentionally opinionated:

- black minimal interface
- off-white primary typography
- muted gray system metadata
- sharp borders
- restrained amber accents for proof and technical emphasis
- no gradients
- no glow
- no rounded SaaS widgets

The result should feel closer to an internal developer platform or observability tool than a consumer onboarding experience.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS

## App Surfaces

### `/`

Product landing page with:

- architecture-aware positioning
- GitHub-native CTA
- real PR output proof artifact
- live system-style product framing

### `/auth/callback`

Receives the JWT token from the backend OAuth callback, stores it in local storage, and redirects to the dashboard.

### `/connect`

Repository onboarding flow with:

- GitHub-native repository picker
- webhook activation flow
- command-palette style selection UX

### `/dashboard`

Operational intelligence console showing:

- live merge intelligence state
- compact risk stream
- connected repositories
- system activity feed

## Folder Structure

```text
frontend/
├── app/
│   ├── auth/callback/
│   ├── connect/
│   ├── dashboard/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   │   └── AppNavbar.tsx
│   └── shared/
│       ├── ArchitectureBackdrop.tsx
│       ├── ConsoleLoadingState.tsx
│       └── GithubMark.tsx
├── constants/
│   └── routes.ts
├── lib/
│   ├── api.ts
│   └── auth.ts
├── public/
└── types/
    ├── analysis.ts
    └── repo.ts
```

## Design System Notes

### Layout

- App Router pages own only page-level state and composition
- shared navbar and visual primitives live in `components/`
- background atmosphere is centralized through `ArchitectureBackdrop`

### State & Data

- API helpers live in `lib/api.ts`
- JWT token helpers live in `lib/auth.ts`
- shared route constants live in `constants/routes.ts`
- domain typing lives in `types/`

### Visual Language

- typography hierarchy is intentionally restrained
- product proof is favored over decorative UI
- interaction states use subtle hover and focus changes only

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

## API Integration

The frontend talks to the NestJS backend at `http://localhost:3001` through route helpers in `constants/routes.ts`.

Current integration points include:

- `GET /repos`
- `GET /repos/github-repos`
- `POST /repos/connect`
- `GET /analysis/recent`
- `GET /auth/github` via top-level CTA

## Authentication Flow

1. User clicks `Connect GitHub`
2. Backend GitHub OAuth flow completes
3. Backend redirects to `/auth/callback?token=...`
4. Frontend stores `grepai_token`
5. Authenticated routes fetch data with `Authorization: Bearer <token>`

Token helpers live in:

- [`lib/auth.ts`](./lib/auth.ts)

## Deployment Notes

Before deployment, review hardcoded local backend URLs in:

- [`constants/routes.ts`](./constants/routes.ts)

Recommended future production hardening:

- move API origin to `NEXT_PUBLIC_API_BASE_URL`
- add environment-aware route helpers
- configure CSP and image domains if external assets are introduced

## Screens & Assets

Relevant local assets:

- [`public/grepai-logo.png`](./public/grepai-logo.png)
- [`public/github-pr-proof.png`](./public/github-pr-proof.png)
- [`public/architecture-bg.png`](./public/architecture-bg.png)

## UI Quality Checklist

Before shipping UI changes:

- no horizontal overflow on mobile
- auth redirects still work
- dashboard data fetches still resolve
- connect flow still submits selected repositories correctly
- all buttons preserve the GrepAI design language

## Related Docs

- Root product overview: [`../README.md`](../README.md)
- Backend service documentation: [`../backend/README.md`](../backend/README.md)
