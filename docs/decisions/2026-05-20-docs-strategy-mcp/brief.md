# Council Brief: Docs Strategy + Agent MCP

**Date:** 2026-05-20
**CEO:** Claude (Opus 4.7, 1M)
**User:** Dominic da Costa (dominic.dacosta@upmind.com)
**Repo:** upmind/upmind-monorepo
**Branch:** feature/graphify+docs
**Linear epic:** [FE-2748](https://linear.app/upmind-automation/issue/FE-2748/epic-headless-docs-platform-v1-corpus-mcp)

## The decision

Upmind currently runs docs as **VitePress + TypeDoc + typedoc-plugin-markdown + typedoc-vitepress-theme + vitepress-jsdoc** (see `docs/package.json`). Comments in code → TypeDoc → markdown → VitePress site.

Pain reported by user:
1. **Stale / out-of-sync content** — comments rot, examples break, no enforcement
2. **Poor discoverability / IA** — hard to find things, weak navigation
3. **Not agent-consumable** — no structured format agents can query; HTML-only output

The user wants:
- A **full docs site** (reference + guides + concepts + ADRs + onboarding + changelogs)
- Serving **four audiences** as first-class:
  - External developers / integrators
  - Internal engineers
  - **AI coding agents (first-class via MCP)**
  - Non-technical stakeholders (PMs, support, sales)
- **Self-hosted only** — no SaaS docs platforms (Mintlify, ReadMe.io, GitBook etc. are OUT)
- Open to rewrites; no SEO/URL-preservation constraint

## The question

> **Do we keep VitePress and bolt on MCP, replace the generator, or move to a fundamentally different docs architecture?**

## Current state (ground truth from recon)

- `docs/` already contains: `adr/`, `analysis/`, `sdd/`, `workshop/`, `release-notes/`, `plans/`, `audit/`, `@upmind-automation/`, `public/`
- Build pipeline: `predocs` → `typedoc` → `vitepress dev/build/preview`
- `tsdoc.json` and `typedoc.json` present
- The repo has a **graphify** knowledge graph at `graphify-out/` (the user is exploring code-graph tooling)
- DEVX.md exists at repo root (26KB) — likely the "real" onboarding doc, not docs/
- `packages/headless/docs/` exists — per-package docs already partially present

## Binding constraints

1. **Self-hosted only.** No SaaS docs platforms.
2. **Agent-first via MCP is a hard requirement,** not a nice-to-have. The docs must be queryable by agents through an MCP server.
3. **Single source of truth** — staleness is the biggest pain; the solution must structurally prevent drift, not rely on discipline.
4. **Full content scope** — reference + guides + concepts + ADRs + onboarding + changelogs all in one system.

## Out of scope for this council

- Specific MCP server vendor/library choice (implementation detail)
- Migration sequencing (handoff to planning-and-task-breakdown after decision)
- Hosting choice (Firebase, Cloudflare Pages, self-run nginx etc.)

## Roster

| Seat | Model | Lens |
|---|---|---|
| principal-engineer (opens) | Opus | Overall architecture, simplicity, source-of-truth design |
| platform-engineer | Sonnet | Generation pipeline, hosting, drift detection, CI enforcement |
| integration-engineer | Opus | MCP server design, schema for agent consumers, external-dev API surface |
| product-manager | Opus | IA across 4 audiences, content strategy |
| technical-writer | Opus | Authoring workflow, comment-vs-prose split, drift prevention, voice |
| ui-ux-designer | Sonnet | Search, navigation, discoverability for human readers |
| accessibility-specialist | Sonnet | a11y, keyboard nav, screen reader, contrast |

## Memory audit

User memory contains only: (1) review-queue tracker path, (2) "never commit without explicit approval". Neither contradicts council protocol. No prior decision logs on docs strategy found.

## Run mode

Teammate (TeamCreate/SendMessage) infrastructure is unavailable in this environment. Running as **parallel Agent subagents, CEO-mediated rounds**:
- Round 1: all seats spawned in parallel, return opening verdicts + reasoning to CEO
- Round 2 (if needed): re-spawn seats with peer positions baked in, max 1 extra round
- CEO synthesizes, posts draft log for approval
