// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/force-presets-all-modules.spec
 * @description FE-3113 `AC1` · `AC3` · `AC4` — force is MULTI-MODULE, and every
 * preset a module's `.feature` DECLARES either answers over that module's own
 * recordings or is named as a capture gap. The old system was pinned to
 * `client-email`, so "it works" was only ever measured on the one corpus that
 * happened to answer all four presets.
 *
 * The offer is read off the module's committed `.feature` (operator ruling,
 * 2026-08-27), never off the recordings — a corpus that cannot answer a declared
 * state owes a capture, and never gets to withdraw the state.
 *
 * Every module publishing recordings is swept, discovered by the layout rather
 * than named here: a module that starts keeping recordings is proven by this
 * file without an entry being added anywhere. Each claim is read off the served
 * answer against the recording it was served FROM, so nothing is authored and
 * nothing is asserted about a body this repo wrote.
 *
 * ## What Breaks If These Fail
 * A developer arms a preset the picker offered and the page does not change —
 * the state under test never happens, and a bug that only shows in the empty or
 * failed state ships unseen. Or force silently keeps answering `client-email`
 * on a page that is not it, so the preview is another module's data.
 *
 * Negative controls: `force-presets-all-modules.other-module.must-fail.patch`,
 * `force-presets-all-modules.unanswerable-offer.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import { recordedBodies } from "@upmind-automation/headless/fixtures";
import {
  captureGaps,
  corpusCapabilities,
  declaredPresets
} from "../capabilities";
import {
  armCorpusModule,
  resolveCorpusRequest,
  runtimeCorpus
} from "../corpus";
import { featureTextFor } from "../corpus.source";
import { PENDING, presetAnswer } from "../presets";
import { moduleRoutes } from "../routes";
import {
  filter,
  get,
  isArray,
  isEmpty,
  keys,
  map,
  some,
  sortBy,
  toUpper
} from "lodash-es";
import type { ForceUrlPreset } from "../../composables/useForcedState.types";
import type { CorpusBodies, RecordedFixture } from "../corpus.source.types";

// -----------------------------------------------------------------------------

const ORIGIN = "https://api.upmind.io";

// Discovery is the layout — every module that publishes recordings is armed,
// so a module that starts keeping them is swept without an entry added here.
await Promise.all(map(keys(recordedBodies), module => armCorpusModule(module)));

type Loaded = {
  module: string;
  bodies: CorpusBodies;
  fixtures: RecordedFixture[];
  offered: readonly ForceUrlPreset[];
  gaps: readonly ForceUrlPreset[];
  answerable: readonly ForceUrlPreset[];
  failure?: RecordedFixture;
};

/**
 * What a module OFFERS is what its own `.feature` declares — the corpus is
 * evidence serving that, never the authority over it (operator ruling,
 * 2026-08-27). A declared preset the recordings cannot answer is a capture gap,
 * so `answerable` is what this suite may hold to a served answer; `gaps` are
 * held to being NAMED instead.
 */
const LOADED: Loaded[] = filter(
  map(keys(recordedBodies), module => {
    const bodies = runtimeCorpus(module);
    if (!bodies) return undefined;

    const caps = corpusCapabilities(bodies);
    const offered = declaredPresets(featureTextFor(module));
    const gaps = captureGaps(offered, bodies);

    return {
      module,
      bodies,
      fixtures: Object.values(bodies),
      offered,
      gaps,
      answerable: filter(offered, preset => !gaps.includes(preset)),
      failure: caps.failure
    };
  }),
  (entry): entry is Loaded => Boolean(entry) && !isEmpty(entry!.fixtures)
);

const isRead = (method: string) => toUpper(method) === "GET";

const urlOf = (fixture: RecordedFixture) =>
  new URL(`${ORIGIN}${get(fixture, ["request", "path"], "")}`);

const rowsIn = (response: unknown) => {
  const data = get(response, ["body", "data"]);
  return isArray(data) ? data : undefined;
};

const pathShape = (path: string) =>
  path
    .split("?")[0]
    .split("/")
    .filter(Boolean)
    .map(segment =>
      /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|mock-uuid-\d+)$/i.test(
        segment
      )
        ? ":id"
        : segment
    )
    .join("/");

/**
 * A recorded successful collection read at the endpoint the capture run drove
 * HARDEST — the shape the most recordings share, ties to the shallower path.
 * A module captured at several read endpoints has one collection; picking any
 * other would grade `empty` against rows the resolver never serves.
 */
const collectionReadOf = (entry: Loaded) => {
  const reads = filter(
    entry.fixtures,
    fixture =>
      isRead(get(fixture, ["request", "method"], "")) &&
      get(fixture, ["response", "status"], 0) < 400 &&
      isArray(get(fixture, ["response", "body", "data"]))
  );

  const shapes = map(reads, fixture =>
    pathShape(get(fixture, ["request", "path"], ""))
  );

  const winner = sortBy(
    shapes,
    shape => -filter(shapes, entry => entry === shape).length,
    shape => shape.split("/").length
  )[0];

  const atCollection = filter(
    reads,
    fixture => pathShape(get(fixture, ["request", "path"], "")) === winner
  );

  // The WIDEST capture of that endpoint. The resolver applies the request's own
  // criteria, so a recording captured under a narrowing filter serves the rows
  // that filter left — grading `empty` against a zero-row capture would compare
  // an emptied answer to an already-empty one. `limit` does not narrow the same
  // way (every paged capture carries one), so rank by rows rather than exclude.
  const unfiltered = filter(atCollection, fixture => {
    const [, search = ""] = get(fixture, ["request", "path"], "").split("?");
    const params = new URLSearchParams(search);

    return (
      !some([...params.keys()], key => key.startsWith("filter[")) &&
      !params.has("query")
    );
  });

  return sortBy(
    isEmpty(unfiltered) ? atCollection : unfiltered,
    fixture =>
      -(get(fixture, ["response", "body", "data"], []) as unknown[]).length
  )[0];
};

/** A recorded write — the request `error-action` must refuse. */
const writeOf = (entry: Loaded) =>
  entry.fixtures.find(
    fixture => !isRead(get(fixture, ["request", "method"], ""))
  );

const answer = (entry: Loaded, preset: string, fixture: RecordedFixture) =>
  presetAnswer(
    preset as never,
    entry.bodies,
    get(fixture, ["request", "method"], "GET"),
    urlOf(fixture),
    entry.failure
  );

// -----------------------------------------------------------------------------

describe("AC1 force reaches every module that publishes recordings", () => {
  it("loaded more than one module's corpus — the system is not pinned to one", () => {
    expect(LOADED.length).toBeGreaterThan(1);
    expect(map(LOADED, "module")).toContain("client-email");
    expect(map(LOADED, "module")).toContain("client-email-history");
  });

  it("serves each module from its OWN recordings, never another's", () => {
    for (const entry of LOADED) {
      const read = collectionReadOf(entry);
      if (!read) continue;

      const served = resolveCorpusRequest(entry.bodies, "GET", urlOf(read));

      expect(
        served,
        `${entry.module} could not serve its own recorded read`
      ).toBeDefined();
      expect(get(served, "status")).toBe(get(read, ["response", "status"]));
    }
  });

  it("derives each module's intercept routes from its own recorded paths", () => {
    for (const entry of LOADED) {
      const routes = moduleRoutes(entry.bodies);

      expect(routes, `${entry.module} derived no routes`).not.toHaveLength(0);

      // A route is derived, not invented, when some recording's own pathname
      // reduces to it: id segments parameterised, the origin left wildcarded.
      const shapeOf = (path: string) =>
        `*/${path
          .split("?")[0]
          .split("/")
          .filter(Boolean)
          .map((segment, index) =>
            /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|mock-uuid-\d+)$/i.test(
              segment
            )
              ? `:id${index}`
              : segment
          )
          .join("/")}`;

      for (const route of routes) {
        expect(
          some(
            entry.fixtures,
            fixture => shapeOf(get(fixture, ["request", "path"], "")) === route
          ),
          `${entry.module} derived route ${route} from no recording of its own`
        ).toBe(true);
      }
    }
  });
});

describe("AC3 every preset a module OFFERS actually answers", () => {
  it("withholds the answer under loading, for every module that offers it", () => {
    for (const entry of LOADED) {
      if (!entry.answerable.includes("loading")) continue;

      const fixture = collectionReadOf(entry) ?? entry.fixtures[0];

      expect(
        answer(entry, "loading", fixture),
        `${entry.module} answered under loading`
      ).toBe(PENDING);
    }
  });

  it("narrows the collection to zero rows under empty, for every offering module", () => {
    for (const entry of LOADED) {
      if (!entry.answerable.includes("empty")) continue;

      const read = collectionReadOf(entry)!;
      const served = answer(entry, "replay", read);
      const emptied = answer(entry, "empty", read);

      expect(
        rowsIn(served)?.length,
        `${entry.module} has no rows to remove`
      ).toBeGreaterThan(0);
      expect(rowsIn(emptied), `${entry.module} did not empty its rows`).toEqual(
        []
      );
      expect(get(emptied, "status")).toEqual(get(served, "status"));

      // Provenance, not the row count: `empty` is the RECORDING with its rows
      // removed, so every other field of the recorded envelope survives. A body
      // rebuilt as a literal renders identically and counts the same zero rows,
      // which is the FE-2824 shape a row-count assertion passes blind.
      expect(
        keys(get(emptied, "body")).sort(),
        `${entry.module} served an authored envelope under empty, not its recording emptied`
      ).toEqual(keys(get(served, "body")).sort());

      for (const field of keys(get(served, "body"))) {
        if (field === "data" || field === "total") continue;

        expect(
          get(emptied, ["body", field]),
          `${entry.module} lost recorded envelope field ${field} under empty`
        ).toEqual(get(served, ["body", field]));
      }
    }
  });

  it("fails the READ under error-collection, for every offering module", () => {
    for (const entry of LOADED) {
      if (!entry.answerable.includes("error-collection")) continue;

      const read = collectionReadOf(entry) ?? entry.fixtures[0];
      const failed = answer(entry, "error-collection", read);
      const served = answer(entry, "replay", read);

      expect(
        get(failed, "status"),
        `${entry.module} did not fail its read under error-collection`
      ).toBeGreaterThanOrEqual(400);
      expect(get(failed, "status")).not.toBe(get(served, "status"));
    }
  });

  it("fails the WRITE under error-action, for every offering module", () => {
    for (const entry of LOADED) {
      if (!entry.answerable.includes("error-action")) continue;

      const write = writeOf(entry)!;
      const refused = answer(entry, "error-action", write);

      expect(
        get(refused, "status"),
        `${entry.module} did not refuse its write under error-action`
      ).toBeGreaterThanOrEqual(400);
      expect(refused).toEqual(entry.failure!.response);
    }
  });

  it("leaves the OTHER half as recorded — a forced error takes no rows with it", () => {
    for (const entry of LOADED) {
      if (!entry.answerable.includes("error-action")) continue;

      const read = collectionReadOf(entry);
      if (!read) continue;

      expect(
        answer(entry, "error-action", read),
        `${entry.module} lost its collection under error-action`
      ).toEqual(answer(entry, "replay", read));
    }
  });
});

describe("AC1 a replayed recording answers what staging answered", () => {
  it("serves every recorded collection read at its OWN url, as recorded", () => {
    for (const entry of LOADED) {
      const reads = filter(
        entry.fixtures,
        fixture =>
          isRead(get(fixture, ["request", "method"], "")) &&
          get(fixture, ["response", "status"], 0) < 400 &&
          isArray(get(fixture, ["response", "body", "data"]))
      );

      for (const read of reads) {
        const recorded = get(read, ["response", "body", "data"]) as unknown[];
        const served = resolveCorpusRequest(entry.bodies, "GET", urlOf(read));

        expect(
          rowsIn(served)?.length,
          `${entry.module} replayed ${get(read, ["request", "path"])} as ${
            rowsIn(served)?.length
          } rows where staging recorded ${recorded.length}`
        ).toBe(recorded.length);
      }
    }
  });
});

describe("AC4 every declared preset is answered, or named as a capture gap", () => {
  it("accounts for every declared preset — answerable or reported, never lost", () => {
    for (const entry of LOADED) {
      expect(
        sortBy([...entry.answerable, ...entry.gaps]),
        `${entry.module} lost a declared preset — neither answered nor reported`
      ).toEqual(sortBy([...entry.offered]));

      for (const gap of entry.gaps) {
        expect(
          entry.offered,
          `${entry.module} reported a gap for ${gap}, which it never declared`
        ).toContain(gap);
      }
    }
  });

  it("answers every preset every module offers — none is dead", () => {
    for (const entry of LOADED) {
      for (const preset of entry.answerable) {
        const fixture =
          preset === "error-action"
            ? writeOf(entry)
            : (collectionReadOf(entry) ?? entry.fixtures[0]);

        expect(
          fixture,
          `${entry.module} offers ${preset} with no recording to serve it`
        ).toBeDefined();

        expect(
          answer(entry, preset, fixture!),
          `${entry.module} offers ${preset} but answers nothing`
        ).toBeDefined();
      }
    }
  });

  it("changes the answer for every preset that is not replay", () => {
    for (const entry of LOADED) {
      const read = collectionReadOf(entry);
      if (!read) continue;

      const served = answer(entry, "replay", read);

      for (const preset of entry.answerable) {
        if (preset === "error-action") continue;

        expect(
          answer(entry, preset, read),
          `${entry.module}'s ${preset} is indistinguishable from replay`
        ).not.toEqual(served);
      }
    }
  });

  it("offers nothing at all for a path the module does not own", () => {
    for (const entry of LOADED) {
      const foreign = new URL(`${ORIGIN}/api/not-a-path-this-module-recorded`);

      for (const preset of entry.answerable) {
        expect(
          answer(entry, preset, {
            request: { method: "GET", path: foreign.pathname },
            response: { status: 200, body: undefined }
          }),
          `${entry.module} answered for a path it never recorded`
        ).toBeUndefined();
      }
    }
  });
});
