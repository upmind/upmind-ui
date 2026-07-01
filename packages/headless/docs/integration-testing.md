# Integration testing

The headless package runs two independent Vitest projects — `unit` and `integration` — defined in [`vitest.config.ts`](../vitest.config.ts). This document covers the integration project only.

```sh
pnpm --filter @upmind-automation/headless exec vitest run --project integration
# or via package scripts:
pnpm --filter @upmind-automation/headless test:integration
```

---

## 1. Three modes

The `FIXTURE_MODE` environment variable selects the network strategy.

| Mode | How | When |
|---|---|---|
| `replay` (default) | MSW intercepts all requests and replays committed fixtures | CI and local development — fully deterministic, no network |
| `record` | MSW is disabled; requests hit the real staging API | Adding new fixtures — run against staging, commit the output |
| `live` | MSW is disabled; requests hit the real API, no recording | Drift detection — verify live API still matches committed fixtures |

Scripts:

```sh
pnpm test:integration                  # replay (default)
pnpm test:integration:record           # FIXTURE_MODE=record
pnpm test:integration:live             # FIXTURE_MODE=live
```

---

## 2. MSW wiring

`replay` mode wires MSW at the network boundary in [`src/__tests__/setup.integration.ts`](../src/__tests__/setup.integration.ts):

1. `buildHandlers()` (in [`src/__tests__/msw-handlers.ts`](../src/__tests__/msw-handlers.ts)) calls `loadAllFixtures()` and emits one `http.<method>` handler per unique `(method, pathname)` pair. The route is `*${pathname}` — host-wildcarded — so it matches both `/api/*` and `/oauth/*` paths.
2. `server.listen({ onUnhandledRequest })` is called in `beforeAll`. Any request that reaches MSW without a matching handler **throws immediately** with the method and path. A test cannot silently escape to the real network or a missing fixture.
3. `server.resetHandlers()` runs after each test; `server.close()` runs after all.

In `record` and `live` modes the setup file is a no-op — no MSW server starts.

**Collision handling:** if two fixtures share the same `(method, pathname)`, the first one wins and a warning is logged. This is intentional: the pool must not contain ambiguous contracts.

---

## 3. Fixture schema and pool layout

### v3 schema

[`tests/fixtures/types.ts`](../../../../tests/fixtures/types.ts) defines the canonical shape:

```ts
type ApiFixtureV3 = {
  version: 3;
  request: {
    method: HttpMethod;
    path: string;        // full pathname, e.g. "/api/countries"
    headers?: Record<string, string>;
    body?: unknown;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body: unknown;
  };
  captured_at: string;   // ISO 8601
  brand_domain: string;  // e.g. "example.com"
  source: "journey" | "case";
  provenance: { journey?: string; case?: string };
};
```

`AnyApiFixture` (v1 | v2 | v3) is also exported for the legacy loader; v3 is the only format for newly authored fixtures.

### Pool layout

```
tests/fixtures/recordings/
  cases/          ← hand-authored, per-endpoint, PII-free (loaded by MSW)
  journeys/       ← future: multi-step flows keyed by slug (loaded by MSW)
  _index.json     ← human-readable key → file map for the legacy filename API
```

`loadAllFixtures()` in [`tests/fixtures/index.ts`](../../../../tests/fixtures/index.ts) walks `cases/` and `journeys/` only. The flat legacy files at the `recordings/` root are excluded — they are unsanitised and not consumed by the MSW layer.

**PII policy:** `tests/fixtures/fixture-naming.mjs` `sanitize()` redacts UUIDs, emails, E.164 phone numbers, and JWTs at value level. `pnpm lint:fixtures` (`tests/fixtures/lint-fixtures.mjs`) scans the pool and exits non-zero on any unmasked PII. It must stay green before committing new fixtures.

---

## 4. Adding a new integration test

### 4a. Author the fixture

Create `tests/fixtures/recordings/cases/<name>.json` (v3 schema, PII-free). Run `pnpm lint:fixtures` to confirm it passes. Example: [`cases/query-countries-200.json`](../../../../tests/fixtures/recordings/cases/query-countries-200.json).

### 4b. Write the test

Co-locate the test file with its module:

```
packages/headless/src/modules/<module>/__tests__/<x>.int.test.ts
```

The `integration` Vitest project picks up any file matching `**/__tests__/**/*.int.test.ts`.

Drive the **real composable** directly — no shadow implementations, no in-test mocks of the HTTP layer. MSW already owns the network boundary.

```ts
import { describe, it, expect } from "vitest";
import { useMyModule } from "../useMyModule";
import { getFixtureBody } from "../../../../../../tests/fixtures/index";

describe("my-module integration (fixture replay)", () => {
  it("resolves the recorded data", async () => {
    const { request } = useMyModule();
    const response = await request({ url: "..." });
    const expected = getFixtureBody("cases/my-fixture");
    expect(response.data).toEqual(expected.data);
  });
});
```

### 4c. Run

```sh
pnpm --filter @upmind-automation/headless test:integration
```

All four cases must be green before committing.

---

## 5. The anti-shadow-implementation rule

Integration tests exercise the **real composable stack end to end**. Do not:

- Create a trimmed-down re-implementation of a composable for test purposes.
- Swap `doFetch` / `useQuery` / `request` for a hand-rolled stub inside the test.
- Mock anything below the network boundary that MSW already covers.

If a test needs to isolate a boundary that MSW cannot cover (e.g. localStorage, a Vue plugin), add that setup to `setup.integration.ts`, not inside the test. Anything inside the test that impersonates production code is a shadow implementation — it tests the shadow, not the real thing.

---

## 6. Pilot test

[`packages/headless/src/modules/query/__tests__/query.int.test.ts`](../src/modules/query/__tests__/query.int.test.ts)

Drives the real `useQuery()` (HTTP boundary, ADR 007) through MSW-replayed v3 fixtures. Four cases:

| Case | Fixture | Asserts |
|---|---|---|
| Happy GET `/api/countries` | `cases/query-countries-200` | 200, unwrapped `data` array, first entry `iso_code: "GB"` |
| Missing resource GET `/api/countries/zz` | `cases/query-country-404` | Rejects with `code: 404` |
| Unauthorized POST `/oauth/access_token` | `cases/query-oauth-401` | Rejects with `code: 401`, no re-auth triggered (`canRetryAuthorization` is false on the oauth path) |
| Unrecorded endpoint (negative control) | none | MSW throws — confirms the guard works |

`useQuery` was chosen as the pilot because it is the only composable with a real tokenless public GET that carries no brand, session, or localStorage dependency. Every feature-module composable requires a token or pulls in `useBrand`.
