# Workshop Initiator — Cursor layer

> Read [`generic.md`](./generic.md) first. This file adds Cursor-specific scaffolding on top of it — context loading, `.cursorrules`, Composer vs Chat, background agents, and per-feature loop adaptations.
>
> If your team is running the workshop on Cursor, **this** file is your initiator. Don't manually concatenate the layers — Cursor reads both files via `@file` context (see "How to load this initiator in Cursor" below).
>
> If a recommendation here conflicts with `generic.md`, **`generic.md` wins**. This layer adapts; it doesn't override.

---

## How to load this initiator in Cursor

Day 1, first thirty minutes:

1. **Create the prototype repo.** Empty git repo, in the team's chosen folder. (Feature 0 will scaffold it; you just need a folder for Cursor to open.)
2. **Drop the handover bundle alongside the code.** Unzip the workshop bundle into a top-level `workshop-bundle/` folder inside the repo (or as a sibling — `workshop-bundle/` next to the repo root works, but inside is simpler for `@file` resolution).
3. **Open the repo in Cursor.** Wait for indexing to finish — you'll see the progress in the bottom status bar. The bundle's markdown will be indexed too, which is what makes `@workshop-bundle/...` references resolve cleanly.
4. **Add `.cursorrules`** (see the next section) at the repo root before starting the first chat. Cursor reads it on every agent interaction.
5. **Open a new chat tab** (Cmd-L) in **Agent mode** (the mode toggle is at the bottom of the chat panel).
6. **Paste the loading prompt below.** This is the only thing the team types to boot the workshop.

### Loading prompt — paste verbatim into the first Cursor chat

```
You are the workshop implementation agent for a 2-day cart + customer-panel prototype
build against the Upmind back-end. Read these two files end-to-end, in this order,
before doing anything else:

  @workshop-bundle/06-initiator/generic.md
  @workshop-bundle/06-initiator/cursor.md

After reading, do this:

1. Confirm in one short message that you've loaded both files and understand:
   - the mission (section 1 of generic.md)
   - the feature sequence (section 8)
   - your operating principles (section 10)
2. Then run the Kickoff Interview (generic.md section 10, Step 0) against me.
   One cluster at a time. Ask the questions in plain language. Capture my answers
   verbatim back into sections 4, 5, and 6 of generic.md as you go — edit the file
   directly. Read each cluster back to me and wait for "confirmed" before moving on.
3. Do not generate any project code until the interview is complete and confirmed.

If I interrupt to start coding, finish the cluster you're on, capture what you have,
mark the rest "TBD — ask when relevant", and continue.
```

That's it. The agent now owns the workshop.

---

## `.cursorrules` — persistent agent rules

Create `.cursorrules` at the **prototype repo root** before the first chat. Cursor automatically reads this file for every agent interaction, which is how the load-bearing principles survive between chat tabs and across the two-day workshop.

The contents below are a distilled, machine-readable form of `generic.md` section 10 — the agent still re-reads the full operating principles from the bundle, but `.cursorrules` is the safety net that fires every turn.

```text
# Workshop Implementation Agent — Cursor Rules

You are building a 2-day cart + customer-panel prototype against the Upmind
back-end. The handover bundle is at @workshop-bundle/. Read it; treat it as
the source of truth.

## Before generating any code for a feature

1. Read the relevant module foundation doc: @workshop-bundle/02-module-foundations/<module>.md
2. Read the per-feature SDD: @workshop-bundle/04-sdd/<NN>-<feature>.md
3. Confirm sections 4, 5, 6 of @workshop-bundle/06-initiator/generic.md are filled
   in (the kickoff interview output). If not, run the interview before coding.
4. Foundations layer (HTTP / auth header / currency injection / error normalisation)
   exists before any feature is touched. If it doesn't, build it first.

## Hard rules (never violate)

- Never invent platform behaviour the foundation docs don't describe.
- Never import from `headless`, `ui`, or `client-vue` — the prototype is from-scratch
  in the team's chosen stack.
- Never hardcode brand identifiers. The Upmind API resolves brand from the request's
  host header. Run the dev server under the brand domain, not localhost.
- Never treat WAITING or AWAITING_CLIENT payment responses as errors — they are
  platform-defined success-path states. See @workshop-bundle/02-module-foundations/payment.md
- Never blur the paymentDetails (capture) vs payment (make) boundary.
- After seating a product into a basket, diff against the pre-seat basket to find
  the new entry — the response is the full refreshed basket and doesn't flag new rows.
- Don't pass basket_id on catalogue browse reads unless you need basket-accurate
  prices — it forces full re-pricing on the back end.

## Working style

- One feature at a time. Validate against its SDD checklist before moving on.
- Respect the team profile in section 5 of generic.md. If a generated approach
  conflicts with the team's stack choice, stop and ask.
- When stuck, ask the team — they are in the room. If they're stuck too, point
  at the foundation doc; the answer is usually there.
- If a foundation doc itself is wrong, surface it — that's a real finding worth recording.
- Update the feature's SDD if reality diverged from the spec during the build.

## Conventions

Re-read sections 5 and 6 of @workshop-bundle/06-initiator/generic.md before every
code-gen step. Those sections are inviolable for naming, imports, async style,
error handling, folder layout, and module organisation.
```

