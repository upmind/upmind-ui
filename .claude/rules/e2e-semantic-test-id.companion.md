---
id: e2e-semantic-test-id
paths:
  - 'tests/journeys/**/*.ts'
  - 'packages/**/*.vue'
  - 'design-system/**/*.vue'
  - 'apps/**/*.vue'
---
# Test ids — monorepo bindings

- The test-id attribute is `data-test-key`. It comes from `testIdAttribute` in `playwright.config.ts:139`.
- Compose a dynamic test id with `kebabCase()` from `lodash-es`.
