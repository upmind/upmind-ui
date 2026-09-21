# contract-product — the module's behavioural source of truth (capability altitude).
#
# WHAT THIS FILE IS. The co-located business-logic feature for the
# CONTRACT-PRODUCT manager and collection ONLY — `useContractProduct` (the
# per-product manager) and `useContractProducts` (the products collection). It
# is the COVERAGE CONTRACT that the developer builds to and the prover anchors
# every colocated unit and integration test to. It is NOT an e2e journey
# feature — no portal page consumes this module yet, so no @layer-e2e scenario
# is written (see docs/sdd/FE-3029-contracts-client/bdd.md, "Scenarios
# intentionally NOT written").
#
# TWO MODULES, TWO FEATURES (ruling R21, 2026-09-21). Split out of the single
# carried `contract.feature`, which previously mis-carried this module's
# capability (AC-1/AC-2/AC-4/AC-5/AC-9/AC-10/AC-11/AC-13/AC-15/AC-17/AC-18/
# AC-19) under the CONTRACT module's header. This file is that capability's
# real home, plus the two ruling-R18 scheduled-cancellation writes this module
# owns (AC-22, AC-23), which the carried copy never scheduled at all.
# `modules/contract/__tests__/contract.feature` carries the `useContract` /
# `useContracts` scenarios only.
#
# DOC PATH. The real SDD bundle for this story is
# `docs/sdd/FE-3029-contracts-client/`; the reference bundle this story ports
# from is the READ-ONLY `docs/sdd/FE-3029-v3.REFERENCE/` (ruling R3). The dead
# path `docs/sdd/FE-3029/` that earlier revisions cited is not used here.
#
# DRIVEABILITY. The package eagerly glob-loads every modules/*/__tests__/*.feature
# into the playback registry and pairs it with that module's ONE *.steps.ts.
# `contract-product.steps.ts` documents, per ADR-020 Amendment 5, that every
# scenario here sweeps to `notYet`: this module's `World` wiring (the
# scenario-harness registration a driven catalog needs) is not among the
# prover seat's contract-fed, Read-permitted inputs, so no catalog entry is
# authored blind against an unverifiable action-id surface. The colocated
# unit test (`contract-product.utils.test.ts`) and the integration suite
# (`contract-product.mutations.int.test.ts`) are this module's executable
# proof.
#
# SEAT LANE. agent-seat-separation.companion.md puts the co-located feature in
# the PROVER's lane. This revision was authored from design.md, flow.md
# section 3, review-notes.md rulings R19-R29, and parity.yaml ONLY — no
# implementation source under packages/headless/src/modules/contract-product/
# was read to write it, except the exported *.types.ts surface.
#
# SCOPE — ONE ADR-001 cell: client x self (review-notes.md C3, parity.yaml).
# STAFF and GUEST are `null as never` in both scope matrices
# (`ContractProductsScopeMatrix`, `ContractProductScopeMatrix`), so no staff or
# guest scenario exists here to imply an advertised-but-absent capability.
# SELF is a matrix key, always present, resolved at runtime — it is not a
# scenario of its own.
#
# FOUR SURFACES, NOT FIVE (ruling R10, 2026-09-15). The scheduled-actions
# collection is folded into this manager: it cannot be fetched, filtered at
# the wire, or addressed on its own, so it is a member of this surface rather
# than a composable of its own. @AC-15 is unchanged in scope and keeps its
# mutant.
#
# TRACEABILITY. Every @AC-n tag resolves 1:1 to an acceptance criterion in
# design.md. No tag is dropped, renamed or renumbered from the carried set
# this file now owns, and AC-22/AC-23 are newly scheduled here under ruling
# R18 (design.md §8.3, flow.md §3's two added self-transitions).
#
# NEGATIVE CONTROLS. @negative-control scenarios each name the mutation that
# must turn them RED. The developer authors the *.must-fail.patch; the prover
# applies it blind, confirms RED, and reverts.
#
# ORACLE. vue-app is the parity oracle (R1). Every scenario below states what
# the legacy client area actually does for a client acting on their own
# account — never what this module's own tests will assert.

