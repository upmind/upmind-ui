---
description: Ensure all code changes follow DEVX.md coding style guidelines
---

# DEVX Compliance Workflow

Before making any code changes in the Upmind monorepo, always consult and follow the coding style guide at `/Users/domdacosta/Dev/Upmind/monorepo/DEVX.md`.

## Key Rules to Apply

### 1. Lodash Usage (CRITICAL)

- **Always use Lodash** for all utility, array, and object operations
- Use `map`, `filter`, `find`, `reduce`, `isArray`, `isEmpty`, `some`, etc. from `lodash-es`
- **Never use** native JavaScript methods like `Array.isArray()`, `Array.prototype.map()`, etc.
- **Do not use** `lodash.get` for state/context access in composables

### 2. Import Organization

- Group imports: external → internal → utils → types
- Use section separators after imports

### 3. Return Object Structure (Composables)

- Group returns by: `// --- state`, `// --- context`, `// --- private (methods)`, `// --- methods (public methods)`, `// --- utils`
- Alphabetize properties within each section
- JSDoc above every return property/method
- All context/computed values defined above return, never inline

### 4. Naming Conventions

- Use canonical names for exports (e.g., `context` not `contextRef`)
- Use camelCase for all variables
- Meta properties prefixed with `is`, `has`, `can`

### 5. State/Context Access

- Use Upmind utilities (`useState`, `useContext`, `stateMatches`, `contextValue`)
- Never access `state.context`, `state.matches`, or `service.getSnapshot()` directly

### 6. Separators & Spacing

- Use 80-char separators (`// -----------------------------------------------------------------------------`) after imports and above return
- Blank lines between logical sections

## When Making Changes

1. Before editing, read the relevant section of DEVX.md if unsure
2. After editing, verify changes comply with all applicable rules
3. When adding imports, use lodash-es equivalents for utility functions
