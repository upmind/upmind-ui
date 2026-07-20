#!/usr/bin/env node
/**
 * Fixture Linter (ADR 025 — per-unit co-located fixtures)
 *
 * Scans the v3 fixture surface, which now lives PER UNIT (no central pool, no
 * `cases/`):
 *   - module units:  packages/headless/src/modules/<m>/__tests__/fixtures/**
 *   - journey units: tests/<surface>/<flow>/<slug>/fixtures/**
 *
 * Fails (exit 1) on any of:
 *   - [pii]   UNMASKED PII (UUID, email, E.164 phone, JWT/Bearer) in a fixture
 *             body OR filename
 *   - [slug]  a journey folder name that breaks the ADR 025 slug grammar
 *   - [dup]   two fixtures in ONE unit sharing a METHOD+identity (same templated
 *             path + identity params) with no distinguishing matcher — the
 *             silent body-bleed shape. Cross-unit duplication is INTENDED and
 *             never flagged.
 *   - [v3]    a fixture json without `version: 3`
 *
 * Exits 0 when every unit is clean (vacuously, if there are no journey units).
 *
 * Usage:
 *   node tests/fixtures/lint-fixtures.mjs
 */

import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, dirname, relative, basename } from "path";
import { fileURLToPath } from "url";
import { fixtureIdentity } from "./fixture-naming.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = join(__dirname, "..", "..");
const MODULES_ROOT = join(REPO_ROOT, "packages", "headless", "src", "modules");
// Journey units live under tests/journeys/<surface>/<flow>/<slug>/ (ADR 025
// Amendment A1.4 moved them beneath a `journeys/` wrapper; this is also where
// tests/journeys/vitest.journeys.config.ts roots its `**/*.int.test.ts` glob).
const JOURNEYS_ROOT = join(REPO_ROOT, "tests", "journeys");

// --- slug grammar (ADR 025) — <surface>-<who>-<product>-<action>[-extras][-payment]

const SURFACES = ["storefront", "portal", "admin"];
const WHO = ["guest", "client", "staff"];

/**
 * A journey slug folder name is valid when it is all-lowercase, hyphen-joined
 * (no underscores), starts with a known surface then a known who, and carries
 * at least a product and an action segment after that (≥4 segments total).
 */
function isValidSlug(slug) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return false;
  const parts = slug.split("-");
  if (parts.length < 4) return false;
  if (!SURFACES.includes(parts[0])) return false;
  if (!WHO.includes(parts[1])) return false;
  return true;
}

// --- PII detectors. Each match is checked against `isMasked` to skip placeholders.

const DETECTORS = [
  {
    type: "uuid",
    pattern:
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi
  },
  {
    // Lowercase TLD only — avoids false positives on object keys / template
    // expressions like "test@data.productsToBundle" (camelCase, not an email).
    type: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,24}\b/g
  },
  {
    type: "jwt",
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g
  },
  {
    type: "phone",
    pattern: /\+\d{7,15}\b/g
  }
];

function isMasked(type, match) {
  if (type === "email") return match.endsWith("@example.com");
  return /^mock-/.test(match);
}

// --- discovery

function subdirs(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter(entry => entry !== "node_modules" && !entry.startsWith("."))
    .map(entry => join(path, entry))
    .filter(full => statSync(full).isDirectory());
}

function jsonFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...jsonFiles(full));
    } else if (entry.endsWith(".json")) {
      files.push(full);
    }
  }
  return files;
}

/**
 * A unit = a `fixtures/` directory owned by one module or one journey.
 * Module units: packages/headless/src/modules/<m>/__tests__/fixtures
 * Journey units: tests/<surface>/<flow>/<slug>/fixtures
 */
function findUnitDirs() {
  const units = [];

  for (const moduleDir of subdirs(MODULES_ROOT)) {
    const fixturesDir = join(moduleDir, "__tests__", "fixtures");
    if (existsSync(fixturesDir)) units.push(fixturesDir);
  }

  for (const surface of subdirs(JOURNEYS_ROOT)) {
    for (const flow of subdirs(surface)) {
      for (const slug of subdirs(flow)) {
        const fixturesDir = join(slug, "fixtures");
        if (existsSync(fixturesDir)) units.push(fixturesDir);
      }
    }
  }

  return units;
}

