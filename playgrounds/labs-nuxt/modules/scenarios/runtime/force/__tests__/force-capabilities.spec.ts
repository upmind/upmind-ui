// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/force-capabilities.spec
 * @description FE-3113 `AC5` — what a module's OWN corpus can honestly answer,
 * measured. The oracle is the committed recordings, read here off the real
 * files: `corpusCapabilities` reports EVIDENCE — what staging actually returned
 * — never a list anybody keeps.
 *
 * This file does NOT grade what force OFFERS — `force-answerable-presets.spec`
 * proves that, and the gap report beside it. Here a false capability is what
 * makes a missing recording reportable rather than a button quietly withdrawn.
 *
 * The expectation is derived independently, straight off `request.method` and
 * `response.status`, so this file agrees with `capabilities.ts` only where both
 * agree with the corpus — an assertion mirroring the derivation would pass on
 * any derivation at all.
 *
 * ## What Breaks If These Fail
 * The gap report goes wrong at its source. A capability claimed true with no
 * recording behind it means a declared preset is reported answerable and arms
 * into nothing — the dead-alive control `S14` forbids. Claimed false with a
 * recording present means a real capture is written off as debt, and the module
 * loses a state it can actually serve.
 *
 * Negative controls: `force-capabilities.refusal-assumed.must-fail.patch`.
 *
 * @anchor force-state.feature
 * @anchor AC5
 * @anchor AC-NA
 * @anchor R6-19
 * @anchor S12
 */

import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { corpusCapabilities } from "../capabilities";
import {
  filter,
  fromPairs,
  get,
  isArray,
  isEmpty,
  map,
  some,
  toUpper
} from "lodash-es";
import type { RecordedFixture } from "../corpus.source.types";

// -----------------------------------------------------------------------------

const MODULES_DIR = join(
  dirname(
    createRequire(import.meta.url).resolve(
      "@upmind-automation/headless/package.json"
    )
  ),
  "src/modules"
);

const fixturesDir = (module: string) =>
  join(MODULES_DIR, module, "__tests__/fixtures");

const jsonFiles = (dir: string) => {
  try {
    return filter(readdirSync(dir), file => file.endsWith(".json"));
  } catch {
    return [];
  }
};

/** Every module that actually keeps recordings — discovery is the layout. */
const RECORDED_MODULES = filter(
  readdirSync(MODULES_DIR, { withFileTypes: true }),
  entry => entry.isDirectory() && !isEmpty(jsonFiles(fixturesDir(entry.name)))
).map(entry => entry.name);

const corpusOf = (module: string): Record<string, RecordedFixture> =>
  fromPairs(
    map(jsonFiles(fixturesDir(module)), file => [
      file.replace(/\.json$/, ""),
      JSON.parse(
        readFileSync(resolve(fixturesDir(module), file), "utf-8")
      ) as RecordedFixture
    ])
  );

const isRead = (fixture: RecordedFixture) =>
  toUpper(get(fixture, ["request", "method"], "")) === "GET";

const isRefused = (fixture: RecordedFixture) =>
  get(fixture, ["response", "status"], 0) >= 400;

const hasRows = (fixture: RecordedFixture) =>
  isArray(get(fixture, ["response", "body", "data"]));

/**
 * A recorded read of a record that is not there — the `404` staging answers for
 * an id it does not hold. A single-record surface has an empty state too, and
 * this recording is the only honest answer for it.
 */
// The absence reading is the STATUS's, not the method's: a 404 to a delete says
// the record was already gone, which is no more a load failure than a 404 to a
// read is.
const isAbsentRecord = (fixture: RecordedFixture) =>
  get(fixture, ["response", "status"], 0) === 404;

/**
 * A not-authenticated refusal. The app cannot tell a forced `401` from a real
 * expired session, so serving one tears the session down — a forced state is a
 * picture of a state and may never have that consequence. It stays on record
 * for the guard scenario its feature declares; it just never answers a preset.
 */
const isAuthRefusal = (fixture: RecordedFixture) =>
  get(fixture, ["response", "status"], 0) === 401;

/**
 * A refusal a forced error state may replay. An absent record is excluded: a
 * record that is not there did not fail to load (operator ruling, `tasks.md`
 * §Y2), and counting it would draw one picture under both `empty` and
 * `error-collection` — the conflation this story exists to end.
 */
const isServableRefusal = (fixture: RecordedFixture) =>
  isRefused(fixture) && !isAuthRefusal(fixture) && !isAbsentRecord(fixture);

const canEmptyOf = (fixtures: RecordedFixture[]) =>
  some(
    fixtures,
    f =>
      (isRead(f) && !isRefused(f) && hasRows(f)) ||
      (isRead(f) && isAbsentRecord(f))
  );

