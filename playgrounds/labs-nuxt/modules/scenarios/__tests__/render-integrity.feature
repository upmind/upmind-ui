@FE-3125
Feature: Render integrity of the labs playground

  A green suite proved shape, not capability: an undeclared prop renders as a
  bare DOM attribute and an unmapped icon name renders a fallback glyph, so a
  labelless button and a blank sidebar both passed every count-based assertion.
  These are the two gates that make the empty-render class fail loudly.

  Background:
    Given the labs-nuxt playground source under app and modules

  @AC-8 @layer-unit @developer
  Scenario: No call site passes an undeclared prop to a design-system component
    Given a component imported from @upmind/ui
    And that component's own published types.ts
    When the call site binds a prop from the retired vocabulary
    Then the prop must be one the component declares
    And the sweep names the file, the component and the prop when it is not

  @AC-8 @layer-unit @developer
  Scenario: The sweep can tell an offence from a clean call site
    Given one source binding a retired prop the component never declared
    And one source binding only declared props
    Then the sweep reports the first and clears the second

  @AC-10 @layer-unit @developer
  Scenario: Every declared icon name resolves to a real glyph
    Given an icon name spelled in a template attribute or a config property
    When the Icon component is asked for that name
    Then it must not land on the fallback glyph
    And the sweep names the file and the name when it does

  @AC-10 @layer-unit @developer
  Scenario: The sweep can tell a resolved name from an unresolved one
    Given a name the lucide map carries
    And a name from the retired Untitled-UI vocabulary
    Then the sweep clears the first and reports the second
