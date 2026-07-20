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

## Generating fixtures (requires staging credentials)

Every fixture is a **real capture, generated headlessly** (ADR 025 §A1.3 /
FE-2937) — never hand-written, never hand-edited. Each unit owns a
`<unit>.fixtures.ts` generator and regenerates its own co-located `fixtures/`
with ONE entrypoint:

```sh
pnpm fixtures:generate <unit>     # e.g. pnpm fixtures:generate auth
                                  #      pnpm fixtures:generate product-setup
```

It loads `packages/headless/.env.recording` (`VITE_API_URL` +
`RECORDING_BRAND_ORIGIN` — the API resolves the brand from `Origin`), runs the
unit's `<unit>.fixtures.ts` against real staging with `FIXTURE_MODE=record`, then
**auto-runs `lint:fixtures`** so a bad or PII-leaking capture fails at the source
(FE-2937 decision 5). Two generator flavours share the entrypoint — the flavour
is an implementation detail of the unit's `.fixtures.ts`, not a flag:

- **(a) direct-API** — the `Generator` (`generator.ts`) makes real `fetch` calls
  and writes sanitised v3. Best for per-endpoint case captures (`auth`, `query`,
  `account`, `session-store`).
- **(b) headless Playwright** — the unit launches a real headless chromium
  session, drives a real staging flow, and `playwright-recorder.mjs` captures the
  browser's traffic via `context.route('**')` (the browser-native equivalent of
  the `recording-proxy.mjs` reverse proxy: it forwards each request to staging,
  captures it, and fulfils it back to the page with permissive CORS; `Origin` is
  rewritten to the brand). Best for cross-module flows that need real
  session/basket/order state — see
  [`product-setup.fixtures.ts`](../../packages/headless/src/modules/product-setup/__tests__/product-setup.fixtures.ts),
  which seats an INVALID configurable-product basket for the `useProductSetup`
  integration tests (FE-2796).

Both flavours go through the SAME pipeline (`fixture-naming.mjs` `sanitize` /
`redactValue` / `generateFixtureName`, v3 `ApiFixtureV3` shape), so a
browser-driven capture lands byte-identical to a direct-API one: PII-masked,
deterministically named (long identity params collapse to a `…-<hash8>` suffix
so a giant `?keys=` list can't overflow the filesystem), co-located, no central
pool. Staging captures create real records on staging — that is sanctioned; be
deliberate.

### Legacy proxy recorder

```sh
pnpm record            # HTTP reverse-proxy recorder (recording-proxy.mjs)
pnpm record:cases      # run record-cases.ts for individual case fixtures
```

`recording-proxy.mjs` is the pre-generator recorder an app is pointed at; the
Playwright recorder above supersedes it for headless capture (no hosted app to
point at). After any recording, run `pnpm lint:fixtures` before committing.

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
