// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures
 * @description Fixtures Loader - Provides access to recorded API fixtures for
 * tests. Every lookup names a unit's own co-located `recordingsDir` (the
 * central pool is retired — ADR 025) and the loader walks that dir recursively,
 * tolerating v1/v2/v3 fixture shapes. Fixtures are captured using `pnpm record`.
 */

import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, relative, resolve, sep } from "path";
import { fixtureIdentity } from "./fixture-naming.mjs";
import type {
  AnyApiFixture,
  ApiFixtureV3,
  FixtureIndex,
  FixtureSource,
  NormalizedFixture
} from "./types";

// -----------------------------------------------------------------------------

export type Fixture = {
  request: {
    method: string;
    path: string;
  };
  response: {
    status: number;
    body: unknown;
  };
};

export type {
  FixtureIndexEntry,
  FixtureIndex,
  NormalizedFixture
} from "./types";

// --- state

const fixturesCache = new Map<string, Map<string, Fixture>>();
const allFixturesCache = new Map<string, NormalizedFixture[]>();

/**
 * Resolve a caller-supplied `recordingsDir` or throw a fail-loud error. The
 * central pool is retired (ADR 025): every fixture lookup must name the unit's
 * own co-located `fixtures/` directory.
 */
function requireRecordingsDir(recordingsDir: string | undefined): string {
  if (!recordingsDir) {
    throw new Error(
      "[fixtures] No recordingsDir given. The central pool is retired — pass " +
        "{ recordingsDir } pointing at the unit's own fixtures/ directory."
    );
  }
  return resolve(recordingsDir);
}

// --- private

function walkJsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkJsonFiles(full));
      continue;
    }
    if (entry.endsWith(".json") && !entry.startsWith("_")) files.push(full);
  }

  return files;
}

function fixtureVersion(fixture: AnyApiFixture): 1 | 2 | 3 {
  const version = (fixture as ApiFixtureV3).version;
  if (version === 3) return 3;
  if (version === 2) return 2;
  return 1;
}

/**
 * Coerce any supported fixture version into the flat {@link Fixture} shape used
 * by the legacy loader API (request.method/path, response.status/body).
 */
function toLegacyFixture(fixture: AnyApiFixture): Fixture {
  return {
    request: {
      method: fixture.request.method,
      path: fixture.request.path
    },
    response: {
      status: fixture.response.status,
      body: fixture.response.body
    }
  };
}

/**
 * Coerce any supported fixture version into a {@link NormalizedFixture}.
 * `journey` is derived from a `journeys/<slug>/` ancestor directory.
 */
function normalize(
  fixture: AnyApiFixture,
  file: string,
  baseDir: string
): NormalizedFixture {
  const version = fixtureVersion(fixture);
  const headers =
    version >= 2
      ? ((fixture.response as ApiFixtureV3["response"]).headers ?? {})
      : {};
  const source = version === 3 ? (fixture as ApiFixtureV3).source : undefined;

  const segments = relative(baseDir, file).split(sep);
  const journey =
    segments[0] === "journeys" && segments.length > 1 ? segments[1] : undefined;

  return {
    body: fixture.response.body,
    file,
    headers,
    method: fixture.request.method,
    path: fixture.request.path,
    source,
    status: fixture.response.status,
    journey
  };
}

// -----------------------------------------------------------------------------

/**
 * Build the fixture index in memory by walking a unit's `recordingsDir`, keyed
 * by each fixture's file path relative to that dir (e.g. "query-countries-200").
 * There is no committed `_index.json` — the files on disk are the single source
 * of truth. The cache is keyed by resolved dir so two units never collide.
 */
export function loadIndex(opts?: { recordingsDir?: string }): FixtureIndex {
  const baseDir = requireRecordingsDir(opts?.recordingsDir);

  const index: FixtureIndex = {};
  for (const file of walkJsonFiles(baseDir)) {
    const fixture = JSON.parse(readFileSync(file, "utf-8")) as AnyApiFixture;
    const key = relative(baseDir, file)
      .replace(/\.json$/, "")
      .split(sep)
      .join("/");
    index[key] = {
      file: `${key}.json`,
      method: fixture.request.method,
      path: fixture.request.path,
      status: fixture.response.status,
      source: (fixture as ApiFixtureV3).source,
      provenance: (fixture as ApiFixtureV3).provenance
    };
  }
  return index;
}

