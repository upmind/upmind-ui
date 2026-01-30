# Code Generation Rules

These rules apply to ALL code generation in this workspace. They work hand-in-glove with `code-reviews.md`. Read DEVX.md for complete details.

> **Sync:** This is a distilled version of `DEVX.md`. Keep both in sync when standards change.

---

## Pre-Generation Requirement

**Before writing ANY new file:**

1. Find an existing file with the same suffix in the same or similar module
2. Copy the exact structure - don't invent new patterns
3. Reference composables: `useDomain`, `useBasket`, `useBrand`

---

## Type Rules

- **All types go in `<module>.types.ts`** - Never define types in other files
- **Use `type` not `interface`** - Unless specifically extending another interface
- **Import types from `.types.ts`** - Never duplicate definitions
- **Use enum values** (`AccessRoleTypes.STAFF`) not string literals (`"staff"`)
- **No `any` type** - Use proper types or `unknown`
- **All functions must have explicit parameter and return types**
- **Use `as const`** for immutable values

---

## Import Order (with section comments)

```typescript
// --- external
import { computed, ref } from "vue";
import { AccessRoleTypes } from "@upmind-automation/types";

// --- internal
import { useBrand, useQuery } from "../index";

// --- utils
import { map, filter, get, isEmpty } from "lodash-es";
import { stateMatches, useContext, contextValue } from "../../utils";

// --- types
import type { AuthContext, LoginModel } from "./module.types";

// -----------------------------------------------------------------------------
```

**Rules:**

- Types must use `import type` - NEVER mix with value imports (no `import { foo, type Bar }`)
- Group imports by: external → internal → utils → types
- Each group has `// ---` separator comment
- 80-char separator after imports

---

## File Headers

Every file needs the 80-char separator and JSDoc module block:

```typescript
// -----------------------------------------------------------------------------
/**
 * @module module-name/file-name
 * @description Brief description of the file's purpose.
 */
```

**Module tag pattern:** `module-name/file-name` (e.g., `auth/services.client`, `basket/mappers`)

---

## Section Separators

- Use `// ---` separator at TOP of section (e.g., `// --- state`, `// --- context`)
- Use `// -----------------------------------------------------------------------------` (80 chars) for major sections
- **NEVER use closing/bottom separators**
- **NEVER use `// ===` style separators**

---

## Lodash Usage (MANDATORY)

**Use Lodash for ALL array/object operations:**

```typescript
// ✅ Correct
import { map, filter, find, reduce, isEmpty, some, debounce, throttle } from "lodash-es";

const ids = map(items, 'id');
const active = filter(items, item => item.active);
const found = find(items, { id: targetId });
const total = reduce(items, (sum, item) => sum + item.price, 0);
if (isEmpty(items)) { ... }

// ❌ WRONG - Do NOT use native JS methods
items.map(...)
items.filter(...)
items.find(...)
items.reduce(...)
```

**Exception:** Do NOT use `lodash.get` for state/context access - use Upmind utilities instead.

---

## State/Context Access (MANDATORY)

**Use Upmind utilities - NEVER access raw XState state directly:**

```typescript
// ✅ Correct - Use Upmind utilities
import { stateMatches, useContext, contextValue } from "../../utils";

const isLoading = stateMatches(state, "loading");
const context = useContext<SessionContext>(state);
const client = contextValue<Client>(clientActor, "client");

// ❌ WRONG - Never do this
state.matches("loading")
state.context.user
state.value.context
service.getSnapshot()
```

---

## Return Structure

```typescript
return {
  // --- state
  /**
   * Waits for the machine to be ready.
   * @returns {Promise<boolean>} Resolves true if ready.
   */
  isReady,

  /**
   * Meta information about state.
   * @typedef {Object} AuthMeta
   * @property {boolean} isLoading - Operation in progress.
   * @property {boolean} isAuthenticated - User authenticated.
   */
  meta,

  // --- context
  /** Current authenticated user. */
  client,

  /** Errors from last operation. */
  errors,

  // --- methods
  /** Cancel the current operation. */
  cancel,

  /** Authenticate with credentials. */
  login
};
```

**Rules:**

- Group by: state → context → private methods → methods → utils
- Alphabetize within each section
- JSDoc above EVERY property in return
- Blank line between JSDoc and next property
- All context/computed values defined ABOVE return, never inline
- Use canonical names: `context`, `errors`, `meta` (not `contextRef`, `errorsList`)

---

## JSDoc Rules

- **JSDoc above EVERY property in the return object** (mandatory)
- **NO JSDoc above function declarations** (only above return properties)
- **Private methods CAN have JSDoc** above their declarations

---

## Meta Properties Pattern

**Expose individual computed properties, NOT a single `meta` object:**

```typescript
// --- context

/**
 * True if operation is in progress.
 */
const isLoading = computed(() =>
  stateMatches(state, ["loading", "processing"])
);

/**
 * True if user is authenticated.
 */
const isAuthenticated = computed(() =>
  stateMatches(state, "authenticated")
);

// -----------------------------------------------------------------------------

return {
  // --- context
  /** True if user is authenticated. */
  isAuthenticated,

  /** True if operation is in progress. */
  isLoading
};
```

**Rules:**

- Each meta flag is its own computed ref (granular reactivity)
- Properties prefixed with `is`, `has`, `can`
- NO single `meta` object - destructure individual properties
- No side effects in computed properties

---

## isReady Pattern (MANDATORY)

```typescript
async function isReady(): Promise<boolean> {
  return waitFor(
    service,
    state => !stateMatches(state, ["loading", "subscribing"]),
    { timeout: Infinity }
  ).then(state => {
    if (stateMatches(state, ["error"])) return false;
    return true;
  });
}
```

