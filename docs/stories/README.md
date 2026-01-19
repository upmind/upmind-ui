# User Stories: Composable Architecture Refactor

Generated from implementation plan on January 19, 2026.

**Platform:** Linear
**Format:** Classic user stories
**Organization:** By Epic/Initiative

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Stories | 28 |
| High Priority | 22 |
| Medium Priority | 6 |
| Epics | 5 |

## Focus Areas

Based on developer input, stories are prioritized on:

- ✅ **Architecture** - Composable patterns, factory functions
- ✅ **Code Quality** - XState v5 migration, documentation
- ⏸️ **Skipped:** Actor/context patterns (needs more design)
- ⏸️ **Deprioritized:** DX/Onboarding, Performance

## Importing to Linear

### Option 1: Use the JSON file with MCP or Script

The `stories.json` file contains all stories in a structured format suitable for:

- MCP server integration
- Custom import scripts using Linear's GraphQL API

### Option 2: Linear API Import

```bash
# Example using Linear API
for story in $(jq -c '.stories[]' stories.json); do
  title=$(echo $story | jq -r '.title')
  description=$(echo $story | jq -r '.description')

  curl -X POST https://api.linear.app/graphql \
    -H "Authorization: $LINEAR_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"mutation { issueCreate(input: { title: \\\"$title\\\", description: \\\"$description\\\", teamId: \\\"TEAM_ID\\\" }) { success } }\"}"
done
```

---

## Epics

| ID | Title | Stories |
|----|-------|---------|
| INIT-1 | Foundation - Composable Patterns | 5 |
| INIT-2 | XState v5 Migration | 7 |
| INIT-3 | Composable Refactor - Basket Reference | 6 |
| INIT-4 | Composable Refactor - Remaining Modules | 5 |
| INIT-5 | Code Quality Improvements | 4 |

---

## Stories by Epic

### INIT-1: Foundation - Composable Patterns

| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| 1.1 | Create createFeatureComposable() factory pattern | High | 3 |
| 1.2 | Implement useFeatureMeta() pattern for flat flags | High | 2 |
| 1.3 | Implement useFeatureActions() pattern for methods only | High | 2 |
| 1.4 | Implement useFeatureAdvanced() escape hatch pattern | Medium | 1 |
| 1.5 | Write unit tests for composable factory patterns | High | 3 |

### INIT-2: XState v5 Migration

| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| 2.1 | Research XState v4 to v5 migration guide | High | 2 |
| 2.2 | Migrate basket.machine.ts to XState v5 | High | 5 |
| 2.3 | Migrate session.machine.ts to XState v5 | High | 5 |
| 2.4 | Migrate remaining machines to XState v5 | High | 8 |
| 2.5 | Update stateMatches utility for XState v5 | High | 2 |
| 2.6 | Update useContext utility for XState v5 | High | 2 |
| 2.7 | Update XState inspector integration for v5 | Medium | 2 |

### INIT-3: Composable Refactor - Basket Reference

| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| 3.1 | Refactor useBasket() following new patterns | High | 5 |
| 3.2 | Create useBasketMeta() with flat flags | High | 2 |
| 3.3 | Create useBasketActions() with methods only | High | 2 |
| 3.4 | Create useBasketAdvanced() escape hatch | Medium | 1 |
| 3.5 | Update basket barrel exports | High | 1 |
| 3.6 | Document basket composable patterns | High | 2 |

### INIT-4: Composable Refactor - Remaining Modules

| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| 4.1 | Refactor session composables to new pattern | High | 5 |
| 4.2 | Refactor client module composables to new pattern | High | 5 |
| 4.3 | Refactor payment module composables to new pattern | High | 5 |
| 4.4 | Refactor remaining modules to new pattern | Medium | 8 |
| 4.5 | Update client-vue wrapper layer for new patterns | High | 3 |

### INIT-5: Code Quality Improvements

| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| 5.1 | Complete basket module README documentation | High | 2 |
| 5.2 | Complete session module README documentation | High | 2 |
| 5.3 | Add READMEs to remaining modules | Medium | 5 |
| 5.4 | Create XState v5 patterns documentation | Medium | 3 |

---

## Estimation Scale (Story Points)

| Points | Effort |
|--------|--------|
| 1 | Trivial (< 2 hours) |
| 2 | Easy (2-4 hours) |
| 3 | Medium (1-2 days) |
| 5 | Large (3-5 days) |
| 8 | Very Large (1-2 weeks) |

---

## Files

- [stories.json](./stories.json) - All stories in JSON format for import
