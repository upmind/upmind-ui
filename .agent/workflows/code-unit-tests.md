---
description: Guidelines for writing valuable unit tests
---

# Unit Testing Guidelines

## Core Principle

> Write tests that protect against real bugs, not tests for test coverage's sake.

## Before Writing a Test, Ask

1. **What real bug does this prevent?** If you can't articulate a plausible failure scenario, skip the test.
2. **Would TypeScript catch this?** Don't test API shape (`toHaveProperty`), types, or existence of exports.
3. **Is this implementation detail or behavior?** Test observable behavior, not internal state.

## Tests That Add Value

| ✅ Write Tests For | Example |
|-------------------|---------|
| **Business logic computations** | `isExpired` calculates correctly from `created_at + expires_in` |
| **State transitions** | Logging in sets `isAuthenticated` to true |
| **Edge cases that have bitten you** | Token refresh when < 5 minutes to expiry |
| **Integration points** | Data persists to cookies after `setSession` |
| **Regressions** | Add test when fixing a bug |

## Tests That Waste Time

| ❌ Avoid Testing | Why |
|-----------------|-----|
| **Initial/default state** | Obvious, rarely breaks, TypeScript enforces |
| **API structure** (`toHaveProperty`) | TypeScript already validates |
| **Singleton behavior** | Implementation detail |
| **That something is defined** | Import errors fail loudly |
| **One assertion per test dogma** | Consolidate related assertions |

## File Structure

Every test file should start with a JSDoc header explaining:

```typescript
/**
 * @fileoverview [Module] Tests
 *
 * ## Job To Be Done
 * [What real-world functionality these tests protect]
 *
 * ## What Breaks If These Fail
 * [Concrete user-facing or system-level failures]
 */
```

## Example: Good vs Bad

```typescript
// ❌ BAD: Tests obvious default state
it("should have empty sessions initially", () => {
  expect(sessions.value).toEqual({});
});

// ❌ BAD: Tests TypeScript's job
it("should expose setSession method", () => {
  expect(actions.setSession).toBeDefined();
});

// ✅ GOOD: Tests real business rule
it("should be false when token has expired", () => {
  const pastTime = Date.now() - 7200000; // 2 hours ago
  setSession(AccessRoleTypes.CLIENT, createMockSession({
    created_at: pastTime,
    expires_in: 3600 // expired 1 hour ago
  }));
  expect(isExpired.value).toBe(true);
});

// ✅ GOOD: Tests edge case that caused a bug
it("should update activeSessionId when removing the active session", () => {
  // This prevents regression where removing active session
  // left activeSessionId pointing to non-existent session
});
```

## When to Add New Tests

1. **Fixing a bug** → Add test that would have caught it
2. **New feature with logic** → Test the logic, not the existence
3. **Complex computation** → Test edge cases
4. **Integration boundary** → Test the handoff works
