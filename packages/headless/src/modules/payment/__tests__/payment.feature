# payment — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT, mirroring the client-address / client-email /
# client-phone precedent. This copy lives at
#   packages/headless/src/modules/payment/__tests__/payment.feature
# and THAT copy is the single source of truth: it is what a co-located
# payment.traceability.test.ts reads and enforces the @AC link against, both
# ways. Per ADR-020 this file is spec-only and non-executable — no runner tag,
# no @cucumber, no steps file.
#
# ID SCHEME CHANGED AT THIS REVISION. The previous revision anchored on
# @PAY-001…@PAY-010. Those ids are invisible to this repo's traceability parser,
# which matches /@AC-(\d+)/ (see client-address.traceability.test.ts). Every
# scenario is re-anchored to @AC-<n>. No test in the tree named a PAY-00n id, so
# nothing is orphaned by the change.
#
# ---------------------------------------------------------------------------
# PROVENANCE OF THIS CAPABILITY LIST — read before trusting its completeness
# ---------------------------------------------------------------------------
# This module has NO SDD bundle: there is no docs/sdd/payment/design.md and no
# parity.yaml for it (docs/sdd/fe-3032 is the payment-GATEWAYS extraction, a
# different module). The capability list below is therefore derived from the two
# contract inputs that do exist:
#   1. the pre-existing co-located payment.feature (superseded by this revision)
#   2. payment.types.ts — PaymentArgs { orderId, paymentDetail } and
#      PaymentContext { authHelper, approval, cancel, payment, gateway,
#      rawOrder, error }
#
# THREE GAPS ARE OPEN AND ARE NOT SILENTLY CLOSED HERE:
#   G1  The exported surface was NOT enumerated. seat-guard denies the prover
#       seat Read on index.ts and docs/foundation.md (agent-seat-separation
#       §3.9 — inputs are design.md, Gherkin, parity.yaml and *.types.ts/*.d.ts
#       only). A capability this module exports but neither the prior feature
#       nor payment.types.ts evidences has NO scenario here. AC-12 and AC-13
#       state the surface contract; they are unverified against the barrel.
#   G2  No scope matrix was read, for the same reason. The cell set below —
#       client x self populated, every other cell denied — is taken from the
#       prior feature's actor tags, not from a PAYMENT_SCOPE_MATRIX.
#   G3  No legacy oracle was consulted and no parity table exists. The staff and
#       guest scenarios record what THIS module does, NOT a signed drop. Whether
#       the legacy portal lets a member of staff take a payment on a client's
#       behalf is UNVERIFIED and owed — it is not asserted here as absent by
#       design.
#
# Actors: a client pays their OWN order. Business language only — no provider
# endpoints, no redirect URLs, no form fields, no tokens, no machine states.
#
# @module:payment @cell:client-self

