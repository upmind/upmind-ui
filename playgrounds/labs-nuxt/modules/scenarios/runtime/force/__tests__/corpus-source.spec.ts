/**
 * @module scenarios/runtime/force/__tests__/corpus-source.spec
 * @description The reach seam's contract (T1.5). The seam is what every
 * consumer imports instead of naming a `headless/testing/*` specifier, so its
 * body is the one thing `ESC6` swaps — and this spec is the oracle that body
 * must satisfy, whichever route the operator rules.
 *
 * The oracle is the COMMITTED corpus, read here by package specifier: eleven
 * scenarios in `client-email.feature` (`K1`), and the ten recordings
 * under `client-email/__tests__/fixtures/`. Nothing is authored — a served
 * body that is not the recording is the defect `S13` names.
 *
 * `ESC6` is RULED (route (a), 2026-08-12), so every case runs unconditionally.
 * A `runIf` on the seam's own resolution would be a self-disabling proof: the
 * one regression that matters — a seam that stops resolving — would silently
 * skip the very cases that catch it, which is how `AC2.6` went unprovable in
 * the first place. The seam's resolution is therefore an ASSERTION here.
 */

import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTraceabilityCheck,
  parseFeatureScenarios
} from "@upmind-automation/scenario-harness";
import {
  corpusBodies,
  featureText,
  isCorpusSourceResolved,
  stepCatalog
} from "../corpus.source";
import {
  CLIENT_EMAIL_TRACK_COUNT,
  CORPUS_FIXTURE_NAMES
} from "../corpus.source.types";
import { every, isEqual, keys, map, sortBy } from "lodash-es";
import type { RecordedFixture } from "../corpus.source.types";

// -----------------------------------------------------------------------------

const HEADLESS_ROOT = dirname(
  createRequire(import.meta.url).resolve(
    "@upmind-automation/headless/package.json"
  )
);

const CLIENT_EMAIL_TESTS_DIR = join(
  HEADLESS_ROOT,
  "src/modules/client-email/__tests__"
);

const FIXTURES_DIR = join(CLIENT_EMAIL_TESTS_DIR, "fixtures");

const committedFeature = (): string =>
  readFileSync(join(CLIENT_EMAIL_TESTS_DIR, "client-email.feature"), "utf-8");

const committedNames = (): string[] =>
  sortBy(
    map(
      readdirSync(FIXTURES_DIR).filter(file => file.endsWith(".json")),
      file => file.replace(/\.json$/, "")
    )
  );

const committedBody = (name: string): RecordedFixture =>
  JSON.parse(readFileSync(resolve(FIXTURES_DIR, `${name}.json`), "utf-8"));

// -----------------------------------------------------------------------------

describe("T1.5 the committed corpus — the oracle a resolved seam must serve", () => {
  it("holds exactly the ten recordings CORPUS_FIXTURE_NAMES declares", () => {
    expect(committedNames()).toStrictEqual(sortBy([...CORPUS_FIXTURE_NAMES]));
  });

  it("carries a self-describing exchange in every recording (AC8.5)", () => {
    const shapes = map(CORPUS_FIXTURE_NAMES, name => {
      const body = committedBody(name);
      return {
        name,
        method: typeof body.request?.method,
        path: typeof body.request?.path,
        status: typeof body.response?.status,
        body: "body" in (body.response ?? {})
      };
    });

    expect(shapes).toStrictEqual(
      map(CORPUS_FIXTURE_NAMES, name => ({
        name,
        method: "string",
        path: "string",
        status: "number",
        body: true
      }))
    );
  });

  // The module's ONE feature holds its not-yet-driveable scenarios too, so what
  // the seam serves is wider than the playlist it yields.
  it("declares MORE scenarios than the playlist plays, and none of them is lost (K1)", () => {
    expect(
      parseFeatureScenarios(committedFeature()).length
    ).toBeGreaterThanOrEqual(CLIENT_EMAIL_TRACK_COUNT);
  });
});

describe("T1.5 the seam's own state is not a claim it can fake", () => {
  it("reports itself resolved exactly when it carries the feature text", () => {
    expect(isCorpusSourceResolved).toBe(featureText.length > 0);
  });

  it("IS resolved — ESC6 ruled route (a), so the seam reaches the corpus", () => {
    expect(isCorpusSourceResolved).toBe(true);
  });
});

describe("T1.5 the resolved seam — the recorded corpus, reached lawfully", () => {
  it("parses the module's whole spec out of featureText, of which the playlist is the driveable subset", () => {
    const scenarios = parseFeatureScenarios(featureText);

    expect(
      createTraceabilityCheck(featureText, stepCatalog, {}).driveable
    ).toHaveLength(CLIENT_EMAIL_TRACK_COUNT);
    expect(map(scenarios, "name")).toStrictEqual(
      map(parseFeatureScenarios(committedFeature()), "name")
    );
  });

  it("carries the committed feature text byte for byte, never a rewrite of it", () => {
    expect(featureText).toBe(committedFeature());
  });

  it("keys its bodies by the ten fixture names, and no others", () => {
    expect(sortBy(keys(corpusBodies()))).toStrictEqual(
      sortBy([...CORPUS_FIXTURE_NAMES])
    );
  });

  it("serves each recording exactly as committed (S13)", () => {
    const served = corpusBodies();
    const drifted = map(CORPUS_FIXTURE_NAMES, name => ({
      name,
      same: isEqual(served[name], committedBody(name))
    })).filter(entry => !entry.same);

    expect(drifted).toStrictEqual([]);
    expect(
      every(CORPUS_FIXTURE_NAMES, name => served[name] !== undefined)
    ).toBe(true);
  });
});
