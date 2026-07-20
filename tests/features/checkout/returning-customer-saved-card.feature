@layer-e2e @journey:returning-customer-saved-card
Feature: Returning customer buys with a saved card

  An existing customer who previously saved a payment card can complete a new
  purchase without re-entering card details — the saved card is pre-selected
  and payment is confirmed in a single step.

  Background:
    Given an existing customer who is logged in
    And the customer has at least one saved payment card on their account
    And the customer has added a paid product to their basket

  Scenario: Saved card is pre-selected at checkout
    When the customer proceeds to the payment step
    Then their saved card is shown as the selected payment method

  Scenario: Customer completes purchase using their saved card
    Given the customer is on the payment step with their saved card selected
    When they confirm the payment
    Then the order is placed successfully
    And the customer receives an order confirmation

  Scenario: Customer chooses a different saved card at checkout
    Given the customer has more than one saved card on their account
    And the customer is on the payment step
    When they select a different saved card
    And confirm the payment
    Then the order is placed using the chosen card
    And the customer receives an order confirmation

  Scenario: Customer adds a new card instead of using a saved card
    Given the customer is on the payment step with their saved card pre-selected
    When they choose to pay with a different card and provide new card details
    And confirm the payment
    Then the order is placed successfully
