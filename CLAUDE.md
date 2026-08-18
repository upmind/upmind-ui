## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

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