/** Every journey slug folder (whether or not it has fixtures), for slug-shape. */
function findJourneySlugs() {
  const slugs = [];
  for (const surface of subdirs(JOURNEYS_ROOT)) {
    for (const flow of subdirs(surface)) {
      for (const slug of subdirs(flow)) {
        slugs.push(slug);
      }
    }
  }
  return slugs;
}

// --- checks

function scanPii(file, findings) {
  const content = readFileSync(file, "utf-8");
  for (const { type, pattern } of DETECTORS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (!isMasked(type, match[0])) {
        findings.push({ kind: "pii", file, detail: `unmasked ${type}: ${match[0]}` });
      }
    }
  }
}

/**
 * The body remap masks PII in values, but a fixture's FILENAME is derived from
 * the recorded request path and can still carry a real UUID (or other PII) even
 * when the body is clean. Scan the basename with the same detectors so a leaked
 * id in the filename cannot slip past a body-only gate.
 */
function scanFilenamePii(file, findings) {
  const name = basename(file);
  for (const { type, pattern } of DETECTORS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(name)) !== null) {
      if (!isMasked(type, match[0])) {
        findings.push({
          kind: "pii",
          file,
          detail: `unmasked ${type} in filename: ${match[0]}`
        });
      }
    }
  }
}

function checkUnit(fixturesDir, findings) {
  const files = jsonFiles(fixturesDir);
  const identities = new Map();

  for (const file of files) {
    scanPii(file, findings);
    scanFilenamePii(file, findings);

    let fixture;
    try {
      fixture = JSON.parse(readFileSync(file, "utf-8"));
    } catch {
      findings.push({ kind: "v3", file, detail: "invalid JSON" });
      continue;
    }

    if (fixture.version !== 3) {
      findings.push({ kind: "v3", file, detail: `version is ${fixture.version ?? "missing"}, expected 3` });
    }

    const req = fixture.request;
    if (req && req.method && req.path) {
      const id = fixtureIdentity(req.method, req.path);
      let key = `${id.method} ${id.path}?${id.params.map(([k, v]) => (v === null ? k : `${k}=${v}`)).join("&")}`;

      // Token endpoints are discriminated by actor_type (mirrors generateFixtureName /
      // generateReadableKey in fixture-naming.mjs). Without this, multiple OAuth
      // captures in the same unit (client, staff, guest) all hash to the same
      // identity and trigger a false-positive [dup].
      const isTokenEndpoint =
        req.path && req.path.includes("/oauth/access_token");
      const actorType =
        fixture.response?.body &&
        typeof fixture.response.body === "object" &&
        isTokenEndpoint
          ? fixture.response.body.actor_type
          : undefined;
      if (actorType) key = `${key} [actor:${actorType}]`;

      if (identities.has(key)) {
        findings.push({
          kind: "dup",
          file,
          detail: `same route+matcher as ${relative(REPO_ROOT, identities.get(key))} (${key})`
        });
      } else {
        identities.set(key, file);
      }
    }
  }
}

function main() {
  const findings = [];

  for (const slug of findJourneySlugs()) {
    const name = basename(slug);
    if (!isValidSlug(name)) {
      findings.push({ kind: "slug", file: slug, detail: `invalid slug "${name}"` });
    }
  }

  const units = findUnitDirs();
  let fixtureCount = 0;
  for (const unit of units) {
    fixtureCount += jsonFiles(unit).length;
    checkUnit(unit, findings);
  }

  if (findings.length > 0) {
    for (const { kind, file, detail } of findings) {
      console.error(`[${kind}] ${relative(process.cwd(), file)}: ${detail}`);
    }
    console.error("\n[lint] FAIL: fixture surface has violations (see above).");
    process.exit(1);
  }

  console.log(
    `[lint] OK: ${fixtureCount} fixture(s) across ${units.length} unit(s) clean.`
  );
  process.exit(0);
}

main();
