> Companion to runner/ docs — Upmind bindings

Binds the generic `runner/HANDOFF.md`, `runner/README.md`, and `runner/agent-runner.code-workspace` (in `monorepo-agent/`) to this org's concrete tooling. The base docs are tracker-agnostic and VCS-agnostic by design — this file supplies the real values.

## Repo clone

The base `git clone <git-remote> .agent` binds to:

```bash
git clone git@git.upmind.io:upmind/groups/frontend-team/monorepo-agent.git .agent
```

## Issue tracker

The generic "issue tracker" / "issue-tracker MCP" in the base docs is **Linear** here, via the `claude.ai Linear` MCP server.

- MCP endpoint: `https://mcp.linear.app/sse`
- Tools: `list_issues`, `get_issue`, `save_issue` (there is no `update_issue` — `save_issue` with an `id` updates; `labels` **replaces the whole set**, `state` sets the status column), `save_comment`
- Labels must exist in the Frontend team on Linear
- ID pattern: `FE-XXXX` (e.g. `FE-2399`)

## Change-request / VCS system

The generic "VCS/change-request MCP" is **GitLab MR creation** here, used by `/complete` (the change-request opener; was `/story-complete` + `/mr-create`).

The workspace file's commented-out `vcs` MCP block is a GitLab MCP server (`@zereight/mcp-gitlab`) pointed at `GITLAB_API_URL: https://git.upmind.io/api/v4`.

**Security note:** the pre-genericization version of `agent-runner.code-workspace` had literal-looking `GITLAB_OAUTH_CLIENT_ID` / `GITLAB_OAUTH_CLIENT_SECRET` values committed in that commented block (the secret carried the `gloas-` GitLab-OAuth-application-secret prefix). Those values were **not** carried into this companion or into the genericized base file — they were replaced with `<oauth-client-id>` / `<oauth-client-secret>` placeholders everywhere. If those values are live credentials, rotate them in GitLab and scrub them from git history; do not just re-paste them into a config file (this one included).

## Architecture decision records

The base docs' generic "the project's architecture decision records" / "state-management conventions" bind to:

- **ADR-001** — XState conventions
- **ADR-005 / ADR-007** — headless architecture / state-management layer (see `core-machines.companion.md`)

Cite the concrete ADR number in Upmind-side work; the base plugin docs deliberately don't.

## Repo context

- **Monorepo root:** `monorepo/`
- **Headless package:** `packages/headless/` — XState machines, composables, services
- **Main branch:** `develop`
- **Branch pattern:** `feature/FE-XXXX`

## Live stories (example queue seed, not normative)

The base `HANDOFF.md` used to carry a "Current Stories Ready" table of live examples. Point-in-time snapshot, kept here for provenance only — refresh from Linear rather than trusting this table:

| ID | Title | Spec | Est. |
|----|-------|------|------|
| FE-2399 | Update quantity-based products to new calculate format | ✅ exists | 1pt |
| FE-2157 | Persist currency when no active basket | ✅ exists | 2pt |
| FE-2410 | Checkout not auto-selecting default payment method | ✅ exists | Urgent |
| FE-2379 | Normalize XState machine state hierarchy | ✅ exists | 5pt |

## Coding-agent / editor binding

The base docs' generic "autonomous coding agent in a dedicated workspace" / "editor with an autonomous coding-agent extension" binds to **Antigravity in a dedicated VS Code workspace** (red title bar in the original). Antigravity settings to set for autonomous execution: Agent Non-Workspace File Access (Enabled), Artifact Review Policy (Always Proceed), Terminal Command Auto Execution (Always Proceed).

## Notification channel

The base docs' generic "notification webhook" is **Slack** here (`SLACK_WEBHOOK_URL` env var).
