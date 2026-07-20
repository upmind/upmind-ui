@layer-e2e @journey:promo-then-pay
Feature: Customer applies a promo code then pays

  A customer can apply a promotional code to their basket before checkout,
  see the discount reflected in the total, and then complete payment at the
  reduced price.

  Background:
    Given an existing customer who is logged in
    And the customer has added a paid product to their basket

  Scenario: Valid promo code reduces the basket total
    When the customer applies a valid promo code
    Then the discount is shown against the product
    And the basket total reflects the reduced price

  Scenario: Customer completes payment after applying a promo code
    Given the customer has applied a valid promo code to their basket
    When they proceed through checkout and confirm payment
    Then the order is placed at the discounted total
    And the customer receives an order confirmation showing the applied discount

  Scenario: Expired promo code is rejected
    When the customer applies an expired promo code
    Then the code is rejected with a clear message
    And the basket total is unchanged

  Scenario: Invalid promo code is rejected
    When the customer applies a code that does not exist
    Then the code is rejected with a clear message
    And the basket total is unchanged

  Scenario: Promo code can be removed after being applied
    Given the customer has applied a valid promo code to their basket
    When the customer removes the promo code
    Then the basket total returns to the original price
    And no discount is shown
