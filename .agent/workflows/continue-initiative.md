---
description: Resume work on an in-progress initiative from a previous session
---

# Continue Initiative Workflow

Use this workflow at the start of any session to resume work on an existing initiative.

## Steps

### 1. Find Task Tracker

// turbo
Locate the TASK.md file:

```bash
find . -name "TASK.md" -type f 2>/dev/null | head -3
```

### 2. Load Current State

// turbo
Read the task tracker:

```bash
cat [TASK_PATH]
```

### 3. Summarize Current State

Present to the user:

```
📋 INITIATIVE STATUS

Initiative: [Name]
Current Story: [ID] - [Title]
Story Status: [Status]

Last Session:
- Duration: [X hours]
- Completed: [N] stories
- Traditional value: [Y hours]

Cumulative:
- Total AI time: [X hours]
- Traditional equivalent: [Y hours]
- Efficiency: [Z]x

Ready to continue with: [Next action]
```

### 4. Check for User Updates

Ask the user:

```
Before we continue, any updates?
- Did tests pass/fail?
- Any new requirements?
- Any blockers resolved?
- Want to pivot to a different story?
```

### 5. Resume Work

Based on story status:

**If "In Progress":**

- Review what was done
- Identify remaining tasks
- Continue implementation

**If "Blocked":**

- Review blocker
- Propose workaround or skip

**If "Complete" (needs verification):**

- Verify acceptance criteria
- Mark as done
- Move to next story

### 6. Load Relevant Context

Based on current story, load relevant files:

// turbo

```bash
# Adjust patterns for your project
find . -name "*.ts" -o -name "*.vue" -o -name "*.tsx" | head -20
```

### 7. Set Session Goal

```
For this session, let's aim to:
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Checkpoint]

Does this sound achievable?
```

### 8. Execute

Proceed with implementation. Use `/update-status` as needed.

## Quick Resume

```
/continue-initiative
```

Or:

```
Read TASK.md and continue from where we left off.
```
