## Upmind

# New FE Arch - Testing strategy

// ARRANGE (assign / mocks)
// ACT (action / calls)
// ASSERT (expect / expect to have been called)

//
// Headless
// Business logic, wraps xstate machines following a framework agnostic architecture exposing hooks/composables
// branch: chore/upflow-vitest
//
// - Unit tests - "low level" xstate logic
// - Mocking xstate machines' `services` means we're not actually hiting the API
//
// - Expect state to have the right values
//
// 1. "Module tests" (automatic) - ex: @/modules/domain/**tests**/domain.machine.test.ts
// 2. "Manual" - ex: @/modules/brand/**tests**/brand.machine.test.ts
//

//
// Client-Vue
// As of right now, compacts Headless, Upmind Ui and "standard"(?) Vue components
// so it's the only lib client would need to import.
// TODO: To discuss (not sure this is the way forward)
//
// - Not testing Headless nor Upmind Ui (those are tested separately)
// So the only remaining features left to test are the Vue components
//
// - Integration tests (for Vue components)
// (we can use Cypress components - https://github.com/cypress-io/cypress-component-testing-apps/blob/main/vue3-vite-ts/src/components/Welcome.cy.ts
//
// - Mock API requests with `cy.intercept`
// . (https://github.com/cypress-io/cypress-component-testing-apps/blob/main/vue3-vite-ts/src/App.cy.ts)
//

//
// playgrounds/doteasy
// A client implementation (DotEasy) using our Client-Vue lib (eventually via "npm install @upmind-automation/client-vue")
//
// - e2e tests with Cypress
//
// - No mocks
// - We can use staging env
// - Eventually we can have a more controlled test env
// - with a DB seeding strategy
//
// Upmind Admin
// - We're probably not doing it for playgrounds/doteasy (DotEasy)
// - However, this approach is my recommendation for the admin app
// (because it will also be a "client" of our upflow-vue and upmind-ui libs - or even Client-vue if that's the way)
//
