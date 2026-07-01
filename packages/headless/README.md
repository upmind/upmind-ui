# Upmind Headless

Upmind Headless is a JavaScript framework used within the Upmind ecosystem, specifically for client UI user journeys. It is responsible for generating state machines that control the flow of client information and interactions, and to manage what actions can be done for each state.

## Installation

Currently, there is no separate installation method for Upmind Headless. It is part of a package within a monorepo and can be consumed using standard ES6 `import` or `require` methods, configured using npm workspaces.

## Usage

See individual modules for usage details.

## Configuration

See individual modules for configuration details.

## API Documentation

See individual modules for API documentation.

## Examples

See individual modules for examples.

## Testing

Tests run with [Vitest](https://vitest.dev/) via two separate projects defined in `vitest.config.ts`.

### Projects

| Project | Files matched | Setup | Timeout |
| ------- | ------------ | ----- | ------- |
| `unit` | `src/**/__tests__/**/*.test.ts` (excludes `*.int.test.ts` and `*.no-test.ts`) | `src/__tests__/setup.unit.ts` | 5 s |
| `integration` | `src/**/__tests__/**/*.int.test.ts` | `src/__tests__/setup.integration.ts` | 30 s |

### Running tests

```bash
# Both projects
pnpm --filter @upmind-automation/headless exec vitest run

# Unit only
pnpm --filter @upmind-automation/headless exec vitest run --project unit

# Integration only
pnpm --filter @upmind-automation/headless exec vitest run --project integration
```

Or via the package scripts:

```bash
pnpm test                   # vitest run (both projects)
pnpm test:unit              # vitest run --project unit
pnpm test:integration       # vitest run --project integration
pnpm test:integration:record  # FIXTURE_MODE=record (hits real network, writes fixtures)
pnpm test:integration:live    # FIXTURE_MODE=live  (hits real network, no fixture write)
```

### File conventions

Integration tests are co-located with the module they exercise and use the `.int.test.ts` suffix:

```
src/modules/query/__tests__/
  query.test.ts       ← unit
  query.int.test.ts   ← integration
```

### MSW and fixture replay

Integration tests run against [MSW](https://mswjs.io/) in Node. Fixtures live in `tests/fixtures/recordings/` (under `cases/` and `journeys/`). The setup server is configured with `onUnhandledRequest: 'error'` — any request that has no matching fixture **throws immediately**, so missing recordings are a hard failure rather than a silent network call.

> **For contributors:** When adding a new integration test, add a corresponding hand-authored fixture under `tests/fixtures/recordings/cases/` using the v3 schema (`tests/fixtures/types.ts`). Run `pnpm lint:fixtures` from the repo root to verify no unmasked PII is present in the pool.

Code coverage is provided by [@vitest/coverage-istanbul](https://www.npmjs.com/package/@vitest/coverage-istanbul).

## License

The **Upmind Headless** package is proprietary and closed source.
