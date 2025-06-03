# Upmind Coding Style Guide

This document defines the strict composable and TypeScript code style rules for all Upmind Vue/TypeScript projects. All contributors must follow these rules for every composable, utility, and module to ensure maintainability, readability, and consistency across the codebase.

---

## How to Use This Guide

- **For contributors:**

  - Before starting any new code or refactor, read this guide in full.
  - When writing new composables/utilities, copy the sample composable and follow all sectioning, JSDoc, and return type rules.
  - Before submitting a PR, manually check your code against each rule in this guide.
  - You can use an AI agent (e.g., GitHub Copilot) to review your code: instruct the agent to "check this file against DEVX.md and refactor to comply with all rules."
  - If you see non-compliant code, refactor it as part of your changes and reference the relevant rule in your PR description.

- **For code reviewers:**

  - Use this guide as a checklist for every review—do not approve PRs with any violations.
  - For each composable/utility, verify:
    - Section grouping and alphabetisation
    - JSDoc placement (only above return properties)
    - No internal state/machine exposure
    - Lodash usage for all utility/array/object operations
    - Return type is exported and used
    - Section separators and spacing
  - You can use an AI agent to assist: instruct the agent to "review this PR for DEVX.md compliance and suggest or make corrections."
  - Request changes for any violations, no matter how small, and reference the specific rule in this guide.

- **For automation/AI agents:**
  - Always read and apply every rule in this guide when generating or editing code in this repository.
  - When asked to review or refactor code, first read DEVX.md, then:
    - Check for section grouping, alphabetisation, and JSDoc placement
    - Ensure no JSDoc above function declarations—only above return properties
    - Never expose internal state/machines or add redundant computed/refs
    - Enforce Lodash usage for all utility/array/object operations
    - Ensure a return type is exported and used for every composable
    - Add or correct section separators and spacing
  - If unsure about a rule or code pattern, prefer minimal changes and ask for clarification in your output.

---

## Why This Matters

Strict adherence to these rules ensures:

- Predictable, readable, and maintainable code.
- Easy onboarding for new developers.
- Consistent code reviews and automation.

---

---

## Quick Reference

- Group returns by: `// --- state`, `// --- context`, `// --- helpers`, `// --- methods`, `// --- utils`
- Alphabetize properties within each section.
- JSDoc only above properties in the return object (never above returned functions/variables).
- JSDoc above non-returned private methods is allowed; never above returned/public methods.
- Use Lodash for all utility/array/object operations.
- Never expose internal state/machines (see below for exceptions).
- Use a full-line separator (`// -----------------------------------------------------------------------------`) after imports and above the return or between a major section if desired. ( the length of the line should be 80 characters )
- Always export and use a composable return type for every composable (see sample below).
- You are encouraged to copy-paste the sample composable and return block as a starting point.

---

## Do / Don't Table

| Do                                            | Don't                                           |
| --------------------------------------------- | ----------------------------------------------- |
| Use computed properties for state collections | Use getter methods for collections              |
| Group all returns                             | Mix return order or groupings                   |
| JSDoc only above return properties            | JSDoc above returned functions/variables        |
| Use Lodash for all utility/array/object ops   | Use native JS for utility/array/object ops      |
| Use section separators and spacing            | Omit section separators or inconsistent spacing |
| Export and use a composable return type       | Return untyped objects from composables         |
| Preferably alphabetize within each section    | Leave returns unordered                         |

---

## Common Pitfalls

- Placing JSDoc above function declarations instead of above return properties.
- Exposing internal state/machines or refs directly.
- Not exporting a return type for the composable.
- Using native JS array/object methods instead of Lodash.
- Not using section separators or proper spacing.
- Returning async functions or Promises in `meta`.

---

## Coding Style Rules

### 1. Return Grouping & Documentation

- All code sections and returned properties should be grouped by:
  - `// --- state`
  - `// --- context`
  - `// --- private (methods)`
  - `// --- methods (public methods)`
  - `// --- utils ( reusable utility functions )`
    (in that order if present)
- Within each section, properties are preferred to be alphabetized.
- Every returned property must have a JSDoc comment directly above it in the return object.
- For public methods: **No JSDoc comments above function or variable declarations**—only above returned properties. This is so we can generate documentation from the return object instead of the function itself.
- For private methods: JSDoc comments are allowed above the function declaration, but they should not be included in the return object.
- Always export and use a composable return type for every composable (e.g., `export type UseBrandReturn = ReturnType<typeof useBrand>`).

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

- Never expose internal state or state machine details to consumers unless explicitly required for advanced use (e.g., for XState inspector or advanced integrations). If you must expose `send` or similar, document it as part of the public API and explain why.
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

## Sample Composable (Best Practice)

```ts
// --- external
import { computed, ref } from "vue";
import { map } from "lodash-es";

// --- internal
// ...

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

/**
 * The return type of useSample composable.
 */
export type UseSampleReturn = ReturnType<typeof useSample>;
```

---

## DEVX Rules

- All composables must export their return type using:

  ```ts
  export type UseX = ReturnType<typeof useX>;
  ```

  This ensures type safety and enables consumers to use the composable's return type in their own code and documentation.

## Meta Object JSDoc Requirements

When returning a `meta` object from a composable, you must include a detailed JSDoc typedef above the property in the return object. This typedef should:

- Use `@typedef` to define the meta object type.
- List and describe all fields of the meta object.
- Be placed directly above the `meta` property in the return object, with a blank line between the comment and the property.
- Follow the style shown in `useSystemUpload`:

```typescript
/**
 * Meta information about the upload state.
 * @typedef {Object} UploadMeta
 * @property {boolean} isLoading - Indicates if the upload is currently loading.
 * @property {boolean} isProcessing - Indicates if the upload is currently processing.
 * @property {boolean} isComplete - Indicates if the upload has been completed.
 * @property {boolean} hasErrors - Indicates if there are any errors in the upload process.
 * @property {boolean} hasFile - Indicates if a file has been uploaded.
 */
meta,
```

All composables that return a `meta` object must follow this documentation pattern for clarity and consistency.
