---
paths:
  - '**/*.vue'
  - '**/*.styles.ts'
  - '**/*.css'
---
> Companion to `code-ui.md` — Upmind-monorepo bindings.

## Uischema (JSONForms)

- Spell it `Uischema`: `useLoginUischema`.
- Every uischema element carries an `i18n` key. No rendered copy is hardcoded. (Lint rule pending: FE-3247 #19.)

## Composed components — `design-system/packages/ui`

The contract is `design-system/packages/ui/COMPONENT_SPEC.md` plus ADR-024 §2. Two laws the spec does not carry:

- Adding a composed component never removes its parts. Parts stay exported; `parts/` marks composition order, not privacy.
- Prop-first, slot-escapable: every data prop has a named slot for rich content, and every item slot exposes its item as a scope param.

Every other former law here is a lint rule (FE-3247). Lodash everywhere, this package included (`code-quality.companion.md`). The test-id contract lives in `code-tests-e2e.companion.md`.
