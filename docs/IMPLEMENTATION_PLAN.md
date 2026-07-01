# Implementation Plan: Composable Architecture Refactor

> Generated from analysis on January 19, 2026
> **Platform:** Linear | **Stories:** [stories.json](./stories/stories.json)

## Overview

This plan addresses refactoring the Upmind composable architecture focusing on:

- ✅ **Composable layer patterns** (Meta/Actions/Advanced)
- ✅ **XState v5 migration**
- ✅ **Code quality & documentation**
- ⏸️ **Actor contexts** (deferred - needs more design)
- ⏸️ **DX/Onboarding improvements** (lower priority)
- ⏸️ **Performance optimizations** (lower priority)

**Expected Outcomes:**

- Flatter, more predictable composable APIs
- Modern XState v5 throughout
- Better module documentation
- Foundation for future actor context work

## Scope & Constraints

- **Target timeframe:** 3-4 months (focused scope)
- **Constraints:**
  - Maintain backwards compatibility during migration
  - No breaking changes to production apps without migration path
  - Must support existing CRUD machine pattern
- **Deferred:**
  - Actor/context patterns (needs more design)
  - Impersonation flows

---

## Initiatives

### Initiative 1: Foundation - Composable Patterns

**Goal:** Establish core composable pattern infrastructure (without actor contexts)

| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| 1.1 | Create createFeatureComposable() factory pattern | High | 3 |
| 1.2 | Implement useFeatureMeta() pattern for flat flags | High | 2 |
| 1.3 | Implement useFeatureActions() pattern for methods only | High | 2 |
| 1.4 | Implement useFeatureAdvanced() escape hatch pattern | Medium | 1 |
| 1.5 | Write unit tests for composable factory patterns | High | 3 |

**Success Criteria:** Factory patterns working, tests pass

---

### Initiative 2: XState v5 Migration

**Goal:** Upgrade all state machines from XState v4 to v5

| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| 2.1 | Research XState v4 to v5 migration guide | High | 2 |
| 2.2 | Migrate basket.machine.ts to XState v5 | High | 5 |
| 2.3 | Migrate session.machine.ts to XState v5 | High | 5 |
| 2.4 | Migrate remaining machines to XState v5 | High | 8 |
| 2.5 | Update stateMatches utility for XState v5 | High | 2 |
| 2.6 | Update useContext utility for XState v5 | High | 2 |
| 2.7 | Update XState inspector integration for v5 | Medium | 2 |

**Success Criteria:** All machines on v5, no regressions, inspector works

---

### Initiative 3: Composable Refactor - Basket Reference

**Goal:** Refactor basket as reference implementation for new patterns

| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| 3.1 | Refactor useBasket() following new patterns | High | 5 |
| 3.2 | Create useBasketMeta() with flat flags | High | 2 |
| 3.3 | Create useBasketActions() with methods only | High | 2 |
| 3.4 | Create useBasketAdvanced() escape hatch | Medium | 1 |
| 3.5 | Update basket barrel exports | High | 1 |
| 3.6 | Document basket composable patterns | High | 2 |

**Success Criteria:** Basket fully refactored, documented, tests pass

---

### Initiative 4: Composable Refactor - Remaining Modules

**Goal:** Apply new patterns to remaining modules

| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| 4.1 | Refactor session composables to new pattern | High | 5 |
| 4.2 | Refactor client module composables to new pattern | High | 5 |
| 4.3 | Refactor payment module composables to new pattern | High | 5 |
| 4.4 | Refactor remaining modules to new pattern | Medium | 8 |
| 4.5 | Update client-vue wrapper layer for new patterns | High | 3 |

**Success Criteria:** All modules use new patterns, apps work

---

### Initiative 5: Code Quality Improvements

**Goal:** Complete module documentation

| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| 5.1 | Complete basket module README documentation | High | 2 |
| 5.2 | Complete session module README documentation | High | 2 |
| 5.3 | Add READMEs to remaining modules | Medium | 5 |
| 5.4 | Create XState v5 patterns documentation | Medium | 3 |

**Success Criteria:** All modules have complete READMEs

---

## Timeline

| Phase | Timeline | Initiatives | Points |
|-------|----------|-------------|--------|
| **Foundation** | Week 1-2 | 1 | 11 |
| **XState v5** | Week 2-5 | 2 | 26 |
| **Basket Reference** | Week 5-7 | 3 | 13 |
| **Module Refactor** | Week 7-12 | 4 | 26 |
| **Code Quality** | Week 10-13 | 5 | 12 |

**Total Story Points:** 88
**Estimated Duration:** ~13 weeks (3-4 months)

---

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Stories | 28 |
| High Priority | 22 |
| Medium Priority | 6 |
| Epics | 5 |

---

## Next Steps

1. ✅ Review and approve this implementation plan
2. Import [stories.json](./stories/stories.json) to Linear
3. Assign owners to initiatives
4. Begin with Initiative 1 or 2 (can run in parallel)

---

## Related Documents

- [ANALYSIS.md](./ANALYSIS.md) - Codebase deep analysis
- [ARCHITECTURE_PROPOSAL.md](./ARCHITECTURE_PROPOSAL.md) - Technical specification (includes actor context design for future)
- [ADR 001](./adr/001-scope-based-composables.md) - Architecture decision record
- [stories.json](./stories/stories.json) - Linear import file
- [`.agent/rules/code-style.md`](/.agent/rules/code-style.md) - Coding standards (replaces DEVX.md)
