---
description: Properly end a session with documentation for the next session
---

# Session Handoff Workflow

Use this workflow at the end of every work session to ensure continuity and track time/ROI metrics.

## Steps

### 1. Record Session Time

Ask the user:

```
📊 SESSION TIME TRACKING

When did this session start?
Duration: [X hours Y minutes]
```

### 2. Find and Load TASK.md

// turbo

```bash
find . -name "TASK.md" -type f 2>/dev/null | head -1
```

### 3. Calculate Session Value

For each story completed, map estimate to traditional hours:

| Estimate | Traditional (1 dev) |
|----------|---------------------|
| XS | 2 hours |
| S | 4 hours |
| M | 12 hours (1.5 days) |
| L | 32 hours (4 days) |
| XL | 80 hours (2 weeks) |

### 4. Update Session Log

```markdown
## Session Log

| Date | AI Duration | Stories Done | Trad. Equiv | Multiplier |
|------|-------------|--------------|-------------|------------|
| [Today] | [X]h | [N] | [Y]h | [Y/X]x |
| **Total** | **[Sum]h** | **[N]** | **[Sum]h** | **[Avg]x** |
```

### 5. Update Cumulative ROI

```markdown
## Cumulative ROI

| Metric | Value |
|--------|-------|
| **Total AI Time** | [X] hours |
| **Traditional Equivalent** | [Y] hours |
| **Time Saved** | [Y-X] hours |
| **Efficiency Multiplier** | [Y/X]x |
| **Stories Completed** | [N] of [Total] |
```

### 6. Document Session Summary

```markdown
## Session Summary - [Date]

**Duration:** [X hours]
**Initiative:** [Name]

### Completed
- [x] [Story] - Est: [M] = ~12h trad.
**Total:** [N] stories, [Y] traditional hours

### In Progress
- [ ] [Story] - [Status]

### Where We Left Off
[Specific description]
```

### 7. Log Blockers & Decisions

```markdown
## Blockers
- 🔴 [Any new blockers]

## Decisions Made
- [Date]: **[Decision]**: [Rationale]
```

### 8. Set Up Next Session

```markdown
## Next Session

### Priority
1. [Most important]
2. [Second priority]

### Estimated Value
- [Story 1]: [M] = ~12h traditional
- [Story 2]: [S] = ~4h traditional
- **Potential:** ~16h value in ~1-2h AI time
```

### 9. Git Status Check

// turbo

```bash
git status
```

Remind about uncommitted changes if any.

### 10. Final Summary

```
## Session Complete! 🎉

### This Session
- ⏱️ Duration: [X hours]
- ✅ Stories: [N] completed
- 📈 Value: [Y] traditional hours

### Cumulative Progress
- 📊 Total AI Time: [X] hours
- 💰 Traditional Equivalent: [Y] hours
- 🚀 Efficiency: [Y/X]x faster

Resume with: /continue-initiative
```

## Quick Handoff

```
/session-handoff - Session was [X] hours. Completed [stories]. Update metrics.
```
