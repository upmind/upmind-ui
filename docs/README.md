# Upmind docs

One index, two consumers. `docs/corpus/corpus.json` is the source of truth for
every generated doc, and both the published site and the agent tooling read it.
Nothing downstream reads the source tree directly.

## How it works

`corpus:build` gathers four inputs into that index:

| Input | Where it comes from |
| ----- | ------------------- |
| Code reflection | TypeDoc over `packages/headless`, JSON only — its markdown goes to a throwaway dir |
| ADRs | `docs/adr/` |
| Module docs | `packages/headless/src/modules/*/docs/` |
| Glossary | `docs/corpus/glossary.yaml` |

`corpus:emit` then renders the index into Mintlify MDX under
`docs/published-docs/developers/reference/headless/`. That directory is a git
submodule of `github.com/upmind/mintlify-docs` — Mintlify publishes from it, so
its `main` goes live without review. Commit to its `develop`, never `main`; a
branch guard enforces it, and you never bypass a guard with `--no-verify`.

```bash
pnpm --filter docs corpus:build    # rebuild the index
pnpm --filter docs corpus:emit     # render the published pages
pnpm --filter docs corpus:refresh  # both
```

## The four gates

`.gitlab-ci/docs-corpus.yml` runs these on any change under `docs/corpus/`.
Each is a plain node script you can run locally from the repo root:

| Gate | What it proves |
| ---- | -------------- |
| `gate-api-drift` | Every source symbol matches the committed corpus and the emitted tree |
| `gate-symbols` | Every documented symbol and glossary referent resolves against a fresh reflection |
| `gate-examples` | Every fenced code block compiles against the real workspace packages |
| `gate-authorship` | No generated page was hand-edited — emit replay is byte-exact |

`gate-examples` is why a doc snippet must be a whole compilable unit: tag it
`ts`, `tsx` or `vue`, import what it uses, and read the real call site rather
than inventing one. A fragment that genuinely cannot stand alone carries
`<!-- corpus-example: skip — <specific reason> -->`; "excerpt" is not a reason.

## What lives here, and what does not

Durable record only — ADRs, the corpus and its gates, the published tree. A
module's own docs live beside its source, under
`packages/headless/src/modules/<name>/docs/`, guides included.

Working notes stay out of git: audits, research, reviews, backups, session
worklogs and spent plans are all gitignored. The workshop handover bundle moved
to the agent-runner root for the same reason. Release notes live in Linear.

VitePress and its Firebase hosting are retired — see ADR-026.
