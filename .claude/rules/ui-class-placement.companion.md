---
id: ui-class-placement
paths:
  - 'packages/modules-*/src/**/*.vue'
  - 'packages/modules-*/src/**/variants.ts'
  - 'packages/client-vue/src/**/*.vue'
  - 'packages/client-vue/src/**/variants.ts'
  - 'design-system/packages/ui/src/components/**/*.vue'
  - 'design-system/packages/ui/src/components/**/variants.ts'
  - 'apps/**/*.vue'
  - 'playgrounds/**/*.vue'
---
> Companion to `ui-class-placement` — Upmind-monorepo bindings.

- Exemplar: `packages/modules-payment/src/variants.ts`, called from `packages/modules-payment/src/components/PaymentGateway.vue:12`.
- Design-system exemplar: `design-system/packages/ui/src/components/button/variants.ts`.
- `cva` comes from `class-variance-authority`.
- The `*.styles.ts` files under `playgrounds/labs-nuxt/` and `packages/client-vue/src/components/form/renderers/` use the retired pattern, with a `cva()` + `useStyles` helper. Move their classes to `variants.ts` when you change them.
- A headless module exposes state flags on `meta`. Pass them to the variant, for example `formVariants({ hasErrors: meta.hasErrors })`.
