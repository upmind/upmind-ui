# Workshop initiator — which file to use

This folder contains three layered variants of the same workshop kickoff prompt.
**Use the one that matches your agent tooling.** Don't manually combine them.

| Your agent | File to use |
| --- | --- |
| Cursor | `cursor.md` |
| Claude Code | `claude-code.md` |
| Aider / Codex / GitHub Copilot Workspace / Anthropic API direct / anything else | `generic.md` |

The variants are **additive** — `cursor.md` builds on `generic.md`, and
`claude-code.md` builds on `cursor.md`. You feed your agent just **one** file as
the initial system prompt; that file tells the agent to read its base layer(s)
before continuing.

## What this initiator does

1. Runs a **Kickoff Interview** to capture your team's stack, conventions, and
   architecture choices (sections 4 / 5 / 6 of `generic.md`).
2. Loads the **module foundation docs** (`../02-module-foundations/`),
   **Foundations chapter** (`../03-foundations-chapter.md`), and **per-feature
   SDDs** (`../04-sdd/`).
3. Drives the **build sequence** (8 features, scaffold → panel) with validation
   at each step.

See `generic.md` for the full operating principles, validation checklist, and
pacing.
