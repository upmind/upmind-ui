Feature: Force-state presets vary by module capabilities

  Background:
    Given I am viewing a scenario page

  @layer-unit
  Scenario: Read-only module shows only read presets
    Given the scenario has no mutation composable
    When I open the force-state picker
    Then I see presets: empty, loading, error-collection
    And I do not see preset: error-action

  @layer-unit
  Scenario: Module with mutations shows all presets
    Given the scenario has a mutation composable
    When I open the force-state picker
    Then I see presets: empty, loading, error-action, error-collection
