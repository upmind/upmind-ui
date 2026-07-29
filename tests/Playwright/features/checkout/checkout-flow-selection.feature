@checkout @FE-3002
Feature: Checkout flow selection
  As a brand operator
  I want the checkout flow my brand is configured for to be the flow customers get
  So that checkout behaviour is predictable and easy to support

  @FE-3002 @layer-e2e @smoke
  Scenario: The brand's configured flow decides the checkout presentation
    Given the brand is configured for the one-page checkout flow
    When a customer with a product in their basket proceeds to checkout
    Then they are presented with the one-page checkout

  @FE-3002 @layer-e2e
  Scenario: The flow link parameter overrides the brand default for that visit
    Given the brand is configured for the stepped checkout flow
    When a customer enters the shop through a link requesting the one-page flow
    Then they are presented with the one-page checkout

  @FE-3002 @layer-e2e
  Scenario: A flow override is forgotten on a fresh visit
    Given the brand is configured for the stepped checkout flow
    And a customer previously entered through a link requesting the one-page flow
    When they return to the shop without the flow link
    Then they are presented with the stepped checkout

  @FE-3002 @layer-e2e
  Scenario: The basket contents do not change the brand's checkout flow
    Given the brand is configured for the one-page checkout flow
    And the basket contains products from several categories
    When the customer proceeds to checkout
    Then they are presented with the one-page checkout

  @FE-3002 @layer-e2e @smoke
  Scenario: A brand with no configured flow keeps the classic stepped journey
    Given the brand has no checkout flow configured
    And the basket does not require additional order details
    When a customer with a product in their basket proceeds to checkout
    Then they are presented with the stepped checkout
    And they can reach the payment step without being returned to the basket

  @FE-3002 @layer-e2e
  Scenario: A customer is never left at a checkout they cannot complete
    Given the brand has no checkout flow configured
    And a customer reaches the checkout with a product still needing setup details
    When they open the checkout
    Then they can provide the setup details on the checkout itself
    And they are not sent back to a separate setup page
    And they can place the order once the details are provided

  @FE-3002 @layer-e2e
  Scenario: An itemised order summary is available on any layout
    Given the brand uses the two-column layout with an itemised order summary configured
    When a customer with a configured product proceeds to checkout
    Then the order summary lists the product's chosen options
    And they are presented with the two-column checkout
