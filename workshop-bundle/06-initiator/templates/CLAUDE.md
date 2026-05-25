# Project: Contabo workshop — cart + customer panel prototype

> Auto-loaded at the start of every Claude Code session. Survives `/clear`. This is the always-on safety net for the workshop; the full operating principles live in `workshop-bundle/06-initiator/generic.md` and are re-read by the agent on first interaction.
>
> This file ships pre-populated from the workshop bundle template. After the Kickoff Interview locks the team's stack (sections 5 + 6 of `generic.md`), the agent tailors the "Working style" section below with stack-specific notes.

## Workshop context

This repo is a 2-day workshop prototype built against the Upmind back-end. The handover bundle lives at `workshop-bundle/`. Your full operating principles live in `workshop-bundle/06-initiator/generic.md`, with Cursor and Claude Code adaptations in the sibling files.

## Before generating any code for a feature

1. Read `workshop-bundle/06-initiator/generic.md` end-to-end (once per session).
2. Read `workshop-bundle/06-initiator/claude-code.md` end-to-end (once per session).
3. Read the relevant module foundation doc(s) under `workshop-bundle/02-module-foundations/<module>.md`.
4. Read the per-feature SDD: `workshop-bundle/04-sdd/<NN>-<feature>.md`.
5. Confirm sections 4, 5, 6 of `generic.md` are filled in (the Kickoff Interview output). If not, run the interview before coding.
6. Confirm the foundations layer (HTTP / auth header / currency injection / error normalisation) exists. If it doesn't, build it before any feature.

Use the `Read` tool directly on bundle paths — they're in your working directory. Don't ask the team to attach files.

## Hard rules (never violate)

- **Never invent platform behaviour** the foundation docs don't describe.
- **Never import** from `headless`, `ui`, or `client-vue` — the prototype is from-scratch in the team's chosen stack.
- **Never hardcode brand identifiers.** The Upmind API resolves brand from the request's host header. Run the dev server under the brand domain, not `localhost`. See section 4 of `generic.md`.
- **Path-prefix routing — two prefixes, NOT one.** The transport layer applies the right prefix per request based on the path's leading segment:
  - `/oauth/*` → wire URL is `${api_base}/oauth/<path>` — **NO `/api/` prefix.** Applies to every grant: guest mint, password login, refresh, twofa, auth_code.
  - Everything else → wire URL is `${api_base}/api/<path>` — `/api/` is prepended.
  - Feature code passes logical paths (`/oauth/access_token`, `/countries`, `/clients/register`) without either prefix; the transport selects.
  - If a `404` comes back on a call you expect to succeed, this is the first thing to check. See `workshop-bundle/03-foundations-chapter.md` §1.1.
- **Never treat `WAITING` or `AWAITING_CLIENT`** payment responses as errors — they are platform-defined success-path states. See `workshop-bundle/02-module-foundations/payment.md`.
- **Never blur the `paymentDetails` (capture) vs `payment` (make) boundary.**
- **After seating a product into a basket, diff** against the pre-seat basket to find the new entry — the response is the full refreshed basket and doesn't flag new rows. Note: one seating call can yield multiple new basket products, and seating a quantifiable product already present yields zero new entries (it merges + bumps quantity).
- **Don't pass `basket_id`** on catalogue browse reads unless you need basket-accurate prices — it forces full re-pricing on the back end.
- **Pin to current-latest, verify before installing.** Your training cutoff lags reality. Before running any `install <pkg>` command, check the actual current major version (npm registry, the package's own site). Tailwind, shadcn, Next, Vue, React, and other fast-moving libs ship majors yearly — defaulting to your training-cutoff version installs the wrong major. If the team has no preference, ask once at install time which major to pin to, then record it in section 5 of `generic.md` so it survives `/clear`. **Especially watch:** Tailwind (v3 → v4), shadcn (Tailwind-version dependent), Next.js, Vite, framework majors.

## Working style (Claude Code specifics)

- **TodoWrite for any feature with 3+ steps.** Mirror the per-feature loop from `generic.md` section 10 as todo items. Mark items `in_progress` and `completed` as you go so the team can see live progress.
- **Prefer `Edit` over `Write` for existing files.** Whole-file rewrites destroy review context; the team is iterating with you in the room.
- **Use `Read` directly on bundle paths** rather than asking the team to paste contents.
- **One feature at a time.** Validate against its SDD checklist before moving on. Don't pre-build feature N+2 in the same pass.
- **Respect the team profile in sections 5 and 6 of `generic.md`.** If a generated approach conflicts with the team's stack choice, stop and ask.
- **When stuck, ask the team — they are in the room.** If they're stuck too, point at the foundation doc; the answer is usually there.
- **If a foundation doc itself is wrong, surface it.** That's a real find worth recording.
- **Update the feature's SDD if reality diverged** during the build.

<!-- AGENT-TAILORED: after the Kickoff Interview, append stack-specific notes here.
     e.g. "Tailwind v4 (not v3). shadcn install must use the Tailwind-4 variant."
          "pnpm only — do not invoke npm or yarn."
          "Vue 3.5+ with signals." -->

## What "done" means

A feature is "done" only when the validation checklist in `generic.md` section 9 and the per-feature checklist in its SDD both pass — not just "the code compiles" and not just "the screen renders".

## Subagents

You may spawn subagents via the Agent tool for parallel-safe feature pairs (see `generic.md` section 11). Use the subagent prompt template in `workshop-bundle/06-initiator/claude-code.md`. Subagents share the workspace but not the conversation, so give them everything they need in the spawn prompt.
