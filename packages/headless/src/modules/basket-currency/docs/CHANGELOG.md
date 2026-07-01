# Changelog

All notable changes to `basket-currency` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## [FE-2957] — Cart Currency Init

### Added

- `basket-currency` module: XState machine (`basketCurrencyManager`), services, utils, and `useBasketCurrency` composable
- Six-step currency resolution chain in `resolveBaseModel`: server basket currency → explicit pick → stored default → account currency → locale currency → brand default
- Two-key sessionStorage design: `currency` (explicit user pick, survives login) and `currency_default` (auto-resolved default, cleared on login)
- Storage helpers: `getExplicitCurrency`, `persistExplicitCurrency`, `persistDefaultCurrency`, `clearDefaultCurrency`, `clearCurrencyStorage`
- `AUTHENTICATED` event handler with `hasNoExplicitCurrency` guard — account currency wins on login unless user explicitly picked
- `UNAUTHENTICATED` event handler — both sessionStorage keys cleared, fresh resolution for new anonymous session
- `REFRESH` event handler with `hasChanged` guard — avoids thrash loop on every basket refresh
- `update` service debounced with `@tanstack/pacer` `asyncDebounce` (1 s, leading) to prevent rapid PUT calls
- `useBasketCurrency` composable exposing `isReady`, `meta`, context refs (`currencies`, `currency`, `currencyCode`, `currencyId`, `model`, `schema`, `uischema`, `errors`, `context`), and methods (`clear`, `input`, `update`)
- `setCurrency` funnel action in `apps/cart` reads `?currency=` query param on route entry and forwards to the currency machine
- 25 unit tests in `__tests__/basket-currency.utils.test.ts` covering resolver precedence (a–f), store-on-compute caching, unsupported-candidate rejection, and all storage helpers

### Design decisions

- Mirrors legacy `vue-app` `setInitialCurrencyCode` precedence, extended with sessionStorage persistence and server-basket-currency priority
- Locale lane (`BasketCurrencySource.LANGUAGE`) gated by brand config so brands can opt in without affecting others
- `persistModel` action only called after a user-driven `SET` (autoupdate), ensuring auto-resolved seeds never overwrite an explicit pick
