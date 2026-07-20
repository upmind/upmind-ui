@layer-e2e @journey:renew-contract-product
Feature: Customer renews a contract product

  A customer with an active contract product (e.g. a hosting plan on a fixed
  term) can initiate renewal before or at expiry, select a renewal term, and
  complete the renewal payment — extending the contract period on their order.

  Background:
    Given an existing customer who is logged in
    And the customer has at least one contract product on their account

  Scenario: Customer can initiate renewal on an active contract
    Given the customer's contract product is active and approaching its renewal date
    When they view the order detail for that product
    Then the option to renew is available

  Scenario: Customer renews for the default term
    Given the customer has initiated renewal on a contract product
    When they confirm the renewal with the default term selected
    Then the renewal order is placed successfully
    And the contract's next renewal date is updated accordingly

  Scenario: Customer renews for a different term
    Given the customer has initiated renewal on a contract product
    When they select a different renewal term and confirm
    Then the renewal order is placed for the chosen term
    And the contract's next renewal date reflects the selected term

  Scenario: Customer renews using a saved card
    Given the customer has a saved payment card on their account
    And the customer has initiated renewal on a contract product
    When they confirm payment using their saved card
    Then the renewal order is placed successfully

  Scenario: Expired contract can still be renewed
    Given the customer's contract product has expired
    When they view the order detail for that product
    Then the option to renew is still available
    And they can complete a renewal to reactivate the contract
