// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/force-presets.spec
 * @description What each forced preset ANSWERS, over the one committed corpus
 * (`AC8.5` · `S13` · `R6-19`). The oracle is the recording itself, read here off
 * the committed files: an answer is a recorded response, the same recording with
 * its rows subtracted, or no answer at all — never a body written in this repo.
 *
 * `R6-19`'s ruling is the shape of the third block: the two failures are
 * DIFFERENT states. `error-action` keeps the collection intact and refuses the
 * row's write with the recorded 409 and its own sentence; `error-collection`
 * fails the READ and says nothing, because the sentence on record answers a
 * set-default and lending it to a collection read is the conflation the ruling
 * named.
 *
 * ## What Breaks If These Fail
 * A forced error takes the rows away with it — the operator's own report that
 * "the data vanished" — or an error preset starts speaking a sentence the API
 * never said about the thing that failed.
 *
 * Negative controls: `force-presets.conflated-error.must-fail.patch`,
 * `force-presets.error-status.must-fail.patch`,
 * `force-presets.invented-empty.must-fail.patch`.
 */

import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { corpusBodies } from "../corpus.source";
import { PENDING, presetAnswer } from "../presets";
import {
  difference,
  filter,
  flatMap,
  get,
  isArray,
  map,
  uniq
} from "lodash-es";
import type { CorpusBodies, RecordedFixture } from "../corpus.source.types";

// -----------------------------------------------------------------------------

const FIXTURES_DIR = join(
  dirname(
    createRequire(import.meta.url).resolve(
      "@upmind-automation/headless/package.json"
    )
  ),
  "src/modules/client-email/__tests__/fixtures"
);

const committed = (name: string): RecordedFixture =>
  JSON.parse(readFileSync(resolve(FIXTURES_DIR, `${name}.json`), "utf-8"));

/** The one recording that FAILED — staging's own 409, with the sentence it gave. */
const FAILURE = committed(
  "put-clients-id-emails-id-case-set-default-unverified"
).response;

/**
 * Every record id staging ever returned for this module, read off the committed
 * files. The resolver decides which recordings make up a collection read — that
 * is `corpus-source.spec.ts`'s claim, not this one — so what is asserted here is
 * only that a preset serves RECORDED records and never an authored one.
 */
const RECORDED_IDS = uniq(
  flatMap(
    filter(readdirSync(FIXTURES_DIR), file => file.endsWith(".json")),
    file => {
      const data = get(committed(file.replace(/\.json$/, "")), [
        "response",
        "body",
        "data"
      ]);
      return map(isArray(data) ? data : [data], record => get(record, "id"));
    }
  )
);

const bodies: CorpusBodies = corpusBodies();

const BASE = "https://api.upmind.io/api/clients/CLIENT_ID/emails";

const read = (search = "") => ["GET", new URL(`${BASE}${search}`)] as const;
const write = () =>
  ["PUT", new URL(`${BASE}/20e43579-5e78-d184-430c-31643202d986`)] as const;

const answer = (preset: string, [method, url]: readonly [string, URL]) =>
  presetAnswer(preset as never, bodies, method, url);

const rowsIn = (response: unknown) => {
  const data = get(response, ["body", "data"]);
  return isArray(data) ? data : undefined;
};

// -----------------------------------------------------------------------------

describe("AC8.5 every preset answers over the RECORDED corpus", () => {
  it("serves recorded records where no preset is armed — nothing authored", () => {
    const served = rowsIn(answer("replay", read())) ?? [];

    expect(served.length).toBeGreaterThan(0);
    expect(difference(map(served, "id"), RECORDED_IDS)).toEqual([]);
  });

  it("answers nothing at all for a path this module does not own (AC8.3)", () => {
    const foreign = new URL("https://api.upmind.io/api/clients/CLIENT_ID");

    for (const preset of [
      "empty",
      "loading",
      "error-action",
      "error-collection"
    ]) {
      expect(answer(preset, ["GET", foreign])).toBeUndefined();
    }
  });

  it("withholds any answer under loading — none, and none is coming", () => {
    expect(answer("loading", read())).toBe(PENDING);
    expect(answer("loading", write())).toBe(PENDING);
  });
});

describe("S13 empty is the recording with its ROWS removed, never an invented body", () => {
  it("keeps the recorded envelope and empties only its data", () => {
    const empty = answer("empty", read());

    const served = answer("replay", read());

    expect(rowsIn(served)?.length).toBeGreaterThan(0);
    expect(rowsIn(empty)).toEqual([]);
    expect(get(empty, "status")).toEqual(get(served, "status"));
    expect(map(get(empty, "body"), () => true).length).toEqual(
      map(get(served, "body"), () => true).length
    );
  });

  it("serves a member recording — which has no rows to remove — exactly as recorded", () => {
    expect(answer("empty", write())).toEqual(answer("replay", write()));
  });

  it("still narrows a filtered read, so the preset changes the answer and not the corpus", () => {
    expect(rowsIn(answer("empty", read("?limit=1")))).toEqual([]);
  });
});

describe("R6-19 the two failures are DIFFERENT states, both offered", () => {
  it("leaves the collection intact under error-action — the list keeps its rows", () => {
    expect(answer("error-action", read())).toEqual(answer("replay", read()));
    expect(rowsIn(answer("error-action", read()))?.length).toBeGreaterThan(0);
  });

  it("refuses the ROW's write under error-action, with the API's own sentence", () => {
    const refused = answer("error-action", write());

    expect(refused).toEqual(FAILURE);
    expect(get(refused, ["body", "error", "message"])).toBe(
      get(FAILURE, ["body", "error", "message"])
    );
  });

  it("fails the READ under error-collection, at the recorded status", () => {
    const failed = answer("error-collection", read());

    expect(get(failed, "status")).toBe(get(FAILURE, "status"));
    expect(get(failed, "status")).not.toBe(
      get(answer("replay", read()), "status")
    );
  });

  it("says nothing on that failed read — the recorded sentence answers a set-default", () => {
    expect(get(answer("error-collection", read()), "body")).toBeUndefined();
  });

  it("leaves the WRITE as recorded under error-collection — only the read failed", () => {
    expect(answer("error-collection", write())).toEqual(
      answer("replay", write())
    );
  });

  it("never conflates the two — each aims at the half it is named for", () => {
    expect(answer("error-action", read())).not.toEqual(
      answer("error-collection", read())
    );
    expect(answer("error-action", write())).not.toEqual(
      answer("error-collection", write())
    );
  });
});
