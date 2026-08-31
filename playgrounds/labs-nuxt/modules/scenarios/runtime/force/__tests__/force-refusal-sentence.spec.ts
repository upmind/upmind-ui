// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/force-refusal-sentence.spec
 * @description FE-3113 `AC3` · `AC4` — the SENTENCE an armed `error-action`
 * marks a row with (`capabilities.types`, `refusedWrite`; `ListSurface.types`,
 * `forcedRefusal`). A forced state is the state, forced: it renders on arming,
 * so the sentence is chosen before anything is pressed and must still be one the
 * API really said, about the thing that really failed.
 *
 * ## Job To Be Done
 * `presetRefusal` picks which recorded refusal speaks for a refused write. Get
 * it wrong three ways and the page lies quietly: a sentence this repo wrote
 * (the deleted `REFUSED`), a sentence the API said about a failed READ lent to a
 * change nobody made, or the auth refusal the app cannot tell from an expired
 * session and signs the operator out over.
 *
 * The oracle is the committed recordings, read here straight off disk and
 * grouped by `request.method` / `response.status` alone — so this file agrees
 * with `presets.ts` only where both agree with what staging actually returned.
 *
 * ## What Breaks If These Fail
 * A developer arms `error-action`, reads a sentence off the row, and takes it
 * for the API's own refusal when nothing on record ever said it — or the forced
 * preview ends at the signed-out screen instead of the state it was armed for.
 *
 * Negative control OWED, developer lane (a mutant needs the source line):
 * a `presetRefusal` that falls back to the corpus's failing READ when no failing
 * write is recorded must red `never lends a failed read's sentence to a refused
 * write`. Filed as `force-refusal-sentence.read-sentence-lent.must-fail.patch`.
 *
 * @anchor force-state.feature
 * @anchor AC-REF
 * @anchor AC-NA
 */

import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { presetRefusal } from "../presets";
import {
  compact,
  difference,
  filter,
  flatMap,
  fromPairs,
  get,
  includes,
  isEmpty,
  isString,
  map,
  some,
  toUpper,
  uniq,
  values
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

const status = (fixture: RecordedFixture) =>
  get(fixture, ["response", "status"], 0);

const isRefused = (fixture: RecordedFixture) => status(fixture) >= 400;

/**
 * A refusal force may SERVE. A `401` is excluded: the app's auth layer cannot
 * tell a forced one from an expired session and tears the session down.
 */
const isServableRefusal = (fixture: RecordedFixture) =>
  isRefused(fixture) && status(fixture) !== 401;

/** Every sentence a set of recordings carries, wherever the API put it. */
const sentencesOf = (fixtures: RecordedFixture[]) =>
  uniq(
    filter(
      flatMap(fixtures, fixture => [
        get(fixture, ["response", "body", "error", "message"]),
        get(fixture, ["response", "body", "message"])
      ]),
      isString
    )
  );

const CORPORA = map(
  filter(
    map(readdirSync(MODULES_DIR, { withFileTypes: true }), entry => entry.name),
    module => !isEmpty(jsonFiles(fixturesDir(module)))
  ),
  module => {
    const bodies = corpusOf(module);
    const fixtures = values(bodies);
    const refusedWrites = filter(
      fixtures,
      fixture => !isRead(fixture) && isServableRefusal(fixture)
    );

    return {
      module,
      bodies,
      fixtures,
      refusedWrites,
      marked: presetRefusal(bodies)
    };
  }
);

// -----------------------------------------------------------------------------

describe("AC3 the corpus is real — this suite grades against recordings", () => {
  it("swept more than one module, each holding self-describing recordings", () => {
    expect(CORPORA.length).toBeGreaterThan(1);

    for (const { module, fixtures } of CORPORA) {
      expect(fixtures.length, `${module} loaded nothing`).toBeGreaterThan(0);

      for (const fixture of fixtures) {
        expect(
          get(fixture, ["request", "method"]),
          `${module} recording has no request.method`
        ).toBeTypeOf("string");
        expect(
          status(fixture),
          `${module} recording has no response.status`
        ).toBeTypeOf("number");
      }
    }
  });
});

describe("AC3 the mark is the API's own sentence about a refused WRITE", () => {
  it("marks with a sentence one of the module's own refused writes carries", () => {
    const marking = filter(CORPORA, entry => Boolean(entry.marked));

    expect(
      map(marking, "module"),
      "no module marks a forced row — this claim has no subject"
    ).not.toEqual([]);

    for (const { module, marked, refusedWrites } of marking) {
      expect(
        sentencesOf(refusedWrites),
        `${module} marks a forced row with "${marked}", which none of its refused writes ever said`
      ).toContain(marked);
    }
  });

  it("never lends a failed read's sentence to a refused write", () => {
    const readOnlySentences = (entry: (typeof CORPORA)[number]) =>
      difference(
        sentencesOf(
          filter(
            entry.fixtures,
            fixture => isRead(fixture) && isRefused(fixture)
          )
        ),
        sentencesOf(entry.refusedWrites)
      );

    const distinguishable = filter(
      CORPORA,
      entry => !isEmpty(readOnlySentences(entry))
    );

    expect(
      map(distinguishable, "module"),
      "no module records a read refusal wording its writes do not share — this claim has no subject"
    ).not.toEqual([]);

    for (const entry of distinguishable) {
      expect(
        readOnlySentences(entry),
        `${entry.module} marks a refused write with a sentence the API said about a failed READ`
      ).not.toContain(entry.marked);
    }
  });

  it("never marks with the refusal the app signs the operator out on", () => {
    const authRefusals = filter(
      flatMap(CORPORA, "fixtures"),
      fixture => status(fixture) === 401
    );

    expect(
      authRefusals,
      "no corpus records a 401 — this claim has no subject"
    ).not.toEqual([]);

    const signOutSentences = sentencesOf(authRefusals);

    for (const { module, marked } of CORPORA) {
      if (!marked) continue;

      expect(
        includes(signOutSentences, marked),
        `${module} marks a forced row with the auth refusal the app tears the session down on`
      ).toBe(false);
    }
  });
});

describe("AC5 nothing is authored — no recorded refusal, no mark", () => {
  it("marks nothing for a module whose corpus records no servable failing write", () => {
    const silent = filter(CORPORA, entry => isEmpty(entry.refusedWrites));

    expect(
      map(silent, "module"),
      "every module records a servable failing write — this claim has no subject"
    ).not.toEqual([]);

    for (const { module, marked } of silent) {
      expect(
        marked,
        `${module} invented "${marked}" for a refusal it never recorded`
      ).toBeUndefined();
    }
  });

  it("marks nothing at all for a corpus that holds nothing (S12)", () => {
    expect(presetRefusal({})).toBeUndefined();
  });

  it("speaks only in sentences some recording in the tree actually carries", () => {
    const everySentence = sentencesOf(flatMap(CORPORA, "fixtures"));

    expect(
      difference(compact(map(CORPORA, "marked")), everySentence),
      "a forced row would be marked with wording no capture run ever returned"
    ).toEqual([]);
  });

  it("differentiates the modules — one sentence is not served to all", () => {
    expect(
      some(CORPORA, entry => Boolean(entry.marked)),
      "nothing marks at all, so the differentiation below has no subject"
    ).toBe(true);
    expect(uniq(compact(map(CORPORA, "marked"))).length).toBeGreaterThan(1);
  });
});
