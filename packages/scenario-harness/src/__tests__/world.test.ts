import { afterEach, describe, expect, it } from "vitest";
import { fixtureRegistry, FIXTURE_KEY } from "../__fixtures__/fixture-registry";
import { fixtureSteps } from "../__fixtures__/fixture.steps";
import { NodeWorld } from "../__fixtures__/node-world";
import { SCOPE_ACTOR } from "../world/scope-actor";
import type { FixtureKey } from "../__fixtures__/fixture-registry";
import type { StepDef } from "../steps/steps.types";
import type { World } from "../world/world.types";

/**
 * A second, independently-implemented `World` — deliberately a different
 * internal representation (a `Map`, not a closured getter object) — proving
 * the exemplar step definitions are engine/implementation-agnostic (bdd
 * @AC-4 "the same step definitions run against a second world implementation
 * unchanged").
 */
class DoubleWorld implements World<FixtureKey> {
  private flags = new Map<string, boolean>();

  async boot(): Promise<void> {
    this.flags = new Map([
      ["isOn", false],
      ["hasLabel", false]
    ]);
  }

  async fire(actionId: string, input?: unknown): Promise<void> {
    if (actionId === "turnOn") this.flags.set("isOn", true);
    else if (actionId === "turnOff") this.flags.set("isOn", false);
    else if (actionId === "rename") {
      const { label } = input as { label: string };
      this.flags.set("hasLabel", label.length > 0);
    } else throw new Error(`double-world: unknown action "${actionId}"`);
  }

  async expectMeta(expected: Partial<Record<string, boolean>>): Promise<void> {
    for (const [flag, value] of Object.entries(expected)) {
      const live = this.flags.get(flag);
      if (live !== value) {
        throw new Error(
          `double-world: expected meta "${flag}" to be ${value}, got ${live}`
        );
      }
    }
  }

  async dispose(): Promise<void> {
    this.flags.clear();
  }
}

function findStep(pattern: string): StepDef {
  const step = fixtureSteps.steps.find(s => s.pattern === pattern);
  if (!step) throw new Error(`no registered step for pattern "${pattern}"`);
  return step;
}

async function runExemplarScenario(
  world: World<FixtureKey>,
  steps: ReadonlyArray<{ pattern: string; arg?: string }>
): Promise<void> {
  for (const { pattern, arg } of steps) {
    const step = findStep(pattern);
    if (arg === undefined) await step.handler(world);
    else await step.handler(world, arg);
  }
}

describe("@AC-4 World — the interface every step definition speaks", () => {
  let world: NodeWorld<FixtureKey>;

  afterEach(async () => {
    await world?.dispose();
  });

  it("booting establishes a live scoped module for the scenario", async () => {
    world = new NodeWorld(fixtureRegistry);
    // world-interface.feature names "guest" explicitly for this
    // scenario — the feature leads, so the test boots that actor.
    await world.boot(FIXTURE_KEY.SWITCH, { actor: SCOPE_ACTOR.GUEST });

    await expect(world.expectMeta({ isOn: false })).resolves.toBeUndefined();
  });

  it("firing an action changes the observable meta", async () => {
    world = new NodeWorld(fixtureRegistry);
    // world-interface.feature names "guest" explicitly for this
    // scenario — the feature leads, so the test boots that actor.
    await world.boot(FIXTURE_KEY.SWITCH, { actor: SCOPE_ACTOR.GUEST });

    await world.fire("turnOn");

    await expect(world.expectMeta({ isOn: true })).resolves.toBeUndefined();
  });

  it("a meta expectation is a subset match on live flags", async () => {
    world = new NodeWorld(fixtureRegistry);
    await world.boot(FIXTURE_KEY.SWITCH, { actor: "self" });
    await world.fire("rename", { label: "demo" });

    // Live flags: { isOn: false, hasLabel: true } — naming only one is a
    // subset match, and it must still pass.
    await expect(world.expectMeta({ hasLabel: true })).resolves.toBeUndefined();
  });

  it("a mismatched meta expectation fails, naming the mismatched flag", async () => {
    world = new NodeWorld(fixtureRegistry);
    await world.boot(FIXTURE_KEY.SWITCH, { actor: "self" });

    await expect(world.expectMeta({ isOn: true })).rejects.toThrow(/isOn/);
  });

  it("disposal isolates scenarios — no state from the earlier scenario is observable", async () => {
    world = new NodeWorld(fixtureRegistry);
    await world.boot(FIXTURE_KEY.SWITCH, { actor: "self" });
    await world.fire("turnOn");
    await world.fire("rename", { label: "demo" });
    await expect(
      world.expectMeta({ isOn: true, hasLabel: true })
    ).resolves.toBeUndefined();

    await world.dispose();
    await world.boot(FIXTURE_KEY.SWITCH, { actor: "self" });

    await expect(
      world.expectMeta({ isOn: false, hasLabel: false })
    ).resolves.toBeUndefined();
  });

  it("an action named constructor is handled honestly — never silently resolved via Object.prototype", async () => {
    world = new NodeWorld(fixtureRegistry);
    await world.boot(FIXTURE_KEY.SWITCH, { actor: SCOPE_ACTOR.GUEST });

    await expect(world.fire("constructor")).rejects.toThrow(/constructor/);
  });

  it("an action named toString is handled honestly — never silently resolved via Object.prototype", async () => {
    world = new NodeWorld(fixtureRegistry);
    await world.boot(FIXTURE_KEY.SWITCH, { actor: SCOPE_ACTOR.GUEST });

    await expect(world.fire("toString")).rejects.toThrow(/toString/);
  });

  it("the same step definitions run against a second world implementation unchanged", async () => {
    const nodeWorld = new NodeWorld(fixtureRegistry);
    const doubleWorld = new DoubleWorld();

    for (const target of [nodeWorld, doubleWorld]) {
      await runExemplarScenario(target, [
        { pattern: "a fresh fixture switch" }
      ]);
      await runExemplarScenario(target, [
        { pattern: "the switch reports itself as off" }
      ]);

      await runExemplarScenario(target, [
        { pattern: "the switch is turned on" },
        { pattern: "the switch reports itself as on" }
      ]);

      await runExemplarScenario(target, [
        { pattern: "the switch is labelled {string}", arg: "demo" },
        { pattern: "the switch reports a label is set" }
      ]);

      await target.dispose();
    }
  });
});
