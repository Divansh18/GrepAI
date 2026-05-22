# GrepAI Project Context

## Project Overview

GrepAI is an architecture-aware pull request intelligence platform. It connects to GitHub repositories, listens for PR events, analyzes changed code with repository context, and posts concise risk reviews directly into GitHub pull requests.

The frontend should communicate:

- serious developer infrastructure
- premium operational tooling
- GitHub-native workflow
- architecture-aware intelligence

## Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS

### Backend

- NestJS 11
- TypeORM
- MySQL
- Octokit
- GitHub OAuth + Webhooks
- Claude API

## Folder Structure Expectations

Frontend structure should remain clean and intentional:

```text
frontend/
├── app/
├── components/
│   ├── layout/
│   └── shared/
├── constants/
├── lib/
├── public/
└── types/
```

Guidelines:

- page files should own page composition and page-level state only
- shared API logic belongs in `lib/`
- auth/token helpers belong in `lib/auth.ts`
- shared route constants belong in `constants/`
- reusable visual primitives belong in `components/shared/`

## Frontend Rules

- do not redesign the product unless explicitly asked
- keep the black minimal UI intact
- preserve sharp borders and restrained accents
- no gradients
- no glow
- no glassmorphism
- no rounded SaaS-card styling
- maintain compact, production-grade spacing
- prefer operational copy over generic AI marketing copy
- keep CTA behavior and auth routing intact

## Backend Rules

- do not break GitHub OAuth
- do not break repository connection flow
- do not break webhook verification or PR event handling
- do not break GitHub comment posting
- do not break analysis persistence or dashboard APIs
- preserve structured analysis output and concise comment rendering

When changing backend logic, assume the following path is critical:

```text
GitHub PR event
-> webhook received
-> files fetched
-> analysis executed
-> GitHub comment posted
-> analysis saved
```

## Coding Standards

- prefer strict typing over ad hoc `any`
- keep business logic out of controllers and page shells
- centralize repeated logic into helpers instead of duplicating it
- make UI state explicit: loading, error, empty, success
- keep comments rare and useful
- preserve production readability over clever abstractions

## UI Design Rules

The GrepAI design language is fixed unless the task explicitly changes it:

- background: black / near-black
- text: white or off-white
- metadata: muted gray
- borders: thin, sharp, low-contrast
- accents: restrained, mostly amber or subtle status colors
- atmosphere: architecture-aware, operational, premium

Avoid:

- colorful dashboards
- glowing widgets
- consumer-app polish
- playful motion
- generic startup hero patterns

## Product Safety Rules

Before merging or refactoring anything, protect these flows:

- auth callback must store JWT and redirect correctly
- dashboard must fetch real repos and analyses
- connect flow must fetch GitHub repositories and connect selected repo
- webhook flow must still produce PR comments
- PR comment formatting must remain concise and architecture-aware

If a change risks one of those flows, keep the refactor smaller and safer.