- Must return `Promise<boolean>`
- Group under `// --- state` section
- Always present and documented in composables

---

## Composable Factory Pattern

Main composable wires sub-composables:

```typescript
// --- state
const service = interpret(moduleMachine, { devTools: true });

export function useModule() {
  if (service.status === InterpreterStatus.NotStarted) {
    service.start();
  }

  const { state, send } = useActor(service);

  // -----------------------------------------------------------------------------

  return {
    // --- sub-composables
    useActions: () => createModuleActions(state, send, service),
    useContext: () => createModuleContext(state),
    useInternals: () => createModuleInternals(state, send),
    useMeta: () => createModuleMeta(state)
  };
}

// Type export for consumers
export type UseModule = ReturnType<typeof useModule>;
```

---

## File Naming

**Pattern:** `{module}.{purpose}.{context?}.ts`

```
auth/
├── auth.machine.ts           # State machine
├── auth.services.ts          # Base services
├── auth.services.admin.ts    # Admin-specific (extends base)
├── auth.services.factory.ts  # Service factory
├── auth.schemas.login.ts     # Schema per form
├── auth.schemas.register.ts
├── auth.types.ts             # All types in one file
├── auth.mappers.ts           # Data mappers
├── useAuth.ts                # Main composable
├── useAuthActions.ts         # Actions sub-composable
└── index.ts                  # Public exports only
```

---

## XState Conventions

> See [ADR-001: XState Pattern](file:///Users/domdacosta/Dev/Upmind/monorepo/.agent/rules/adr-001-xstate-pattern.md) for full details.

### File Naming

- **Machine:** `{feature}.machine.ts`
- **Services:** `{module}.services.ts`

### Naming Conventions

| Type | Convention | Examples |
|------|------------|----------|
| Actions | Descriptive verbs | `setModel`, `clearError`, `updateBasket` |
| Guards | Prefixed `has`/`is`/`can` | `hasProducts`, `isValid`, `canCheckout` |
| Events | SCREAMING_SNAKE_CASE | `SET`, `REFRESH`, `CHECKOUT` |

### Required State Pattern (for form/CRUD machines)

```typescript
available: {
  initial: "checking",
  states: {
    checking: {
      invoke: {
        src: "parseAndValidate",
        onDone: { target: "valid", actions: ["setParsed"] },
        onError: { target: "invalid", actions: ["setError"] }
      }
    },
    valid: { on: { SUBMIT: "#processing" } },
    invalid: {}
  },
  on: { SET: ".checking" }  // Validate on every SET
}
```

### Rules

1. **Validate on every SET** - Model changes trigger `checking`
2. **Validate before API** - Processing validates before submitting
3. **No `processed` delays** - UI handles success feedback
4. **Error auto-clear** - Clear error on user action

### Composable Integration

- Never access `state.value.context` directly - use `useContext` util
- Expose `isValid` only - derive `isInvalid` as `!isValid`
- Use `UseActor` type for sub-composable params

---

## Vue/Nuxt Conventions

**SFC Order (strict):**

1. `<template>` (template first, always)
2. `<script setup lang="ts">`
3. NO `<style>` blocks - use CVA instead

**Script Setup Organization:**

1. Imports (grouped with comments)
2. Props/Emits/Models definitions
3. Composables
4. Refs/Reactive state
5. Computed properties
6. Watchers
7. Functions/Methods
8. Lifecycle hooks

**Naming:**

- Composables: `useSomething`
- Props: typed with `defineProps<T>()`
- Models: typed with `defineModel<T>()`

---

## CSS / Styling (Tailwind + CVA)

- **Always use Tailwind with CVA** (Class Variance Authority)
- **NO inline Tailwind classes** in templates
- **NO `<style>` blocks** in SFCs
- **NO inline style attributes**
- **NO arbitrary values** like `w-[123px]` - use tokens only
- **Separate styles file:** `.styles.ts`

---

## JSON/UI Schema Conventions

- Use `Uischema` (lowercase 's'): `useLoginUischema`
- **All uischema elements MUST have `i18n` property**

```typescript
// ✅ Correct
{
  type: "Control",
  scope: "#/properties/username",
  i18n: "form.auth_email",  // Required!
  options: { ... }
}

// ❌ WRONG - Missing i18n
{
  type: "Control",
  scope: "#/properties/username"
}
```

---

## Boolean Checks

```typescript
// ✅ Preferred
if (!!event.data?.requires2fa) { ... }

// ❌ Avoid
if (event.data?.requires2fa === true) { ... }
```

---

## Variable Naming

- Use `camelCase`
- Keep names concise: `get`, `set`, `find` (not `getSession`)
- Use canonical names: `context` not `contextRef`
- Export return type: `export type UseModule = ReturnType<typeof useModule>`

---

## Error Handling

- Always expose errors as a context value (`errors`)
- Reflect error states in `meta` (`hasErrors`)

---

## Testing (Fixtures)

- Use cached API response snapshots for test mocks
- Import from `fixtures/` - never hand-craft API response shapes
- Sanitize fixtures - remove real tokens, PII

---

## Review Checklist

Before committing, verify:

- [ ] All state/context/actor access uses Upmind utilities
- [ ] All returned properties have JSDoc
- [ ] `isReady` present and documented
- [ ] `meta` has `@typedef` JSDoc
- [ ] All context/computed values type-annotated
- [ ] Lodash used for all array/object operations
- [ ] No direct `.context` or `.value` on XState snapshots
- [ ] Return object grouped and ordered per standard
- [ ] Types in `.types.ts`, using `type` not `interface`
- [ ] Import order correct with section comments
