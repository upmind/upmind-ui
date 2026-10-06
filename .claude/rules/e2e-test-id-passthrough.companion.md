---
id: e2e-test-id-passthrough
paths:
  - 'packages/**/*.vue'
  - 'design-system/**/*.vue'
  - 'apps/**/*.vue'
---
# Test-id pass-through — monorepo bindings

- The pass-through is the component's `dataAttrs` prop, typed ``Record<`data-${string}`, string | number | boolean>``. Bind it onto the rendered element with `v-bind`.
- The value attribute is `data-test-value`. One value read uses one `data-test-value`.
- `useTestAttrs` is the one sanctioned test-mode path in production code (FE-2865).
