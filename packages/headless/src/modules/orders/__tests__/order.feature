@orders
Feature: Order payment orchestration
  As a client
  I want to pay invoices through various payment methods
  So that I can complete my purchases and settle outstanding balances

  Background:
    Given an authenticated client with an unpaid invoice

  @order-init @client @layer-integration
  Scenario: Client initialises order payment flow
    Given the client has an invoice ID
    When they initialise the order payment flow
    Then the invoice details are fetched and parsed
    And the payment detail actor is spawned

  @order-pay @client @layer-integration
  Scenario: Client pays an invoice in full
    Given an invoice is loaded with an outstanding balance
    When the client submits payment with valid payment details
    Then the payment is processed through the selected gateway
    And the invoice status reflects the payment outcome

  @order-pay-partial @client @layer-integration
  Scenario: Client makes a partial payment
    Given an invoice is loaded with an outstanding balance
    And partial payments are permitted
    When the client submits a partial payment amount
    Then the payment is processed for the specified amount
    And the invoice shows the remaining unpaid balance

  @order-pay-wallet @client @layer-integration
  Scenario: Client pays using wallet credit
    Given an invoice is loaded with an outstanding balance
    And the client has sufficient wallet credit
    When the client elects to pay with wallet funds
    Then the wallet amount is applied to the invoice

  @order-retry @client @layer-integration
  Scenario: Client retries a failed payment
    Given a previous payment attempt has failed
    And the last payment selections are persisted
    When the client initiates a payment retry
    Then the previous payment selections are applied to the retry
    And a new payment attempt is submitted

  @order-refresh @client @layer-integration
  Scenario: Client refreshes invoice data
    Given an invoice is loaded
    When the client requests a refresh
    Then the invoice data is re-fetched from the API
    And the context is updated with current values

  @order-challenge-render @client @layer-integration
  Scenario: Payment triggers 3DS challenge
    Given a payment attempt triggers a 3DS challenge
    When the challenge response is received
    Then the challenge UI is rendered to the client

  @order-challenge-complete @client @layer-integration
  Scenario: Client completes 3DS challenge
    Given the 3DS challenge is displayed
    When the client completes the challenge successfully
    Then the challenge result is submitted
    And the payment flow resumes to completion

  @order-challenge-cancel @client @layer-integration
  Scenario: Client cancels 3DS challenge
    Given the 3DS challenge is displayed
    When the client cancels the challenge
    Then the payment attempt is aborted
    And the client can retry with different payment details

  @order-ready @client @layer-integration
  Scenario: Order payment flow signals readiness
    Given the order machine is initialised
    When all required actors are spawned and data is loaded
    Then the ready state returns true

  @order-error @client @layer-integration
  Scenario: Payment error is surfaced
    Given a payment operation fails
    When the error is captured
    Then the error details are stored in context
    And the client can view the failure reason

  @order-free @client @layer-integration
  Scenario: Free invoice requires no payment
    Given an invoice with zero outstanding balance
    When the order payment flow is initialised
    Then the invoice is marked as complete without payment
