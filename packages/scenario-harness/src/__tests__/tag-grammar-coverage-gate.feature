# Realized as unit tests over `runGate()` — src/gate/__tests__/coverage-gate.test.ts.

@AC-7
Feature: Playground tag grammar and the coverage gate
  As a developer trusting the coverage verdict
  I want the gate to read explicit tags only
  So that every exemption is a visible decision, never a heuristic

  Scenario: An excluded action is skipped with its reason recorded
    Given an action tagged playground-exclude with a reason
    When the coverage gate runs
    Then the action's verdict is exempt
    And the recorded reason is the tag's reason

  Scenario: An included action with no covering step is red
    Given an action tagged playground-include
    And no registered step covers it
    When the coverage gate runs
    Then the gate is red for that action as uncovered

  Scenario: An untagged input-taking action is red
    Given an action with an input schema and no playground tag
    When the coverage gate runs
    Then the gate is red for that action as untagged

  Scenario: An exclusion without a reason is red
    Given an action tagged playground-exclude with no reason
    When the coverage gate runs
    Then the gate is red for that action as missing its reason

  Scenario: A step naming an action that is not live is red
    Given a registered step covering an action name absent from the live enumeration
    When the coverage gate runs
    Then the gate is red for that step as dead

  Scenario: An untagged action without an input schema defaults to included
    Given an action with no input schema and no playground tag
    And no registered step covers it
    When the coverage gate runs
    Then the gate is red for that action as uncovered, not as untagged