@module:contract-product @variant:hybrid @cell:client-self
Feature: A client manages the products on their own contracts

  A client's contract products are the subscriptions and one-off purchases on
  their account — what they bought, what state it is in, when it next bills,
  what it costs and how it is paid for. Two surfaces serve them: a COLLECTION
  the client browses and pages, and a per-entity MANAGER through which the
  client changes one product at a time. Both act on that client's own account,
  under that client's own identity, and never another account's.

  Background:
    Given I am an authenticated client acting on my own account
    And every request I make is addressed to my own products as that client

  # === THE PRODUCTS COLLECTION ===============================================

  @AC-1 @collection
  Scenario: See the products on my own account
    When I open my products
    Then I see the reactive page of contract products on my account
    And each one arrives with its status, its product and brand, its category, its tags, its pending contract request and the product it was moved to
    And no other client's products are ever loaded
    And my page is read under my own identity, not by naming an account id

  @AC-1 @collection @criteria
  Scenario: Narrow my products the way the product area lets me
    When I narrow my products by product name, by category name, by category, by lifecycle status, by whether they are subscriptions or one-off, by when I bought them, by when they next fall due, or by price
    Then only the products matching what I asked for are returned
    And clearing what I asked for brings all my products back
    And narrowing by category name is offered to me — it is the one narrowing the legacy client area gives a client and an account holder alone

  # My brand can decide that one-off purchases are simply not part of my portal.
  # When it has, that is not a narrowing I chose and not one I can undo — it is
  # applied to every read of my products, ahead of anything I ask for.
  @AC-1 @collection @criteria @brand
  Scenario: A brand that hides one-off purchases hides them from me everywhere
    Given my brand has chosen to hide one-off purchases from its portal
    When I open my products, however I have narrowed them
    Then only my subscriptions come back
    And asking to see one-off purchases does not bring them back — my brand's choice outranks mine
    And when my brand has made no such choice, my one-off purchases are returned as normal

  @AC-1 @collection @criteria
  Scenario: Order and page through my products
    Given I have more products than fit on one page
    When I order them by status, by when I bought them, by when they next fall due, or by when they were cancelled
    Then my products come back in that order
    And I am given the first page, told which page I am on and how many there are, and can move forward and back
    And I am told when there is no further page to go to

  @AC-1 @collection @criteria @negative-control
  Scenario: Every narrowing I ask for travels one way only
    When I narrow, order or page my products
    Then what I asked for is the only thing that shapes the request
    And a request the module's own contract rejects is never sent, and I am told it was rejected
    And patching a narrowing onto the request behind that contract turns this scenario red

  @AC-2 @collection @delegation
  Scenario: Choose whether to see products delegated to me
    Given products have been delegated to me by another account
    When I ask to see delegated products
    Then the products delegated to me are included alongside my own
    And when I ask to hide them, only my own products come back
    And that choice is which set of products I asked for, not a filter over one set

  @AC-2 @collection @delegation
  Scenario: Never be shown delegated products I do not have
    Given no products have been delegated to me
    When I open my products
    Then delegated products are excluded every single time, whether or not I ask
    And I am not offered the choice at all

  @AC-18 @collection @delegation @negative-control
  Scenario: My choice about delegated products is remembered
    Given products have been delegated to me
    And I have asked to see them
    When I come back later, in a new session
    Then my products still include the ones delegated to me — I do not have to ask again
    And the same holds when I asked to hide them
    And remembering my choice does not disturb any other preference I have set on my account
    And if nothing has been delegated to me by then, delegated products stay hidden whatever I once chose — having none outranks what was remembered
    And my choice is still remembered when I happen to be editing my profile at the same time
    And the profile I have open at the time still shows the fields I opened it on, not my preference in their place
    And recording only the choice that changed, rather than the whole set of preferences my account already holds, turns this scenario red

  # This read is NOT a mode of the products list — legacy addresses it to my
  # account by id rather than by token, asks for a smaller set of related
  # records, orders it by service, and counts only my live products. Crucially
  # it applies NO delegation rule at all (design.md D4a).
  @AC-19 @collection
  Scenario: See my products grouped by category, with a count for each
    When I ask for my products grouped by category
    Then I am given one entry per category with how many of my products are in it
    And only my live products are counted — the active, the awaiting activation, the pending and the suspended
    And they are grouped in service order
    And my choice about delegated products does not change what is counted — this count applies no delegation rule of its own
    And when my brand hides one-off purchases, only my subscriptions are counted here too

  # === MY PRODUCT'S OWN STATE ==================================================

  @AC-17 @meta
  Scenario: Know what state each of my products is in
    When I look at one of my products
    Then I am told whether it is active, awaiting activation, awaiting setup, pending, suspended, cancelled, lapsed, imported or moved
    And whether it is a subscription or a one-off purchase
    And whether it is on trial, and whether that trial is about to end
    And whether it has unpaid recurring invoices
    And whether it is already set to expire at the end of its term

  @AC-17 @meta
  Scenario: An expiring subscription is not the same as one that stopped invoicing
    Given one of my subscriptions is set to expire at the end of its term
    When I look at it
    Then it tells me it will expire
    And that reading comes from the fact that I asked it to stop renewing, together with the date it will end
    And it is not confused with a subscription whose renewal invoicing was switched off — a separate thing this module does not offer me

  @AC-10 @meta
  Scenario: Know whether an outstanding invoice is still due, and still cancellable
    Given one of my products has an outstanding recurring invoice
    When I look at it
    Then I am told whether that invoice is still due
    And whether it is still in a state where cancelling it means anything
    And those two readings agree exactly with how the rest of the platform reads an invoice's status

  # === CHANGING ONE PRODUCT ====================================================

  @AC-4 @manager
  Scenario: Open one of my products with what its detail view needs
    When I open one of my products
    Then it arrives with the accounts it belongs to and their images, its pending contract request, and its catalogue product with that product's currency and image
    And it is read under my own identity

  @AC-5 @manager @mutation
  Scenario: Stop one of my subscriptions renewing, and change my mind
    Given an active subscription on my account
    When I ask for it to stop renewing
    Then it is set to end at the end of its current term
    When I ask for it to carry on instead
    Then it renews as before
    And when my brand asks me why, my reason and details travel with the change — and nothing travels in their place when it does not ask
    And neither of those ever touches the separate renewal-invoicing switch, which this module does not offer me

  # Legacy shows the auto-renew message block only when a product is allowed to
  # have its renewal invoicing switched off — but stopping a subscription
  # renewing is a DIFFERENT change, and legacy offers it from three other
  # places that consult no such permission. Gating it here would take away
  # something the account area gives me today.
  @AC-5 @manager @mutation
  Scenario: Stopping a subscription renewing is not the renewal-invoicing permission
    Given a subscription on my account that is not allowed to have its renewal invoicing switched off
    When I ask for it to stop renewing
    Then it is still set to end at the end of its current term — that permission does not govern this change
    And the renewal-invoicing switch is still not something this module offers me either way

  @AC-9 @manager @mutation
  Scenario Outline: Decide whether one subscription joins my consolidated invoice
    Given a subscription on my account
    When I set its consolidation to "<choice>"
    Then that subscription's invoices "<outcome>"
    And the choice is expressed in the platform's existing consolidation vocabulary, not a second copy of it invented here
    And my account-level consolidation preference is left exactly as it was

    Examples:
      | choice        | outcome                                      |
      | opted out     | are billed separately from my consolidated one |
      | opted in      | join my consolidated one                     |
      | follow my account | follow whatever my account is set to      |

  @AC-11 @manager @guard @negative-control
  Scenario: A product still being imported cannot be changed
    Given one of my products is still being imported
    When I try to stop it renewing, change its payment method, or change its consolidation
    Then I am told the change is not available to me
    And no request is made at all — not one that is sent and refused
    And removing that protection turns this scenario red
    And so does withholding those same changes from a merely suspended subscription — my account area offers them on one of those, and a surface that refuses them has taken something away from me rather than protected me

  # Legacy refuses the consolidation change on THREE lasting conditions —
  # cancelled, lapsed, or still being imported — of which "still being
  # imported" is only the last. (Its form lists a fourth, "already submitting",
  # but that is the form's own in-flight flag, not a state of my product, and
  # this module already refuses a second change while one is in flight.) A
  # product I have already finished with is not one I get to re-file against my
  # consolidated invoice.
  #
  # And there is a condition before all three: legacy only shows me this choice
  # on a SUBSCRIPTION. A one-off purchase is never offered it at all, which is
  # why the second scenario below exists.
  @AC-11 @manager @guard
  Scenario: A product I have finished with cannot change how it is invoiced
    Given one of my products has been cancelled, or has lapsed
    When I try to change whether it joins my consolidated invoice
    Then I am told the change is not available to me
    And no request is made at all
    And I can still read everything about that product — only the change is refused
    And a product that is merely suspended is not one I have finished with — on that one I can still stop it renewing, change how it is invoiced, and book a scheduled cancellation, exactly as my account area lets me today

  # A one-off purchase is not a smaller subscription: my account area offers it a
  # smaller set of changes altogether.
  @AC-11 @manager @guard
  Scenario: A one-off purchase is never offered a consolidation choice
    Given one of my products is a one-off purchase rather than a subscription
    When I look at what I can change about it
    Then the consolidation choice is not offered to me at all
    And forcing it anyway makes no request and is refused
    And the same product on a subscription is offered that choice normally
    And stopping it renewing is not offered to me either — that belongs to my subscriptions

  @AC-13 @manager @mutation
  Scenario: A change I make shows up everywhere without me reloading
    Given I am looking at one of my products, at my products list, and at my dashboard's count of them, all at the same time
    When I make any of the changes this surface offers me
    Then every one of them shows me the change without my asking them to
    And each of them re-reads from the server rather than guessing

  # === SCHEDULED ACTIONS (part of this manager's surface) =====================

  # These belong to the product I opened, not to a surface of their own: the
  # only route a client is entitled to read them by is the product itself (R10).
  @AC-15 @manager @negative-control
  Scenario: See what is scheduled to happen to one of my products
    Given one of my products has billing actions scheduled against it
    When I open that product's scheduled actions
    Then I see them
    And they come from the product I already loaded, because that is the only place a client is entitled to read them
    And an empty result tells me whether it is empty because there are none, or because the product was loaded without them
    And refreshing them re-reads that product
    And pointing them at the staff-only scheduled-actions route turns this scenario red

  # Ruling R18 — the two writes AC-15's data feeds. Neither is the hard
  # cancellation request `useContract().requestCancellation` lodges (that is a
  # CONTRACT-level write, per ruling R22, and lives in `contract.feature`).
  # Booking a scheduled cancellation is a self-transition: it never moves the
  # product's own status node, because `status.cancelling` derives from the
  # hard request alone (flow.md §3).
  @AC-22 @manager @mutation
  Scenario: Book a cancellation for one of my products on a date I choose
    Given an active product on my account, with no cancellation already booked
    When I book a cancellation for a date I choose, giving my reason and any details the request asks me for
    Then that cancellation is scheduled against my product for the date I chose
    And my reason and details travel with it, and nothing travels in their place when I was never asked for them
    And my product's own status is unchanged — a scheduled cancellation is not the hard cancellation request
    And every reader of that product re-reads it, so the booking shows up without my asking

  @AC-23 @manager @mutation
  Scenario: Revoke a scheduled cancellation I booked
    Given one of my products has a cancellation booked for a future date
    When I revoke that booking
    Then my product no longer carries a scheduled cancellation
    And my product's own status is unchanged by the revoke, exactly as the booking left it unchanged
    And every reader of that product re-reads it, so the revoke shows up without my asking

  # === WHOLE-MODULE GUARANTEES ================================================

  @AC-16 @module @guard @negative-control
  Scenario: Nothing is read or changed on my products without an authenticated client session
    Given there is no authenticated client session
    When either surface of this module is used, forced or not
    Then no request is made against any product resource
    And any forced read or write is refused as not-authenticated
    And removing that protection from either surface turns this scenario red

  @AC-16 @module @fe-2824 @negative-control
  Scenario: The account I act on is the one my scope resolved
    Given every request resolves whose products it is acting on from the scope I opened
    When a caller tries to name a different account through an option
    Then neither surface offers a "clientId" option, or any alias of it, to a caller — every account id comes from the scope I opened
    And every request and every cached result still belongs to my own account
    And no request URL that is ever observed anywhere contains the literal text "clients/undefined/"
    And re-introducing that option, even for internal use only, turns this scenario red

  @AC-16 @module @guard @negative-control
  Scenario: No staff route is ever reachable from my product surfaces
    Given the routes that modify terms, activate, set a manual status, switch currency, transfer ownership, or read the staff scheduled-actions collection belong to staff
    When every action this module offers me is exercised
    Then not one request is ever addressed to a staff route
    And pointing any action at its staff counterpart turns this scenario red

# NOT A SCENARIO, DELIBERATELY. "The module speaks the platform's vocabulary
# rather than minting its own" is a source-structure fact for THIS module too
# (design.md §8.10, R19), not something a client can DO. Its only possible
# assertion reads module source, so it lives in the lint/source lane, not
# here — the same disposition contract.feature's own header records.
