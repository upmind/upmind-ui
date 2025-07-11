# Upmind Coding Style Guide (REVIEWED)

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
    - Section grouping and alphabetization.
    - JSDoc placement (only above return properties).
    - No internal state/machine exposure.
    - Lodash usage for all utility/array/object operations.
    - Return type is exported and used.
    - Section separators and spacing.
    - **Section comments and blank lines are present in both the composable body and the return object.**
  - You can use an AI agent to assist: instruct the agent to "review this PR for DEVX.md compliance and suggest or make corrections."
  - Request changes for any violations, no matter how small, and reference the specific rule in this guide.

- **For automation/AI agents:**
  - Always read and apply every rule in this guide when generating or editing code in this repository.
  - When asked to review or refactor code, first read DEVX.md, then:
    - Check for section grouping, alphabetization, and JSDoc placement.
    - Ensure no JSDoc above function declarations—only above return properties.
    - Never expose internal state/machines or add redundant computed/refs.
    - Enforce Lodash usage for all utility/array/object operations.
    - Ensure a return type is exported and used for every composable.
    - Add or correct section separators and spacing.
    - **Ensure all context/computed values are defined above the return, never inline.**
    - **Enforce canonical naming for exported properties (e.g., `context`, not `contextRef`).**
    - **Enforce the canonical `isReady` pattern and placement.**
  - If unsure about a rule or code pattern, prefer minimal changes and ask for clarification in your output.

---

## Why This Matters

Strict adherence to these rules ensures:

- Predictable, readable, and maintainable code.
- Easy onboarding for new developers.
- Consistent code reviews and automation.

---

## Quick Reference & Core Principles

- **Return Grouping:** Group returns by: `// --- state`, `// --- context`, `// --- private (methods)`, `// --- methods (public methods)`, `// --- utils` (in that order if present). These section comments must appear both in the composable body (where values are defined) and in the return object. There must be a blank line between each logical section in the composable body and between every property, method, and JSDoc comment in the return object.

- **Alphabetization:** Alphabetize properties within each section.

- **JSDoc Placement:** JSDoc **must** be present above every property and method in the return object (never above returned functions/variables). JSDoc above non-returned private methods is allowed. For public API, JSDoc must appear only above the property/method in the return object. The `meta` object must have a detailed `@typedef` JSDoc above it in the return.

- **State/Context Access:** Use Upmind state/context utilities (e.g., `useState`, `useContext`, `stateMatches`, `contextValue`) for all state/context access in composables. **Direct use of `state.matches`, `state.context`, `state.value.context`, or `service.getSnapshot()` is not allowed.** All context/computed values must be defined above the return object, never inline in the return. Exported properties must use canonical names (e.g., `context`, not `contextRef`).

- **Utility Operations:** Use Lodash for all utility, array, and object operations (e.g., `map`, `filter`, `find`, `reduce`, `debounce`, `throttle`). Avoid native JavaScript methods for these. **Do not use `lodash.get` for state/context access.**

- **Internal Exposure:** Never expose internal state or state machines directly (see exceptions for XState inspector or advanced integrations, if documented). Prefer returning computed properties over exposing internal refs. Do not rename exported properties in the return object—use canonical names as defined by the composable's API (e.g., `context`, `errors`, `meta`).

- **Separators:** Use a full-line separator (`// -----------------------------------------------------------------------------` - 80 characters long) after imports and above the return, or between major sections if desired.

- **Return Type Export:** Always export and use a composable return type for every composable (e.g., `export type UseBrand = ReturnType<typeof useBrand>`).

- **`isReady` Functions:** All `isReady` functions must use the canonical pattern and return `Promise<boolean>`. The function must be grouped under the `// --- state` section. Example:

  ```typescript
  import { waitFor } from "@/path/to/upmind/state/utilities"; // Assuming waitFor is also a utility

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => !stateMatches(state, ["loading", "subscribing"]), // Wait until not loading/subscribing
      { timeout: Infinity }
    ).then(state => {
      if (stateMatches(state, ["error"])) return false;
      // Or if you want to explicitly check for a "ready" state:
      // if (!stateMatches(state, ["ready"])) return false;
      return true;
    });
  }
  ```

- **Meta Object:** `meta` should always be a computed property containing only reactive, synchronous values (no Promises, async functions). Name meta properties with prefixes like `is`, `has`, `can`. When returning a `meta` object, you must include a detailed JSDoc `@typedef` above the property in the return object, listing and describing all fields.

- **Copy-Paste:** You are encouraged to copy-paste the sample composable and return block as a starting point.

---

## Do / Don't Table

