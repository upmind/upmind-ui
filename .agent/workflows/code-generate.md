---
description: Pre-generation checklist - study existing patterns before writing new code
---

# Code Generation Checklist

Before generating any new code in a module, follow these steps to ensure adherence to DEVX standards from the start.

## 1. Study Existing Patterns First

Before writing ANY new file, you MUST:

1. **Find exemplar files** in the same module or similar modules:
   - For composables: Look at `useSessionStore.ts`, `useSessionStoreActions.ts`, etc.
   - For services: Look at existing `.services.ts` files in the module
   - For types: Look at existing `.types.ts` files
   - For schemas: Look at existing `.schemas.*.ts` files

2. **Extract patterns** from the exemplar:
   - Import structure (`// --- external`, `// --- internal`, `// --- utils`, `// --- types`)
   - Section separators (80-char `// ---...` lines)
   - JSDoc module blocks (`@module`, `@description`)
   - Type declarations (`type` not `interface` unless extending)
   - Return structure (alphabetized properties, grouped by section)

3. **Copy the structure** - Don't reinvent, replicate exactly

## 2. Type Placement Rules

- **All types go in `<module>.types.ts`** - Never define types/interfaces in composable files
- **Import from types file** - Don't duplicate type definitions across files
- **Use `type` not `interface`** - Unless specifically extending another interface

## 3. Composable Structure (Factory Pattern)

```typescript
// --- external
import { ... } from "vue";

// --- internal
import { createModuleActions } from "./useModuleActions";
import { createModuleContext } from "./useModuleContext";
import { createModuleMeta } from "./useModuleMeta";
import { createModuleInternals } from "./useModuleInternals";

// --- types
import type { ... } from "./module.types";

// -----------------------------------------------------------------------------
/**
 * @module module-name/useModule
 * @description Brief description.
 */

export function useModule() {
  // --- state
  const { state, send } = ...;

  // -----------------------------------------------------------------------------

  return {
    // --- sub-composables
    useActions: () => createModuleActions(...),
    useContext: () => createModuleContext(...),
    useInternals: () => createModuleInternals(...),
    useMeta: () => createModuleMeta(...)
  };
}
```

## 4. Sub-Composable Structure

```typescript
// --- external/internal/utils imports

// --- types
import type { Ref } from "vue";
import type { ... } from "./module.types";

// -----------------------------------------------------------------------------
/**
 * @module module-name/useModuleActions
 * @description Brief description.
 */

export function createModuleActions(state: Ref<unknown>, send: SendFn, service: any) {
  // --- methods (alphabetized)
  function actionA(): void { ... }
  function actionB(): Promise<boolean> { ... }

  // -----------------------------------------------------------------------------

  return {
    // --- methods (alphabetized)
    actionA,
    actionB
  };
}

// Type export for consumers
export type UseModuleActions = ReturnType<typeof createModuleActions>;
```

## 5. Service Structure

```typescript
// --- external
import { ... } from "@upmind-automation/types";

// --- internal
import { useQuery, useBrand } from "../index";

// --- utils
import { ... } from "lodash-es";

// --- types
import type { ... } from "./module.types";

// -----------------------------------------------------------------------------
/**
 * @module module-name/services
 * @description Brief description.
 */

export async function serviceFunction(context: ContextType): Promise<ResultType> {
  // implementation
}
```

## 6. Pre-Flight Check

Before generating, ask yourself:

- [ ] Have I looked at an existing file with the same suffix? (`.actions.ts`, `.context.ts`, etc.)
- [ ] Am I using `type` instead of `interface`?
- [ ] Are all types imported from `.types.ts`?
- [ ] Is my import structure matching the exemplar exactly?
- [ ] Am I using existing utilities (`stateMatches`, `useContext`, etc.)?
- [ ] Is my JSDoc module block present with `@module` and `@description`?
