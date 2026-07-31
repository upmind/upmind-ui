# Realized as unit tests over the in-process Node world —
# src/__tests__/world.test.ts (bdd.md "The world interface").

@AC-4
Feature: The world interface every step definition speaks
  As a developer writing step definitions once
  I want steps to speak only boot, fire and meta expectations
  So that the same steps run unchanged in any execution channel

  Scenario: Booting establishes a live scoped module for the scenario
    Given no module is booted
    When the world boots the auth module as a guest
    Then meta expectations evaluate against that module's live flags

  Scenario: Firing an action changes the observable meta
    Given the auth module booted as a guest
    When the world fires a state-changing action
    Then the expected meta flags pass against the live flags

  Scenario: A meta expectation is a subset match on live flags
    Given a booted module whose live flags outnumber the expectation's names
    When the expectation names only a subset and every named flag agrees
    Then the expectation passes

  Scenario: A mismatched meta expectation fails naming the mismatched flag
    Given a booted module
    When an expectation names a flag whose live value differs
    Then the expectation fails
    And the failure names the mismatched flag

  Scenario: Disposal isolates scenarios
    Given a booted module mutated by fired actions
    When the world is disposed and a new boot occurs
    Then no state from the earlier scenario is observable

  Scenario: The same step definitions run against a second world implementation unchanged
    Given step definitions that speak only through the world interface
    When they are registered against a differently implemented world
    Then they run without modification
