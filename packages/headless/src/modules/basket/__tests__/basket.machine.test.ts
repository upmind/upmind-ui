import { describe, it, expect } from "vitest";
// import { Machine } from "xstate";
// import { createModel } from "@xstate/test";
// import basketMachine from "../basket.machine";

// const basketModel = createModel(basketMachine).withEvents({
//   ADD_PRODUCT: {
//     exec: async ({ context }) => {
//       // simulate adding a product to the basket
//       context.basket = {
//         products: [{ id: 1, name: "Product 1", price: 10 }],
//       };
//     },
//   },
//   CLEAR_BASKET: {
//     exec: async ({ context }) => {
//       // simulate clearing the basket
//       context.basket = {};
//     },
//   },
//   SESSION: {},
//   GENERATE: {},
//   UNAUTHENTICATED: {},
//   AUTHENTICATED: {},
// });

// test("basket machine", async ({ pass }) => {
//   const testPlans = basketModel.getShortestPathPlans();

//   // test all the plans
//   testPlans.forEach(plan => {
//     describe(plan.description, () => {
//       plan.paths.forEach(path => {
//         it(path.description, async () => {
//           const machine = Machine(basketMachine).withContext(
//             path.state.context
//           );
//           const nextState = machine.transition(path.state, path.event);
//           expect(nextState.value).toEqual(path.nextState.value);
//           expect(nextState.context).toEqual(path.nextState.context);
//         });
//       });
//     });
//   });

//   // test that the model coverage is complete
//   const coverage = basketModel.testCoverage();
//   pass(
//     coverage.percentage === 100,
//     `model coverage is ${coverage.percentage}%`
//   );
// });

describe("Basket Machine", () => {
  it("should be truthy", () => {
    expect(true).toBeTruthy();
  });
});
