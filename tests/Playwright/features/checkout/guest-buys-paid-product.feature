@layer-e2e @journey:guest-buys-paid-product
Feature: Guest buys a paid product

  A visitor who does not have an account can add a paid product to their basket,
  proceed through checkout as a guest, and complete payment — resulting in an
  active order without having created a full account.

  Background:
    Given a guest visitor on a brand that allows guest checkout
    And the catalogue has at least one paid product available for purchase

  Scenario: Guest completes a one-time purchase
    Given the visitor has added a paid product to their basket
    And the visitor has entered guest checkout
    When they provide valid payment details and confirm the order
    Then the order is placed successfully
    And the visitor receives an order confirmation

  Scenario: Guest is offered a full-account upgrade after purchase
    Given the visitor has just completed a guest purchase
    When the order confirmation is shown
    Then the visitor is offered the option to create a full account

  Scenario: Guest checkout is not available for subscription products
    Given the visitor's basket contains a subscription product
    When the visitor proceeds to checkout
    Then guest checkout is not offered as an option
    And the visitor is required to register or log in
