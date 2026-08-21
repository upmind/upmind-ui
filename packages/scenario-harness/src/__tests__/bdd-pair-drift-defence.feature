# Realized as unit tests over `createTraceabilityCheck()` —
# src/steps/__tests__/traceability.test.ts, run against the exemplar pair in
# __fixtures__/. The first scenario also runs end to end under playwright-bdd
# (root test:bdd lane).

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

  Scenario: A Scenario Outline's steps match the catalog after Examples-row expansion
    Given a feature scenario outline with an Examples table
    When the traceability check runs
    Then every expanded row's steps match the catalog

  Scenario: A Background step is checked the same as any other scenario step
    Given a feature background step with a matching step definition
    When the traceability check runs
    Then the background step counts as matched

  Scenario: A Background step with no matching definition is still red
    Given a feature background step with no matching step definition
    When the traceability check runs
    Then the check fails naming the unmatched background step

  Scenario: A DocString or DataTable body is never parsed as a step of its own
    Given a feature step carrying a docstring or data table body
    When the traceability check runs
    Then the docstring or data table content is not treated as a step

  Scenario: An unregistered custom parameter type is a structured failure, not a thrown error
    Given a step definition whose pattern names an unregistered custom parameter type
    When the traceability check runs
    Then the check reports a malformed step definition naming the pattern
    And the traceability check does not throw
