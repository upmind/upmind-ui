// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/force-answerable-presets.spec
 * @description FE-3113 `AC2`/`AC5` — what force OFFERS, and what it OWES.
 *
 * ## Job To Be Done
 * The offer is a structural measurement of committed evidence (operator ruling,
 * 2026-08-27, revised): a preset is offered when the module's own recordings can
 * ANSWER it. The build before this one hunted English phrases in the `.feature`
 * instead, so three modules whose states all answered correctly derived zero
 * presets and got no force affordance at all. Prose matching is guessing.
 *
 * The `.feature` still governs what a module DOES: a state it declares that the
 * corpus cannot answer is a CAPTURE GAP, named loudly by `captureGaps`, never a
 * silently absent button.
 *
 * Two refinements the browser matrix forced onto that measurement, and this file
 * grades both. The not-authenticated refusal answers no error state: the app
 * cannot tell a served 401 from an expired session, so arming over one ends at
 * the signed-out screen rather than the state it was armed for. And a
 * single-record surface has an EMPTY of its own — the recorded answer for a
 * record that is not there — captured like every other state, never authored as
 * a hollowed body.
 *
 * Both oracles are read off committed files here — the recordings straight off
 * disk, the declarations straight off the `.feature` — so this file agrees with
 * `capabilities.ts` only where both agree with the evidence.
 *
 * ## What Breaks If These Fail
 * Either the picker starves — a module whose every state answers offers nothing,
 * which is the regression this story exists to end — or it over-offers, and a
 * developer arms a state that has no recording to serve it and watches nothing
 * happen. And with the gap report broken, a missing capture reads as "this
 * module does not do that" rather than "nobody recorded it yet".
 *
 * Negative controls: `force-answerable-presets.prose-gate.must-fail.patch`.
 *
 * Negative control OWED, developer lane (a mutant needs the source line): an
 * `answerablePresets` that counts the not-authenticated refusal as an error
 * state's evidence must red `never answers a forced error with the refusal that
 * ends at the signed-out screen`. Filed as
 * `force-answerable-presets.auth-refusal-counted.must-fail.patch`.
 *
 * @anchor force-state.feature
 * @anchor AC2
 * @anchor AC5
 * @anchor S12
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { answerablePresets, captureGaps } from "../capabilities";
import { FORCE_RECIPES } from "../states.types";
import {
  every,
  filter,
  fromPairs,
  get,
  groupBy,
  includes,
  intersection,
  isArray,
  isEmpty,
  map,
  omitBy,
  pickBy,
  some,
  toUpper,
  values
} from "lodash-es";
import type { RecordedFixture } from "../corpus.source.types";
import type { ForceMeasuredRecipe } from "../states.types";

// -----------------------------------------------------------------------------

const MODULES_DIR = join(
  dirname(
    createRequire(import.meta.url).resolve(
      "@upmind-automation/headless/package.json"
    )
  ),
  "src/modules"
);

const featurePath = (module: string) =>
  join(MODULES_DIR, module, "__tests__", `${module}.feature`);

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

const isRefused = (fixture: RecordedFixture) =>
  get(fixture, ["response", "status"], 0) >= 400;

const hasRows = (fixture: RecordedFixture) =>
  isArray(get(fixture, ["response", "body", "data"]));

/**
 * The not-authenticated refusal — the one refusal a forced state may never
 * replay. The app's auth layer cannot tell a served 401 from an expired session,
 * so arming a preset over one ends at the signed-out screen instead of the state
 * it was armed for. A 403 is a different answer: the caller IS authenticated and
 * simply may not read that, which the app survives, so it stays serveable.
 */
const isAuthRefusal = (fixture: RecordedFixture) =>
  get(fixture, ["response", "status"], 0) === 401;

/**
 * A record that is not there — a single-record surface's own empty. The reading
 * is the STATUS's, not the method's: a 404 to a delete says the record was
 * already gone, which is no more a load failure than a 404 to a read is.
 */
const isAbsentRecord = (fixture: RecordedFixture) =>
  get(fixture, ["response", "status"], 0) === 404;

/**
 * A refusal a forced error state may replay. An absent record is excluded: a
 * record that is not there did not fail to load (operator ruling, `tasks.md`
 * §Y2), and counting it would draw one picture under both `empty` and
 * `error-collection` — the conflation this story exists to end.
 */
const isServableRefusal = (fixture: RecordedFixture) =>
  isRefused(fixture) && !isAuthRefusal(fixture) && !isAbsentRecord(fixture);

/**
 * The offer this suite grades against, measured straight off the recordings per
 * design §"The offer": `loading` = any recording; `empty` = a successful GET
 * carrying a `data` array, or the recorded answer for a record that is not
 * there; `error-collection` = a servable recorded refusal; `error-action` = a
 * servable refused NON-GET.
 */
const measured = (fixtures: RecordedFixture[]): ForceMeasuredRecipe[] =>
  filter(FORCE_RECIPES, preset => {
    if (preset === "loading") return !isEmpty(fixtures);
    if (preset === "empty")
      return some(
        fixtures,
        f => isAbsentRecord(f) || (isRead(f) && !isRefused(f) && hasRows(f))
      );
    if (preset === "error-action")
      return some(fixtures, f => !isRead(f) && isServableRefusal(f));
    return some(fixtures, isServableRefusal);
  });

/** Every module that keeps recordings — discovery is the layout, not a list. */
const RECORDED = map(
  filter(
    map(readdirSync(MODULES_DIR, { withFileTypes: true }), entry => entry.name),
    module => !isEmpty(jsonFiles(fixturesDir(module)))
  ),
  module => {
    const bodies = corpusOf(module);
    const fixtures = values(bodies);

    return {
      module,
      bodies,
      fixtures,
      feature: existsSync(featurePath(module))
        ? readFileSync(featurePath(module), "utf-8")
        : "",
      expected: measured(fixtures),
      offered: answerablePresets(bodies)
    };
  }
);

const named = (module: string) => {
  const entry = RECORDED.find(candidate => candidate.module === module);
  if (!entry) throw new Error(`${module} keeps no recordings to grade`);
  return entry;
};

const gapsOf = (entry: (typeof RECORDED)[number]) => [
  ...captureGaps(entry.feature, entry.bodies)
];

/**
 * Whether a feature DECLARES a refusal, read off the scenario tag that carries
 * it. The prose this story deleted is not re-hunted here: a tag is structure.
 */
const declaresRefusal = (feature: string) => includes(feature, "@guard");

const hasWrite = (fixtures: RecordedFixture[]) =>
  some(fixtures, fixture => !isRead(fixture));

/**
 * A module's own recordings with its SERVABLE refusals dropped — the corpus
 * exactly as it stood before the capture that closed its error gap. An absent
 * record (404) and an auth refusal (401) answer no error state, so dropping them
 * would strip the 404 a single-record surface's `empty` rides on and gap a state
 * the module still answers. Nothing is authored: every surviving entry is a
 * committed recording.
 */
const beforeItsCapture = (bodies: Record<string, RecordedFixture>) =>
  omitBy(bodies, isServableRefusal);

const inVocabulary = (presets: ForceMeasuredRecipe[]) =>
  filter(FORCE_RECIPES, preset => includes(presets, preset));

// -----------------------------------------------------------------------------

describe("AC2 the corpus is real — this suite grades against committed evidence", () => {
  it("found recordings for more than one module, each self-describing", () => {
    expect(RECORDED.length).toBeGreaterThan(1);

    for (const { module, fixtures } of RECORDED) {
      expect(fixtures.length, `${module} loaded nothing`).toBeGreaterThan(0);

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

  it("read a non-empty feature for both modules the ruling names", () => {
    expect(named("client-email").feature.length).toBeGreaterThan(0);
    expect(named("client-email-history").feature.length).toBeGreaterThan(0);
  });
});

describe("AC2 the offer is measured from recordings, never read out of prose", () => {
  it("offers exactly what each module's own recordings can answer", () => {
    for (const { module, offered, expected } of RECORDED) {
      expect(
        [...offered],
        `${module} offers a set its recordings do not evidence`
      ).toEqual(expected);
    }
  });

  it("leaves no module with recordings offering nothing at all", () => {
    for (const { module, offered } of RECORDED) {
      expect(
        [...offered],
        `${module} keeps recordings and offers no state to force`
      ).not.toEqual([]);
    }
  });

  it("offers the same set to every module holding the same evidence, whatever its feature says", () => {
    const byEvidence = groupBy(RECORDED, entry => entry.expected.join(","));

    for (const group of values(byEvidence)) {
      const sets = map(group, entry => [...entry.offered].join(","));

      expect(
        new Set(sets).size,
        `${map(group, "module").join(" and ")} hold the same evidence and were offered different sets`
      ).toBe(1);
    }

    // Falsifiable only while two modules actually share an evidence tuple —
    // otherwise every group is a singleton and the claim asserts nothing.
    expect(some(values(byEvidence), group => group.length > 1)).toBe(true);
  });

  it("client-email answers all four, so it offers all four", () => {
    expect([...named("client-email").offered]).toEqual([...FORCE_RECIPES]);
  });

  it("client-personal-details holds no collection, so its empty is the record that is not there", () => {
    const entry = named("client-personal-details");

    expect(filter(entry.fixtures, f => isRead(f) && hasRows(f))).toEqual([]);
    expect(
      filter(entry.fixtures, isAbsentRecord),
      "the no-such-record read is not on file — a single-record empty has nothing to serve"
    ).not.toEqual([]);
    expect([...entry.offered]).toContain("empty");
    expect([...entry.offered]).toContain("loading");
  });

  it("never offers a failed read off a record that is merely not there", () => {
    const absentOnly = filter(
      RECORDED,
      entry =>
        some(entry.fixtures, isAbsentRecord) &&
        !some(entry.fixtures, isServableRefusal)
    );

    expect(
      map(absentOnly, "module"),
      "no module keeps an absent-record read as its only 4xx — the ruling is unexercised"
    ).not.toEqual([]);

    for (const entry of absentOnly) {
      expect(
        [...entry.offered],
        `${entry.module} offers error-collection off its absent record — empty and the failed read would draw one picture`
      ).not.toContain("error-collection");
      expect([...entry.offered]).toContain("empty");
    }
  });

  it("restores the modules prose-matching starved — each offers what it can answer", () => {
    for (const module of [
      "client-address",
      "client-custom-fields",
      "client-personal-details"
    ]) {
      const entry = named(module);

      expect(
        [...entry.offered],
        `${module} answers its states and still offers nothing`
      ).toEqual(entry.expected);
      expect([...entry.offered].length).toBeGreaterThan(0);
    }
  });

  it("filters the master vocabulary rather than re-spelling it", () => {
    for (const { module, offered } of RECORDED) {
      expect(
        [...offered],
        `${module} re-ordered or renamed the vocabulary`
      ).toEqual(filter(FORCE_RECIPES, preset => offered.includes(preset)));
    }
  });

  it("offers nothing at all for a corpus that holds nothing (S12)", () => {
    expect([...answerablePresets({})]).toEqual([]);
  });

  it("never answers a forced error with the refusal that ends at the signed-out screen", () => {
    const carriers = filter(
      RECORDED,
      entry => !isEmpty(pickBy(entry.bodies, isAuthRefusal))
    );

    expect(
      map(carriers, "module"),
      "no module in the tree records a not-authenticated refusal — this claim has no subject"
    ).not.toEqual([]);

    for (const entry of carriers) {
      expect(
        [...answerablePresets(pickBy(entry.bodies, isAuthRefusal))],
        `${entry.module} answers a forced error with the 401 the app reads as an expired session`
      ).toEqual(["loading"]);
    }

    const authOnly = filter(RECORDED, entry => {
      const refusals = filter(entry.fixtures, isRefused);
      return !isEmpty(refusals) && every(refusals, isAuthRefusal);
    });

    for (const entry of authOnly) {
      expect(
        [...entry.offered],
        `${entry.module} keeps only a not-authenticated refusal and still offers an error state`
      ).not.toContain("error-collection");
    }
  });
});

describe("AC5 a declared state the corpus cannot answer is NAMED, never dropped", () => {
  it("never reports a gap for something the corpus can already answer", () => {
    for (const entry of RECORDED) {
      expect(
        intersection(gapsOf(entry), [...entry.offered]),
        `${entry.module} reported a gap for a state it already answers`
      ).toEqual([]);
    }
  });

  it("never reports a gap outside the master vocabulary", () => {
    for (const entry of RECORDED) {
      for (const gap of gapsOf(entry)) {
        expect(
          FORCE_RECIPES,
          `${entry.module} reported ${gap}, which is not a forcible state`
        ).toContain(gap);
      }
    }
  });

  it("closes client-email-history's gap at the source — its declared refusal is on record", () => {
    const entry = named("client-email-history");

    expect(declaresRefusal(entry.feature)).toBe(true);
    expect(
      filter(entry.fixtures, isRefused),
      "the refusal its feature declares has no recording — the capture is owed, not closed"
    ).not.toEqual([]);
    expect([...entry.offered]).toContain("error-collection");
    expect(gapsOf(entry)).toEqual([]);
  });

  it("reports no gap for client-email, whose corpus answers what it declares", () => {
    expect(gapsOf(named("client-email"))).toEqual([]);
  });

  /**
   * `client-notes` is the one open capture: its feature declares a refusal and
   * its only recorded 4xx is a 404 on a delete — an ABSENCE, which is no more a
   * load failure than a 404 to a read is. Both error states are owed a capture,
   * and this gate names them rather than letting the buttons quietly vanish.
   */
  const OWED: Record<string, ForceMeasuredRecipe[]> = {
    "client-notes": ["error-collection", "error-action"],
    // Its feature declares a refusal (@guard) and it records a servable refused
    // WRITE, but a servable refused READ is the fault staging will not return on
    // demand — so error-collection stays an owed capture, named not dropped.
    "client-notifications": ["error-collection"],
    // Same as client-notes: its feature declares a @guard refusal but its only
    // recordable fault is the auth 401 (unservable), so a servable refused read
    // stays an owed capture staging will not return on demand.
    "client-phone": ["error-collection"],
    // A single-record client-owned read: its feature declares a @guard refusal
    // but its corpus holds only a 200 read and a 404 absent-record. A servable
    // refused read of a client's own details is the fault staging will not return
    // on demand, so error-collection stays an owed capture, named not dropped.
    "client-personal-details": ["error-collection"],
    // FE-3229, design DA59: isEmpty's TRUE state needs every stat's report
    // key absent at once; no recorded fixture omits the tickets `open` key
    // (design 8.3), so no capture can answer it. The limit is on the proof,
    // not the member. Tracked: FE-3229 stats.negative-controls.md
    // Part 12, docs/sdd/FE-3229-client-stats/parity.yaml.
    stats: ["empty"]
  };

  it("owes a capture only where one is on record as owed", () => {
    for (const entry of RECORDED) {
      expect(
        [...gapsOf(entry)].sort(),
        `${entry.module} declares a state no recording of its own answers — run its capture`
      ).toEqual([...(OWED[entry.module] ?? [])].sort());
    }
  });

  it("names the gap the moment a declared refusal has nothing recorded behind it", () => {
    const declaring = filter(RECORDED, entry => declaresRefusal(entry.feature));

    expect(
      map(declaring, "module"),
      "no feature in the tree declares a refusal — this claim has no subject"
    ).not.toEqual([]);

    for (const entry of declaring) {
      const unrecorded = beforeItsCapture(entry.bodies);

      expect(
        filter(values(unrecorded), isServableRefusal),
        `${entry.module} kept a servable refusal the strip should have dropped`
      ).toEqual([]);
      expect(
        [...answerablePresets(unrecorded)],
        `${entry.module} offers a refusal it has no recording to serve`
      ).not.toContain("error-collection");
      expect(
        [...captureGaps(entry.feature, unrecorded)],
        `${entry.module} drops the refusal its feature declares silently, as a missing button`
      ).toEqual(
        inVocabulary(
          hasWrite(values(unrecorded))
            ? ["error-action", "error-collection"]
            : ["error-collection"]
        )
      );
    }
  });

  it("bills only a feature that DECLARES the refusal, never one that merely exists", () => {
    const silent = filter(
      RECORDED,
      entry => !isEmpty(entry.feature) && !declaresRefusal(entry.feature)
    );

    expect(
      map(silent, "module"),
      "every feature in the tree declares a refusal — this claim has no subject"
    ).not.toEqual([]);

    for (const entry of silent) {
      expect(
        intersection(
          [...captureGaps(entry.feature, beforeItsCapture(entry.bodies))],
          ["error-action", "error-collection"]
        ),
        `${entry.module} is billed for an errored state its feature never declares`
      ).toEqual([]);
    }
  });

  it("owes nothing where there is no force affordance at all (S12)", () => {
    const entry = named("client-email");

    expect([...captureGaps(entry.feature, {})]).toEqual([]);
    expect([...captureGaps("", entry.bodies)]).toEqual([]);
  });
});
