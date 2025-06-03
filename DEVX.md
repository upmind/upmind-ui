# Upmind Coding Style Guide

This document defines the strict composable and TypeScript code style rules for all Upmind Vue/TypeScript projects. All contributors must follow these rules for every composable, utility, and module to ensure maintainability, readability, and consistency across the codebase.

---

## Quick Reference

- Group returns by: `// --- state`, `// --- context`, `// --- helpers`, `// --- methods`, `// --- utils`
- Alphabetize properties within each section.
- JSDoc only above properties in the return object (never above returned functions/variables).
- JSDoc above non-returned private methods is allowed; never above returned/public methods.
- Use Lodash for all utility/array/object operations.
- Never expose internal state/machines.
- Use a full-line separator (`// -----------------------------------------------------------------------------`) after imports and above the return.
- You are encouraged to copy-paste the sample composable and return block as a starting point.

---

## Coding Style Rules

### 1. Return Grouping & Documentation

- All code sections and returned properties should be grouped by:
  - `// --- state`
  - `// --- context`
  - `// --- helpers (private methods)`
  - `// --- methods (public methods)`
  - `// --- utils`
    (in that order if present)
- Within each section, properties must be alphabetized.
- Every returned property must have a JSDoc comment directly above it in the return object.
- For public methods: **No JSDoc comments above function or variable declarations**—only above returned properties. This is so we can generate documentation from the return object instead of the function itself.
- For private methods: JSDoc comments are allowed above the function declaration, but they should not be included in the return object.

### 2. No Redundant Reactivity

- Only expose a single ref for state; return as an inline computed if needed.
- Do not expose internal/state refs, but rather return computed properties. Mutate via methods.

### 3. JSDoc above Functions

- Only use JSDoc comments above private methods and properties in the return object, and only where necessary. No need for simple getters/setters.
- Never place JSDoc comments above publicly returned function or composable declarations.
- Always place JSDoc comments above the properties in the return object.
- Use JSDoc comments for all returned properties, including methods, computed properties, and state.
- JSDoc are allowed above private methods, but not above public methods in the return object.

### 4. No Internal State/Machines

- Never expose internal state or state machine details to consumers.
- Always return a clean, simple interface.

### 5. Variable Naming

- Use clear, non-shadowing variable names in all methods.
- Use camelCase for all variable names.
- Try to keep returned methods and properties consistent and not overly verbose.
  eg: `get`, `set`, `find` instead of getSession, setSession, findSession. We already have the context of the composable/module, so we don't need to repeat it in every method name.

### 6. Spacing & Sectioning

- Use empty lines for readability between logical sections.
- Use a full line comment separator (`// -----------------------------------------------------------------------------`) above the return statement and after the imports to visually separate sections.

### 7. State should be exposed via Meta Object

- Meta should always be a computed property.
- Only include reactive, synchronous values in `meta` (no async functions). Meta should never contain Promises, async functions, or values that require awaiting.
- Use `meta` for properties that are derived from state or internal refs.
- Meta properties should always be named with prefix like `is`, `has`, `can`, etc.

### 8. Minimal, Targeted Changes

- Only make necessary, minimal, and style-consistent changes.
- Do not restructure or reformat code that already matches these rules.

### 9. Lodash Usage

- Use Lodash for all utility functions to ensure consistency and readability.
- Use Lodash functions over native JavaScript methods for utility functions for improved readability.
  - For example:
    - use `map` instead of `Array.prototype.map`
    - use `filter` instead of `Array.prototype.filter`
    - use `find` instead of `Array.prototype.find`
    - use `reduce` instead of `Array.prototype.reduce`
    - etc...
- Use Lodash functions for utility methods (e.g., `debounce`, `throttle`, etc.) instead of writing custom implementations.

---

## Section Definitions

- **state:** Reactive refs or objects representing module state.
  `const value = ref(0);`
- **computed:** Computed properties derived from state.
  `const double = computed(() => value.value * 2);`
- **helpers:** Private/internal methods not returned from the composable.
  `function privateHelper() { ... }`
