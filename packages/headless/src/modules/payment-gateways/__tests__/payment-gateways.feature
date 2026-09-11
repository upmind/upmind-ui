# Module business-logic feature — paymentGateways
#
# Non-executable. This is the module's behavioural source of truth: one scenario
# per capability the module promises. The module's unit and integration tests
# each name the @AC-* id of the scenario they prove; the co-located
# payment-gateways.traceability.test.ts fails on either side of that link
# breaking.
#
# SCOPE RULING (operator, this run). This feature proves OUR gateway contract,
# not each provider's quirks. A named gateway appears only as a row in an
# Examples table, proving it plugs into the shared machine contract. There is no
# per-provider scenario set, and no scenario asserts a provider's own SDK
# behaviour.
#
# Matrix cells. This module is NOT actor-scoped — it has no scope matrix and no
# per-actor arms. It is spawned by the payment-details machine and takes the
# client, gateway, amount and currency as plain inputs, so the axis is the
# gateway context plus the processing mode:
#   A — the lifecycle contract every gateway honours, whatever its provider
#   B — a client paying an outstanding amount through a gateway (PAY context)
#   C — a client storing a payment method through a gateway (ADD context)
#   D — the processing modes a gateway is driven by (SDK, redirect, offline, free)
#   E — a gateway that cannot serve the request (denied / unsupported)

