# Glossary

## Domain Terms

| Term | Definition |
|------|------------|
| **Basket** | Shopping cart containing products, promotions, and checkout state |
| **BasketProduct** | A configured product within a basket with pricing and options |
| **Brand** | The white-label organization/company configuration |
| **Client** | An authenticated user/customer |
| **DAC** | Domain Access Controller - manages domain configuration |
| **Guest** | An unauthenticated user browsing the store |
| **Invoice** | A bill generated from a converted basket |
| **Order** | A completed purchase transaction |
| **Promotion** | Discount code or offer applied to a basket |
| **Session** | User authentication and state context |

## Technical Terms

| Term | Definition |
|------|------------|
| **Actor** | XState spawned child machine (e.g., billing, currency, promotions) |
| **Composable** | Vue function returning reactive state and methods (`useBasket`, `useBrand`) |
| **Context** | XState machine's data store (not Vue's provide/inject) |
| **Guard** | XState condition function (`hasProducts`, `canCheckout`) |
| **Headless** | Framework-agnostic business logic layer |
| **Machine** | XState state machine definition |
| **Meta** | Computed object with state flags (`isLoading`, `hasErrors`) |
| **PREFRESH** | Partial basket refresh before full refresh |
| **Service** | XState running machine instance |

## Package Names

| Package | NPM Name | Purpose |
|---------|----------|---------|
| headless | `@upmind-automation/headless` | XState machines & business logic |
| client-vue | `@upmind-automation/client-vue` | Vue composables |
| ui | `@upmind-automation/upmind-ui` | Component library |
| types | `@upmind-automation/types` | TypeScript definitions |
| i18n | `@upmind-automation/i18n` | Translations |
| cart | `@upmind-automation/cart` | Shopping cart app |

## State Machine States

Common machine states used across modules:

| State | Meaning |
|-------|---------|
| `subscribing` | Waiting for dependencies (auth, session) |
| `loading` | Fetching initial data |
| `shopping` | User actively browsing/configuring |
| `configuring` | Setting up sub-components |
| `processing` | Executing an operation |
| `complete` | Final successful state |
| `error` | Error state |

## File Naming Conventions

| Pattern | Purpose |
|---------|---------|
| `{feature}.machine.ts` | XState machine definition |
| `{feature}.service.ts` | API/service layer |
| `{feature}.types.ts` | TypeScript types |
| `{feature}.styles.ts` | CVA style definitions |
| `use{Feature}.ts` | Vue composable |
| `{Feature}Page.vue` | Page component |
