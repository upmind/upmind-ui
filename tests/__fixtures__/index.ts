// -----------------------------------------------------------------------------
/**
 * @module tests/__fixtures__
 * @description Fixtures Loader - Provides access to recorded API fixtures for unit tests.
 * Fixtures are captured using `pnpm dev:record`.
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// -----------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RECORDINGS_DIR = join(__dirname, "recordings");
const INDEX_PATH = join(RECORDINGS_DIR, "_index.json");

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

export type FixtureIndexEntry = {
  file: string;
  path: string;
  method: string;
};

export type FixtureIndex = Record<string, FixtureIndexEntry>;

// --- state

let fixturesCache: Map<string, Fixture> | null = null;
let indexCache: FixtureIndex | null = null;

// -----------------------------------------------------------------------------

/**
 * Load the fixture index map.
 * Maps readable keys like "GET brand/settings" to fixture files.
 */
export function loadIndex(): FixtureIndex {
  if (indexCache) return indexCache;

  try {
    if (existsSync(INDEX_PATH)) {
      indexCache = JSON.parse(readFileSync(INDEX_PATH, "utf-8"));
      return indexCache!;
    }
  } catch {
    // No index
  }

  indexCache = {};
  return indexCache;
}

/**
 * Load all fixtures from the recordings directory.
 */
export function loadFixtures(): Map<string, Fixture> {
  if (fixturesCache) return fixturesCache;

  fixturesCache = new Map();

  try {
    const files = readdirSync(RECORDINGS_DIR).filter(
      f => f.endsWith(".json") && !f.startsWith("_")
    );

    for (const file of files) {
      const content = readFileSync(join(RECORDINGS_DIR, file), "utf-8");
      const fixture = JSON.parse(content) as Fixture;
      const key = file.replace(".json", "");
      fixturesCache.set(key, fixture);
    }
  } catch {
    console.warn(
      "[fixtures] No recordings found. Run `pnpm dev:record` to capture fixtures."
    );
  }

  return fixturesCache;
}

/**
 * Get a fixture by readable key (e.g., "GET brand/settings").
 * @param readableKey - Readable key to match in index
 * @throws Error if fixture not found
 */
export function getFixtureByKey(readableKey: string): Fixture {
  const index = loadIndex();
  const entry = index[readableKey];

  if (!entry) {
    throw new Error(
      `Missing fixture for key "${readableKey}". Run \`pnpm dev:record\` to capture fixtures.`
    );
  }

  const fixtures = loadFixtures();
  const fixtureKey = entry.file.replace(".json", "");
  const fixture = fixtures.get(fixtureKey);

  if (!fixture) {
    throw new Error(
      `Missing fixture file for key "${readableKey}". Run \`pnpm dev:record\` to capture fixtures.`
    );
  }

  return fixture;
}

/**
 * Get a fixture by partial filename match.
 * @param partialKey - Partial key to match fixture filename
 * @throws Error if fixture not found
 */
export function getFixture(partialKey: string): Fixture {
  const fixtures = loadFixtures();

  // Try exact match first
  if (fixtures.has(partialKey)) {
    return fixtures.get(partialKey)!;
  }

  // Try partial match
  for (const [key, fixture] of fixtures) {
    if (key.includes(partialKey)) {
      return fixture;
    }
  }

  throw new Error(
    `Missing fixture "${partialKey}". Run \`pnpm dev:record\` to capture fixtures.`
  );
}

/**
 * Get a fixture's response body by readable key.
 * @param readableKey - Readable key to match in index
 * @throws Error if fixture not found
 */
export function getFixtureBodyByKey<T = unknown>(readableKey: string): T {
  const fixture = getFixtureByKey(readableKey);
  return fixture.response.body as T;
}

/**
 * Get a fixture's response body by partial filename match.
 * @param partialKey - Partial key to match fixture filename
 * @throws Error if fixture not found
 */
export function getFixtureBody<T = unknown>(partialKey: string): T {
  const fixture = getFixture(partialKey);
  return fixture.response.body as T;
}

/**
 * Get token fixture for testing.
 * @throws Error if fixture not found
 */
export function getTokenFixture(): Fixture {
  return getFixture("post-oauth-access_token");
}

/**
 * List all available fixture keys from the index.
 */
export function listFixtureKeys(): string[] {
  return Object.keys(loadIndex());
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
    index: loadIndex
  };
}