Feature: paymentGateways — drive any payment gateway through one contract

  Payment gateways turns a selected gateway into a driveable payment. It loads
  the gateway, decides whether it needs a form and renders one, validates what
  the client enters, hands the payment to the provider, and reports back a
  payment detail or an error. Every gateway — SDK, offsite redirect, stored
  method, offline or free — is driven through this one contract, so a consumer
  never branches on which provider is in play.

  # ---------------------------------------------------------------------------
  # Cell A — the lifecycle contract every gateway honours
  # ---------------------------------------------------------------------------

  @AC-A1 @client @layer-unit
  Scenario Outline: Every supported gateway reaches a driveable state
    Given a client has selected the <gateway> gateway for an amount in GBP
    When the gateway is spawned
    Then the gateway reports itself available to be driven
    And the gateway reports no error

    Examples:
      | gateway     |
      | braintree   |
      | card        |
      | dlocal      |
      | mercadoPago |
      | nicky       |
      | openPay     |
      | razorpay    |
      | stripe      |

  @AC-A2
  @AC-E2
  @AC-E3
  @client @layer-unit
  Scenario: A gateway that is loading, failed, or absent is never offered as ready to pay with
    Given a client has selected a gateway
    And the gateway has not finished loading
    When the consumer reads the gateway's state
    Then the gateway reports itself as loading
    And the gateway is not reported as available
    Given a client has selected a gateway whose setup fails
    When the gateway is opened
    Then the gateway reports itself unavailable
    And the client is offered no form to complete
    Given a consumer holding no gateway at all
    When the consumer reads the gateway's state
    Then the gateway is reported as not supported
    And the gateway is reported as not available

  @AC-A3
  @AC-A4
  @client @layer-unit
  Scenario: A client waiting for a gateway is released when it settles, and told when it cannot load
    Given a client has selected a gateway that settles into an available state
    When the consumer waits for the gateway to settle
    Then the consumer is told the gateway is ready
    Given a client has selected a gateway that settles as unavailable
    When the consumer waits for the gateway to settle
    Then the consumer is told the gateway is not ready

  @AC-A5
  @AC-A6
  @client @layer-unit
  Scenario: A gateway reports whether the client has entered anything into it
    Given a client has selected a gateway with an empty form
    When the client enters nothing
    Then the gateway reports itself as not dirty
    Given a client has selected a gateway with a form
    When the client enters their card details
    Then the gateway reports itself as dirty

  @AC-A7 @client @layer-unit
  Scenario: Clearing a gateway discards what the client entered
    Given a client has entered details into a gateway form
    When the client clears the gateway
    Then the gateway holds no captured input
    And the gateway reports itself as not dirty

  @AC-A8
  @AC-A9
  @client @layer-unit
  Scenario: A gateway that fails validation surfaces the failing fields, and one that passes is offered to pay
    Given a client has selected a gateway with a form
    When the client enters details that satisfy the gateway's schema
    Then the gateway reports itself as valid
    When the client enters details that breach the gateway's schema
    Then the gateway reports the fields that failed
    And the gateway does not report itself as valid

  @AC-A10 @client @layer-unit
  Scenario: Submitting unchanged input asks the gateway to proceed, not to re-capture
    Given a client has entered details into a gateway and not changed them
    When the client submits the gateway again
    Then the gateway is asked to proceed with what it already holds
    And the captured input is not re-sent

  @AC-A11 @client @layer-unit
  Scenario: Submitting changed input re-captures before the gateway proceeds
    Given a client has entered details into a gateway
    When the client changes the details and submits
    Then the changed details are captured first
    And the gateway then proceeds with them

  @AC-A12 @client @layer-integration
  Scenario: A gateway that completes hands back a payment detail
    Given a client has entered valid details into a gateway
    When the client submits the payment
    Then the gateway reports itself complete
    And a payment detail is handed back for the payment to use

  @AC-A13 @client @layer-integration
  Scenario: A gateway that is refused surfaces the refusal to the client
    Given a client has entered valid details into a gateway
    When the provider refuses the payment
    Then the client is told why the payment was refused
    And no payment detail is handed back

  @AC-A14 @client @layer-unit
  Scenario: A gateway that never settles fails the client rather than hanging
    Given a client has submitted a payment through a gateway
    When the gateway does not settle within the allowed time
    Then the client is told the payment could not be completed

  @AC-A15 @client @layer-unit
  Scenario: I can see that my payment is with the provider and still working
    Given a client has submitted a payment through a gateway
    When the provider has not yet answered
    Then the gateway reports itself as processing

  # ---------------------------------------------------------------------------
  # Cell B — a client paying an outstanding amount (PAY context)
  # ---------------------------------------------------------------------------

  @AC-B1 @client @layer-unit
  Scenario: A client paying a chargeable amount is asked for payment
    Given a client owes 50.00 in GBP on an order
    When a supported gateway is opened to pay that amount
    Then the client is asked to pay

  @AC-B2 @client @layer-unit
  Scenario: A client paying through an offline gateway is not asked for payment
    Given a client owes 50.00 in GBP on an order
    When an offline gateway is opened to settle that amount
    Then the client is not asked to pay
    And the client is shown how to settle the amount instead

  @AC-B3 @client @layer-integration
  Scenario: A payment is recorded against the order it was opened for
    Given a gateway is opened to pay 50.00 in GBP on a named order
    When the client completes the payment
    Then the payment is recorded against that named order

  @AC-B4
  @AC-B5
  @client @layer-unit
  Scenario: An amount is charged in its currency's own units, minor or whole
    Given a client owes 5000 in JPY, a currency with no minor unit
    When a gateway is opened to pay that amount
    Then the provider is asked for 5000, not for 500000
    Given a client owes 50.00 in GBP
    When a gateway is opened to pay that amount
    Then the provider is asked for 5000 minor units

  @AC-B6 @client @layer-unit
  Scenario: A client is shown the gateway's own payment instructions when it carries them
    Given a client has selected a gateway that carries payment instructions
    When the gateway is opened to pay
    Then the client is shown those instructions

  @AC-B7 @client @layer-unit
  Scenario: A client is shown the brand's consent disclaimer before paying
    Given a brand that carries a consent disclaimer
    When a client opens a gateway to pay
    Then the client is shown that disclaimer

  @AC-B8 @client @layer-unit
  Scenario: A gateway whose charge minimum exceeds the amount reports itself unavailable
    Given a client owes 0.20 in GBP
    When a gateway with a minimum charge of 0.50 is opened to pay that amount
    Then the gateway reports itself unavailable
    And the client is not offered to pay through it

  # ---------------------------------------------------------------------------
  # Cell C — a client storing a payment method (ADD context)
  # ---------------------------------------------------------------------------

  @AC-C1 @client @layer-unit
  Scenario: A client storing a method is not asked for an amount
    Given a client with nothing outstanding
    When a gateway is opened to store a payment method
    Then the client is asked for no amount
    And no order is named on the request

  @AC-C2 @client @layer-integration
  Scenario: Storing a method reserves the record the provider completes
    Given a client opens a gateway to store a payment method
    When the gateway begins setting the method up
    Then a payment detail record is reserved for the client
    And the provider is handed the secret it needs to complete the setup

  @AC-C3 @client @layer-integration
  Scenario: A stored method is handed back once the provider confirms it
    Given a client is storing a payment method through a gateway
    When the provider confirms the method
    Then the stored method is handed back against the reserved record

  @AC-C4 @client @layer-unit
  Scenario: A gateway that cannot store a method is not offered for storing one
    Given a gateway that cannot store a payment method
    When it is opened to store a method
    Then the client is told the gateway cannot store a method

  @AC-C5 @client @layer-unit
  Scenario: A gateway that must store the method gives the client no choice
    Given a gateway that must store the method it is paid with
    When a client pays through it
    Then the method is stored
    And the client is offered no choice about storing it

  @AC-C6 @client @layer-unit
  Scenario: A method stored for automatic renewal is marked for it
    Given a gateway whose stored methods must be charged for renewals
    When a client stores a method through it
    Then the stored method is marked to be charged for renewals

  # ---------------------------------------------------------------------------
  # Cell D — the processing modes a gateway is driven by
  # ---------------------------------------------------------------------------

  @AC-D1 @client @layer-unit
  Scenario: A gateway that brings its own form is given somewhere on the page to draw it
    Given a client has selected a gateway that draws its own form
    When the consumer offers the gateway a place on the page
    Then the gateway draws its form there

  @AC-D2 @client @layer-unit
  Scenario: A gateway offered nowhere to draw reports the fault without failing the payment
    Given a client has selected a gateway that draws its own form
    When the consumer offers the gateway no place on the page
    Then the fault is reported
    And the payment is not failed

  @AC-D3 @client @layer-unit
  Scenario: A gateway needing no form is never asked to draw one
    Given a client has selected a gateway that needs no form
    When the consumer offers the gateway a place on the page
    Then the gateway is not asked to draw anything

  @AC-D4 @client @layer-unit
  Scenario: A gateway with nothing for me to enter asks the page for no form
    Given a client has selected a gateway whose fields are all read-only
    When the gateway is opened
    Then the gateway reports that it needs no form

  @AC-D5 @client @layer-integration
  Scenario: A client sent to the provider's own site is returned to where they left
    Given a client is paying through a gateway hosted on the provider's site
    When the client is sent to the provider and comes back
    Then the payment resumes from where the client left it

  @AC-D6 @client @layer-integration
  Scenario: A client returning without stored context is resumed from the carried context
    Given a client is paying through a gateway hosted on the provider's site
    And the browser keeps nothing between the two visits
    When the client comes back from the provider
    Then the payment resumes from the context carried back with them

  @AC-D7 @client @layer-unit
  Scenario: A free amount is settled without asking any provider
    Given a client owes nothing after discounts
    When the payment is settled
    Then no provider is asked for anything
    And the payment is reported complete

  # ---------------------------------------------------------------------------
  # Cell E — a gateway that cannot serve the request (denied)
  # ---------------------------------------------------------------------------

  @AC-E1 @client @layer-unit
  Scenario: A gateway the module does not support is refused, not half-driven
    Given a client has selected a gateway the module does not support
    When the gateway is opened
    Then the client is told the gateway is not supported
    And the client is not asked to pay
