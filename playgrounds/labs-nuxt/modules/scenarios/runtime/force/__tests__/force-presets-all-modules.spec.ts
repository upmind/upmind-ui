// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/force-presets-all-modules.spec
 * @description FE-3113 `AC1` · `AC3` · `AC4` — the executed matrix. Every module
 * that publishes recordings × every preset in the vocabulary is ONE named test,
 * and both answers are graded: a cell the module offers must serve a recorded
 * answer, and a cell it does not offer must be UNANSWERABLE — never a status
 * this repo invented.
 *
 * ## Job To Be Done
 * The earlier build put every claim behind `if (offered.includes(preset))`, so a
 * module offering nothing passed by asserting nothing. This file removes that
 * escape: a cell that cannot be proved FAILS, and no `continue` guards a claim.
 *
 * Discovery is the layout — the modules come off `recordedBodies`, so one that
 * starts keeping recordings is swept without an entry added here. Every claim is
 * read off the served answer against the recording it was served FROM, so
 * nothing is authored and nothing is asserted about a body this repo wrote.
 *
 * Routes are graded by the same law the design gives them: a module arms the
 * recorded paths belonging to the SUBJECT its own `.feature` declares. So the
 * recordings supply the paths and the feature decides which are the module's
 * own — asserted here by handing one module's recordings another's feature and
 * requiring a different answer, which no recordings-only derivation can give.
 *
 * ## What Breaks If These Fail
 * A developer arms a preset the picker offered and the page does not change, so
 * a bug that only shows in the empty or failed state ships unseen. Or a module
 * with no refusal on record serves a fabricated 500 — a state the API never
 * produced, previewed as if it had. On the route side, an under-reaching arm
 * sends a forced page to STAGING and an over-reaching one intercepts app chrome,
 * where `loading` hangs it for the tab's life.
 *
 * Negative controls:
 * `force-presets-all-modules.arms-the-capture-run.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import { recordedBodies } from "@upmind-automation/headless/fixtures";
import {
  FORCE_URL_PRESETS,
  type ForceUrlPreset
} from "../../composables/useForcedState.types";
import { answerablePresets } from "../capabilities";
import { armCorpusModule, runtimeCorpus, runtimeFeature } from "../corpus";
import { createForceHandlers } from "../handlers";
import { PENDING, presetAnswer } from "../presets";
import { moduleRoutes } from "../routes";
import {
  filter,
  flatMap,
  get,
  isArray,
  isEmpty,
  keys,
  map,
  reject,
  some,
  sortBy,
  toUpper,
  uniq
} from "lodash-es";
import type { CorpusBodies, RecordedFixture } from "../corpus.source.types";
import type { HttpHandler } from "msw";

// -----------------------------------------------------------------------------

const ORIGIN = "https://api.upmind.io";

const isRead = (fixture: RecordedFixture) =>
  toUpper(get(fixture, ["request", "method"], "")) === "GET";

const isRefused = (fixture: RecordedFixture) =>
  get(fixture, ["response", "status"], 0) >= 400;

const hasRows = (fixture: RecordedFixture) =>
  isArray(get(fixture, ["response", "body", "data"]));

/**
 * A recorded read of a record that is not there — the `404` staging answers for
 * an id it does not hold. It is what a single-record surface's empty state is
 * made of; a list's is made of rows withheld.
 */
const isAbsentRecord = (fixture: RecordedFixture) =>
  isRead(fixture) && get(fixture, ["response", "status"], 0) === 404;

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

const pathOf = (fixture: RecordedFixture) =>
  get(fixture, ["request", "path"], "");

const methodOf = (fixture: RecordedFixture) =>
  get(fixture, ["request", "method"], "GET");

const urlOf = (fixture: RecordedFixture) =>
  new URL(`${ORIGIN}${pathOf(fixture)}`);

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
 * What EVIDENCE a module's own recordings hold for one preset, measured off
 * `request.method` and `response.status` alone. This is the oracle both branches
 * of a cell are graded against — an assertion reading the offer back off the
 * derivation would pass on any derivation at all.
 */
const EVIDENCE: Record<
  ForceUrlPreset,
  (fixtures: RecordedFixture[]) => boolean
> = {
  empty: fixtures =>
    some(
      fixtures,
      f => (isRead(f) && !isRefused(f) && hasRows(f)) || isAbsentRecord(f)
    ),
  loading: fixtures => !isEmpty(fixtures),
  "error-action": fixtures =>
    some(fixtures, f => !isRead(f) && isServableRefusal(f)),
  "error-collection": fixtures => some(fixtures, isServableRefusal)
};

type Loaded = {
  module: string;
  bodies: CorpusBodies;
  feature: string;
  fixtures: RecordedFixture[];
  offered: readonly ForceUrlPreset[];
};

const LOADED: Loaded[] = [];

/** A module the fixtures export publishes that force loaded nothing for. */
const UNLOADED: { module: string; feature: string }[] = [];

// Serial: the loader caches per module and arming moves one shared pointer, so a
// parallel sweep would race the corpus it is about to read back.
for (const module of keys(recordedBodies)) {
  await armCorpusModule(module);

  const bodies = runtimeCorpus(module);
  const feature = runtimeFeature(module);

  if (!bodies || isEmpty(bodies)) {
    UNLOADED.push({ module, feature });
    continue;
  }

  LOADED.push({
    module,
    bodies,
    feature,
    fixtures: Object.values(bodies),
    offered: answerablePresets(bodies)
  });
}

/**
 * A recorded successful collection read at the endpoint the capture run drove
 * HARDEST — the shape the most recordings share, ties to the shallower path, and
 * the WIDEST capture of it. The resolver applies the request's own criteria, so
 * grading `empty` against a narrowed capture would compare an emptied answer to
 * an already-empty one.
 */
const collectionReadOf = (entry: Loaded) => {
  const reads = filter(
    entry.fixtures,
    f => isRead(f) && !isRefused(f) && hasRows(f)
  );

  const shapes = map(reads, f => pathShape(pathOf(f)));

  const winner = sortBy(
    shapes,
    shape => -filter(shapes, other => other === shape).length,
    shape => shape.split("/").length
  )[0];

  const atCollection = filter(reads, f => pathShape(pathOf(f)) === winner);

  const unfiltered = filter(atCollection, f => {
    const [, search = ""] = pathOf(f).split("?");
    const params = new URLSearchParams(search);

    return (
      !some([...params.keys()], key => key.startsWith("filter[")) &&
      !params.has("query")
    );
  });

  return sortBy(
    isEmpty(unfiltered) ? atCollection : unfiltered,
    f => -(get(f, ["response", "body", "data"], []) as unknown[]).length
  )[0];
};

/** The module's recorded answer for a record that is not there. */
const absentReadOf = (entry: Loaded) => entry.fixtures.find(isAbsentRecord);

/**
 * The successful read of the SAME resource the absent recording asked for — the
 * request an armed single-record surface makes, whose answer `empty` replaces.
 */
const memberReadOf = (entry: Loaded) => {
  const absent = absentReadOf(entry);
  if (!absent) return undefined;

  const shape = pathShape(pathOf(absent));

  return entry.fixtures.find(
    f => isRead(f) && !isRefused(f) && pathShape(pathOf(f)) === shape
  );
};

const writeOf = (entry: Loaded) => entry.fixtures.find(f => !isRead(f));

/** The refusals a forced state may actually serve — a 401 is not one of them. */
const refusalsOf = (entry: Loaded) => filter(entry.fixtures, isServableRefusal);

const failureOf = (entry: Loaded) =>
  entry.fixtures.find(f => !isRead(f) && isServableRefusal(f)) ??
  refusalsOf(entry)[0];

const answer = (entry: Loaded, preset: string, fixture: RecordedFixture) =>
  presetAnswer(
    preset as never,
    entry.bodies,
    methodOf(fixture),
    urlOf(fixture),
    failureOf(entry)
  );

const matches = async (
  handlers: HttpHandler[],
  url: string,
  method: string
) => {
  const verdicts = await Promise.all(
    map(handlers, handler =>
      handler.test({ request: new Request(url, { method }) } as never)
    )
  );

  return some(verdicts);
};

const named = (module: string) => {
  const entry = LOADED.find(candidate => candidate.module === module);
  if (!entry) throw new Error(`${module} loaded no corpus to grade`);
  return entry;
};

const routesOf = (entry: Loaded) => moduleRoutes(entry.feature, entry.bodies);

const handlersOf = (entry: Loaded) =>
  createForceHandlers("replay", entry.bodies, entry.feature);

const shapeOfRoute = (route: string) =>
  route.replace(/^\*\//, "").replace(/:id\d+/g, ":id");

/** The recordings the module's declared subject claims — what MUST intercept. */
const armedFixtures = (entry: Loaded) => {
  const armed = new Set(map(routesOf(entry), shapeOfRoute));
  return filter(entry.fixtures, f => armed.has(pathShape(pathOf(f))));
};

/**
 * The recordings the subject does NOT claim — chrome a capture run happened to
 * drive through. Arming these is the defect that hangs `/api/countries` for the
 * tab's life, so they must stay live.
 */
const unarmedFixtures = (entry: Loaded) => {
  const armed = new Set(map(routesOf(entry), shapeOfRoute));
  return reject(entry.fixtures, f => armed.has(pathShape(pathOf(f))));
};

/**
 * Every path some OTHER module recorded whose shape this one never recorded —
 * the over-reach probe. A shape both modules recorded is each one's own to
 * answer, so it is foreign to neither.
 */
const foreignPathsFor = (entry: Loaded) => {
  const own = new Set(map(entry.fixtures, f => pathShape(pathOf(f))));

  return uniq(
    reject(
      flatMap(
        reject(LOADED, other => other.module === entry.module),
        other => map(other.fixtures, pathOf)
      ),
      path => own.has(pathShape(path))
    )
  );
};

// -----------------------------------------------------------------------------

function proveAnswered(entry: Loaded, preset: ForceUrlPreset) {
  const write = writeOf(entry);
  const collection = collectionReadOf(entry);

  if (preset === "loading") {
    expect(
      answer(entry, "loading", collection ?? entry.fixtures[0]),
      `${entry.module} answered its read under loading`
    ).toBe(PENDING);

    if (write) {
      expect(
        answer(entry, "loading", write),
        `${entry.module} answered its write under loading`
      ).toBe(PENDING);
    }

    return;
  }

  if (preset === "empty") {
    if (!collection) {
      const absent = absentReadOf(entry);
      const member = memberReadOf(entry);

      expect(
        absent,
        `${entry.module} offers empty with neither a collection to empty nor an absent record on file`
      ).toBeDefined();
      expect(
        member,
        `${entry.module} recorded an absent record at a resource it never read successfully`
      ).toBeDefined();

      const emptied = answer(entry, "empty", member!);

      expect(
        get(emptied, "status"),
        `${entry.module} answered empty at a status its absent-record recording never carried`
      ).toEqual(get(absent, ["response", "status"]));
      expect(
        get(emptied, "body"),
        `${entry.module} authored a body for empty instead of serving its absent-record recording`
      ).toEqual(get(absent, ["response", "body"]));
      expect(
        get(answer(entry, "replay", member!), ["body", "data"]),
        `${entry.module} had no record to withhold — an already-absent baseline proves nothing`
      ).not.toEqual(get(absent, ["response", "body", "data"]));

      return;
    }

    const served = answer(entry, "replay", collection!);
    const emptied = answer(entry, "empty", collection!);

    expect(
      rowsIn(served)?.length,
      `${entry.module} has no rows to remove — an already-empty baseline proves nothing`
    ).toBeGreaterThan(0);
    expect(rowsIn(emptied), `${entry.module} did not empty its rows`).toEqual(
      []
    );
    expect(get(emptied, "status")).toEqual(get(served, "status"));

    // Provenance, not the row count: `empty` is the RECORDING with its rows
    // removed, so every other field of the recorded envelope survives. A body
    // rebuilt as a literal renders identically and counts the same zero rows.
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

    return;
  }

  if (preset === "error-collection") {
    const read = collection ?? entry.fixtures[0];
    const failed = answer(entry, "error-collection", read);

    expect(
      get(failed, "status"),
      `${entry.module} did not fail its read under error-collection`
    ).toBeGreaterThanOrEqual(400);
    expect(
      map(refusalsOf(entry), f => get(f, ["response", "status"])),
      `${entry.module} failed its read at a status no recording of its own carries`
    ).toContain(get(failed, "status"));
    expect(
      get(failed, "body"),
      `${entry.module} lent a recorded sentence to a read that never said it`
    ).toBeUndefined();

    if (write) {
      expect(
        answer(entry, "error-collection", write),
        `${entry.module} took its write down with the failed read`
      ).toEqual(answer(entry, "replay", write));
    }

    return;
  }

  expect(
    filter(entry.fixtures, f => !isRead(f) && isServableRefusal(f)),
    `${entry.module} offers error-action with no failing write on record`
  ).not.toEqual([]);

  const refused = answer(entry, "error-action", write!);

  expect(
    get(refused, "status"),
    `${entry.module} did not refuse its write under error-action`
  ).toBeGreaterThanOrEqual(400);
  expect(
    map(refusalsOf(entry), "response"),
    `${entry.module} refused its write with a response no recording of its own carries`
  ).toContainEqual(refused);

  expect(
    collection,
    `${entry.module} offers error-action with no collection read to hold up beside the refused write`
  ).toBeDefined();

  expect(
    answer(entry, "error-action", collection!),
    `${entry.module} lost its collection under error-action`
  ).toEqual(answer(entry, "replay", collection!));
  expect(
    rowsIn(answer(entry, "error-action", collection!))?.length,
    `${entry.module} emptied its list under error-action`
  ).toBeGreaterThan(0);
}

function proveUnanswerable(entry: Loaded, preset: ForceUrlPreset) {
  if (preset === "loading") {
    expect(
      entry.fixtures,
      `${entry.module} withholds loading while holding recordings — a withheld answer needs no body`
    ).toEqual([]);

    return;
  }

  if (preset === "empty") {
    expect(
      collectionReadOf(entry),
      `${entry.module} withholds empty while holding a collection it could empty`
    ).toBeUndefined();
    expect(
      absentReadOf(entry),
      `${entry.module} withholds empty while holding the absent record that answers it`
    ).toBeUndefined();

    for (const fixture of entry.fixtures) {
      expect(
        answer(entry, "empty", fixture),
        `${entry.module} changes ${pathOf(fixture)} under an empty it does not offer`
      ).toEqual(answer(entry, "replay", fixture));
    }

    return;
  }

  const targets =
    preset === "error-action" ? reject(entry.fixtures, isRead) : entry.fixtures;

  expect(
    filter(targets, isServableRefusal),
    `${entry.module} withholds ${preset} while holding a refusal that answers it`
  ).toEqual([]);

  for (const fixture of targets) {
    expect(
      answer(entry, preset, fixture),
      `${entry.module} changes ${pathOf(fixture)} under a ${preset} it does not offer`
    ).toEqual(answer(entry, "replay", fixture));
  }
}

// -----------------------------------------------------------------------------

describe("AC1 force reaches every module that publishes recordings", () => {
  it("loaded more than one module's corpus — the system is not pinned to one", () => {
    expect(LOADED.length).toBeGreaterThan(1);
    expect(map(LOADED, "module")).toContain("client-email");
    expect(map(LOADED, "module")).toContain("client-email-history");
  });

  it("accounts for every module the fixtures export publishes — swept, or S12", () => {
    expect(
      [...map(LOADED, "module"), ...map(UNLOADED, "module")].sort()
    ).toEqual(keys(recordedBodies).sort());
  });

  it("drops a module only for the reason S12 names — it declares no subject", () => {
    for (const { module, feature } of UNLOADED) {
      expect(
        feature,
        `${module} publishes recordings and declares a subject, and force loaded nothing for it`
      ).toBe("");
    }
  });

  it("every swept module carries self-describing recordings, so the matrix can grade", () => {
    for (const entry of LOADED) {
      expect(
        entry.fixtures.length,
        `${entry.module} loaded nothing`
      ).toBeGreaterThan(0);

      for (const fixture of entry.fixtures) {
        expect(
          get(fixture, ["request", "method"]),
          `${entry.module} recording has no request.method`
        ).toBeTypeOf("string");
        expect(
          get(fixture, ["response", "status"]),
          `${entry.module} recording has no response.status`
        ).toBeTypeOf("number");
      }
    }
  });

  it("differentiates the modules — the offer is not one list served to all", () => {
    expect(
      new Set(map(LOADED, entry => entry.offered.join(","))).size
    ).toBeGreaterThan(1);
  });
});

describe.each(LOADED)("AC3 · AC4 $module", (entry: Loaded) => {
  it.each([...FORCE_URL_PRESETS])(
    "× %s — answers from its own recordings when offered, invents nothing when not",
    preset => {
      const offered = entry.offered.includes(preset);

      expect(
        offered,
        `${entry.module} offers ${preset} against recordings that cannot answer it`
      ).toBe(EVIDENCE[preset](entry.fixtures));

      if (offered) proveAnswered(entry, preset);
      else proveUnanswerable(entry, preset);
    }
  );

  it("replays every recorded collection read at its OWN url, as recorded", () => {
    const reads = filter(
      entry.fixtures,
      f => isRead(f) && !isRefused(f) && hasRows(f)
    );

    expect(
      entry.fixtures.length,
      `${entry.module} has nothing to replay`
    ).toBeGreaterThan(0);

    for (const read of reads) {
      const recorded = get(read, ["response", "body", "data"]) as unknown[];

      expect(
        rowsIn(answer(entry, "replay", read))?.length,
        `${entry.module} replayed ${pathOf(read)} at a row count staging never recorded`
      ).toBe(recorded.length);
    }
  });

  it("derives a route from its own feature — a module with recordings arms something", () => {
    expect(
      routesOf(entry),
      `${entry.module} declares a subject and arms nothing for it`
    ).not.toHaveLength(0);
    expect(handlersOf(entry)).toHaveLength(routesOf(entry).length);
  });

  it("answers every recording under a route it armed, query string carried", async () => {
    const handlers = handlersOf(entry);

    expect(armedFixtures(entry), `${entry.module} armed no recording`).not.toBe(
      []
    );

    for (const fixture of armedFixtures(entry)) {
      expect(
        pathOf(fixture),
        `${entry.module} armed a path this probe stripped to nothing`
      ).not.toBe("");
      expect(
        await matches(
          handlers,
          `${ORIGIN}${pathOf(fixture)}`,
          methodOf(fixture)
        ),
        `${entry.module} armed ${pathShape(pathOf(fixture))} yet answers none of its recorded urls — a query string disqualified the path`
      ).toBe(true);
    }
  });

  it("leaves the chrome it merely TOUCHED unarmed — nothing outside its subject", async () => {
    const handlers = handlersOf(entry);

    for (const fixture of unarmedFixtures(entry)) {
      expect(
        await matches(
          handlers,
          `${ORIGIN}${pathOf(fixture)}`,
          methodOf(fixture)
        ),
        `${entry.module} intercepts ${pathOf(fixture)}, which its subject never claimed`
      ).toBe(false);
    }
  });

  it("arms nothing outside its own recordings", async () => {
    const handlers = handlersOf(entry);
    const foreign = foreignPathsFor(entry);

    expect(
      foreign.length,
      `${entry.module} had no foreign path to probe — the exclusivity claim would be vacuous`
    ).toBeGreaterThan(0);

    for (const path of foreign) {
      expect(
        await matches(handlers, `${ORIGIN}${path}`, "GET"),
        `${entry.module} arms ${path}, which no recording of its own names`
      ).toBe(false);
    }
  });

  it("derives every route it arms from a recording of its own", () => {
    for (const route of routesOf(entry)) {
      expect(
        some(entry.fixtures, f => pathShape(pathOf(f)) === shapeOfRoute(route)),
        `${entry.module} derived route ${route} from no recording of its own`
      ).toBe(true);
    }
  });

  it("takes its subject from the FEATURE — the same recordings under another read differently", () => {
    const other = LOADED.find(candidate => candidate.module !== entry.module);

    expect(
      other,
      "one module loaded — the claim needs a second feature"
    ).toBeDefined();
    expect(
      moduleRoutes("", entry.bodies),
      `${entry.module} arms its recordings with no declared subject to arm them for`
    ).toEqual([]);
    expect(
      moduleRoutes(other!.feature, entry.bodies),
      `${entry.module} arms the same set under ${other!.module}'s subject — the recordings decide, not the feature`
    ).not.toEqual(routesOf(entry));
  });
});

