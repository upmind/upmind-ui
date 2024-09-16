import { test, describe, it, expect } from "vitest";
import { createModel } from "@xstate/test";
import domainsMachine from "@/modules/domain/domain.machine";

const domainsModel = createModel(domainsMachine);

test("domains machine", async () => {
  const testPlans = domainsModel.getShortestPathPlans();
  // const testPlans = domainsModel.getSimplePathPlans();

  // test all the plans
  testPlans.forEach(plan => {
    describe(plan.description, () => {
      plan.paths.forEach(path => {
        it(path.description, async () => {
          const machine = domainsMachine.withContext(path.state.context);

          // await path.test({ events: {} });
          const nextState = machine.transition(path.state, path.event);
          expect(nextState.value).toEqual(path.nextState.value);
          expect(nextState.context).toEqual(path.nextState.context);
        });
      });

      // it('should have full coverage', () => {
      //   return model.testCoverage();
      //
      //   const coverage = domainsModel.testCoverage();
      //   console.log(`Code coverage is ${coverage.percentage}%`);
      //   expect(coverage.percentage).toEqual(100);
      // });
    });
  });
});
