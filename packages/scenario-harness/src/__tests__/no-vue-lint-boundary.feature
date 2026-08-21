# Realized as the workspace-lint red/green transcript pair — the known-bad
# patches under __tests__/known-bad/ prove the boundary red-on-inject,
# green-on-revert. @lint-run: the Then is the lint run's exit status, not a
# vitest assertion.

@AC-1 @lint-run
Feature: The generation core carries no framework code
  As a developer reusing the core outside this product
  I want any framework import inside the core to fail lint
  So that agnosticism is proven mechanically, not asserted

  Scenario: The shipped core lints green
    Given the core package as shipped
    When the workspace lint runs
    Then the run passes with no boundary violation

  Scenario: A vue import inside the core turns the lint run red
    Given a core file with a vue import added
    When the workspace lint runs
    Then the run fails reporting the banned import
    And removing the import returns the run to green

  Scenario: A type-only import of a vue-coupled workspace package is also red
    Given a core file importing only types from a vue-coupled workspace package
    When the workspace lint runs
    Then the run fails reporting the banned import

# The second scenario above is the story's known-bad negative control: the bad
# fixture must go red before the boundary counts as proven.
