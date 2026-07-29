# docs/corpus — the corpus pipeline and the agent discovery channel

This module builds `docs/corpus/corpus.json` — the single, typed, renderer-independent
JSON artifact that the docs CI drift gates, the MDX emitter, and in-repo factory
agents all read (ADR-026: "the corpus + CI drift gates are the product"). This
README covers the **discovery channel** (FE-3003): how an agent goes from a
domain/system term (`basket`, `session`, `promotion`, …) to the living code, ADR,
or guide that term actually resolves to today — never a hand-maintained list
that can quietly drift from the code.

> Everything below is checked against `docs/corpus/*.selftest.mjs` and
> `docs/corpus/fixtures/`. If a self-test doesn't cover a claim in this doc, the
> claim shouldn't be here.

## What it is

Two faces over one drift-checked source (`corpus.glossary.terms` + `corpus.index`,
both built by `corpus:build` from the hand-authored `docs/corpus/glossary.yaml`):

- **Pull** — `glossary-resolve.mjs`, a CLI an agent (or a skill) calls on demand
  when it hits an unfamiliar term.
- **Push** — `glossary-inject.mjs`, a `PreToolUse` hook wired in
  `.claude/settings.json` that surfaces a term's digest into agent context the
  moment the agent touches a file/path/pattern that term resolves to — no lookup
  required.

Both faces read the *same* source. There is no second, hand-maintained glossary
in this channel — a referent that stops resolving fails the `gate:symbols` CI
gate rather than silently going stale.

## Operations

### Pull — resolve a term on demand

```
node docs/corpus/glossary-resolve.mjs <term-or-alias>
```

```
$ node docs/corpus/glossary-resolve.mjs basket
## basket (domain)  [slug: basket]

The customer's in-progress order — the collection of products, billing
cycles, promotions, and currency selected before checkout. The headless
basket is the reactive source of truth the storefront app reads and mutates.

referents:
  - symbol @upmind-automation/headless!useBasket -> packages/headless/src/modules/basket/useBasket.ts
  - symbol @upmind-automation/headless!BasketContext -> packages/headless/src/modules/basket/basket.types.ts
```

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | resolved — a single deterministic match, or a genuine alias tie (printed in full, with a `WARN` on stderr) |
| `1` | no term or alias matches the input |
| `2` | corpus-integrity failure — a matched referent id does not resolve in `corpus.index` (should never happen post-gate; reported loud, never dropped) |

Precedence when an input could match more than one entry: an **exact term-slug
or canonical-name match always wins** over an alias match, even if the input
also collides with another term's alias. Only when the input is a shared alias
of two or more terms with no slug/name match does the resolver print every tied
match (never silently pick one).

`cart` and `basket` are deliberately separate terms, not aliases of each other:
`basket` is the domain concept (the in-progress order); `cart` is the
`apps/cart` storefront app that renders it (ADR-007). Resolving `cart` returns
the ADR-007 referent, not the basket symbols.

### Push — activity-triggered injection

Wired in `.claude/settings.json` as a `PreToolUse` hook on
`Read|Edit|Write|NotebookEdit|Grep|Glob|Bash`:

```
[ -f docs/corpus/glossary.json ] && node docs/corpus/glossary-inject.mjs || true
```

The hook reads the tool-call payload from stdin (`tool_name`, `tool_input`) and
matches on what the agent is **touching** — a file path landing on a term's
resolved referent path ranks first, a text mention of a term/alias in a
grep/glob pattern or bash command ranks second. On a hit it prints exactly one
line:

```
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"glossary: basket: The customer's in-progress order… (packages/headless/src/modules/basket/useBasket.ts, packages/headless/src/modules/basket/basket.types.ts)"}}
```

Bounded by design: at most 3 terms per injection, each definition truncated to
160 characters. No match, a missing/unparseable `glossary.json`, or unreadable
stdin all degrade **silently** — exit 0, empty stdout, never a thrown error.

This mirrors the existing graphify `PreToolUse` hooks in the same
`.claude/settings.json` (same `additionalContext` JSON contract) and only fires
for sessions whose working directory is this monorepo checkout — an agent
launched from outside a monorepo worktree never sees it.

