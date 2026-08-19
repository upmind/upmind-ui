## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships. It is a **monorepo** graph built with a cross-package resolver (`pnpm graph`), so it carries the apps<->packages edges a plain rebuild drops.

Rules:

- For codebase questions, reach for the **`graphify` MCP tools FIRST** — `query_graph`,
  `shortest_path`, `get_node`, `get_neighbors`, `get_community`, `god_nodes`, `graph_stats`.
  They are callables, not a shell round-trip, and they return a scoped subgraph — usually
  much smaller than GRAPH_REPORT.md or raw grep output.
- For "what calls X / what does X call", use **`get_neighbors`** — it returns the inbound and
  outbound edges straight off the symbol node. This is the question most often answered with grep.
- The CLI is the FALLBACK, for when the MCP server is absent (a bare worktree, CI, a
  headless run): `graphify query "<question>"`, `graphify path "<A>" "<B>"`,
  `graphify explain "<concept>"`, `graphify affected "<symbol>"`. Shelling out while the
  tools are connected is the wrong door — check your tool list before you reach for Bash.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when the tools do not surface enough context.
- After modifying code, run `pnpm graph` to keep the graph current (AST-only, no API cost).
  **Not `graphify update .`** — this is a monorepo, and graphify's own rebuild has no
  cross-package resolver, so it wipes every `apps` <-> `packages` edge.

## published-docs (mintlify-docs) — never commit to `main`

`docs/published-docs` is a submodule of `github.com/upmind/mintlify-docs`, and `main`
there is the LIVE published Mintlify target — a commit on it publishes without review.

Rules:

- Commit to `develop`, or to a feature branch with an MR into `develop`. Never `main`.
- Check the branch before committing: that repo's `origin/HEAD` points at `origin/main`,
  so a fresh clone or a detached-HEAD submodule checkout lands on `main` by default.
- This is where `pnpm --filter docs corpus:refresh` writes its generated reference tree,
  so it applies on every corpus refresh.

Enforced by `.claude/scripts/published-docs-branch-guard.sh`, wired two ways:
a blocking `PreToolUse(Bash)` hook in `.claude/settings.json` (stops agents) and
`pre-commit`/`pre-push` hooks installed into the submodule by
`.claude/scripts/install-published-docs-hooks.sh`, which the root `prepare` script
re-runs on every `pnpm install` (stops everyone, and survives re-clone).
`--no-verify` bypasses the git-hook side: this is a guard rail against the accident,
not a substitute for server-side branch protection.

## Constraints (non-negotiable)

- NEVER interpret or hand-roll ad-hoc commands. ALWAYS invoke the `upmind-agent` doors, tools, and skills — the work logic lives behind the doors, not in improvised prompts.

## Communication (non-negotiable)

Write all replies in Simplified Technical English (STE). Obey these rules:

- Keep each sentence short. Use no more than 20 words in each sentence.
- Write one instruction in each sentence.
- Write one idea in each message.
- Use the active voice. Use the imperative for instructions.
- Use simple present tense. Do not use complex tenses.
- Use one word for one meaning. Do not change the word for the same thing.
- Answer only the question. Do not write a preamble. Do not write a recap. Do not list options.
- Do one step. Then wait for the reply.
- If you make a mistake, tell the user immediately. Do not defend the mistake. Do not add a caveat.
- Keep agent output out of the chat. Give one line at each gate.
