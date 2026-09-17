# scope Changelog

All notable changes to the scope module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/); the module versions with the `@upmind-automation/headless` package.

## [Unreleased]

### Added

- A second, mutually exclusive `.for()` call shape: a **selector** context (`.for(type)`, id forbidden), declared per matrix member with the `selector()` helper, alongside the existing **retarget** shape (`.for(type, id)`, id required). Each context type is one pattern or the other, enforced at compile time — passing an id to a selector, or omitting one on a retarget, is a type error, not a runtime one.
- A matrix cell may now declare **several** context members for one actor, as a `readonly` array — one actor can offer, for example, one entity-scoped context and two independent catalogue-scoped contexts side by side. See [Usage](./usage.md#3-declaring-a-selector-context-when-the-type-is-the-answer).
- `selector()` (`scope.utils.ts`) marks a context type as a selector member. `resolveContextDeclarations()` / `resolveContextDeclaration()` are the single reading of what a matrix cell declares — a bare string, a `selector()` wrapper, or an array of either — used by the builder's own resolution and available to any future caller that needs to introspect a matrix.

### Changed

- `ScopeContext.id` is now optional: present for a retarget context, absent for a selector context (`scope.types.ts`).
- The DevTools inspector's state panel now reads a scope key's reserved segments (`id:`, `brand:`, `fresh:`) as `[marker, value]` pairs, walking the key from the right, instead of matching a fixed position or a colon-prefixed string. A selector context (one unprefixed segment) and a retarget context (two) both report correctly; the previous fixed-position read could not distinguish them. See [Architecture](./architecture.md).

### Known gap

- A labs playground URL of the shape `/for/<type>` with no id, against a context type declared retarget, now boots a differently-keyed instance rather than being rejected — nothing at runtime consults the matrix to check the id is present. See [Gotchas](./gotchas.md).

---

## Migration Guide

### From v1.x to v2.x

No breaking change for an existing matrix: a bare string cell keeps meaning "retarget",
unchanged, and every existing `.for(type, id)` call site against a retarget member is
unaffected. The only way to reach the new selector shape is to opt a context type into
it explicitly with `selector()`.
