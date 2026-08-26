// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/feature-traceability.spec
 * @description The anchor enforcement `code-test-bdd` §7 assigns to the prover:
 * the both-ways link between every playground `.feature` and the specs beside
 * it. It fails when a scenario carries a capability id no spec names (a
 * coverage hole), and when a spec names an id its feature never declared (an
 * untethered or stale anchor).
 *
 * Neither direction is visible without it. A feature is not executable, so a
 * scenario nobody proved reads exactly like one somebody did; and an
 * `@anchor T-4` left behind after the ids were renamed points at nothing while
 * still looking like traceability.
 *
 * The vocabulary below is what a tag can be OTHER than an id — the story tag,
 * the actor, the layer, and `@todo` for a declared-but-unprovable capability.
 * Everything else on a `Scenario:` is a capability id and must be answered.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  difference,
  filter,
  find,
  flatMap,
  isEmpty,
  map,
  reject,
  some,
  sortBy,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

// `import.meta.url` is an http URL under jsdom, so the root comes from the
// lane's own `root` (`vitest.config.ts:96`), which is this package.
const PLAYGROUND_ROOT = process.cwd();

const SCANNED_ROOTS = ["app", "modules"];

const SKIPPED_DIRS = new Set(["node_modules", ".nuxt", "dist"]);

/** Tags that classify a scenario rather than identify a capability. */
const NOT_AN_ID = /^(?:FE-\d+|todo|layer-\w+|developer|client|staff|guest)$/;

type Feature = { file: string; ids: string[] };

type Spec = { file: string; feature: string; ids: string[] };

function walk(dir: string, keep: (entry: string) => boolean): string[] {
  return flatMap(readdirSync(dir), entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return SKIPPED_DIRS.has(entry) ? [] : walk(full, keep);
    }
    return keep(entry) ? [full] : [];
  });
}

const under = (keep: (entry: string) => boolean): string[] =>
  flatMap(SCANNED_ROOTS, root => walk(join(PLAYGROUND_ROOT, root), keep));

/** Every capability id a feature's scenarios declare. */
export function idsDeclaredIn(source: string): string[] {
  return uniq(
    reject(
      flatMap(
        [...source.matchAll(/^[ \t]*(@[^\n]+)\n[ \t]*Scenario:/gm)],
        match =>
          map([...String(match[1]).matchAll(/@([\w.-]+)/g)], tag => tag[1])
      ),
      tag => NOT_AN_ID.test(String(tag))
    )
  ) as string[];
}

/** A spec's anchors: the feature it answers, and the ids it claims within it. */
export function anchorsIn(source: string): { feature: string; ids: string[] } {
  const anchors = map([...source.matchAll(/@anchor\s+([\w./-]+)/g)], match =>
    String(match[1])
  );

  return {
    feature: String(find(anchors, anchor => anchor.endsWith(".feature")) ?? ""),
    ids: uniq(reject(anchors, anchor => anchor.endsWith(".feature")))
  };
}

const FEATURES: Feature[] = map(
  under(entry => entry.endsWith(".feature")),
  file => ({
    file: relative(PLAYGROUND_ROOT, file),
    ids: idsDeclaredIn(readFileSync(file, "utf-8"))
  })
);

const SPECS: Spec[] = reject(
  map(
    under(entry => entry.endsWith(".spec.ts")),
    file => {
      const { feature, ids } = anchorsIn(readFileSync(file, "utf-8"));
      return { file: relative(PLAYGROUND_ROOT, file), feature, ids };
    }
  ),
  spec => isEmpty(spec.feature)
);

/** The specs answering one feature — its own directory is the scope. */
const answering = ({ file }: Feature): Spec[] =>
  filter(
    SPECS,
    spec =>
      spec.feature === basename(file) && dirname(spec.file) === dirname(file)
  );

// -----------------------------------------------------------------------------

describe("BDD anchors — the gate can tell a link from a gap", () => {
  it("reads a capability id off a scenario, and skips the classifying tags", () => {
    const feature = `@FE-1
Feature: probe
  @D-1 @developer
  Scenario: one
  @contract @layer-unit @staff
  Scenario: two`;

    expect(idsDeclaredIn(feature)).toEqual(["D-1", "contract"]);
  });

  it("reads a spec's feature and its ids apart", () => {
    const spec = `/**
 * @anchor probe.feature
 * @anchor D-1
 */
describe("x", () => {
  /** @anchor contract */
  it("y", () => {});
});`;

    expect(anchorsIn(spec)).toEqual({
      feature: "probe.feature",
      ids: ["D-1", "contract"]
    });
  });

  it("found features and specs to link", () => {
    expect(FEATURES.length).toBeGreaterThan(0);
    expect(SPECS.length).toBeGreaterThan(0);
    expect(some(FEATURES, feature => !isEmpty(answering(feature)))).toBe(true);
  });
});

describe("BDD anchors — every scenario is answered, every anchor lands", () => {
  it("leaves no declared capability without a spec naming it", () => {
    const holes = flatMap(FEATURES, feature => {
      const claimed = flatMap(answering(feature), "ids");
      return map(
        difference(feature.ids, claimed),
        id => `${feature.file} @${id}`
      );
    });

    expect(sortBy(holes)).toEqual([]);
  });

  it("leaves no spec anchor pointing at a capability its feature never declared", () => {
    const stale = flatMap(FEATURES, feature =>
      flatMap(answering(feature), spec =>
        map(
          difference(spec.ids, feature.ids),
          id => `${spec.file} @anchor ${id}`
        )
      )
    );

    expect(sortBy(stale)).toEqual([]);
  });

  it("leaves no feature with nothing answering it", () => {
    expect(
      map(
        filter(FEATURES, feature => isEmpty(answering(feature))),
        "file"
      )
    ).toEqual([]);
  });
});
