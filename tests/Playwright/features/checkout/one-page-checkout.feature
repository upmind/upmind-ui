@checkout @FE-3002
Feature: One-page checkout
  As a customer on a brand configured for one-page checkout
  I want to review my order, complete my details, and place the order on a single page
  So that I can buy without stepping through separate pages

  Background:
    Given the brand is configured for the one-page checkout flow

  @FE-3002 @layer-e2e @smoke
  Scenario: The order summary always shows the server-priced basket
    Given my basket contains a configurable product
    When I increase the product quantity on the order page
    Then the order summary shows the updated quantity
    And the order summary total matches the basket total held by the store

  @FE-3002 @layer-e2e
  Scenario: An inline configuration change is saved immediately
    Given my basket contains a configurable product
    When I change the product's billing term on the order page
    Then the new billing term is still applied after I reload the page

  @FE-3002 @layer-e2e @smoke
  Scenario: Placing an order with required order details incomplete points me at them
    Given my basket requires additional order details that I have not completed
    And my billing details are complete
    When I place the order
    Then the order is not placed
    And I am shown the incomplete additional-details section

  @FE-3002 @layer-e2e
  Scenario: Placing an order without billing details points me at the billing section
    Given I have not provided billing details
    When I place the order
    Then the order is not placed
    And I am shown the incomplete billing section

  @FE-3002 @layer-e2e
  Scenario: A returning customer's saved billing details load after a page refresh
    Given I am signed in with saved billing details
    And I am on the checkout
    When I reload the page
    Then my saved billing details are shown in the billing section

  @FE-3002 @layer-e2e
  Scenario: A guest is offered the guest billing form
    Given I am browsing as a guest with a product in my basket
    When I open the checkout
    Then the billing section offers the guest billing form

  @FE-3002 @layer-e2e @smoke
  Scenario: A complete one-page order is placed successfully
    Given my basket, billing details, and product setup are complete
    When I place the order
    Then the order is confirmed

  @FE-3002 @layer-e2e
  Scenario: Editing saved billing details keeps me moving
    Given I am signed in with saved billing details
    And I am on the billing step
    When I edit my saved address
    Then my change is saved
    And I can continue to the next step

  @FE-3002 @layer-e2e
  Scenario: Payment stays closed until the details it depends on are provided
    Given my basket contains a product that needs setup details
    And I have not provided billing details
    When I open the checkout
    Then the billing section is open for editing
    And the product setup section is closed
    And the payment section is closed
    When I provide my billing details
    Then the product setup section is open for editing
    And the payment section is closed
    When I provide the product setup details
    Then the payment section is open for editing

  @FE-3002 @layer-e2e
  Scenario: Changing my saved billing details always takes me somewhere I can edit
    Given I am signed in with saved billing details
    And I am on the checkout
    When I choose to change my billing details
    Then I am given a way to edit them
    And my updated details are shown on the checkout once saved
