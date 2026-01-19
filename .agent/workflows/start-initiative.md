---
description: Begin work on a new initiative from an evolution/implementation plan
---

# Start Initiative Workflow

Use this workflow when beginning work on a new initiative. This sets up context, creates tracking files, and plans the first story.

## Configuration

Before using, identify your project's paths:

- **Stories file:** Look for `stories.json` in `docs/`, `docs/stories/`, or project root
- **Task tracker:** Will be created as `TASK.md` alongside stories
- **Implementation plan:** Optional, look for `IMPLEMENTATION_PLAN.md`

## Steps

### 1. Discover Project Structure

First, find where stories are located:

// turbo

```bash
find . -name "stories.json" -type f 2>/dev/null | head -5
find . -name "TASK.md" -type f 2>/dev/null | head -5
find . -name "IMPLEMENTATION_PLAN.md" -type f 2>/dev/null | head -5
```

### 2. Discover Available Initiatives

// turbo
Read all unique milestones from the stories file:

```bash
cat [STORIES_PATH] | jq -r '.milestones[] | .title'
```

// turbo
Count stories per initiative:

```bash
cat [STORIES_PATH] | jq -r '.stories | group_by(.milestone) | .[] | "\(.[0].milestone): \(length) stories"'
```

### 3. Present Initiatives to User

Display discovered initiatives:

```
📋 AVAILABLE INITIATIVES

Discovered from stories.json:

| # | Initiative | Stories | Status | Dependencies |
|---|------------|---------|--------|--------------|
| 1 | [Milestone 1] | [N] | 🔵 | None |
| 2 | [Milestone 2] | [N] | 🔵 | [1] |
...

Which initiative would you like to start?
```

### 4. Load Initiative Context

Once user selects, load stories for that initiative:

// turbo

```bash
INITIATIVE="[Selected Initiative Name]"
cat [STORIES_PATH] | jq --arg init "$INITIATIVE" '.stories[] | select(.milestone == $init)'
```

### 5. Check Dependencies

Read TASK.md (if exists) to check prerequisite initiatives:

// turbo

```bash
cat [TASK_PATH] 2>/dev/null || echo "No TASK.md yet - will create"
```

If dependencies are incomplete, warn:

```
⚠️ WARNING: This initiative has dependencies that may not be complete.
You can:
1. Start anyway
2. Start the dependency first
3. Skip check (you know what you're doing)
```

### 6. Create/Update TASK.md

Create the task tracker alongside the stories file:

```markdown
# [Project Name] - Task Tracker

## Current Initiative
**Name:** [Selected Initiative]
**Started:** [Date]
**Status:** 🟡 In Progress

## Stories for This Initiative
- [ ] [Story 1 Title]
- [ ] [Story 2 Title]
...

## Time Metrics & ROI
[Include estimate reference table]

## Session Log
| Date | AI Duration | Stories Done | Trad. Equiv | Notes |
|------|-------------|--------------|-------------|-------|
| [Today] | Starting | - | - | Beginning initiative |
```

### 7. Plan First Story

Load and analyze the first story:

```
## First Story

**Title:** [Title]
**Estimate:** [Size from labels]
**Traditional Equivalent:** [X hours]

**Acceptance Criteria:**
[From story body]

### Implementation Approach
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Files to Create/Modify
- [Identified from context]

Ready to begin?
```

### 8. Begin Execution

Once approved, update TASK.md to mark story as "In Progress" and start implementing.

## Quick Start

```
/start-initiative
```

Or with initiative name:

```
/start-initiative [Initiative Name]
```

## Notes

- This workflow works with any `stories.json` following the standard format
- Paths are discovered dynamically at runtime
- Dependencies are inferred from milestone order and descriptions