| **Do**                                                                           | **Don't**                                                                     |
| :------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| Use computed properties for state collections.                                   | Use getter methods for collections.                                           |
| Group all returns according to defined sections.                                 | Mix return order or groupings.                                                |
| JSDoc above **every** return property/method.                                    | Omit JSDoc or place above returned functions/declarations.                    |
| Use Upmind state/context utilities for access (e.g., `stateMatches`).            | Access `state.context`, `state.matches`, or `service.getSnapshot()` directly. |
| Use Lodash for all utility/array/object ops (e.g., `map`, `filter`).             | Use native JS for utility/array/object ops.                                   |
| Use section separators and consistent spacing.                                   | Omit section separators or use inconsistent spacing.                          |
| Export and use a composable return type.                                         | Return untyped objects from composables.                                      |
| Alphabetize properties within each return section.                               | Leave returns unordered.                                                      |
| All `isReady` functions use the canonical pattern and return `Promise<boolean>`. | Return other types from `isReady` or use a non-canonical pattern.             |
| Use reactive `state` and context utilities.                                      | Use `service.getSnapshot()` for state access.                                 |
| **Do not use `lodash.get` for state/context access in composables.**             | Use `lodash.get` for state/context access.                                    |
| Section comments and blank lines in both composable body and return.             | Omit section comments or blank lines.                                         |
| All context/computed values defined above the return, never inline.              | Define computed/context values inline in the return.                          |
| Use canonical names for exported properties.                                     | Rename exported properties in the return.                                     |

---

## Common Pitfalls

- Placing JSDoc above function declarations instead of above return properties.

- Exposing internal state/machines or refs directly.

- Not exporting a return type for the composable.

- Using native JS array/object methods instead of Lodash.

- Not using section separators or proper spacing and line breaks between comment sections, properties, and methods in the return object AND the composable body.

- Returning async functions or Promises in `meta`.

- Directly accessing XState `state.context` or `state.matches`.
- Defining computed/context values inline in the return object.

- Omitting section comments or blank lines in the return object.

- Renaming exported properties in the return object.

---

## Coding Style Rules

### 1. Return Grouping & Documentation

- All code sections and returned properties should be grouped by:

  - `// --- state`
  - `// --- context`
  - `// --- private (methods)`
  - `// --- methods (public methods)`
  - `// --- utils ( reusable utility functions )`
    (in that order if present).
  - These section comments must appear both in the composable body and in the return object.
  - There must be a blank line between each logical section in the composable body and between every property, method, and JSDoc comment in the return object.

- Within each section, properties are preferred to be alphabetized.

- **Every returned property and method must have a JSDoc comment directly above it in the return object.** This ensures that documentation can be generated accurately from the return interface.

- For public methods: **No JSDoc comments above their function or variable declarations**—only above the property in the return object.

- For private/internal methods (those not returned): JSDoc comments are allowed above their function declaration.

- Always export and use a composable return type for every composable (e.g., `export type UseBrand = ReturnType<typeof useBrand>`).

### 2. Reactivity & Internal State Exposure

- Only expose the primary state ref directly if essential for consumer reactivity. Generally, prefer returning computed properties derived from internal state rather than exposing the internal refs themselves.

- Do not expose internal/state refs that are meant for internal mutation; instead, return computed properties or provide methods for interaction.

- **Never expose internal state or state machine details to consumers** (e.g., direct `send` functions or `service` objects), unless explicitly required for advanced use (e.g., for XState inspector or advanced integrations, in which case it must be explicitly documented as part of the public API with a clear rationale).

- Always return a clean, simple interface. Do not rename exported properties in the return object—use canonical names as defined by the composable's API (e.g., `context`, `errors`, `meta`).

### 3. JSDoc Placement & Content

- JSDoc comments are **mandatory** above every property and method in the return object.

- For publicly returned properties/methods, JSDoc is _only_ permitted directly above the property in the return object.

- For private/internal methods (not returned by the composable), JSDoc is allowed above their function declaration.

- The `meta` object must have a detailed `@typedef` JSDoc above it in the return, listing and describing all fields.

- No need for JSDoc on simple getters/setters unless they perform complex logic or have specific side effects.

### 4. Variable Naming

- Use clear, non-shadowing variable names in all methods.

- Use `camelCase` for all variable names.

- Try to keep returned methods and properties consistent and not overly verbose.
  E.g.: `get`, `set`, `find` instead of `getSession`, `setSession`, `findSession`. The composable's context already provides sufficient meaning.

- Exported properties must use canonical names (e.g., `context`, not `contextRef`).

### 5. Spacing & Sectioning

- Use empty lines for readability between logical sections.

- Use a full line comment separator (`// -----------------------------------------------------------------------------` - 80 characters) above the return statement and after the imports to visually separate major sections.

- There must be a blank line between every property, method, and JSDoc comment in the return object.

### 6. Meta Object Rules

- The `meta` object should always be a computed property.

- Only include reactive, synchronous values in `meta`. `meta` should never contain Promises, async functions, or values that require awaiting.

