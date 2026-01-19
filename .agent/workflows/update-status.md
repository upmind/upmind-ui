---
description: Update task tracker with current progress during a session
---

# Update Status Workflow

Use this workflow to update progress during a session.

## When to Use

- After completing a sub-task
- When hitting a blocker
- When making a decision
- Before taking a break
- At natural checkpoints

## Steps

### 1. Determine Update Type

- **Progress** - Completed part of a story
- **Blocker** - Hit an issue
- **Decision** - Made a choice that affects future work
- **Completion** - Finished a story (use `/complete-story` instead)

### 2. Find and Read TASK.md

// turbo

```bash
find . -name "TASK.md" -type f 2>/dev/null | head -1
```

// turbo

```bash
cat [TASK_PATH]
```

### 3. Update Appropriate Section

**For Progress:**

```markdown
## Current Story
**Status:** 🟡 In Progress (X of Y criteria met)

### Progress
- [x] Completed: [What was done]
- [ ] Remaining: [What's left]
```

**For Blocker:**

```markdown
## Blockers
- 🔴 [Date]: [Description]
  - Impact: [What this blocks]
  - Possible solutions: [Ideas]
```

**For Decision:**

```markdown
## Decisions Made
- [Date]: **[Decision]** - [Rationale]
```

### 4. Commit Suggestion (Optional)

```
feat([scope]): [what was done]

Part of: [Story ID]
```

### 5. Continue or Pause

```
Status updated. What's next?
- Continue with current story
- Take a break
- Switch story
- End session (/session-handoff)
```

## Quick Update

```
Update TASK.md: Completed [X], now working on [Y].
```
