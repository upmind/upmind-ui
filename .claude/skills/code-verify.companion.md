> Companion to the upmind-agent skill /code-verify — Upmind-monorepo-specific bindings/overrides.

Binds the base skill's generic "issue tracker", "git host", "review stage", and governing-record placeholders to this repo's concrete systems. The base doctrine is authoritative; this file only supplies the values.

## Tracker + git-host binding

- **Issue tracker:** Linear (MCP connector `claude.ai Linear`). Every base step that reads ACs, distils the deliverable, or mirrors the verdict reads/writes Linear; "delivered under a different issue" means a different Linear issue.
- **Git host:** GitLab at `git.upmind.io`. All branch reads (`git fetch`, `origin/<target-branch>`, the HEAD captured as `verifiedSha`) are against this remote.
- **Override — settlement host:** the verdict is settled server-side on **Linear + GitLab, never GitHub**. Do not open, mirror to, or settle the verdict on GitHub even when a `gh`/GitHub path is available in the environment.
- **Review-stage mapping:** the base "review stage" (the point `/agent-run` gates before) is the Linear **`Needs Review`** state.

## Governing records

- The skill's charter and correctness-coverage discipline (base "the governing decision record"): **ADR-021** (Testing Trophy, Agentic Workflow & Coverage Policy). Cite it; do not restate it.
- The actor-model decision record that fixes the actor×context cell grid (base Step 1 / `parity.yaml`): **ADR-001**.