Feature: A client pays an order of their own

  As a client of a brand
  I want to pay what I owe on my order with the method I choose
  So that my order is settled and my services continue

  Background:
    Given I am signed in as a client of a brand
    And I have an order of my own with an amount still to pay


  # ---------------------------------------------------------------------------
  # Taking the payment
  # ---------------------------------------------------------------------------

  @AC-1 @client @self @pay
  Scenario: I pay an order of mine with the method I chose
    Given I have chosen how I want to pay
    When I pay the order
    Then my payment is taken up for that order and for what is owed on it
    And I can tell it is in progress while I wait

  @AC-2 @client @self @pay @identity
  Scenario: My payment goes against the order I picked and no other
    Given I have more than one order of my own still to pay
    When I pay one of them
    Then only the order I picked is paid
    And my other orders are left with the same amount still to pay

  @AC-3 @client @self @pay @provider
  Scenario: My payment is handled by the provider behind the method I chose
    Given my brand offers more than one way to pay and I have chosen one of them
    When I pay the order
    Then the payment is handled by the provider that stands behind the method I chose
    And no other provider of my brand's is involved

  @AC-4 @client @self @success
  Scenario: A payment that clears straight away settles my order
    Given my payment needs no further confirmation from me
    When my payment clears
    Then I am told the payment succeeded
    And what I owe on that order goes down by what I paid


  # ---------------------------------------------------------------------------
  # When my bank wants me to confirm
  # ---------------------------------------------------------------------------

  @AC-5 @client @self @challenge
  Scenario: My bank asks me to confirm before the money is taken
    Given my payment needs my bank's confirmation
    When I pay the order
    Then I am given what I need in order to confirm it with my bank
    And my payment waits for me instead of failing

  @AC-6
  @AC-8
  @client @self @challenge @provider
  Scenario: However my bank asks me to confirm, I can see it through and the payment completes
    Given my payment is waiting on my bank's confirmation
    When I confirm it with my bank
    Then my payment counts as paid only once the provider agrees it was
    And what I owe on that order goes down by what I paid
    Given my brand uses a provider that runs its confirmation step in its own way
    When my payment needs confirming
    Then I am taken through that provider's own confirmation step
    And a provider with no step of its own still confirms me in the ordinary way

  @AC-7 @client @self @challenge @cancel
  Scenario: I back out at my bank and nothing is taken
    Given my payment is waiting on my bank's confirmation
    When I back out instead of confirming
    Then no money is taken from me
    And the order is left with the same amount still to pay


  # ---------------------------------------------------------------------------
  # When the payment does not go through
  # ---------------------------------------------------------------------------

  @AC-9 @client @self @failure
  Scenario: When the provider refuses my payment I am told why
    Given my payment is with the provider
    When the provider refuses it
    Then I am told the payment failed and what went wrong with it
    And the order is left with the same amount still to pay

  @AC-10 @client @self @validation
  Scenario: A method I can no longer use stops the payment before anything is taken
    Given the payment method I chose can no longer be used
    When I try to pay the order
    Then I am told the method cannot be used
    And nothing at all is attempted against that order

  @AC-11 @client @self @session
  Scenario: My payment does not outlive my sign-in
    Given my payment is being taken
    When my sign-in ends part-way through
    Then my payment does not carry on as though I were still signed in


  # ---------------------------------------------------------------------------
  # The front door
  # ---------------------------------------------------------------------------

  @AC-12 @client @self @surface
  Scenario: Everywhere in the product that takes a payment goes in by one door
    When another part of the product takes a payment for an order
    Then it goes through this module's published surface
    And nothing reaches inside it by another route

  @AC-13 @client @self @surface @no-cosplay
  Scenario: Nothing is offered that does not work
    When I look at everything this module offers
    Then every single thing it offers actually does something
    And nothing is advertised that has no effect


  # ---------------------------------------------------------------------------
  # Who cannot use this — one scenario per denied cell (see G2 and G3 above)
  # ---------------------------------------------------------------------------

  @AC-14
  @AC-15
  @guest @self @for-client @denied
  Scenario: Signed out, no order can be paid — mine or anyone else's
    Given I am not signed in
    When something tries to pay an order of mine
    Then no payment is attempted at all
    And I am told I must be signed in
    When something tries to pay an order belonging to somebody else
    Then no payment is attempted at all

  @AC-16 @client @for-client @denied
  Scenario: As a client I cannot pay another client's order
    Given there is an order belonging to another client of my brand
    When I try to pay that order
    Then no payment is attempted against it
    And the other client's order is left with the same amount still to pay

  @AC-17 @staff @self @denied
  Scenario: As a member of staff I have no order of my own to pay here
    Given I am signed in as a member of staff
    When I try to pay an order of my own through this module
    Then this simply is not something I can ask for

  @AC-18 @staff @for-client @denied
  Scenario: As a member of staff I cannot take a payment on a client's behalf
    Given I am signed in as a member of staff and a client of mine has an unpaid order
    When I try to take that payment on the client's behalf
    Then this simply is not something I can ask for
    And whether the legacy portal allows it is recorded as unverified and owed, not as absent by design
