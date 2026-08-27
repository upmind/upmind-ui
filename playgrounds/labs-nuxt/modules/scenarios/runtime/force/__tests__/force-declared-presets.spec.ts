// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/force-declared-presets.spec
 * @description FE-3113 `AC2`/`AC5` — the module's committed `.feature` is the
 * source of truth for which presets force offers (operator ruling, 2026-08-27).
 * It declares the scenarios; the recordings are evidence serving them. A preset
 * the feature declares but the corpus cannot answer is a CAPTURE GAP, named
 * loudly, never a silently absent button.
 *
 * The expectation is read off the committed `.feature` files themselves, not off
 * a list kept here and not off the derivation under test, so this file agrees
 * with `capabilities.ts` only where both agree with the spec.
 *
 * ## Job To Be Done
 * Pin the direction of authority. Design §"The source of truth" inverted an
 * earlier draft in which recordings decided the offer; this suite is what stops
 * that inversion silently reverting.
 *
 * ## What Breaks If These Fail
 * The corpus becomes authoritative again. A capture that never happened silently
 * removes a button, and the module's spec is overruled by whatever happens to be
 * on disk. A developer then reads an absent `error-collection` as "this module
 * does not do that", when the feature plainly declares it does and only the
 * evidence is missing.
 *
 * Negative controls: `force-declared-presets.corpus-authoritative.must-fail.patch`,
 * `force-declared-presets.silent-gap.must-fail.patch`.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { FORCE_URL_PRESETS } from "../../composables/useForcedState.types";
import { captureGaps, declaredPresets } from "../capabilities";
import { filter, fromPairs, map } from "lodash-es";
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
        readFileSync(join(fixturesDir(module), file), "utf-8")
      ) as RecordedFixture
    ])
  );

const FEATURED_MODULES = filter(
  map(readdirSync(MODULES_DIR, { withFileTypes: true }), entry => entry.name),
  module => existsSync(featurePath(module))
);

/**
 * What the SPEC says, read straight off its own prose — the oracle the
 * derivation is graded against. Design's table: a feature declaring "loading,
 * empty, or errored" earns the three read states; one naming a rejected
 * MUTATION additionally earns `error-action`; one naming a refused READ alone
 * does not.
 */
const spec = (feature: string) => {
  if (!/loading,\s*empty,\s*or\s*errored/i.test(feature)) return [];

  const declaresMutation = /forced\s+read\s+or\s+mutation/i.test(feature);

  return filter(FORCE_URL_PRESETS, preset =>
    preset === "error-action" ? declaresMutation : true
  );
};

const FEATURED = map(FEATURED_MODULES, module => {
  const feature = readFileSync(featurePath(module), "utf-8");

  return {
    module,
    feature,
    bodies: corpusOf(module),
    expected: spec(feature),
    declared: declaredPresets(feature)
  };
});

const named = (module: string) =>
  FEATURED.find(entry => entry.module === module);

// -----------------------------------------------------------------------------

describe("AC2 the oracle is real — this suite grades against committed features", () => {
  it("found committed features for more than one module", () => {
    expect(FEATURED_MODULES.length).toBeGreaterThan(1);
  });

  it("read a non-empty feature for every module under test", () => {
    for (const { module, feature } of FEATURED) {
      expect(feature.length, `${module}'s feature is empty`).toBeGreaterThan(0);
    }
  });

  it("carries both modules the ruling names", () => {
    expect(named("client-email")).toBeDefined();
    expect(named("client-email-history")).toBeDefined();
  });
});

describe("AC2 presets are read from the .feature, not from the recordings", () => {
  it("offers exactly what each module's own feature declares", () => {
    for (const { module, expected, declared } of FEATURED) {
      expect(
        [...declared],
        `${module} offers a set its feature does not declare`
      ).toEqual(expected);
    }
  });

  it("client-email-history declares a refused READ, so it gets no error-action", () => {
    const entry = named("client-email-history")!;

    expect([...entry.declared]).toEqual([
      "empty",
      "loading",
      "error-collection"
    ]);
  });

  it("client-email declares a rejected MUTATION, so it gets all four", () => {
    const entry = named("client-email")!;

    expect([...entry.declared]).toEqual([...FORCE_URL_PRESETS]);
  });

  it("keeps error-collection for a module whose corpus holds no failure", () => {
    const entry = named("client-email-history")!;
    const failing = filter(
      Object.values(entry.bodies),
      fixture => fixture.response.status >= 400
    );

    // The premise of the ruling: 15 recordings, not one a refusal. The preset
    // survives anyway, because the feature declares the errored state.
    expect(failing).toEqual([]);
    expect([...entry.declared]).toContain("error-collection");
  });

  it("declares nothing for a feature stating no forced states at all", () => {
    expect([...declaredPresets("Feature: nothing forced here")]).toEqual([]);
  });

  it("declares nothing for an empty feature", () => {
    expect([...declaredPresets("")]).toEqual([]);
  });

  it("filters the master vocabulary rather than re-spelling it", () => {
    for (const { module, declared } of FEATURED) {
      for (const preset of declared) {
        expect(
          FORCE_URL_PRESETS,
          `${module} declared ${preset}, which is not in the vocabulary`
        ).toContain(preset);
      }
    }
  });

  it("differentiates the modules — not every feature declares the same set", () => {
    const sets = map(FEATURED, entry => [...entry.declared].join(","));

    expect(new Set(sets).size).toBeGreaterThan(1);
  });
});

describe("AC5 a declared preset the corpus cannot answer is named, never dropped", () => {
  it("reports client-email-history's errored state as a capture gap", () => {
    const entry = named("client-email-history")!;

    expect(
      [...captureGaps(entry.declared, entry.bodies)],
      "the errored state its feature declares is unevidenced and unreported"
    ).toContain("error-collection");
  });

  it("still OFFERS the preset it reports a gap for", () => {
    const entry = named("client-email-history")!;

    for (const gap of captureGaps(entry.declared, entry.bodies)) {
      expect(
        [...entry.declared],
        `${gap} was dropped rather than reported`
      ).toContain(gap);
    }
  });

  it("reports no gap for client-email, whose corpus answers what it declares", () => {
    const entry = named("client-email")!;

    expect([...captureGaps(entry.declared, entry.bodies)]).toEqual([]);
  });

  it("reports every declared preset as a gap when the corpus is empty", () => {
    const entry = named("client-email")!;

    expect([...captureGaps(entry.declared, {})]).toEqual([...entry.declared]);
  });

  it("reports a gap only for presets that were declared", () => {
    for (const { module, declared, bodies } of FEATURED) {
      for (const gap of captureGaps(declared, bodies)) {
        expect(
          [...declared],
          `${module} reported a gap for ${gap}, which it never declared`
        ).toContain(gap);
      }
    }
  });
});
