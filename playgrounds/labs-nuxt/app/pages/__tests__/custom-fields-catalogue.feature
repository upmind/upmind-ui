@scope @FE-3034
Feature: The custom-fields page can be read against any catalogue its brand keeps
  As an operator driving the custom-fields playground page
  I want that page's own scope bar to offer the catalogues the module declares
  So that a catalogue is reachable from the page, and the list follows the pick

  Background:
    Given the custom-fields page booted on the module's own declaration

  @AC-1 @layer-component
  Scenario: The page offers the catalogues its own module declares
    # Protects against: the module gaining a catalogue axis the page never
    # offers, so the capability is unreachable from the page that drives it.
    When the operator opens the acting-for picker on the custom-fields page
    Then every catalogue that module itself declares is offered there

  @AC-2 @layer-component
  Scenario: The list follows the catalogue the operator picks
    # Protects against: the pick moving the address while the page keeps
    # serving the catalogue it was already showing.
    When the operator picks a catalogue on the custom-fields page
    Then the page is scoped to that catalogue
    And the list is read again for it, leaving the catalogue it was showing alone