## Data shape

Both faces read the slim `docs/corpus/glossary.json` — a build-time projection
of just two sections of `corpus.json` (typed in `corpus.types.ts`), so a tool
call never parses the full ~3MB corpus:

- `glossary.terms[slug] → { term, kind: domain|system, aliases[], definition, referents: [{ type: symbol|guide|adr|example, id }] }`
- `index[id] → { kind, path, module, title }` — every referent's `id` is looked
  up here to produce a real, repo-relative path.

The hand-authored source is `docs/corpus/glossary.yaml` — the only
non-machine-owned file under `docs/corpus/`. It currently carries 31
symbol-referent lines and 7 ADR-referent lines across its populated term set;
`corpus:build` compiles it into `corpus.glossary.terms` and `gate:symbols`
fails CI if any referent stops resolving.

## Dependencies

- `docs/corpus/glossary.json` — the slim runtime artifact both faces read: a
  projection of `corpus.json`'s `glossary` + the `index` entries its referents
  point at, emitted by `corpus:build` alongside the corpus so a tool call never
  parses the full ~3MB file.
- `docs/corpus/corpus.json` — built by `pnpm --filter docs corpus:build` (needs
  a TypeDoc reflection over `packages/headless`; see Lessons below); the source
  `glossary.json` is projected from.
- `docs/corpus/gates/gate-symbols.mjs` — the drift gate; every glossary
  referent (symbol or ADR) must resolve against the fresh reflection or CI goes
  red. Adding a term needs no new gate.
- `.claude/settings.json` — hosts the `PreToolUse` hook wiring for the push
  face, alongside the pre-existing graphify hooks.

## API endpoints

None — this is an in-repo agent-tooling channel, not a product HTTP surface.

## Lessons (hard-won)

- **`gate:symbols` needs a real TypeDoc reflection, not just `corpus.index`.**
  `type: symbol` referents are checked against a *fresh* TypeDoc reflection
  (`docs/corpus/.reflection.json`), which requires a full workspace
  `pnpm install` (submodule init for `packages/types` / `packages/ui`, then
  building those packages) before `corpus:build` can run. In a bare worktree
  the gate goes red with "run `pnpm --filter docs corpus:build` first" — that
  is a missing-precondition failure, not a dead referent.
- **`basket` and `cart` are not synonyms.** They were originally modelled as
  aliases; the ontology was corrected so `cart` is its own term pointing at the
  `apps/cart` storefront app (ADR-007), while `basket` stays the domain
  concept. Conflating them would have made both resolve to the wrong referent
  half the time.
- **The push hook must degrade silently, not throw.** A missing or
  pre-`corpus:build` `corpus.json`, unparseable JSON, or empty stdin all exit 0
  with no output — a `PreToolUse` hook that throws breaks the tool call it's
  attached to, so absence-of-corpus is treated as absence-of-match, never as an
  error.
- **The static plugin `glossary.md` is intentionally not touched by this
  channel.** It was evaluated for retirement and dropped from scope
  (operator-signed decision, `docs/sdd/FE-3003/plan.md` OQ-2): it ships from a
  marketplace plugin with `autoUpdate: true` (an in-place edit would be
  clobbered on the next sync) and has zero live consumers in the tree. It is
  left in place as harmless dead weight; `docs/corpus/glossary.yaml` /
  `corpus.json` is the single source of truth this channel reads.

## Verification

Re-run at the pushed HEAD (`docs/sdd/FE-3003/verify.md`, PRESENT): pull-resolve
returns real headless paths for known terms and a non-zero exit for unknown
ones; push-inject emits the guarded `additionalContext` line on a referent-path
hit and stays silent otherwise; the populated glossary (23 terms) has every
referent resolving through `corpus.index`; `gate-symbols.mjs` passes against a
freshly built reflection (`docs/sdd/FE-3003/evidence/ac1-readback.md`). See
`glossary-resolve.selftest.mjs` and `glossary-inject.selftest.mjs` for the
executable assertions backing every claim above.
