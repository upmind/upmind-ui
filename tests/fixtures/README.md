# tests/fixtures

The fixtures tool — loader, identity/naming, MSW replay, journey aliases —
shared across packages' tests. Fixtures themselves are **co-located with the
unit that owns them** (the central pool is retired — see
[ADR 025](../../docs/adr/025-colocated-journey-units.md)): a module's fixtures
live under `packages/headless/src/modules/<m>/__tests__/fixtures/`, a journey's
under `tests/<surface>/<flow>/<slug>/fixtures/`.

## recordingsDir — every lookup names its own dir

There is no whole-pool default. Every loader and getter takes a
`{ recordingsDir }` pointing at the unit's own `fixtures/` directory; omitting
it throws a fail-loud error. The cache is keyed by the resolved dir, so two
units can never share fixtures or bleed into one another.

## Dual-consumption pattern

The same co-located fixture files serve two distinct test layers:

**Unit / body lookup** — import `getFixtureBody` from
`@upmind-automation/test-fixtures` and read a recorded body directly, passing
the unit's `recordingsDir`. The test controls what the composable receives; no
network or MSW is involved.

```ts
import { fileURLToPath } from "node:url";
import { getFixtureBody } from "@upmind-automation/test-fixtures";

const recordingsDir = fileURLToPath(new URL("./fixtures", import.meta.url));
const body = getFixtureBody<Country[]>("query-countries-200", { recordingsDir });
```

**Integration tests** — call `startReplayServer({ recordingsDir })` from the
unit's own `setup.integration.ts`, imported at the top of its `*.int.test.ts`.
`buildHandlers`/`loadAllFixtures` walk exactly that dir to build MSW handlers.
When `FIXTURE_MODE=replay` (default), MSW intercepts every real HTTP call the
composable makes and returns the stored body — the composable runs unmodified,
nothing is mocked, and unmatched requests throw, surfacing unrecorded endpoints
immediately.

```ts
// modules/query/__tests__/setup.integration.ts
const recordingsDir = fileURLToPath(new URL("./fixtures", import.meta.url));
startReplayServer({ recordingsDir });
```

This per-unit setup is symmetric with journeys (each journey's `setup.ts` does
the same) and keeps a unit self-contained and deletable. Because each unit loads
only its own dir, the old whole-pool body-bleed bug — two units' parameterless
routes (e.g. `GET orders/current`) collapsing into one handler — cannot occur.

## v3 schema

All new fixtures are written in v3. The loader also tolerates v1 and v2 for
legacy pool entries. `AnyApiFixture` is the union type; `ApiFixtureV3` is the
canonical shape:

```ts
{
  version: 3,
  request: { method: HttpMethod; path: string; headers?: Record<string,string>; body?: unknown },
  response: { status: number; headers?: Record<string,string>; body: unknown },
  captured_at: string,   // ISO-8601, required
  brand_domain: string,  // e.g. "example.com"
  source: "journey" | "case",
  provenance: { journey?: string; case?: string }
}
```

See `types.ts` for the full type definitions.

## Directory layout

Fixtures live in a `fixtures/` directory co-located with the owning unit:

```text
packages/headless/src/modules/query/__tests__/
  fixtures/                 # this module's own fixtures
    query-countries-200.json
    query-country-404.json
    query-oauth-401.json
  setup.integration.ts      # startReplayServer({ recordingsDir: ./fixtures })
  query.int.test.ts

tests/<surface>/<flow>/<slug>/
  fixtures/
    journeys/<slug>/<fixture>.json   # journey is derived from this ancestor dir
  setup.ts
```

`loadAllFixtures({ recordingsDir })` walks **exactly** that dir, recursively,
keyed in the cache by its resolved path — so one unit can never bleed into
another. A fixture's `journey` is set when it sits under a `journeys/<slug>/`
ancestor directory.

## Recording (deferred — requires staging credentials)

```sh
pnpm record            # record a full journey against staging
pnpm record:cases      # run record-cases.ts for individual case fixtures
```

Both commands hit a live staging API and write v3 fixtures into the appropriate
`cases/` or `journeys/<slug>/` directory. They are no-ops in CI and must be run
locally with valid staging credentials. After recording, run `pnpm lint:fixtures`
before committing.

In integration tests, set `FIXTURE_MODE=record` or `FIXTURE_MODE=live` to bypass
MSW and hit the real network directly (also requires staging credentials).

## PII rule

Two layers of protection keep fixtures safe to commit:

**Value-level sanitiser** (`fixture-naming.mjs` `sanitize()` + `redactValue()`):
applied at record time, before any fixture is written. Redacts UUID, email,
E.164 phone, and JWT/Bearer tokens regardless of which JSON key they appear
under. Each unique source value maps deterministically to a `mock-*` placeholder
(`mock-uuid-1`, `mock-email-1@example.com`, `mock-token-1`, `mock-phone-1`)
so the same source value always produces the same placeholder within a run.
Sensitive keys (`token`, `password`, `secret`, etc.) are additionally blanked
to `mock-{key}`.

**Lint gate** (`lint-fixtures.mjs`, also `pnpm lint:fixtures`): scans every
file in `recordings/cases/` and `recordings/journeys/` recursively. Exits 1
if any unmasked UUID, email, E.164 phone, or JWT is found. Already-masked
`mock-*` placeholders and `@example.com` addresses are whitelisted. The lint
gate must pass (exit 0) before any fixture PR is merged.

The flat legacy v2 files at the `recordings/` root are NOT scanned — they are
an unsanitised backlog kept only for backwards-compatible filename-keyed
lookups and must never be committed with real PII.
