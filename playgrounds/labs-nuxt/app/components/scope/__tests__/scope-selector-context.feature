@scope @FE-3239
Feature: The playground can be scoped to a catalogue
  As an operator driving the labs playground
  I want the scope bar to offer a catalogue the same way it offers a client
  So that a catalogue context is reachable and inspectable from the page

  Background:
    Given a playground page booted on a module that declares catalogue contexts

  @AC-6 @layer-component
  Scenario: The playground operator scopes a page to a catalogue
    # Protects against: the scope picker demanding an entity id that a catalogue
    # does not have, leaving the capability unreachable from the playground.
    When the operator picks a catalogue from the scope bar
    Then the page is scoped to that catalogue
    And the operator is never asked for an entity id
    And every catalogue the module declares is offered, not just the first