- Use `meta` for properties that are derived from state or internal refs, representing flags or summary information.

- Meta properties should always be named with prefixes like `is`, `has`, `can`, etc.

- **JSDoc Requirement:** When returning a `meta` object, you must include a detailed JSDoc `@typedef` above the property in the return object. This typedef should list and describe all fields.

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

### 7. Minimal, Targeted Changes

- Only make necessary, minimal, and style-consistent changes.

- Do not restructure or reformat code that already matches these rules.

### 8. Lodash Usage

- Use Lodash for all utility functions to ensure consistency and readability.

- **Prefer Lodash functions over native JavaScript methods for array and object utility functions** (e.g., `map` instead of `Array.prototype.map`, `filter` instead of `Array.prototype.filter`, `find` instead of `Array.prototype.find`, `reduce` instead of `Array.prototype.reduce`).

- Use Lodash for utility methods like `debounce`, `throttle`, etc., instead of writing custom implementations.

- **Crucially, do not use `lodash.get` for state/context access within composables.** Always use the Upmind state/context utilities.

### 9. isReady Pattern

- The `isReady` function must use the canonical pattern:

  ```typescript
  import { waitFor } from "@/path/to/upmind/state/utilities"; // Assuming waitFor is also a utility

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => !stateMatches(state, ["loading", "subscribing"]), // Wait until not loading/subscribing
      { timeout: Infinity }
    ).then(state => {
      if (stateMatches(state, ["error"])) return false;
      // Or if you want to explicitly check for a "ready" state:
      // if (!stateMatches(state, ["ready"])) return false;
      return true;
    });
  }
  ```

- The actual states may differ, but the structure must match this pattern.
- `isReady` must be grouped under the `// --- state` section.

### 10. Context/Computed Values

- All context/computed values must be defined above the return object, never inline in the return.
- Exported properties must use canonical names (e.g., `context`, not `contextRef`).
- All computed values, whether derived from XState context or internal Vue refs/state, must be defined above the return, under the `// --- context` section.
- Use `computed` or `useContext` with explicit type annotations.

---

## Upmind Composable Standards (2025)

### 1. General Principles

- All composables must be type-safe, reactive, and use Upmind state/context utilities.

- `useDomain`, `useBasket`, and `useBrand` are the reference implementations. Follow their structure and patterns.

### 2. Machine Instantiation

- **Singleton/Long-Lived Machines** (shared across the app, e.g., brand, basket):

  - Instantiate the machine at module scope (outside the composable), but **do not start** it immediately.

  - In the composable, check if the service is started; if not, start it.

- **Instance/Short-Lived Machines** (per composable usage, e.g., useDomain):

  - Instantiate and start the machine inside the composable.

- Choose the instantiation pattern based on the intended lifecycle and sharing requirements of the machine. Document the pattern used in the composable’s JSDoc or comments for clarity.

### 3. State & Context Access

- **MANDATORY:** All state, context, and actor access must use Upmind utilities (`useContext`, `stateMatches`, `contextValue`, etc.). **Never** access `.context`, `.value`, or actor state directly on the raw XState service snapshot.

### 4. Return Object Structure

Return values must be grouped and ordered as follows:

1.  **State**

    - `isReady` (async, always present, always documented)

    - `meta` (object with all state flags, always documented with `@typedef`)

    - Primary state ref(s) if directly exposed (e.g., `value`).

2.  **Context/Computed Values**

    - All computed values derived from XState context or internal state, type-annotated, and documented. These should be placed under the `// --- context` section.

3.  **Methods**

    - All actions and helpers, named for intent, and documented.

### 5. Documentation

- Every returned property and method must have a JSDoc comment.

- Use `@typedef` for complex objects (e.g., `meta`, `pagination`).

- Place JSDoc immediately above the returned property/method.

### 6. Type Safety

- All context access and computed values must be type-annotated.

- All methods must have explicit parameter and return types.

### 7. Lodash Usage

- Use Lodash for all array/object checks and operations (`some`, `find`, `isEmpty`, `map`, `filter`, `reduce`, etc.).

- Do not use native JS methods for these operations.

### 8. Service Subscription

- If exposing the XState service (rare, for advanced cases), always expose `.subscribe` as `service.subscribe.bind(service)`.

### 9. Computed/Context Sectioning

- All computed values, whether derived from XState context or internal Vue refs/state, must be defined above the return, under the `// --- context` section.

- Use `computed` or `useContext` with explicit type annotations.

### 10. Other Patterns

- **No side effects in computed properties.**

- **Pagination:** If present, return as a computed object with `offset`, `limit`, `total` and document with JSDoc typedef.

- **Error Handling:** Always expose errors as a context value (`errors`) and reflect error states in `meta`.

### 11. Review Checklist

