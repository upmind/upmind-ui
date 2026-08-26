@FE-3125
Feature: Homepage Card Grammar Migration

  The homepage scenario grid uses Card components from @upmind/ui.
  Cards display scenario entries with icon, title, and tags.

  Background:
    Given the labs-nuxt playground is running
    And scenario entries are available

  @D-1 @developer
  Scenario: Header metrics and tag chips render their content
    Given the registry yields composables, families and scenario coverage
    When the homepage renders
    Then each header metric shows its own derived count as text
    And no element carries a label or icon it was never declared to accept

  @D-2 @developer
  Scenario: Scenario cards render with Card component grammar
    When the homepage renders
    Then each scenario entry renders inside a Card component
    And the card header contains the scenario icon
    And the card header contains the scenario title
    And the card header contains tag badges

  @D-2 @developer
  Scenario: Card content uses design-system tokens
    When the homepage renders
    Then cards use token-based styling
    And no inline CSS variables are present

  @contract @developer
  Scenario: Scenario data is preserved after card migration
    Given a set of scenario entries with icons, labels, and tags
    When the homepage renders
    Then all scenario entries are displayed
    And each entry shows its icon
    And each entry shows its label
    And each entry shows its tags

  @contract @developer
  Scenario: Cards are navigable links
    When the homepage renders
    Then each card is wrapped in or contains a navigation link
    And clicking a card navigates to the scenario route
