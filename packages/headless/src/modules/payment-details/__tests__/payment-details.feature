# Module business-logic feature — paymentDetails
#
# Non-executable. This is the module's behavioural source of truth: one scenario
# per capability the module promises. The module's unit and integration tests
# each name the @AC-* id of the scenario they prove; the co-located
# payment-details.traceability.test.ts fails on either side of that link
# breaking.
#
# Matrix cells. This module is NOT actor-scoped — it has no scope matrix and no
# per-actor arms. It takes the client it acts for as a plain input, so the axis
# is the capture context, plus the signed-out state:
#   A — a client capturing a payment intent for their own outstanding amount
#   B — a client storing a payment method outside of a payment
#   G — an unauthenticated visitor (denied)

Feature: paymentDetails — capture a payment intent and store payment methods

  Payment details captures how an amount will be paid. It lists the methods a
  client already has on file, works out which gateways the brand will accept for
  the amount, currency and country in play, offers the client's account credit as
  a payment source, and produces the selected-method payload the payment module
  submits. In add context it captures a method with no amount outstanding.

  # ---------------------------------------------------------------------------
  # Cell A — a client capturing a payment intent for their own amount
  # ---------------------------------------------------------------------------

  @AC-A1 @client @layer-integration
  Scenario: A client sees the methods they already have on file, default first
    Given I am a client with three stored payment methods on this brand
    And one of them is marked as my default method
    When I open payment details for an outstanding amount in GBP
    Then I am offered my stored methods eligible for GBP
    And my default method is offered first

  @AC-A2 @client @layer-integration
  Scenario: A client is offered only the gateways the brand accepts for this payment
    Given I am a client with an outstanding amount of 50.00 in GBP
    And the brand accepts two gateways for GBP and my country
    When I open payment details for that amount
    Then I am offered those two gateways in the order the brand curated

  @AC-A3 @client @layer-integration
  Scenario: A client is shown their account credit as a payment source
    Given I am a client holding 20.00 of account credit in GBP
    When I open payment details for an outstanding amount of 50.00 in GBP
    Then I am told 20.00 of credit is available towards the amount

  @AC-A4 @client @layer-unit
  Scenario: Account credit is taken off the amount before the gateway is charged
    Given I am a client with an outstanding amount of 50.00 in GBP
    And I hold 20.00 of account credit in GBP
    When I choose to settle 20.00 from my credit
    Then the gateway is asked for the remaining 30.00
    And my selection records 20.00 as the credit contribution

  @AC-A5 @client @layer-unit
  Scenario: A client settles the whole amount from account credit alone
    Given I am a client with an outstanding amount of 20.00 in GBP
    And I hold 20.00 of account credit in GBP
    When I choose to settle the whole amount from my credit
    Then my selection asks no gateway for anything
    And my selection is complete without a payment method

  @AC-A6 @client @layer-unit
  Scenario: A client paying with a stored method hands on that method alone
    Given I am a client with an outstanding amount of 50.00 in GBP
    When I choose one of my stored methods to pay with
    Then my selection names that stored method
    And my selection names no gateway

  @AC-A7 @client @layer-unit
  Scenario: A client paying with a fresh gateway hands on that gateway alone
    Given I am a client with an outstanding amount of 50.00 in GBP
    When I choose a fresh gateway to pay with
    Then my selection names that gateway
    And my selection names no stored method

  @AC-A8 @client @layer-unit
  Scenario: A client is offered a part payment only when every condition allows it
    Given I am a client with an outstanding amount of 50.00 in GBP
    And the brand permits part payments
    And the gateway I can use supports a part payment
    When I open payment details for a draft amount
    Then I am offered the choice to pay part of the amount

  @AC-A9 @client @layer-unit
  Scenario: A client loses the part-payment choice when the brand forbids it
    Given I am a client with an outstanding amount of 50.00 in GBP
    And the brand forbids part payments
    When I open payment details for that amount
    Then I am not offered the choice to pay part of the amount

  @AC-A10 @client @layer-unit
  Scenario: A client can defer payment while the amount is still a draft
    Given I am a client with a draft amount of 50.00 in GBP
    And the brand permits deferring payment
    When I open payment details for that amount
    Then I am offered the choice to pay later

  @AC-A11 @client @layer-unit
  Scenario: A client loses the defer choice once part of the amount is paid
    Given I am a client with an amount of 50.00 in GBP that is part paid
    And the brand permits deferring payment
    When I open payment details for that amount
    Then I am not offered the choice to pay later

  @AC-A12 @client @layer-unit
  Scenario: A client cannot ask to pay more than is outstanding
    Given I am a client with an outstanding amount of 50.00 in GBP
    And the brand permits part payments
    When I ask to pay 80.00
    Then my selection is refused as more than the amount outstanding

  @AC-A13 @client @layer-integration
  Scenario: A client is shown the amount, the outstanding balance and the credit as money
    Given I am a client with an outstanding amount of 50.00 in GBP
    And I choose to settle 20.00 from my credit
    When I read back what I am about to pay
    Then the amount, the outstanding balance and the credit each read as GBP money

  @AC-A14 @client @layer-integration
  Scenario: A client who changes the currency is re-offered the eligible gateways
    Given I am a client offered two gateways for an amount in GBP
    When I switch the amount to USD
    Then I am offered the gateways the brand accepts for USD
    And the gateways that do not accept USD are withdrawn

  @AC-A20 @client @layer-integration
  Scenario: A client whose outstanding amount changes is re-offered against the new one
    Given I am a client offered payment methods for an outstanding amount of 50.00
    When the amount I owe changes to 12.50
    Then my methods and gateways are fetched again for 12.50
    And the amount I am about to pay follows to 12.50

  @AC-A17 @client @layer-integration
  Scenario: A client asking for another client's methods is refused, not shown an empty list
    Given I am a client
    When payment details is opened for a client that is not me
    Then I am told the request is not permitted
    And I am not told that the other client has no stored methods

  @AC-A18 @client @layer-unit
  Scenario: A client whose selection is incomplete cannot hand it on
    Given I am a client with an outstanding amount of 50.00 in GBP
    And I have chosen neither a stored method nor a gateway
    When I try to hand my selection on for payment
    Then my selection is refused as incomplete

  # ---------------------------------------------------------------------------
  # Cell B — a client storing a payment method outside of a payment
  # ---------------------------------------------------------------------------

  @AC-B1 @client @layer-unit
  Scenario: A client storing a method is offered only the gateways that can store one
    Given I am a client with nothing outstanding
    And the brand accepts one gateway that can store a method and one that cannot
    When I open payment details to store a method
    Then I am offered only the gateway that can store a method

  @AC-B2 @client @layer-unit
  Scenario: A client storing a method is never offered a payment choice
    Given I am a client with nothing outstanding
    When I open payment details to store a method
    Then I am not offered the choice to pay later
    And I am not offered the choice to pay part of an amount

  @AC-B3 @client @layer-unit
  Scenario: A client storing a method with no chosen currency falls back to their own
    Given I am a client whose account is held in EUR
    And I name no currency
    When I open payment details to store a method
    Then the gateways I am offered are those the brand accepts for EUR

  @AC-B10 @client @layer-unit
  Scenario: A client cannot decline renewal charging when the brand mandates it
    Given I am a client on a brand that mandates renewal charging on stored methods
    When I ask to store a method without renewal charging
    Then the method is stored with renewal charging on

  @AC-B11 @client @layer-unit
  Scenario: A client is told when storing the method on payment is not their choice
    Given I am a client whose brand mandates storing the method used to pay
    When I open payment details for an outstanding amount
    Then I am told the method will be stored
    And I am not offered a choice about storing it

  @AC-B12 @client @layer-integration
  Scenario: A client removes a stored method they no longer want
    Given I am a client with two stored payment methods
    When I remove one of them
    Then that method is no longer offered to me

  @AC-B13 @client @layer-integration
  Scenario: A client is refused when the brand protects the last method backing a contract
    Given I am a client with one stored method backing a renewing contract
    And the brand forbids removing that method
    When I remove that method
    Then I am told the method cannot be removed
    And the method is still offered to me

  @AC-B14 @client @layer-integration
  Scenario: A client promotes a stored method to be their default
    Given I am a client with two stored methods, the first of them my default
    When I make the second one my default
    Then the second method is my default
    And the first method is no longer my default

  @AC-B15 @client @layer-integration
  Scenario: A client turns renewal charging on for a stored method
    Given I am a client with a stored method that is not charged for renewals
    And the brand leaves renewal charging to me
    When I turn renewal charging on for that method
    Then that method is charged for renewals

  @AC-A19 @client @layer-unit
  Scenario: The selection belongs to the client the capture was opened for
    Given payment details is opened for a named client with 50.00 outstanding
    When a stored method of that client is chosen to pay with
    Then the selection is recorded against that named client
    And the selection is not recorded against whoever holds the session

  # ---------------------------------------------------------------------------
  # Cell G — an unauthenticated visitor (denied)
  # ---------------------------------------------------------------------------

  @AC-G1 @guest @layer-integration
  Scenario: An unauthenticated visitor cannot read any stored payment methods
    Given I am an unauthenticated visitor
    When payment details is opened for a client
    Then I am told the request is not permitted
    And I am offered no stored payment methods

  @AC-G2 @guest @layer-unit
  Scenario: An unauthenticated visitor cannot store a payment method
    Given I am an unauthenticated visitor
    When I try to store a payment method
    Then I am told I must identify myself first
    And no method is recorded
