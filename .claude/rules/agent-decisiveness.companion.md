> Companion to [agent-decisiveness.md](./agent-decisiveness.md) — Upmind-monorepo-specific bindings/examples.

## Tooling bindings

- **Issue tracker / external side effects:** GitLab (merge-request comments) and Slack (channel messages) are the shared external systems the "External side effects" clause refers to here. Posting to either needs approval in an interactive session.
- **CI signal:** the autonomous-context signal #3 in this repo is `GITLAB_CI=true` (GitLab CI predefined variable). Also honour `CI=true` and the `CI_*` GitLab predefined vars.

## Core-machines binding

The "never bypasses core-machines sign-off" clause defers to [core-machines.md](./core-machines.md) + [core-machines.companion.md](./core-machines.companion.md), which bind the actual battle-hardened core paths and the `UPMIND_OPERATOR_SIGNOFF` token for this monorepo.
