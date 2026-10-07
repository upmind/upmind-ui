@checkout @FE-3274
Feature: Billing details saved after registering at checkout
  As a shopper who registers at checkout
  I want the billing details I save to be applied to my order at once
  So that I can continue checkout without a page refresh

  Background:
    Given my basket contains a product
    And I am on the checkout page as a guest

  @FE-3274 @layer-e2e
  Scenario: An address saved after registering with a required phone is applied to the order
    Given the brand requires a phone number at registration
    And I have registered at checkout with a phone number
    When I save a new billing address
    Then my order uses that billing address

  @FE-3274 @layer-e2e
  Scenario: An address saved after registering without a phone is applied to the order
    Given the brand does not require a phone number at registration
    And I have registered at checkout without a phone number
    When I save a new billing address
    Then my order uses that billing address

  @FE-3274 @layer-e2e
  Scenario: A company saved after registering with a required phone is applied to the order
    Given the brand requires a phone number at registration
    And I have registered at checkout with a phone number
    When I save a new company as my billing details
    Then my order uses that company
