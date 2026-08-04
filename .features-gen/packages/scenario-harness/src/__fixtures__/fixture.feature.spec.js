// Generated from: packages/scenario-harness/src/__fixtures__/fixture.feature
import { test } from "../../../../../playwright.bdd.config.ts";

test.describe("Fixture switch exemplar", () => {
  test(
    "A fresh switch starts off",
    { tag: ["@AC-4", "@AC-5"] },
    async ({ Given, Then }) => {
      await Given("a fresh fixture switch");
      await Then("the switch reports itself as off");
    }
  );

  test(
    "Turning the switch on updates its status",
    { tag: ["@AC-4", "@AC-5"] },
    async ({ Given, When, Then }) => {
      await Given("a fresh fixture switch");
      await When("the switch is turned on");
      await Then("the switch reports itself as on");
    }
  );

  test(
    "Labelling the switch sets its label status",
    { tag: ["@AC-4", "@AC-5"] },
    async ({ Given, When, Then }) => {
      await Given("a fresh fixture switch");
      await When('the switch is labelled "demo"');
      await Then("the switch reports a label is set");
    }
  );

  test(
    "Turning the switch off after it was on updates its status",
    { tag: ["@AC-4", "@AC-5"] },
    async ({ Given, When, Then }) => {
      await Given("a fixture switch that is on");
      await When("the switch is turned off");
      await Then("the switch reports itself as off");
    }
  );
});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: "test", box: true }],
  $uri: [
    ({}, use) =>
      use("packages/scenario-harness/src/__fixtures__/fixture.feature"),
    { scope: "test", box: true }
  ],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
  $world: [({ world }, use) => use(world), { scope: "test", box: true }]
});

const bddFileData = [
  // bdd-data-start
  {
    pwTestLine: 6,
    pickleLine: 11,
    tags: ["@AC-4", "@AC-5"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 12,
        keywordType: "Context",
        textWithKeyword: "Given a fresh fixture switch",
        stepMatchArguments: []
      },
      {
        pwStepLine: 8,
        gherkinStepLine: 13,
        keywordType: "Outcome",
        textWithKeyword: "Then the switch reports itself as off",
        stepMatchArguments: []
      }
    ]
  },
  {
    pwTestLine: 11,
    pickleLine: 15,
    tags: ["@AC-4", "@AC-5"],
    steps: [
      {
        pwStepLine: 12,
        gherkinStepLine: 16,
        keywordType: "Context",
        textWithKeyword: "Given a fresh fixture switch",
        stepMatchArguments: []
      },
      {
        pwStepLine: 13,
        gherkinStepLine: 17,
        keywordType: "Action",
        textWithKeyword: "When the switch is turned on",
        stepMatchArguments: []
      },
      {
        pwStepLine: 14,
        gherkinStepLine: 18,
        keywordType: "Outcome",
        textWithKeyword: "Then the switch reports itself as on",
        stepMatchArguments: []
      }
    ]
  },
  {
    pwTestLine: 17,
    pickleLine: 20,
    tags: ["@AC-4", "@AC-5"],
    steps: [
      {
        pwStepLine: 18,
        gherkinStepLine: 21,
        keywordType: "Context",
        textWithKeyword: "Given a fresh fixture switch",
        stepMatchArguments: []
      },
      {
        pwStepLine: 19,
        gherkinStepLine: 22,
        keywordType: "Action",
        textWithKeyword: 'When the switch is labelled "demo"',
        stepMatchArguments: [
          {
            group: {
              start: 23,
              value: '"demo"',
              children: [
                { start: 24, value: "demo", children: [{}] },
                { children: [{}] }
              ]
            },
            parameterTypeName: "string"
          }
        ]
      },
      {
        pwStepLine: 20,
        gherkinStepLine: 23,
        keywordType: "Outcome",
        textWithKeyword: "Then the switch reports a label is set",
        stepMatchArguments: []
      }
    ]
  },
  {
    pwTestLine: 23,
    pickleLine: 25,
    tags: ["@AC-4", "@AC-5"],
    steps: [
      {
        pwStepLine: 24,
        gherkinStepLine: 26,
        keywordType: "Context",
        textWithKeyword: "Given a fixture switch that is on",
        stepMatchArguments: []
      },
      {
        pwStepLine: 25,
        gherkinStepLine: 27,
        keywordType: "Action",
        textWithKeyword: "When the switch is turned off",
        stepMatchArguments: []
      },
      {
        pwStepLine: 26,
        gherkinStepLine: 28,
        keywordType: "Outcome",
        textWithKeyword: "Then the switch reports itself as off",
        stepMatchArguments: []
      }
    ]
  }
]; // bdd-data-end