- **methods:** Public API methods returned from the composable.
  `function increment() { value.value++; }`
- **utils:** Utility functions, usually not reactive or returned.
  `function formatCurrency(val) { ... }`

---

## Do/Don’t Table

| Do                                  | Don’t                                         |
| ----------------------------------- | --------------------------------------------- |
| Place JSDoc above return properties | Place JSDoc above function declarations       |
| Use Lodash for all utility logic    | Use native JS array methods for utility logic |
| Group and alphabetize returns       | Return properties in random order             |
| Expose only clean, minimal API      | Expose internal refs, state, or machines      |

---

## Common Pitfalls

- JSDoc above function public.returned declarations (should be above return properties only)
- Exposing internal refs or state that can be mutated directly
- Not using Lodash for utility logic
- Not alphabetizing return properties
- Not using section/grouping comments

---

## Example Return Block

```typescript
// -----------------------------------------------------------------------------
return {
  // --- state

  /** Initializes the module (if module needs manual initialisation). */
  init,

  /**
   * Checks if the module is ready.
   * @returns {Promise<boolean>} Resolves true if ready.
   */
  isReady,

  /** The current machine state. */
  state,

  /**
   * Computed meta information about the i18n state (loading, available, etc).
   * @returns {ComputedRef<I18nMeta>} The i18n meta information.
   */
  meta,

  // --- context

  /** The current locale. */
  locale,

  // --- methods

  /** Gets the current tracking cookie values. */
  get: getTracking,

  /** Removes the tracking cookie. */
  remove,
};
```

---

## Sample Full Composable

```typescript
// --- imports
import { ref, computed } from "vue";
import { map } from "lodash-es";
// -----------------------------------------------------------------------------

export const useSample = () => {
  // --- state
  const value = ref(0);

  async function isReady(): Promise<boolean> {
    // Simulate async readiness check
    return new Promise(resolve => setTimeout(() => resolve(true), 1000));
  }

  const meta = computed(() => ({
    isAvailable: value.value > 0, // Example derived state
    canIncrement: value.value < 10, // Example derived state
  }));

  // --- context

  const double = computed(() => value.value * 2);

  /**
   * A private helper function that does something.
   * @param {any} args - The arguments for the helper.
   * @return {any} The result of the helper function.
   * @private
   */
  function privateHelper(args: any): any {
    // ...
  }

  // --- methods

  function increment() {
    value.value++;
  }

  function setValue(newValue: number) {
    value.value = newValue;
  }

  // -----------------------------------------------------------------------------
  return {
    // --- state
    /**
     * Initializes the composable.
     * @returns {Promise<boolean>} A promise that resolves when the composable is initialized.
     */
    isReady,

    /**
     * Meta information about the composable.
     * @returns {ComputedRef<{ isAvailable: boolean; canIncrement: boolean }>} The meta information.
     */
    meta,

    /** The main value. */
    value,

    // --- context
    /** The doubled value. */
    double,

    // --- methods
    /** Increments the value. */
    increment,
    /** Sets the value. */
    setValue,
  };
};
```

---

## How to Use This Guide

- **For contributors:**

  - Review this guide before submitting any PRs.
  - Ensure all composables/utilities strictly follow these rules.
  - If you see code that does not comply, refactor it as part of your changes.

- **For code reviewers:**

  - Use this guide as your checklist for every review.
  - Request changes for any violations, no matter how small.

- **For automation/AI agents:**
  - Always apply these rules when generating or editing code in this repository.
  - Never add JSDoc above function declarations—only above return properties.
  - Never expose internal state/machines or add redundant computed/refs.
  - If unsure, prefer minimal changes and ask for clarification.

---

## Why This Matters

Strict adherence to these rules ensures:

- Predictable, readable, and maintainable code.
- Easy onboarding for new developers.
- Consistent code reviews and automation.

---

**File location:** Place this file at the root of the repository as `CODING-STYLE.md`.

**If you have questions or suggestions, contact the Upmind engineering team.**