> If your team's Cursor version supports the newer `.cursor/rules/*.mdc` per-folder rules system, you can split the above by concern (one `.mdc` for hard rules, one for working style, one for conventions) and scope each to specific folders. For a two-day prototype with a single-app repo, a single root `.cursorrules` is simpler and sufficient.

---

## `.cursor/rules/*.mdc` — per-folder rules (optional)

If the team's repo layout grows feature folders early (e.g. `src/features/auth/`, `src/features/basket/`), consider scoping rules to those folders so the agent only loads the relevant module foundation doc per feature.

Example — `.cursor/rules/basket.mdc`:

```text
---
description: Basket + basketProduct feature work
globs:
  - src/features/basket/**
  - src/features/checkout/**
alwaysApply: false
---

When working in this folder, read these foundation docs before generating code:
- @workshop-bundle/02-module-foundations/basket.md
- @workshop-bundle/02-module-foundations/basketProduct.md
- @workshop-bundle/02-module-foundations/product.md  (seating endpoint)

Per-feature SDD: @workshop-bundle/04-sdd/04-basket.md
```

Keep these light. The team is moving fast; per-folder rules are useful when the agent keeps forgetting which docs to load — not as upfront ceremony.

---

## Context injection — pointing Cursor at the right docs

Cursor's `@`-prefix references are how you load context per turn. The four references the team uses every feature:

| Reference | What it loads | When to use |
| --- | --- | --- |
| `@workshop-bundle/02-module-foundations/<module>.md` | One module's foundation doc | Every code-gen step touching that module |
| `@workshop-bundle/04-sdd/<NN>-<feature>.md` | The feature's spec | Start of each feature build |
| `@workshop-bundle/03-foundations-chapter.md` | Cross-cutting concerns | When building or revisiting the foundations layer (feature 0) |
| `@workshop-bundle/07-references/fixture-index.md` | Captured API response shapes | When typing a response or checking edge-case payloads |

Other useful `@` references in Cursor:

- `@file <path>` — explicit file (same as the bundle references above; the `@workshop-bundle/...` form is just an `@file` shortcut)
- `@folder <path>` — pulls in everything in a folder; use sparingly (eats context)
- `@web <query>` — live web search; useful if the team picks a stack the agent isn't fluent in
- `@docs <name>` — Cursor's bundled docs for popular frameworks (Svelte, React, Next, etc.); add the team's chosen framework via Settings → Features → Docs early in Day 1

### Example chat prompts per feature

Feature 1 (auth) starting prompt:

```
Build feature 1 (auth — register + login) per the spec.

Context:
@workshop-bundle/04-sdd/01-auth.md
@workshop-bundle/02-module-foundations/session.md
@workshop-bundle/02-module-foundations/client.md
@workshop-bundle/03-foundations-chapter.md

Use the conventions captured in sections 5 and 6 of
@workshop-bundle/06-initiator/generic.md.

Walk me through your plan first — file list, key types, the order you'll
write things — then we'll iterate before you touch any code.
```

Feature 6 (payment) starting prompt:

