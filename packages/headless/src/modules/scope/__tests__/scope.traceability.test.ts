// -----------------------------------------------------------------------------
/**
 * @fileoverview scope traceability — the module feature is the contract
 *
 * ## Job To Be Done
 * Hold `scope.feature` and the specs that prove it in step, in both directions:
 * every capability the module promises is claimed by a spec, every id a spec
 * claims is a scenario the feature still carries, and every claimed id is
 * actually exercised by a case in the spec that claims it.
 *
 * The scope module is the first headless module to author a `.feature` with no
 * step catalog, so this is the AC-link half only — `featureAcTags` is the
 * left-hand side, the `@anchor` tags the specs carry are the right.
 *
 * ## What Breaks If These Fail
 * A capability the module promises quietly loses its only proof and nothing
 * goes red — the FE-2824 shape one level up. Or an `@anchor` left behind after
 * a rename points at nothing while still reading as traceability.
 */

import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { featureAcTags } from "@upmind-automation/scenario-harness";
import {
  difference,
  filter,
  flatMap,
  forEach,
  isEmpty,
  map,
  reject,
  size,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const here = import.meta.dirname;

const FEATURE = "scope.feature";

/**
 * Specs proving a scope capability from outside the module. AC-9 is an identity
 * question, so it is proven where identity lives — at the seam that resolves the
 * target, and at the wire the request goes out on. Moving either file is a break
 * this test is meant to report.
 */
const EXTERNAL_SPECS = [
  join(
    here,
    "../../session-store/__tests__/session-store.client-identity.int.test.ts"
  ),
  join(
    here,
    "../../client-address/__tests__/client-address.bare-context-identity.int.test.ts"
  )
];

/**
 * The recorded acceptance this story's change was measured against — the
 * pre-existing retarget read-back the parity table cites as the oracle. It
 * carries no `@AC-` id of its own and is not edited by this story, so it is
 * bound by its exact title: a rename or a deletion breaks this anchor rather
 * than silently retiring the oracle.
 */
const ORACLE_RETARGET_AT_THE_WIRE = {
  spec: join(
    here,
    "../../client-address/__tests__/client-address.scope-identity.int.test.ts"
  ),
  title:
    "AC-2 reads the SCOPE-CONTEXT client's list while the session's own activeUser is a different client"
};

const ANCHOR = /@anchor\s+([\w./-]+)/g;
const TITLE = /\bit\(\s*\n?\s*"([^"]*)"/g;

type Spec = { file: string; ids: string[]; titles: string[] };

/**
 * Reads a spec's anchors and its case titles.
 *
 * @param path - Absolute path to a spec file.
 * @returns The feature it answers, the ids it claims, and its `it(...)` titles.
 */
function readSpec(path: string): Spec & { feature: string } {
  const source = readFileSync(path, "utf8");
  const anchors = map([...source.matchAll(ANCHOR)], match => String(match[1]));

  return {
    file: basename(path),
    feature: anchors.find(anchor => anchor.endsWith(".feature")) ?? "",
    ids: uniq(reject(anchors, anchor => anchor.endsWith(".feature"))),
    titles: map([...source.matchAll(TITLE)], match => String(match[1]))
  };
}

const declaredIds = featureAcTags(readFileSync(join(here, FEATURE), "utf8"));

const localSpecs = map(
  filter(
    readdirSync(here),
    name => /\.test\.ts$/.test(name) && name !== basename(import.meta.filename)
  ),
  name => join(here, name)
);

const answering = filter(
  map([...localSpecs, ...EXTERNAL_SPECS], readSpec),
  spec => spec.feature === FEATURE
);

const claimedIds = uniq(flatMap(answering, "ids"));

// -----------------------------------------------------------------------------

describe("scope feature traceability", () => {
  it("reads the capability ids the feature declares", () => {
    expect(size(declaredIds)).toBeGreaterThan(0);
    expect(size(answering)).toBeGreaterThan(0);
  });

  it("names a proving spec for every capability the feature declares", () => {
    expect(difference(declaredIds, claimedIds)).toEqual([]);
  });

  it("carries a scenario for every capability id a spec claims", () => {
    expect(difference(claimedIds, declaredIds)).toEqual([]);
  });

  it("claims at least one capability in every spec that answers the feature", () => {
    expect(
      map(
        filter(answering, spec => isEmpty(spec.ids)),
        "file"
      )
    ).toEqual([]);
  });

  it("exercises every capability its specs claim, rather than only naming it", () => {
    // An `@anchor` pointing at a capability no case in the file mentions is an
    // anchor to a filename, not to a proof.
    const unexercised = flatMap(answering, spec =>
      map(
        reject(spec.ids, id =>
          spec.titles.some(title => title.includes(`@${id}`))
        ),
        id => `${spec.file} → ${id}`
      )
    );

    expect(unexercised).toEqual([]);
  });

  it("still finds the recorded acceptance the parity table names as the oracle", () => {
    forEach([ORACLE_RETARGET_AT_THE_WIRE], anchor => {
      expect(readFileSync(anchor.spec, "utf8")).toContain(
        `it("${anchor.title}"`
      );
    });
  });
});
