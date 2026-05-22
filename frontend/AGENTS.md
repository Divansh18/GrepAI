# GrepAI Agent Architecture

GrepAI is moving toward an agentic architecture where pull request intelligence is produced by a small set of focused backend agents rather than a single opaque analysis step.

The product goal is simple:

> understand repository context, detect architectural risk, and return a concise GitHub-native review before risky code merges.

## Core Agent Roles

### PR Analysis Agent

Primary responsibility:

- inspect changed files, patch context, PR title, and PR metadata
- identify risky changes with high reviewer relevance
- produce structured analysis instead of long free-form output

Expected outputs:

- risk level
- confidence
- summary
- impact path
- findings
- merge recommendation

### Repository Context Agent

Primary responsibility:

- reconstruct system context around changed files
- infer affected modules, boundaries, shared middleware, downstream services, and operational surfaces
- enrich raw diffs with repository-aware architecture context

This agent is what makes GrepAI architecture-aware instead of simply diff-aware.

### Risk Scoring Agent

Primary responsibility:

- translate findings into a reviewer-friendly risk posture
- weigh severity, propagation, operational blast radius, and confidence
- keep scoring logic concise, explainable, and stable across PRs

Long term, this agent should evolve toward repository-specific risk baselines.

### GitHub Comment Agent

Primary responsibility:

- convert structured analysis into compact, premium GitHub comment output
- keep formatting high-signal and easy to scan in dark mode
- preserve GrepAI’s architecture-aware tone

This agent should never produce essay-style review comments.

### Webhook Processing Agent

Primary responsibility:

- orchestrate the PR event lifecycle after GitHub webhook delivery
- verify payload integrity
- fetch files and PR context
- invoke analysis
- trigger comment posting
- persist analysis results for dashboard visibility

This layer should stay resilient, observable, and log-rich.

## Current Product Mapping

Today, parts of this agent model already exist across the backend:

- `webhook/` coordinates event handling
- `github/` handles GitHub API interaction
- `analysis/` handles AI-driven risk analysis
- `repos/` handles repository connection state

The future direction is to make these responsibilities more explicit and composable.

## Agent Design Principles

- prefer structured outputs over long prose
- optimize for reviewer clarity, not model verbosity
- treat PRs as system events, not isolated snippets
- surface architecture impact before implementation trivia
- keep GitHub-native workflow intact
- avoid breaking auth, webhook, analysis, or comment-posting flows during refactors

## Future Agentic Roadmap

- repository graph agent for deeper dependency tracing
- semantic retrieval agent for historical code context
- drift detection agent for architecture boundary changes across PRs
- team intelligence agent for recurring risk patterns and ownership-aware alerts
- merge gate agent for policy-driven review outcomes

## Working Rule for AI Assistants

When modifying GrepAI, preserve the product’s core behavior:

- repository connection must remain GitHub-native
- webhook processing must remain reliable
- PR analysis must remain concise and structured
- GitHub comment posting must not regress
- dashboard data should reflect real repository and analysis state