```
Build feature 6 (payment — Stripe 3DS happy path).

Context:
@workshop-bundle/04-sdd/06-payment.md
@workshop-bundle/02-module-foundations/paymentDetails.md
@workshop-bundle/02-module-foundations/payment.md
@workshop-bundle/02-module-foundations/basket.md

Hard reminders before you start:
- paymentDetails captures (gateways, SDK handshake, produces SelectPaymentMethodData)
- payment makes (submits, handles 3DS / awaiting-client / offsite redirect)
- WAITING and AWAITING_CLIENT are success-path states, not errors

Plan first. Wait for confirmation before generating code.
```

The team keeps a notepad (see "Settings recommended" below) with these prompts pre-written so they can fire them per feature without retyping.

---

## Composer vs Chat vs Agent mode — when to use which

Cursor offers three interaction surfaces. Pick deliberately per task.

| Surface | Shortcut | Best for |
| --- | --- | --- |
| **Inline edit** | Cmd-K | Tight, single-file edits ("rename this", "add a try/catch here") |
| **Chat** | Cmd-L | Q&A, exploration, "explain this", small targeted edits to one or two files |
| **Composer** | Cmd-I | Multi-file changes — refactors, new feature scaffolds, anything touching 3+ files |
| **Agent mode** (inside Chat) | Toggle at chat bottom | Open-ended tasks where the agent decides which files to read/edit; the right mode for the kickoff interview and per-feature builds |

Workshop guidance:

- **Kickoff interview** — Agent mode in Chat. The agent edits `generic.md` in place to capture answers.
- **Each per-feature build** — Agent mode in Chat. The agent reads foundation doc + SDD, plans, then writes. Multi-file by nature.
- **Mid-feature refactors** ("split this file", "extract a hook") — Composer. Cleaner diff review than Agent mode for known-scope changes.
- **"What does this do?"** — Chat (non-Agent). Read-only Q&A.
- **Typo / one-liner fixes** — Inline edit.

Don't fight the surfaces. If the team's instinct is Composer, let them use it; switch to Agent mode when the next task is genuinely open-ended.

---

## Background agents — running parallel work streams

`generic.md` section 11 lists three parallel-safe feature pairs. Cursor's background agents (the cloud-side agents launched from the Background Agents panel) are the right tool for this — they run independently, don't share context with the foreground chat, and merge results back via a branch.

> **If your team's Cursor version doesn't have Background Agents enabled**, ignore this section and stick to the sequential baseline in `generic.md` section 11. The workshop is achievable sequentially.

### How to launch a background agent for a parallel feature

1. Open the Background Agents panel (sidebar icon, or Cmd-Shift-P → "Background Agents").
2. Click **New Background Agent**.
3. Choose the base branch (usually `main` after the previous merge point).
4. Paste the **background agent prompt template** below, filled in for the feature.
5. The agent runs to a working state on its own branch, then surfaces a PR / branch the team reviews and merges.

### Background agent prompt template

Copy-paste, fill the `[BRACKETS]`:

```
You are a background workshop implementation agent. Read these files before
generating code:

  @workshop-bundle/06-initiator/generic.md
  @workshop-bundle/06-initiator/cursor.md
  @workshop-bundle/04-sdd/[NN-feature].md
  @workshop-bundle/02-module-foundations/[primary-module].md
  [@workshop-bundle/02-module-foundations/<secondary-module>.md ...]

Your task: implement feature [NN] per its SDD, on a new branch named
"feature/[NN-short-name]". Respect the team profile captured in sections 4, 5,
and 6 of generic.md. Use the conventions there exactly.

When done:
- Every checklist item in the SDD passes
- The feature compiles and runs against the staging API
- You've committed in logical chunks with clear messages
- You've written a short summary of what you built and any deviations from the SDD

Do not touch files outside this feature's scope. Do not modify the
foundations layer — it's owned by another stream.

If you're blocked, stop and post a question. Don't guess.
```

### Rules when going parallel (the non-negotiables from `generic.md` section 11, restated for Cursor)

1. **Lock the contract at the boundary before splitting.** Agree the shape of what stream A hands to stream B in the foreground chat first, then launch the background agent for stream B. Otherwise the streams diverge.
2. **Each background agent re-reads its own foundation doc + SDD.** No cross-contamination. The agent has no memory of the foreground chat — it works from the bundle.
3. **One human reviewer per stream.** Two people steering one background agent creates conflict.
4. **Merge before moving on.** The team merges both branches to a single working state before starting the next feature. Don't pile features on top of un-merged streams.

