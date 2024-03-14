import { test, describe, it, expect } from "vitest";
import { Machine } from "xstate";
import { createModel } from "@xstate/test";
import domainsMachine from "../domain.machine";

const domainsModel = createModel(domainsMachine).withEvents({
  ADD_PRODUCT: {
    exec: async ({ context }) => {
      // simulate adding a product to the domains
      context.domains = {
        "pewpew.com": { domain: "pewpew.com", sld: "pewpew", tld: ".com" },
      };
    },
  },
  CLEAR_BASKET: {
    exec: async ({ context }) => {
      // simulate clearing the domains
      context.domains = {};
    },
  },
  SESSION: {},
  GENERATE: {},
  UNAUTHENTICATED: {},
  AUTHENTICATED: {},
});

test("domains machine", async ({ pass }) => {
  const testPlans = domainsModel.getShortestPathPlans();

  // test all the plans
  testPlans.forEach(plan => {
    describe(plan.description, () => {
      plan.paths.forEach(path => {
        it(path.description, async () => {
          const machine = Machine(domainsMachine).withContext(
            path.state.context
          );
          const nextState = machine.transition(path.state, path.event);
          expect(nextState.value).toEqual(path.nextState.value);
          expect(nextState.context).toEqual(path.nextState.context);
        });
      });
    });
  });

  // test that the model coverage is complete
  const coverage = domainsModel.testCoverage();
  pass(
    coverage.percentage === 100,
    `model coverage is ${coverage.percentage}%`
  );
});
