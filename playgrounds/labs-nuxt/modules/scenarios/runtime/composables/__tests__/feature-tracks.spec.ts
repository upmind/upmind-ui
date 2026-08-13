// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/__tests__/feature-tracks.spec
 * @description T4.1 — a feature IS the playlist (`AC2.5` · design §3.1). Six
 * claims, in the order a track travels them:
 *   1. a playlist declaring 11 scenarios yields 11 tracks in document order,
 *      an Outline expanded one track per Examples row (`K1`: Live + 11);
 *   2. a track's scenes are its own steps, the Background's first, each
 *      carrying the kind, text and line the feature declares;
 *   3. every scene is bound to the catalog handler that matched it, called
 *      with the args cucumber compiled from the step's own text;
 *   4. a track carries the scope its own arrangement boots at — which is what
 *      T4.2 compares against the page's scope before arming (§3.1 ruling 2);
 *   5. an unmatched step is refused out loud, never skipped to keep a track
 *      moving, and the track it belongs to refuses to arm;
 *   6. an empty seam yields zero tracks — Live-only is the CORRECT degraded
 *      state while `ESC6` is unruled (`S12`), not an error.
 *
 * The playlist above is SYNTHETIC — it exists to put the composable's shape
 * under a feature this spec fully controls, including the two degraded ones no
 * real feature has. What the page actually plays is the REAL client-email feature, and since
 * `ESC6` was ruled (route (a), 2026-08-12) the seam serves it: the last block
 * drives the composable on `corpus.source`'s own `featureText` + `stepCatalog`,
 * which is the `AC2.6` oracle — unprovable until that ruling.
 *
 * The parser and matcher are the harness's ONE pair (`parseFeatureScenarios` /
 * `createStepMatcher`) — a second copy anywhere is the defect this spec's
 * subject exists to avoid.
 *
 * ## What breaks if these fail
 * The bar lists the wrong things, or a track plays steps the catalog never
 * matched — which, on a module whose scenes WRITE, is a silent no-op mid-demo.
 *
 * Negative controls: `feature-tracks.scope-blind.must-fail.patch`,
 * `feature-tracks.skip-unmatched.must-fail.patch`.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SCOPE_ACTOR,
  STEP_KIND,
  createTraceabilityCheck,
  defineSteps
} from "@upmind-automation/scenario-harness";
import { featureText, stepCatalog } from "../../force/corpus.source";
import { CLIENT_EMAIL_TRACK_COUNT } from "../../force/corpus.source.types";
import { useFeatureTracks } from "../useFeatureTracks";
import {
  countBy,
  every,
  filter,
  find,
  first,
  includes,
  last,
  map,
  nth,
  size,
  some,
  uniq
} from "lodash-es";
import type {
  StepCatalog,
  World,
  WorldScope
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const KEY = "useClientEmails";

const CLIENT_SCOPE: WorldScope = { actor: SCOPE_ACTOR.CLIENT };

const STAFF_CONTEXT_ID = "mock-uuid-1";

const STAFF_SCOPE: WorldScope = {
  actor: SCOPE_ACTOR.STAFF,
  context: { type: "client", id: STAFF_CONTEXT_ID }
};

/** 11 scenarios — nine written out, plus an Outline standing for two. */
const PLAYLIST = `@synthetic
Feature: A synthetic playlist
  As a developer meeting a composable
  I want its scenarios to play

  Background:
    Given the collection is open for the client

  @smoke
  Scenario: The client sees their collection
    Then the collection holds 3 addresses

  Scenario: The client adds an address
    When the client adds the address "mock-email-9@example.com"
    Then the collection reports no failure

  Scenario: The client removes an address
    When the client removes the address "mock-email-3@example.com"
    Then the collection reports no failure

  Scenario: The client resends a verification
    When the client resends the verification for "mock-email-4@example.com"
    Then the collection reports no failure

  Scenario: The client makes an address the default
    When the client makes "mock-email-3@example.com" the default
    Then the collection reports no failure

  Scenario: The client refreshes the collection
    When the client refreshes the collection
    Then the collection holds 3 addresses

  @filters
  Scenario Outline: The client filters to <state> addresses
    When the client filters to <state> addresses only
    Then the collection holds <total> addresses

    Examples:
      | state      | total |
      | unverified | 2     |
      | verified   | 1     |

  Scenario: The client sorts the collection
    When the client sorts the collection by "email" descending
    Then the collection reports no failure

  Scenario: Discarding the collection releases it
    When the client discards the collection
    Then the collection reports no failure

  @fe-2824
  Scenario: Staff acting for a client read that client's collection
    Given a staff member acting for the client "${STAFF_CONTEXT_ID}"
    Then the collection holds 3 addresses
`;

/** A playlist whose arrangement boots nothing at all. */
const UNARRANGED = `Feature: A playlist that boots nothing

  Scenario: The client refreshes the collection
    When the client refreshes the collection
    Then the collection reports no failure
`;

/** A playlist carrying one step no catalog pattern can match. */
const UNMATCHABLE = `Feature: A playlist with a step nobody registered

  Background:
    Given the collection is open for the client

  Scenario: The client does something nobody wrote a step for
    When the client teleports the collection sideways
    Then the collection reports no failure
`;

/**
 * The module's catalog as a steps file writes one — `defineSteps`, patterns as
 * data, handlers reaching the module through the World and nothing else.
 */
const catalog: StepCatalog = defineSteps(({ Given, When, Then }) => {
  Given("the collection is open for the client", world =>
    world.boot(KEY, CLIENT_SCOPE)
  );

  Given("a staff member acting for the client {string}", (world, id) =>
    world.boot(KEY, {
      actor: SCOPE_ACTOR.STAFF,
      context: { type: "client", id: String(id) }
    })
  );

  When("the client adds the address {string}", (world, email) =>
    world.fire("ensure", { email })
  );

  When("the client removes the address {string}", (world, email) =>
    world.fire("remove", { email })
  );

  When("the client resends the verification for {string}", (world, email) =>
    world.fire("verify", { email })
  );

  When("the client makes {string} the default", (world, email) =>
    world.fire("setDefault", { email })
  );

  When("the client refreshes the collection", world => world.fire("refresh"));

  When("the client filters to {word} addresses only", (world, state) =>
    world.fire("filterBy", { state })
  );

  When(
    "the client sorts the collection by {string} descending",
    (world, field) => world.fire("sortBy", { field })
  );

  When("the client discards the collection", world => world.fire("destroy"));

  Then("the collection holds {int} addresses", (world, total) =>
    world.expectContext?.({ total })
  );

  Then("the collection reports no failure", world =>
    world.expectMeta({ hasError: false })
  );
});

type Call = { member: string; args: unknown[] };

/** A World that records what a scene asked of it, and answers nothing. */
function recordingWorld(): World & { calls: Call[] } {
  const calls: Call[] = [];
  const record =
    (member: string) =>
    async (...args: unknown[]) => {
      calls.push({ member, args });
    };

  return {
    calls,
    boot: record("boot"),
    fire: record("fire"),
    expectMeta: record("expectMeta"),
    expectContext: record("expectContext"),
    dispose: record("dispose")
  } as World & { calls: Call[] };
}

const playlist = () => useFeatureTracks({ feature: PLAYLIST, catalog });

const trackNamed = (name: string) =>
  find(playlist().tracks, track => track.name === name);

const STAFF_TRACK = "Staff acting for a client read that client's collection";

beforeEach(() => {
  vi.clearAllMocks();
});

// -----------------------------------------------------------------------------

describe("T4.1 the feature IS the playlist (AC2.5 · K1)", () => {
  it("hands back one track per declared scenario, in document order", () => {
    const { tracks } = playlist();

    expect(size(tracks)).toBe(11);
    expect(first(tracks)?.name).toBe("The client sees their collection");
    expect(last(tracks)?.name).toBe(STAFF_TRACK);
  });

  it("expands an Outline one track per Examples row, each carrying its own substituted name", () => {
    const { tracks } = playlist();
    const outlined = filter(tracks, track => includes(track.tags, "@filters"));

    expect(map(outlined, track => track.name)).toStrictEqual([
      "The client filters to unverified addresses",
      "The client filters to verified addresses"
    ]);
    expect(some(tracks, track => includes(track.name, "<"))).toBe(false);
    expect(uniq(map(outlined, track => track.line))).toHaveLength(2);
  });

  it("carries the scenario's own tags and no feature-level tag", () => {
    const { tracks } = playlist();

    expect(first(tracks)?.tags).toStrictEqual(["@smoke"]);
    expect(some(tracks, track => includes(track.tags, "@synthetic"))).toBe(
      false
    );
  });

  it("gives every track a url-safe slug the playlist never repeats", () => {
    const slugs = map(playlist().tracks, track => track.slug);

    expect(size(uniq(slugs))).toBe(11);
    expect(every(slugs, slug => /^[a-z0-9-]+$/.test(slug))).toBe(true);
  });
});

describe("T4.1 a scene IS a step (AC2.5 · AC2.7)", () => {
  it("runs the Background's steps first, then the scenario's own, in declared order", () => {
    const track = trackNamed("The client adds an address");

    expect(map(track?.scenes, scene => scene.text)).toStrictEqual([
      "the collection is open for the client",
      'the client adds the address "mock-email-9@example.com"',
      "the collection reports no failure"
    ]);
    expect(map(track?.scenes, scene => scene.kind)).toStrictEqual([
      STEP_KIND.GIVEN,
      STEP_KIND.WHEN,
      STEP_KIND.THEN
    ]);
  });

  it("carries each scene's own declared line — the number the Scenario pane marks", () => {
    const track = trackNamed("The client adds an address");
    const lines = map(track?.scenes, scene => scene.line);

    expect(size(uniq(lines))).toBe(size(lines));
    expect(every(lines, line => line > 0)).toBe(true);
    expect(nth(lines, 1)).toBeGreaterThan(first(lines) as number);
  });

  it("matches every scene of every track — a zero-unmatched playlist is playable", () => {
    const { tracks, malformedStepDefs } = playlist();
    const scenes = filter(
      map(tracks, track => track.scenes),
      Boolean
    );

    expect(
      every(scenes, sceneList => every(sceneList, scene => scene.isMatched))
    ).toBe(true);
    expect(every(tracks, track => track.isPlayable)).toBe(true);
    expect(malformedStepDefs).toStrictEqual([]);
  });
});

describe("T4.1 a scene is BOUND to the handler that matched it", () => {
  it("calls the matched handler with the args cucumber compiled from the step text", async () => {
    const world = recordingWorld();
    const track = trackNamed("The client adds an address");

    for (const scene of track?.scenes ?? []) {
      await scene.run(world);
    }

    expect(world.calls).toStrictEqual([
      { member: "boot", args: [KEY, CLIENT_SCOPE] },
      {
        member: "fire",
        args: ["ensure", { email: "mock-email-9@example.com" }]
      },
      { member: "expectMeta", args: [{ hasError: false }] }
    ]);
  });

  it("compiles a typed arg as its own type, not as the text around it", async () => {
    const world = recordingWorld();
    const track = trackNamed("The client filters to unverified addresses");

    for (const scene of track?.scenes ?? []) {
      await scene.run(world);
    }

    expect(
      find(world.calls, call => call.member === "fire")?.args
    ).toStrictEqual(["filterBy", { state: "unverified" }]);
    expect(
      find(world.calls, call => call.member === "expectContext")?.args
    ).toStrictEqual([{ total: 2 }]);
  });

  it("runs no scene at parse time — a playlist is read, never played", () => {
    const world = recordingWorld();

    playlist();

    expect(world.calls).toStrictEqual([]);
  });
});

describe("T4.1 a track declares the scope its arrangement boots at (§3.1 ruling 2)", () => {
  it("carries the Background's scope for a track that arranges nothing else", () => {
    expect(trackNamed("The client sees their collection")?.scope).toStrictEqual(
      CLIENT_SCOPE
    );
  });

  it("carries the FOREIGN scope of the staff track — the hole §7.1 names", () => {
    expect(trackNamed(STAFF_TRACK)?.scope).toStrictEqual(STAFF_SCOPE);
  });

  it("leaves the scope absent where the arrangement boots nothing at all", () => {
    const { tracks } = useFeatureTracks({ feature: UNARRANGED, catalog });

    expect(size(tracks)).toBe(1);
    expect(first(tracks)?.scope).toBeUndefined();
  });
});

describe("T4.1 an unmatched step is refused out loud, never skipped", () => {
  it("lists the track, marks the unmatched scene, and refuses to play it", () => {
    const { tracks } = useFeatureTracks({ feature: UNMATCHABLE, catalog });
    const track = first(tracks);

    expect(size(tracks)).toBe(1);
    expect(countBy(track?.scenes, scene => scene.isMatched)).toStrictEqual({
      true: 2,
      false: 1
    });
    expect(track?.isPlayable).toBe(false);
  });

  it("throws rather than no-opping when the unmatched scene is asked to run", async () => {
    const { tracks } = useFeatureTracks({ feature: UNMATCHABLE, catalog });
    const world = recordingWorld();
    const unmatched = find(first(tracks)?.scenes, scene => !scene.isMatched);

    await expect(unmatched?.run(world)).rejects.toThrow();
    expect(world.calls).toStrictEqual([]);
  });

  it("blames the catalog, not the feature, when a pattern cannot compile", () => {
    const malformed = defineSteps(({ When }) => {
      When("the client {nosuchtype} the collection", world =>
        world.fire("refresh")
      );
    });

    const { malformedStepDefs } = useFeatureTracks({
      feature: PLAYLIST,
      catalog: malformed
    });

    expect(size(malformedStepDefs)).toBe(1);
    expect(first(malformedStepDefs)?.pattern).toBe(
      "the client {nosuchtype} the collection"
    );
  });
});

describe("T4.1 an empty seam is Live-only, not an error (S12 · ESC6)", () => {
  it("yields zero tracks while the corpus cannot reach app runtime", () => {
    const { tracks, malformedStepDefs } = useFeatureTracks({
      feature: "",
      catalog
    });

    expect(tracks).toStrictEqual([]);
    expect(malformedStepDefs).toStrictEqual([]);
  });
});

describe("T4.1 the REAL client-email feature, over the seam ESC6 opened (AC2.6 · K1)", () => {
  /** The FE-2824 watch-point scenario, resolved by its own tag, never by name. */
  const FE_2824 = "@fe-2824";

  const clientEmails = () =>
    useFeatureTracks({ feature: featureText, catalog: stepCatalog });

  const clientEmailsTrack = (name: string) =>
    find(clientEmails().tracks, track => track.name === name);

  /**
   * The playlist's own oracle, computed by the harness's OTHER reader of the
   * same pair: the module's ONE feature holds its not-yet-driveable scenarios
   * too, so what a page plays is the driveable subset, never every scenario the
   * file declares.
   */
  const driveable = () =>
    createTraceabilityCheck(featureText, stepCatalog, {}).driveable;

  const staffTrackName = () =>
    find(driveable(), scenario => includes(scenario.tags, FE_2824))!.name;

  it("plays the driveable subset, named exactly as the committed feature declares them", () => {
    expect(size(clientEmails().tracks)).toBe(CLIENT_EMAIL_TRACK_COUNT);
    expect(map(clientEmails().tracks, "name")).toStrictEqual(
      map(driveable(), "name")
    );
  });

  it("matches every scene against the module's OWN catalog — the whole playlist is playable", () => {
    const { tracks, malformedStepDefs } = clientEmails();

    expect(malformedStepDefs).toStrictEqual([]);
    expect(
      map(
        filter(tracks, track => !track.isPlayable),
        "name"
      )
    ).toStrictEqual([]);
  });

  it("gives each track the scenes the feature declares for it, Background first", () => {
    expect(
      map(clientEmails().tracks, track => map(track.scenes, "text"))
    ).toStrictEqual(map(driveable(), scenario => map(scenario.steps, "text")));
  });

  it("boots every track at the Background's client scope, bar the staff one", () => {
    const scoped = filter(
      clientEmails().tracks,
      track => track.name !== staffTrackName()
    );

    expect(uniq(map(scoped, track => track.scope?.actor))).toStrictEqual([
      SCOPE_ACTOR.CLIENT
    ]);
    expect(some(scoped, track => !!track.scope?.context)).toBe(false);
  });

  it("carries the staff track's FOREIGN scope — the ESC5 disagreement, made visible", () => {
    const staff = clientEmailsTrack(staffTrackName());

    expect(staff?.scope?.actor).toBe(SCOPE_ACTOR.STAFF);
    expect(staff?.scope?.context?.type).toBe("client");
    expect(staff?.scope?.context?.id).toEqual(expect.any(String));
    expect(staff?.scope).not.toStrictEqual(
      clientEmailsTrack(first(driveable())!.name)?.scope
    );
  });
});
