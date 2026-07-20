@layer-journey @surface-storefront @who-guest @payment-stripe
Feature: storefront-guest-oneoff-checkout-stripe

  A visitor without an account buys a single one-off product from the
  storefront and pays with a card via Stripe, ending on a placed order —
  without ever creating a full account. The Feature name is the journey slug
  (ADR 025): the same vocabulary names the folder, the replay scope, and both
  runners' files.

  Background:
    Given a guest visitor on a storefront brand that allows guest checkout
    And the catalogue offers at least one paid one-off product priced in the brand currency

  Scenario: A guest is booted with a guest session
    When the storefront boots
    Then the visitor holds a guest session
    And the visitor is not treated as an authenticated account

  Scenario: A guest adds a one-off product and sees a recalculated total
    Given the visitor has a guest session
    When the visitor adds the paid one-off product to their basket
    Then the basket holds that product
    And the basket total is recalculated in the brand currency

  Scenario: A guest pays with Stripe and the order is placed
    Given the visitor has a one-off product in their basket
    And Stripe is offered as a payment method for the basket
    When the visitor pays with a card via Stripe and confirms
    Then the order is placed in the brand currency
    And the visitor receives an order confirmation
