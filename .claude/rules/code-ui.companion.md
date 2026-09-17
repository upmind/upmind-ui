---
paths:
  - '**/*.vue'
  - '**/*.styles.ts'
  - '**/*.css'
---
> Companion to `code-ui.md` — Upmind-monorepo bindings.

## Uischema (JSONForms)

- Spell it `Uischema`: `useLoginUischema`.
- Every uischema element carries an `i18n` key. No rendered copy is hardcoded.

## Composed components — `design-system/packages/ui`

The contract is `design-system/packages/ui/COMPONENT_SPEC.md` plus ADR-024 §2. Two laws the spec does not carry, and neither a lint can judge, so they stay here:

- Adding a composed component never removes its parts. Parts stay exported; `parts/` marks composition order, not privacy (CC1b).
- Prop-first, slot-escapable: every data prop has a named slot for rich content, and every item slot exposes its item as a scope param (CC2).

**Every other former law is now a lint rule** in `@upmind-automation/eslint-plugin-ui` (FE-3247), wired in `eslint.config.mjs` over `design-system/packages/ui/src/components/**`:

`folder-grammar` (CC-B) · `no-parts-import` (CC-C) · `no-inline-sfc-types` (CC4) · `no-cva-in-composed` (CC3a) · `controlled-boolean-undefined` (CC6) · `test-attrs-key` (CC9/CC10) · `simple-template-conditions` (CC12a) · `no-direct-slots-access` (CC14) · `no-v-for-index-key` (CC18) · `no-as-child-prop` (CC19) · `require-accessible-name` (CC20) · `require-empty-state` (CC21) · `no-english-default` (CC22) · `require-story-and-registry` (CC24/CC25) · `class-strings-placement` (CC26) · `define-options-name` (CC1a) · `slot-return-vnode` (CC5b) · `test-attrs-in-template` (CC8b) · `named-clauses-single-expression` (CC13a) · `no-lodash-in-components` (CC13b). CC0/CC5a/CC7 are the built-in `vue/block-order`, `vue/require-explicit-slots`, `no-underscore-dangle`.

Dropped (a judgment, not a lint): CC-A, CC8, CC11, CC15, CC16, CC17. Already enforced at the merge gate: CC23 (`verify-must-fail.ts`). The test-id contract lives in `code-tests-e2e.companion.md`; the Lodash carve-out for these components in `code-quality.companion.md`.