/**
 * Load all fixtures from a unit's co-located `recordingsDir` (recursively),
 * keyed by each fixture's file path relative to that dir without the `.json`
 * extension (e.g. "query-countries-200"). The cache is keyed by resolved dir so
 * two units never share an entry.
 */
export function loadFixtures(opts?: {
  recordingsDir?: string;
}): Map<string, Fixture> {
  const baseDir = requireRecordingsDir(opts?.recordingsDir);

  const cached = fixturesCache.get(baseDir);
  if (cached) return cached;

  const fixtures = new Map<string, Fixture>();
  for (const file of walkJsonFiles(baseDir)) {
    const fixture = JSON.parse(readFileSync(file, "utf-8")) as AnyApiFixture;
    const key = relative(baseDir, file)
      .replace(/\.json$/, "")
      .split(sep)
      .join("/");
    fixtures.set(key, toLegacyFixture(fixture));
  }

  fixturesCache.set(baseDir, fixtures);
  return fixtures;
}

/**
 * Load every fixture under a unit's co-located `recordingsDir` (recursively),
 * normalized to {@link NormalizedFixture}. Used by the MSW handler builder.
 * `journey` is set from a `journeys/<slug>/` ancestor directory when present.
 *
 * The central pool is retired (ADR 025): `recordingsDir` is required and the
 * cache is keyed by the resolved dir, so two units never share an entry and a
 * unit can only ever replay its own fixtures.
 */
export function loadAllFixtures(opts?: {
  recordingsDir?: string;
}): NormalizedFixture[] {
  const baseDir = requireRecordingsDir(opts?.recordingsDir);

  const cached = allFixturesCache.get(baseDir);
  if (cached) return cached;

  const fixtures = walkJsonFiles(baseDir).map(file => {
    const fixture = JSON.parse(readFileSync(file, "utf-8")) as AnyApiFixture;
    return normalize(fixture, file, baseDir);
  });

  allFixturesCache.set(baseDir, fixtures);
  return fixtures;
}

// -----------------------------------------------------------------------------
// --- journeys

/** A typed reference to one journey fixture, by readable `"METHOD path"` selector. */
export type JourneySelector<T> = { selector: string; _type?: T };

/**
 * Mark which fixture a journey alias points at — a readable `"METHOD path"`
 * selector (least-specific match wins; add params to target a specific variant)
 * — and the type of its unwrapped `data` payload.
 */
export function select<T = unknown>(selector: string): JourneySelector<T> {
  return { selector };
}

/** Unwrap the Upmind `{ data }` envelope; bodies without it (e.g. oauth) pass through. */
function unwrapData(body: unknown): unknown {
  return body !== null && typeof body === "object" && "data" in body
    ? (body as { data: unknown }).data
    : body;
}

function resolveJourneyFixture(
  fixtures: NormalizedFixture[],
  selector: string
): NormalizedFixture {
  const parsed = selector.match(/^(\w+)\s+(.+)$/);
  if (!parsed) {
    throw new Error(
      `Bad journey selector "${selector}" — expected "METHOD path".`
    );
  }
  const method = parsed[1].toUpperCase();
  const url = new URL(parsed[2], "http://fixtures.local/");
  const wantPath = fixtureIdentity(method, url.pathname).path;
  const wantKeys = [...url.searchParams.keys()];

  const candidates = fixtures
    .map(fixture => {
      const id = fixtureIdentity(fixture.method, fixture.path);
      return { fixture, path: id.path, keys: id.params.map(([key]) => key) };
    })
    .filter(
      candidate =>
        candidate.fixture.method.toUpperCase() === method &&
        candidate.path === wantPath
    );

  if (!candidates.length) {
    throw new Error(
      `No "${selector}" fixture in this journey. Run \`pnpm record\`.`
    );
  }

  const matching = wantKeys.length
    ? candidates.filter(candidate =>
        wantKeys.every(key => candidate.keys.includes(key))
      )
    : candidates;

  return (matching.length ? matching : candidates).sort(
    (a, b) => a.keys.length - b.keys.length
  )[0].fixture;
}