### Recommended parallel pairs (from `generic.md` section 11, restated)

| Foreground stream | Background stream |
| --- | --- |
| Feature 1 (auth) | Feature 2 (brand bootstrap) |
| Feature 3 (catalogue grid + categories) | Feature 7 (panel scaffolding, read-only mocks until feature 6 lands) |
| Feature 5 (checkout address UI) | Feature 6 (payment SDK handshake plumbing) |

If the team is new to background agents, skip them on Day 1 and try one on Day 2 — the sequential baseline is the safe path.

---

## Per-feature loop in Cursor

A Cursor-specific restatement of `generic.md` section 10's per-feature loop. The principles are the same; the mechanics adapt.

1. **Open a new chat tab** (Cmd-T) per feature. Fresh context per feature keeps the agent focused — no bleed from feature N-1's debugging.
2. **Switch to Agent mode** at the chat panel bottom.
3. **Paste the feature's starting prompt** (see "Context injection" examples above). This loads the SDD + foundation doc(s) via `@file`.
4. **Ask the agent to plan first.** "Walk me through your plan before generating code." Catches misreads of the SDD early.
5. **Approve the plan, then let the agent build.** Multi-file Composer-style writes happen inside Agent mode.
6. **Review inline diffs together.** Cursor shows per-file diffs as the agent writes; the team in the room walks through them before accepting.
7. **Iterate** with follow-up turns in the same chat tab — the agent retains context for the feature.
8. **Run the feature end-to-end against staging.** Confirm against the SDD's checklist + `generic.md` section 9 validation items.
9. **Commit** when green. One commit per feature is typical; sub-commits per logical chunk are fine.
10. **Update the SDD** if reality diverged. The agent can do this — "update `04-sdd/01-auth.md` to reflect what we actually built".
11. **Close the chat tab. Move to the next feature.**

---

## Settings recommended for the workshop

These are Cursor settings worth tweaking before Day 1. None are strictly required, but they smooth the experience.

- **Model** — Pin to Claude Sonnet (or whichever Claude-class model the team's plan provides). The workshop assumes Claude-class capability; switching to a smaller model mid-workshop creates inconsistent output.
- **Codebase indexing** — On. Verify it has finished indexing the bundle before the kickoff interview starts (status bar shows progress). This is what makes `@workshop-bundle/...` references resolve fast.
- **Privacy mode** — Team's call, but be aware that privacy mode disables some indexing features. For a workshop on a throwaway prototype repo, privacy mode off is fine.
- **YOLO mode / auto-run** — On for file ops (Cursor will write files without per-write confirmation). The team is iterating fast and reviewing in diff form, not per-prompt. Keep terminal command auto-run **off** unless the team is comfortable with it — the agent shouldn't be running `rm -rf` unattended.
- **Notepads** — Pre-create a "Workshop Prompts" notepad with the per-feature starting prompts (auth, brand bootstrap, catalogue, basket, checkout, payment, panel) ready to paste. Saves typing under time pressure. Also pre-create a "Platform Contracts" notepad with the contents of `@workshop-bundle/03-foundations-chapter.md` for quick reference.
- **Docs** — Add the team's chosen framework (Svelte, React, Vue, etc.) via Settings → Features → Docs. Lets the agent use `@docs` for framework-specific lookups.
- **Multi-tab chat sessions** — Use one chat tab per feature (see per-feature loop above). Cmd-T opens a new tab.

> If your team's Cursor version supports a feature listed here under a different name, the principle still applies. Cursor's UI moves fast — when in doubt, look for the closest equivalent and proceed.

---

## What this layer does NOT change vs `generic.md`

These are owned by `generic.md` and not overridden here:

- The mission, scope cut, and BUILT vs DOC'D-ONLY split (sections 1-3)
- The kickoff interview questions themselves (section 10, Step 0)
- The feature sequence and dependency graph (section 8)
- The validation checklist / definition of done (section 9)
- The operating principles (section 10)
- The parallel-safe pairs and rules for going parallel (section 11)
- The workshop day shape (section 11)
- Anything in sections 4, 5, 6 (those are filled in during the kickoff interview, not pre-written)

If the team finds tension between this layer and `generic.md`, **`generic.md` wins**. Surface the tension to the workshop facilitator — the initiator should be tightened, not worked around.
