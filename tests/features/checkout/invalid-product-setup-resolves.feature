@layer-e2e @journey:invalid-product-setup-resolves
Feature: Customer adds an invalid product and product-setup resolves

  When a customer adds a product that requires configuration (e.g. a domain or
  server with missing setup data), the checkout flow surfaces the setup step
  and allows the customer to resolve it before completing the order. An order
  cannot be placed while any product in the basket has unresolved setup.

  Background:
    Given an existing customer who is logged in

  Scenario: Checkout is blocked when a product has missing setup data
    Given the customer has added a product that requires configuration to their basket
    When they proceed to checkout
    Then they are shown the product setup step
    And they cannot advance to payment until setup is complete

  Scenario: Customer completes product setup and proceeds to checkout
    Given the customer is on the product setup step for a product requiring configuration
    When they provide the required setup details
    Then the setup step is marked as complete
    And the customer can proceed to the payment step

  Scenario: Order is placed after resolving all product setup
    Given the customer has resolved setup for all products in their basket
    When they confirm payment
    Then the order is placed successfully
    And the customer receives an order confirmation

  Scenario: Multiple products — only the invalid one requires setup
    Given the customer's basket contains one configured product and one product requiring setup
    When they proceed to checkout
    Then only the product requiring setup is flagged
    And the customer can complete setup for that product without affecting the other