/**
 * What EVIDENCE the recordings themselves hold, computed from the quartet
 * alone. This is the oracle the derivation is graded against.
 *
 * `canEmpty` is answerable two ways because "nothing here" reads differently on
 * a list and on a record: rows a collection read can withhold, or a recorded
 * absent-record read. Neither is authored.
 *
 * `canErrorCollection` is a RECORDED REFUSAL, per `capabilities.types` — a
 * corpus of nothing but 200s cannot serve a failed read, and saying so is what
 * makes the gap reportable. Nothing is authored to fake one.
 */
const measured = (fixtures: RecordedFixture[]) => ({
  canEmpty: canEmptyOf(fixtures),
  canLoading: !isEmpty(fixtures),
  canErrorAction: some(fixtures, f => !isRead(f) && isServableRefusal(f)),
  canErrorCollection: some(fixtures, isServableRefusal)
});

const CORPORA = map(RECORDED_MODULES, module => {
  const bodies = corpusOf(module);

  return {
    module,
    bodies,
    fixtures: Object.values(bodies),
    caps: corpusCapabilities(bodies)
  };
});

// -----------------------------------------------------------------------------

describe("AC5 the corpus is real — this suite grades against recordings", () => {
  it("found committed recordings for the modules under test", () => {
    expect(RECORDED_MODULES.length).toBeGreaterThan(1);
    expect(some(CORPORA, entry => isEmpty(entry.fixtures))).toBe(false);
  });

  it("every recording is self-describing, so the measurement is possible", () => {
    for (const { module, fixtures } of CORPORA) {
      for (const fixture of fixtures) {
        expect(
          get(fixture, ["request", "method"]),
          `${module} recording has no request.method`
        ).toBeTypeOf("string");
        expect(
          get(fixture, ["response", "status"]),
          `${module} recording has no response.status`
        ).toBeTypeOf("number");
      }
    }
  });
});

describe("AC5 a capability is TRUE only when a recording backs it", () => {
  it("reports exactly what each module's own recordings measure", () => {
    for (const { module, fixtures, caps } of CORPORA) {
      const truth = measured(fixtures);

      expect(
        {
          canEmpty: caps.canEmpty,
          canLoading: caps.canLoading,
          canErrorAction: caps.canErrorAction,
          canErrorCollection: caps.canErrorCollection
        },
        `${module} reports capabilities its recordings do not measure`
      ).toEqual(truth);
    }
  });

  it("never claims canErrorAction without a recorded FAILING WRITE", () => {
    for (const { module, fixtures, caps } of CORPORA) {
      if (!caps.canErrorAction) continue;

      expect(
        some(fixtures, f => !isRead(f) && isServableRefusal(f)),
        `${module} claims canErrorAction with no failing write on record`
      ).toBe(true);
    }
  });

  it("never claims canErrorCollection without a recorded REFUSAL", () => {
    for (const { module, fixtures, caps } of CORPORA) {
      if (!caps.canErrorCollection) continue;

      expect(
        some(fixtures, isServableRefusal),
        `${module} claims canErrorCollection with no refusal on record`
      ).toBe(true);
    }
  });

  it("never reads a record that is not there as a record that failed to load", () => {
    const absentOnly = filter(
      CORPORA,
      entry =>
        some(entry.fixtures, isAbsentRecord) &&
        !some(entry.fixtures, isServableRefusal)
    );

    expect(
      map(absentOnly, "module"),
      "no module keeps an absent-record read as its only 4xx — the ruling is unexercised"
    ).not.toEqual([]);

    for (const { module, caps } of absentOnly) {
      expect(
        caps.canErrorCollection,
        `${module} reads its absent record as a failed load — empty and error-collection would draw one picture`
      ).toBe(false);
      expect(
        caps.canEmpty,
        `${module} holds the recorded answer for a missing record and still cannot serve empty`
      ).toBe(true);
      expect(caps.failure).toBeUndefined();
    }
  });

  it("never carries a not-authenticated refusal as the failure it serves", () => {
    const holdsAuthRefusal = filter(CORPORA, entry =>
      some(entry.fixtures, isAuthRefusal)
    );

    expect(
      map(holdsAuthRefusal, "module"),
      "no module records a 401 — the sign-out guard is unexercised"
    ).not.toEqual([]);

    for (const { module, caps } of holdsAuthRefusal) {
      if (!caps.failure) continue;

      expect(
        isAuthRefusal(caps.failure),
        `${module} would answer a forced error with its 401 and sign the operator out`
      ).toBe(false);
    }
  });

  it("cannot serve error-action when its only failing write is a 401", () => {
    const authWriteOnly = filter(
      CORPORA,
      entry =>
        some(entry.fixtures, f => !isRead(f) && isAuthRefusal(f)) &&
        !some(
          entry.fixtures,
          f => !isRead(f) && isRefused(f) && !isAuthRefusal(f)
        )
    );

    expect(
      map(authWriteOnly, "module"),
      "no module records a 401 as its only failing write — this branch is unexercised"
    ).not.toEqual([]);

    for (const { module, caps } of authWriteOnly) {
      expect(
        caps.canErrorAction,
        `${module} offers error-action off a 401 write — arming it signs the operator out`
      ).toBe(false);
    }
  });

  it("never claims canEmpty without rows to withhold or an absent record on file", () => {
    for (const { module, fixtures, caps } of CORPORA) {
      if (!caps.canEmpty) continue;

      expect(
        canEmptyOf(fixtures),
        `${module} claims canEmpty with neither rows to remove nor a recorded absent record`
      ).toBe(true);
    }
  });

  it("reads a single-record module's empty off its recorded absent record", () => {
    const singles = filter(
      CORPORA,
      entry =>
        !some(entry.fixtures, f => isRead(f) && !isRefused(f) && hasRows(f)) &&
        entry.caps.canEmpty
    );

    expect(
      map(singles, "module"),
      "no module reaches canEmpty without a collection — the absent-record branch is unexercised"
    ).not.toEqual([]);

    for (const { module, fixtures } of singles) {
      expect(
        some(fixtures, isAbsentRecord),
        `${module} claims canEmpty with no collection AND no recorded absent record`
      ).toBe(true);
    }
  });

  it("carries the module's OWN failing recording as the failure", () => {
    for (const { module, fixtures, caps } of CORPORA) {
      if (!caps.canErrorCollection) {
        expect(
          caps.failure,
          `${module} named a failure it cannot serve`
        ).toBeUndefined();
        continue;
      }

      expect(
        fixtures,
        `${module} carried a failure that is not one of its recordings`
      ).toContainEqual(caps.failure);
      expect(isRefused(caps.failure!)).toBe(true);
      expect(
        isAuthRefusal(caps.failure!),
        `${module} carries a 401 as its failure — arming it signs the operator out`
      ).toBe(false);
      expect(
        isAbsentRecord(caps.failure!),
        `${module} carries its absent record as the failure it serves`
      ).toBe(false);
    }
  });
});

