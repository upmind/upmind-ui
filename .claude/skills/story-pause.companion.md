> Companion to the upmind-agent skill /story-pause — Upmind-monorepo-specific bindings/overrides.

## Issue tracker: Linear

The "issue tracker" in this repo is **Linear**, and it is the source of truth for session state.

- **Issue ID format:** `FE-XXXX` (e.g., `FE-1234`) — substitute for `<ID>` everywhere the base skill uses it.
- **Branch naming:** `feature/FE-XXXX` — the worktree grep (`git worktree list | grep "feature/FE-XXXX"`) and the push target use this form.
- **WIP commit prefix:** `wip(FE-XXXX): [description]` inside a worktree, or `wip: [FE-XXXX] [brief description]` in the normal flow.

## Identifier vs internal ID

Linear tool calls need the issue **UUID**, not the human `FE-XXXX` identifier. Fetch the UUID first:

```
linear__get_issue(id: "FE-XXXX")
```

## Posting the session comment

Post with the human summary first and the Agent-Chain block appended verbatim, using the fetched UUID:

```
linear__create_comment(
  issueId: "<issue-uuid>",
  body: "## 🤖 AI Session — [DATE]\n\n**Status:** 🟡 In Progress\n\n### Completed\n- [x] Item 1\n- [x] Item 2\n\n### Next Steps\n- [ ] Item 3\n- [ ] Item 4\n\n### Context\nBrief notes here\n\n<the Agent-Chain block, verbatim, goes here>"
)
```

Another agent extracts the handoff via the `AGENT-CHAIN:BEGIN`/`END` markers out of the Linear markdown.

## Updating status to blocked (Step 5)

The blocked state is named `Blocked`:

```
linear__save_issue(id: "<issue-uuid>", state: "Blocked")
```
