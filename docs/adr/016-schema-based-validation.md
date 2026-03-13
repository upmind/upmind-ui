# ADR 016: Schema-Based Validation for Product Config

**Date:** February 2026
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

The product configuration flow validates user input at multiple points: quantity, billing term, options, attributes, and provision fields. Previously, validation was split across four hand-written functions (`checkQuantity`, `checkTerm`, `checkSubproducts`, `checkProvisioning`) in `packages/headless/src/modules/product/utils.ts` and a separately generated JSON schema used for form rendering.

This created two problems:

1. **Dual source of truth** — Validation rules were encoded in both the `check*` functions and the JSON schema. Changes to constraints (e.g., a new minimum quantity) required updates in two places.
2. **Incomplete coverage** — The `check*` functions didn't validate sub-quantity on options, while the schema did. Conversely, the `check*` functions caught `undefined` values that AJV auto-filled with defaults.

The schema was already being generated for jsonforms rendering via `useProductConfigSchema()`. We needed to decide whether to maintain both validation paths or consolidate.

---

## Decision

Use the **JSON schema as the single source of truth** for all product config validation. Remove the `check*` functions entirely.

### How It Works

```
Product Context (lookups, terms, options, attributes)
        │
        ▼
useProductConfigSchema(context)  ──→  JSON Schema
        │
        ├──→ AJV validate(schema, model)  ──→  ErrorObject[]
        │
        └──→ jsonforms rendering (form controls, labels, constraints)
```

1. `schemas.ts` generates a complete JSON schema from the product context
2. `services.ts` runs `useValidation().validate(schema, model)` via AJV
3. The same schema drives form rendering via jsonforms
4. External API errors are mapped to schema paths via `parseBasketProductError()`

### Validation Coverage

| Constraint | Schema Keyword | Old Function |
|---|---|---|
| Quantity minimum | `minimum` | `checkQuantity` |
| Quantity maximum | `maximum` | `checkQuantity` |
| Quantity step | `multipleOf` | `checkQuantity` |
| Quantity type | `type: "number"` | `checkQuantity` |
| Valid term cycle | `enum: [1, 12, ...]` | `checkTerm` |
| Required option group | `required`, `minProperties` | `checkSubproducts` |
| Valid product IDs | `propertyNames.enum` | `checkSubproducts` |
| Max selections | `maxProperties` | `checkSubproducts` |
| Sub-quantity constraints | `minimum` on sub-entries | Not checked |
| Provision fields | Sub-schema from Laravel blueprint | `checkProvisioning` |

---

## Parity Verification

Before removing the old functions, we wrote 19 unit tests comparing both approaches side-by-side across every scenario.

**Results:**
- **13 scenarios:** Full parity (both detect the same problem)
- **1 scenario:** New surpasses old (sub-quantity validation)
- **2 scenarios:** Behavioural difference — AJV fills schema defaults for `undefined` values instead of erroring

The two "differences" are not real gaps. The machine's `parse` service always initialises the model with defaults before `validate` runs. AJV filling the same default is redundant, not a missed check.

**Test files:**
- `packages/headless/src/modules/product/__tests__/validation-parity.test.ts` (19 tests)
- `packages/headless/src/modules/basketProduct/__tests__/parseBasketProductError.test.ts` (14 tests)

---

## Consequences

### Positive

1. **Single source of truth** — One schema, not two validation paths
2. **Better coverage** — AJV validates sub-quantity and provision fields in one pass
3. **Consistent error format** — All errors are AJV `ErrorObject[]` with `instancePath`
4. **Form alignment** — The schema that validates is the same schema that renders the form
5. **Less code** — ~200 lines of validation functions removed
6. **Extensible** — New fields only need a schema update, not a new `check*` function

### Negative

1. **AJV default-filling** — `useDefaults: true` means `undefined` values get silently filled. Not a problem in practice (parse runs first), but worth knowing.
2. **Schema complexity** — The generated schema is harder to read than imperative `check*` code. Mitigated by tests.

### Neutral

1. **Performance** — AJV compiles schemas for fast validation; roughly equivalent to hand-written checks

---

## Bug Found During Migration

`unflattenErrors()` in `useError.ts` used `[]` (Array) as the lodash `reduce` accumulator. Dot-notation keys like `"options.0.product_id"` attached string properties to the array, but `isEmpty([])` only checks `.length`, always returning `true`. Fixed by changing to `{}` (plain object).

---

## Related Documents

- [Migration Report](/packages/headless/docs/product-config-validation-migration.md) — Full test results and file changes
- [ADR 005: XState State Management](./005-xstate-state-management.md) — Machine patterns used by the product config flow
- [ADR 013: Testing Strategy](./013-testing-strategy.md) — Unit testing approach
- `packages/headless/src/modules/product/schemas.ts` — Schema generator
- `packages/headless/src/modules/product/services.ts` — Validate service
