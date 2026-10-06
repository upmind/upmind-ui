---
id: e2e-helper-home
paths:
  - 'tests/journeys/**/*.ts'
---
# Support folders — monorepo bindings

The support tree is `tests/journeys/support/` (for example `basket-boot.ts`); the frozen `tests/Playwright/e2e/support/` is not an exemplar:

| Folder | Purpose |
| --- | --- |
| `actions/` | Single UI actions reused across specs |
| `flows/` | Multi-step setup and navigation |
| `helpers/` | Single-purpose utilities |
| `mocks/` | Route mocks for settings and error answers |
| `page-objects/` | Page and component locators and actions |
| `constants/` | Static values |
| `fixtures/` | Playwright test fixtures |

There is no `api/` folder (decision 7).
