@layer-e2e @journey:free-trial-activation
Feature: Free trial activation

  A customer can add a free-trial product to their basket and activate it
  without providing payment details — the trial begins immediately and the
  customer is billed only when the trial period ends, if they have not cancelled.

  Background:
    Given an existing customer who is logged in
    And the catalogue has at least one product available with a free trial

  Scenario: Free-trial product can be added to the basket
    When the customer adds a free-trial product to their basket
    Then the product is shown in the basket with a zero amount due now
    And the trial end date and future billing amount are shown

  Scenario: Free trial activates without requiring payment details
    Given the customer has a free-trial product in their basket
    When they proceed through checkout and confirm the trial activation
    Then the trial is activated without payment being taken
    And the customer receives a confirmation that the trial has started

  Scenario: Active trial appears on the customer's orders list
    Given the customer has activated a free trial
    When they view their orders
    Then the trial product is shown as an active order
    And the trial expiry date is displayed

  Scenario: Customer cannot activate a trial for a product they already have active
    Given the customer already has an active trial or subscription for a product
    When they attempt to add the same product as a new trial
    Then they are informed they already have this product active
    And they cannot add a duplicate trial
