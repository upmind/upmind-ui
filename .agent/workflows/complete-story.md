---
description: Mark a story as complete and transition to the next one
---

# Complete Story Workflow

Use this workflow when finishing a story to properly close it out and set up the next one.

## Steps

### 1. Load Story from Stories File

// turbo
Find stories file:

```bash
find . -name "stories.json" -type f 2>/dev/null | head -1
```

// turbo
Load the completed story:

```bash
cat [STORIES_PATH] | jq '.stories[] | select(.title == "[STORY_TITLE]")'
```

### 2. Verify Acceptance Criteria

Go through each criterion from the story body:

```
## Acceptance Criteria Verification

Story: [Title]

- [ ] Criterion 1: [Description]
  - Evidence: [How verified]

- [ ] Criterion 2: [Description]
  - Evidence: [How verified]
```

### 3. Run Verification Commands

// turbo

```bash
# Adjust for your project
npm run build 2>&1 | tail -20
npm run test 2>&1 | tail -20
npm run lint 2>&1 | tail -20
```

### 4. Update TASK.md

Mark story as complete:

```markdown
## Stories for This Initiative
- [x] [Completed Story] ✅ [Date]
- [ ] [Next Story] ← NEXT
```

Update session log with traditional time equivalent:

```markdown
## Session Log
| Date | AI Duration | Stories Done | Trad. Equiv | Notes |
|------|-------------|--------------|-------------|-------|
| [Today] | [X]h | [Story Title] | [Y]h | [Notes] |
```

### 5. Calculate Time Value

Map story estimate to traditional hours:

| Estimate | Traditional |
|----------|-------------|
| XS | 2 hours |
| S | 4 hours |
| M | 12 hours |
| L | 32 hours |
| XL | 80 hours |

### 6. Load Next Story

```
Next story: [Title]
Estimate: [Size]
Traditional value: [X hours]

Key tasks:
1. [Task 1]
2. [Task 2]

Ready to begin? Or end session?
```

### 7. Transition

**If continuing:** Update TASK.md, begin planning
**If ending:** Run `/session-handoff`

## Quick Complete

```
Complete story "[Title]". Verify criteria, update TASK.md, show next story.
```
