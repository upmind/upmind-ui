@layer-e2e @FE-1035
Feature: Guest checkout

  Customers on a brand that allows guest checkout can skip account creation
  and check out as a guest, then optionally upgrade to a full account.

  Background:
    Given a guest visitor with a product in their basket

  Scenario: The guest checkout option is offered when the brand allows guest checkout
    Given the brand allows guest checkout
    When the visitor opens the register page
    Then the guest checkout option is offered

  Scenario: The guest checkout option is hidden when the brand disallows guest checkout
    Given the brand does not allow guest checkout
    When the visitor opens the register page
    Then no guest checkout option is offered

  Scenario: The guest checkout option is not offered for subscription products
    Given the brand allows guest checkout
    But the visitor's basket contains a subscription product
    When the visitor opens the register page
    Then no guest checkout option is offered

  Scenario: Entering guest checkout signs the visitor in as a guest client
    Given the brand allows guest checkout
    And the visitor is on the register page
    When they choose to check out as a guest
    Then their account menu identifies them as a guest
    And the account menu offers a full-account upgrade

  Scenario: A guest upgrades to a full account from the register page
    Given the brand allows guest checkout
    And the visitor has entered guest checkout
    And the visitor is on the register page
    When they complete the registration form with valid details
    Then they become a fully registered client
    And the guest upgrade prompt is no longer shown