describe("AC5 the modules the ticket named, measured rather than assumed", () => {
  const capsFor = (module: string) =>
    get(
      CORPORA.find(entry => entry.module === module),
      "caps"
    );

  it("client-email-history records a refusal but no write, so it serves the failed READ alone", () => {
    const caps = capsFor("client-email-history");

    expect(caps).toBeDefined();
    expect(caps!.canEmpty).toBe(true);
    expect(caps!.canLoading).toBe(true);
    expect(caps!.canErrorCollection).toBe(true);
    expect(caps!.canErrorAction).toBe(false);
  });

  it("client-email records a failing write, so it can serve both error states", () => {
    const caps = capsFor("client-email");

    expect(caps).toBeDefined();
    expect(caps!.canEmpty).toBe(true);
    expect(caps!.canLoading).toBe(true);
    expect(caps!.canErrorAction).toBe(true);
    expect(caps!.canErrorCollection).toBe(true);
  });

  it("a module with writes but NO failing write cannot serve error-action", () => {
    const writesOnly = filter(
      CORPORA,
      entry =>
        some(entry.fixtures, f => !isRead(f)) &&
        !some(entry.fixtures, f => isRefused(f) && !isRead(f))
    );

    expect(writesOnly.length).toBeGreaterThan(0);

    for (const { module, caps } of writesOnly) {
      expect(
        caps.canErrorAction,
        `${module} invented an error-action from a succeeding write`
      ).toBe(false);
    }
  });

  it("differentiates the modules — not every corpus holds the same evidence", () => {
    const sets = map(CORPORA, entry =>
      [
        entry.caps.canEmpty,
        entry.caps.canLoading,
        entry.caps.canErrorAction,
        entry.caps.canErrorCollection
      ].join(",")
    );

    expect(new Set(sets).size).toBeGreaterThan(1);
  });
});

describe("S12 a corpus that holds nothing can answer nothing", () => {
  it("reports every capability false for an empty corpus", () => {
    const caps = corpusCapabilities({});

    expect(caps.canEmpty).toBe(false);
    expect(caps.canLoading).toBe(false);
    expect(caps.canErrorAction).toBe(false);
    expect(caps.canErrorCollection).toBe(false);
    expect(caps.failure).toBeUndefined();
  });
});