describe("AC1 · AC3 the subject is narrower than the capture run", () => {
  it("refuses at least one path it recorded — an over-reaching arm hangs app chrome", () => {
    const refusing = filter(LOADED, entry => !isEmpty(unarmedFixtures(entry)));

    expect(
      map(refusing, "module"),
      "every module arms every path it ever touched — chrome included"
    ).not.toEqual([]);
  });

  it("client-phone does not arm the country lookup a dropdown needed", async () => {
    const entry = named("client-phone");
    const chrome = filter(entry.fixtures, f => /\/countries\b/.test(pathOf(f)));

    expect(
      chrome,
      "client-phone no longer records the country lookup — pick another chrome path"
    ).not.toEqual([]);

    for (const fixture of chrome) {
      expect(
        await matches(handlersOf(entry), `${ORIGIN}${pathOf(fixture)}`, "GET"),
        `client-phone arms ${pathOf(fixture)}, and forcing loading hangs the chrome for the tab's life`
      ).toBe(false);
    }
  });

  it("client-email-history arms its detail read — a query string is not a disqualifier", async () => {
    const entry = named("client-email-history");
    const detail = filter(entry.fixtures, f => pathOf(f).includes("?with="));

    expect(
      detail,
      "client-email-history records no read carrying a query string"
    ).not.toEqual([]);

    for (const fixture of detail) {
      expect(
        await matches(
          handlersOf(entry),
          `${ORIGIN}${pathOf(fixture)}`,
          methodOf(fixture)
        ),
        `client-email-history reaches STAGING for ${pathOf(fixture)} under a forced chip`
      ).toBe(true);
    }
  });
});
