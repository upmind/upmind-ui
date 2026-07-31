# Realized as unit tests over `createTraceabilityCheck()` —
# src/steps/__tests__/traceability.test.ts, run against the exemplar pair in
# __fixtures__/ (bdd.md "The BDD pair stays in lockstep"). The first scenario
# also runs end to end under playwright-bdd (root test:bdd lane).

@AC-5
Feature: The BDD pair stays in lockstep
  As a developer trusting the feature file as the only spec
  I want the feature and its step definitions checked against each other both ways
  So that the spec and its execution can never silently drift

  Scenario: The exemplar pair runs green end to end
    Given the fixture module with its feature file and step definitions
    When the feature runs through the Node world
    Then every scenario passes

  Scenario: A feature step with no matching step definition is red
    Given a feature scenario gains a step no definition matches
    When the traceability check runs
    Then the check fails naming the unmatched step

  Scenario: A step definition matching no feature step is red
    Given a step definition no feature scenario uses
    When the traceability check runs
    Then the check fails naming the orphan definition

  Scenario: Step definitions import nothing engine-specific
    Given the exemplar step definitions
    When their import surface is inspected
    Then it contains only the world interface and the shared keys
