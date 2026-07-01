@layer-e2e @journey:partial-payment-change-amount
Feature: Partial payment and change pay amount

  A customer can choose to pay part of an outstanding balance rather than the
  full amount due, and can adjust the payment amount before confirming. The
  order reflects the partial payment and the remaining balance is tracked.

  Background:
    Given an existing customer who is logged in
    And the customer has an outstanding balance on their account

  Scenario: Customer is shown the full amount due by default
    When the customer opens the payment screen for an outstanding balance
    Then the full amount due is shown as the default payment amount

  Scenario: Customer changes the payment amount to a partial amount
    Given the customer is on the payment screen for an outstanding balance
    When they change the payment amount to a partial amount
    Then the updated amount is shown as the amount to be charged
    And the remaining balance after payment is shown

  Scenario: Customer completes a partial payment
    Given the customer has set a partial payment amount
    When they confirm payment
    Then the partial payment is processed successfully
    And the remaining balance on the account is reduced by the paid amount

  Scenario: Customer cannot enter a payment amount exceeding the balance due
    Given the customer is on the payment screen for an outstanding balance
    When they attempt to set a payment amount greater than the total due
    Then the amount is capped at the total due
    And they cannot proceed with an amount exceeding the balance

  Scenario: Customer cannot enter a zero or negative payment amount
    Given the customer is on the payment screen for an outstanding balance
    When they attempt to set the payment amount to zero or below
    Then they are shown a validation error
    And they cannot proceed until a valid amount is entered