- \[ \] All state/context/actor access uses Upmind utilities.

- \[ \] All returned properties/methods are documented with JSDoc.

- \[ \] `isReady` is present and documented.

- \[ \] `meta` object is present, type-annotated, and documented with `@typedef`.

- \[ \] All context/computed values are type-annotated.

- \[ \] Lodash is used for all array/object operations.

- \[ \] No direct `.context` or `.value` access on raw XState snapshots.

- \[ \] Service `.subscribe` is exposed if relevant and bound correctly.

- \[ \] Pagination is returned as a computed object and documented.

- \[ \] Methods are named for intent and documented.

- \[ \] Errors are exposed and reflected in `meta`.

- \[ \] Return object is grouped and ordered as per standard.

**Reference composables:**

- `useDomain`

- `useBasket`

- `useBrand`

**If in doubt, match their structure and documentation.**

## Sample Composable (Best Practice)

```typescript
// --- external
import { computed, ref } from "vue";
import { map } from "lodash-es";

// --- internal
import {
  useState,
  useContext,
  stateMatches,
} from "@/path/to/upmind/state/utilities"; // Example path
import type {
  SomeDomainContext,
  SomeDomainState,
} from "@/path/to/upmind/machine/types"; // Example path

// -----------------------------------------------------------------------------

export const useSample = () => {
  // Assume 'state' and 'send' are obtained from useActor or similar Upmind utility
  // const { state, send } = useActor(someMachine); // Example

  // --- state
  const value = ref(0); // Example of a primary internal ref that might be returned

  /**
   * Performs an asynchronous readiness check for the composable.
   * This function waits for the composable's state to be ready,
   * ensuring it is not in a loading or subscribing state, or more commonly an available state.
   * @returns {Promise<boolean>} A promise that resolves to `true` when the composable is ready, `false` otherwise.
   */
  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => !stateMatches(state, ["loading", "subscribing"]),
      // state => stateMatches(state, "available"), // common Alternative
      { timeout: Infinity }
    ).then(state => {
      if (stateMatches(state, ["error"])) return false;
      return true;
    });
  }

  /**
   * Meta information about the composable's current state and capabilities.
   * @typedef {Object} SampleMeta
   * @property {boolean} isAvailable - Indicates if the composable's core functionality is available.
   * @property {boolean} canIncrement - Indicates if the value can currently be incremented.
   */
  const meta = computed(() => ({
    isAvailable: stateMatches(state, ["active", "idle"]) && value.value > 0, // Example using stateMatches
    canIncrement: value.value < 10, // Example derived from internal ref
  }));

  // --- context
  // Example of a computed property derived from XState context
  const someContextValue = useContext<SomeDomainContext["someProperty"]>(
    state,
    "someProperty"
  );
  const anotherContextComputed = computed(() => someContextValue.value * 2);

  // Example of a computed property derived from internal 'value' ref, still grouped under context
  const double = computed(() => value.value * 2);

  // --- private (methods)
  /**
   * A private helper function that processes some arguments internally.
   * @param {any} args - The arguments for the helper.
   * @return {any} The result of the helper function.
   */
  function privateHelper(args: any): any {
    // ... complex internal logic, potentially using lodash
    const mappedArgs = map(args, item => item.id);
    return mappedArgs;
  }

  // --- methods (public methods)

  /** Increments the main value. */
  function increment() {
    value.value++;
    // send("INCREMENT_EVENT"); // Example of sending an XState event
  }

  /** Sets the main value to a new number. */
  function setValue(newValue: number) {
    value.value = newValue;
    // send({ type: "SET_VALUE", value: newValue }); // Example
  }

  /**
   * Performs an action that fetches data.
   * @param {string} id - The ID of the item to fetch.
   * @returns {Promise<void>} A promise that resolves when fetching is complete.
   */
  async function fetchData(id: string): Promise<void> {
    // ...
  }

  // -----------------------------------------------------------------------------
  return {
    // --- state
    /**
     * Waits for the machine to be ready (in a terminal or available state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the composable's current status and capabilities.
     * @type {SampleMeta}
     */
    meta,

    /** The main reactive value managed by the composable. */
    value,

    // --- context
    /** A value derived from the XState context. */
    someContextValue,
    /** Another computed value derived from context. */
    anotherContextComputed,
    /** The doubled value derived from the main value. */
    double,

    // --- methods
    /** Increments the main value by one. */
    increment,
    /** Sets the main value to a specified number.
     * @param {number} newValue - The new number to set the value to.
     */
    setValue,
    /**
     * Fetches data based on the provided ID.
     * @param {string} id - The identifier for the data to fetch.
     */
    fetchData,
  };
};

/**
 * The return type of the `useSample` composable, ensuring type safety for consumers.
 */
export type UseSample = ReturnType<typeof useSample>;
```
