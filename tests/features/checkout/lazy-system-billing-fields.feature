@layer-e2e @FE-2789
Feature: Billing fields backed by lazily-loaded system data populate after their deferred load

  Countries, regions and billing cycles are no longer fetched eagerly on cart
  boot (FE-1698): they are loaded on demand the first time a flow needs them.
  These scenarios cover the user-visible promise that the populate STILL
  happens once the deferred load resolves — the address country and region
  dropdowns populate, the region list re-derives when the country changes, and
  the phone dialling-code list is present and choosable. The prefetch-timing
  and call-count guarantees stay at the integration layer; here we only assert
  what a customer at checkout can actually observe.

  Background:
    Given a customer at checkout who needs to provide billing details

  Scenario: A chosen address suggestion populates the country and region
    Given the customer is adding a new billing address
    When they choose a suggested address from the autocomplete results
    Then the country for that address is shown as selected
    And the region for that address is shown as populated

  Scenario: Changing the country re-derives the available regions
    Given the customer is adding a new billing address
    When the country dropdown has finished loading its options
    Then the country dropdown offers a list of countries to choose from
    And choosing one country then a different country re-derives the region options for the new country

  Scenario: The phone dialling-code selector is populated and choosable
    Given the customer is adding a phone number to their billing details
    When they open the phone country selector
    Then a list of dialling codes is shown
    And a dialling code can be chosen from the list
