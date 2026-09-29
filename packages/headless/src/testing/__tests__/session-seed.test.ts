/**
 * @fileoverview seedSessionFor tests
 *
 * ## Job To Be Done
 * A scenario boots behind a real authenticated client session by default, and
 * behind the module's own guest session only when it carries `@signed-out`.
 * `seedSessionFor` is the switch: it seeds a client unless the scenario's own
 * tags name the signed-out tag, in which case it seeds the guest floor instead.
 *
 * ## What Breaks If These Fail
 * A signed-out scenario is seeded with a client session it never wanted (so its
 * denial recordings replay against the wrong identity), or every other scenario
 * loses its client seed and replays as a guest.
 */

import { describe, expect, it, vi } from "vitest";
import { seedSessionFor, SIGNED_OUT_TAG } from "../session-seed";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

function scenarioWith(tags: string[]): FeatureScenario {
  return {
    name: "a scenario",
    tags,
    line: 1,
    steps: [],
    backgroundStepCount: 0
  };
}

function seedClientSessionSpy() {
  return vi.fn(async () => ({ clientId: "client-1", accessToken: "token-1" }));
}

function seedGuestSessionSpy() {
  return vi.fn(async () => undefined);
}

describe("seedSessionFor", () => {
  it("seeds a client session, not the guest floor, for a scenario with no signed-out tag", async () => {
    const seedClientSession = seedClientSessionSpy();
    const seedGuestSession = seedGuestSessionSpy();

    await seedSessionFor(
      scenarioWith(["@AC-1"]),
      seedClientSession,
      seedGuestSession
    );

    expect(seedClientSession).toHaveBeenCalledTimes(1);
    expect(seedGuestSession).not.toHaveBeenCalled();
  });

  it("seeds the guest floor, not a client session, for a scenario tagged signed-out", async () => {
    const seedClientSession = seedClientSessionSpy();
    const seedGuestSession = seedGuestSessionSpy();

    await seedSessionFor(
      scenarioWith(["@AC-1", SIGNED_OUT_TAG]),
      seedClientSession,
      seedGuestSession
    );

    expect(seedClientSession).not.toHaveBeenCalled();
    expect(seedGuestSession).toHaveBeenCalledTimes(1);
  });
});