/**
 * Build a typed, lazy accessor for one journey's fixtures from an alias map.
 * Each alias resolves to the unwrapped `data` of its fixture, so tests consume
 * domain data directly (`journey().ordersCurrent.currency.code`).
 */
export function defineJourney<
  M extends Record<string, JourneySelector<unknown>>
>(
  journey: string,
  aliases: M,
  opts: { recordingsDir: string }
): () => {
  [K in keyof M]: M[K] extends JourneySelector<infer T> ? T : unknown;
} {
  return () => {
    const fixtures = loadAllFixtures(opts).filter(
      fixture => fixture.journey === journey
    );
    if (!fixtures.length) {
      throw new Error(
        `No fixtures for journey "${journey}". Run \`pnpm record\`.`
      );
    }

    const resolved: Record<string, unknown> = {};
    for (const [name, ref] of Object.entries(aliases)) {
      resolved[name] = unwrapData(
        resolveJourneyFixture(fixtures, ref.selector).body
      );
    }

    return resolved as {
      [K in keyof M]: M[K] extends JourneySelector<infer T> ? T : unknown;
    };
  };
}

/**
 * Get a fixture by readable key (e.g., "GET brand/settings").
 * @param readableKey - Readable key to match in index
 * @throws Error if fixture not found
 */
export function getFixtureByKey(
  readableKey: string,
  opts?: { recordingsDir?: string }
): Fixture {
  const index = loadIndex(opts);
  const entry = index[readableKey];

  if (!entry) {
    throw new Error(
      `Missing fixture for key "${readableKey}". Run \`pnpm record\` to capture fixtures.`
    );
  }

  const fixtures = loadFixtures(opts);
  const fixtureKey = entry.file.replace(/\.json$/, "");
  const fixture = fixtures.get(fixtureKey) ?? getFixture(fixtureKey, opts);

  if (!fixture) {
    throw new Error(
      `Missing fixture file for key "${readableKey}". Run \`pnpm record\` to capture fixtures.`
    );
  }

  return fixture;
}

/**
 * Get a fixture by partial filename match.
 * @param partialKey - Partial key to match fixture filename
 * @throws Error if fixture not found
 */
export function getFixture(
  partialKey: string,
  opts?: { recordingsDir?: string }
): Fixture {
  const fixtures = loadFixtures(opts);

  if (fixtures.has(partialKey)) {
    return fixtures.get(partialKey)!;
  }

  for (const [key, fixture] of fixtures) {
    if (key.includes(partialKey)) {
      return fixture;
    }
  }

  throw new Error(
    `Missing fixture "${partialKey}". Run \`pnpm record\` to capture fixtures.`
  );
}

/**
 * Get a fixture's response body by readable key.
 * @param readableKey - Readable key to match in index
 * @throws Error if fixture not found
 */
export function getFixtureBodyByKey<T = unknown>(
  readableKey: string,
  opts?: { recordingsDir?: string }
): T {
  const fixture = getFixtureByKey(readableKey, opts);
  return fixture.response.body as T;
}

/**
 * Get a fixture's response body by partial filename match.
 * @param partialKey - Partial key to match fixture filename
 * @throws Error if fixture not found
 */
export function getFixtureBody<T = unknown>(
  partialKey: string,
  opts?: { recordingsDir?: string }
): T {
  const fixture = getFixture(partialKey, opts);
  return fixture.response.body as T;
}

/**
 * Get token fixture for testing.
 * @throws Error if fixture not found
 */
export function getTokenFixture(opts?: { recordingsDir?: string }): Fixture {
  return getFixture("post-oauth-access_token", opts);
}

/**
 * List all available fixture keys from the index.
 */
export function listFixtureKeys(opts?: { recordingsDir?: string }): string[] {
  return Object.keys(loadIndex(opts));
}

/**
 * Composable for Vue components in tests.
 */
export function useFixtures() {
  return {
    get: getFixture,
    getByKey: getFixtureByKey,
    getBody: getFixtureBody,
    getBodyByKey: getFixtureBodyByKey,
    getToken: getTokenFixture,
    list: listFixtureKeys,
    load: loadFixtures,
    loadAll: loadAllFixtures,
    index: loadIndex
  };
}

export type { FixtureSource };
