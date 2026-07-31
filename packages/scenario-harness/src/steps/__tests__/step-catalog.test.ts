import { describe, expect, it } from "vitest";
import { fixtureSteps } from "../../__fixtures__/fixture.steps";
import { defineSteps } from "../step-catalog";

/**
 * @AC-4 — the engine-free `defineSteps`/`StepCatalog` registration surface
 * (design §4). The exemplar `fixture.steps.ts` doubles as the "import
 * surface compiles" proof (its own import surface is asserted textually in
 * `traceability.test.ts`).
 */
describe("@AC-4 defineSteps — the catalog collects StepDefs in registration order", () => {
  it("collects Given/When/Then registrations with kind/pattern/handler, in call order", () => {
    const catalog = defineSteps(({ Given, When, Then }) => {
      Given("a first thing", () => {});
      When("a second thing happens", () => {});
      Then("a third thing is observed", () => {});
    });

    expect(catalog.steps).toHaveLength(3);
    expect(catalog.steps.map(s => s.kind)).toStrictEqual([
      "Given",
      "When",
      "Then"
    ]);
    expect(catalog.steps.map(s => s.pattern)).toStrictEqual([
      "a first thing",
      "a second thing happens",
      "a third thing is observed"
    ]);
    for (const step of catalog.steps) {
      expect(typeof step.handler).toBe("function");
    }
  });

  it("collects nothing when the builder registers no steps", () => {
    const catalog = defineSteps(() => {});
    expect(catalog.steps).toStrictEqual([]);
  });

  it("the exemplar fixture catalog compiles and collects its declared steps", () => {
    expect(fixtureSteps.steps.length).toBeGreaterThan(0);
    for (const step of fixtureSteps.steps) {
      expect(["Given", "When", "Then"]).toContain(step.kind);
      expect(typeof step.pattern).toBe("string");
      expect(typeof step.handler).toBe("function");
    }
  });
});
