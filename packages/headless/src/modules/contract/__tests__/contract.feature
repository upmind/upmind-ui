# contracts — the module's behavioural source of truth (capability altitude).
#
# WHAT THIS FILE IS. The co-located business-logic feature for this module: one
# scenario per client x self behaviour the parity table carries, stated in
# actor language. It is the COVERAGE CONTRACT that the developer builds to and
# the prover anchors every colocated unit and integration test to. It is NOT an
# e2e journey feature — no portal page consumes this module yet, so no
# @layer-e2e scenario is written (see docs/sdd/FE-3029/bdd.md, "Scenarios
# intentionally NOT written").
#
# DRIVEABILITY — ADR-020 Amendment 5. This file is NOT "non-executable". The
# package eagerly glob-loads every modules/*/__tests__/*.feature into the
# playback registry (packages/headless/src/testing/features.ts:44-50) and pairs
# it with that module's ONE *.steps.ts (:69-78). Amendment 5 is explicit: "No
# 'non-executable' marking, and no second file, distinguishes the two — whether
# a scenario's own steps are all matched is the only fact that does." So a
# scenario here is spec-only BY DESIGN, named in contracts.steps.ts's header
# with the reason, never spec-only by omission. The module owes that catalog
# (tasks.md T30a); the exemplar is client-company.steps.ts:9-30, which names
# the driven scenarios and says why each swept one is not driven.
#
# SEAT LANE — SURFACED, NOT HIDDEN. agent-seat-separation.companion.md and the
# client-company.feature header put the co-located feature in the PROVER's
# lane. This run's explicit constraint directs the PLANNER seat to author it as
# the coverage contract for both seats. The instruction is followed and the
# tension is recorded (design.md D10-5): this file was authored from
# requirements.md and the vue-app oracle ONLY. No implementation source under
# packages/headless/src/modules/contracts/ was read to write it — none exists.
# The prover still owns re-expression and every executable assertion; the
# developer still owns every *.must-fail.patch, because only the developer
# knows the exact source line a mutant must break.
#
# SCOPE — ONE ADR-001 cell: client x self (review-notes.md C3). STAFF and GUEST
# are `null as never` in all FOUR scope matrices, so no staff or guest scenario
# exists here to imply an advertised-but-absent capability. SELF is a matrix
# key, always present, resolved at runtime (C2) — it is not a scenario.
#
# FOUR SURFACES, NOT FIVE (ruling R10, 2026-09-15). The scheduled-actions
# collection is folded into the contract-product manager: it cannot be fetched,
# cannot be filtered at the wire and cannot be addressed on its own, so it is a
# member of its parent's surface rather than a composable. @AC-15 is unchanged
# in scope and keeps its mutant.
#
# TRACEABILITY. Every @AC-n tag resolves 1:1 to an acceptance criterion in
# docs/sdd/FE-3029/requirements.md. No tag is dropped, renamed or renumbered.
#
# NEGATIVE CONTROLS. @negative-control scenarios each name the mutation that
# must turn them RED. The developer authors the *.must-fail.patch; the prover
# applies it blind, confirms RED, and reverts.
#
# The mutant surface spans TWO modules, because one capability's write does.
# EIGHT patches in all. Six mutate this module's source and sit beside this file.
# TWO mutate the module that owns the client record the remembered-preference
# write rides on, and sit beside THEIR assertions, in ITS own __tests__ folder:
# one drops the merge, one drops .fresh() from the seam. SEVEN of the eight are
# 1:1 with the seven @negative-control scenarios below; the eighth guards a
# CONTROL rather than a scenario, which is why the counts are 7 and 8 rather than
# 8 and 8. A scenario here names the mutation in domain language either way;
# which module's source carries the line is a plan fact, not a scenario fact, and
# it lives in docs/sdd/FE-3029/tasks.md (T28).
# (Corrected at cycle 9. This block read "six... the seventh" and totalled seven,
# while tasks.md:35 and bdd.md:274 both recorded eight from cycle 7 onward. The
# block was edited this pass for R10 and the stale paragraph directly beneath was
# not swept.)
#
# RULING R16 (2026-09-15) CHANGED WHAT A CLIENT CAN DO, and it is the only ruling
# in this story's history that has. The state model was derived from the cancel
# MODAL's internals rather than from the gate that decides whether a client is
# ever SHOWN the control (cancelOption, cProdProvider.vue:248, consumed :574). A
# SUSPENDED subscription was filed as read-only; legacy lets a client stop it
# renewing, ask for it to be cancelled, change how it is paid for and change how
# it is invoiced. Four capabilities, dropped, every gate green — the FE-2824
# shape. The scenarios below now say so, and the staged-gate mutant carries an
# OVER-REFUSAL direction so a module that withholds them again goes red.
#
# RULING R15 (2026-09-15) closed this bundle's last open question: the
# provisioning submit belongs to FE-3234, which is related and not blocking. No
# scenario here advertises it, and none should — an unreachable capability reads
# as a promise.
#
# ORACLE. vue-app is the parity oracle (R1). Every scenario below states what
# the legacy client area actually does for a client acting on their own
# account — never what this module's own tests will assert.

@module:contract @variant:hybrid @cell:client-self
Feature: A client manages the contracts and products on their own account

  A client's contract products are the subscriptions and one-off purchases on
  their account — what they bought, what state it is in, when it next bills,
  what it costs and how it is paid for. The contract is the agreement those
  products sit under. Four surfaces serve them: two COLLECTIONS the client
  browses and pages, and two per-entity MANAGERS through which the client
  changes one contract or one product at a time. All of them act on that
  client's own account, under that client's own identity, and never another
  account's.

  Background:
    Given I am an authenticated client acting on my own account
    And every request I make is addressed to my own contracts and products as that client

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

  # AC-14's own word is "paged", so this scenario spends its lines on paging.
  # Loading / empty / errored and the wait that always settles are platform
  # lifecycle every collection and manager in this module shares; they are
  # proven once in contracts.lifecycle.int.test.ts (bdd.md's deferral table),
  # not re-stated per collection.
  @AC-14 @collection
  Scenario: See and page through the contracts on my own account
    Given I have more contracts than fit on one page
    When I open my contracts
    Then I see the reactive page of contracts on my account
    And I am given the first page, told which page I am on and how many there are, and can move forward and back
    And I am told when there is no further page to go to
    And before I am signed in, nothing is read at all

  # === THE PRODUCT'S OWN STATE ===============================================

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

  @AC-12 @meta
  Scenario: See my contract's state and my cancellation request's state in the platform's own words
    When I look at one of my contracts
    Then its lifecycle state is named in the platform's own contract vocabulary
    And the state of any cancellation request on it is named in the platform's own cancellation vocabulary
    And a state neither vocabulary knows is shown to me as it is, rather than quietly turned into one that is

  @AC-10 @meta
  Scenario: Know whether an outstanding invoice is still due, and still cancellable
    Given one of my products has an outstanding recurring invoice
    When I look at it
    Then I am told whether that invoice is still due
    And whether it is still in a state where cancelling it means anything
    And those two readings agree exactly with how the rest of the platform reads an invoice's status

  # === CHANGING ONE CONTRACT =================================================

  @AC-3 @manager
  Scenario: Open one of my contracts with everything the account area needs
    When I open one of my contracts
    Then it arrives with the cancellation request on it and that request's custom fields
    And with the payment method assigned to it and that method's gateway
    And with each of its products' brand, status, tags, scheduled actions, allowed migrations, contract request and unpaid recurring invoices
    And with the products that are still being imported included rather than hidden
    And nothing that only staff are entitled to see is ever asked for on my behalf

  # What I pick in the legacy cancellation modal — "don't cancel", "cancel at
  # the end of the term", "cancel immediately" — decides WHICH of two things
  # happens, it is not part of what is sent. The first two are AC-5's soft
  # cancel; only "cancel immediately" lodges a request here. What IS sent is
  # which product the request is against, plus my reason and details when I am
  # asked for them.
  @AC-6 @manager @mutation
  Scenario: Ask for one of my contracts to be cancelled outright
    Given a contract on my account with a product I want cancelled
    When I ask for that product to be cancelled immediately, giving my reason and any details the request asks me for
    Then my cancellation request is lodged against that contract, naming the product it is against
    And my reason and details travel with it, and nothing travels in their place when I was never asked for them
    And what I see afterwards is the server's answer, not an optimistic guess
    And the request is made on my own account's behalf, never through a staff route

  @AC-7 @manager @mutation
  Scenario: Change my mind about a cancellation I asked for
    Given I have an outstanding cancellation request on one of my contracts
    When I withdraw it
    Then the request is removed and my contract carries on
    And approving, rejecting or immediately cancelling are not things this surface ever offers me — they belong to staff

  # Legacy gives a client no way to UNASSIGN a contract's payment method — its
  # one dispatch site sends the chosen method and nothing else, and the submit
  # is refused unless a method is actually selected. The removal half is OUT
  # (design.md D1 row C5b, signoff R7), so no scenario advertises it.
  # My account area only offers this change on a SUBSCRIPTION I own. A one-off
  # purchase has no settings for me to change at all, and neither does a product
  # someone else has delegated to me — I can read it, ask for it to be cancelled
  # and change how it is invoiced, but how it is paid for is not mine to move.
  @AC-8 @manager @mutation
  Scenario: Point a contract at a different stored payment method
    Given a contract on my account paying by one of my stored methods
    When I point it at a different stored payment method
    Then that contract bills against the method I chose
    And nothing is sent when I have picked no method, or picked the one it already uses
    And the change is addressed to my own contract, under my own identity
    And the change is not offered at all on a one-off purchase, nor on a product delegated to me — and nothing is sent in either case
    And on a product delegated to me I can still ask for cancellation and still change how it is invoiced — only the payment method is withheld
    And a suspended subscription is offered the change normally

  # === CHANGING ONE PRODUCT ==================================================

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
    When I try to stop it renewing, ask for it to be cancelled, change its payment method, or change its consolidation
    Then I am told the change is not available to me
    And no request is made at all — not one that is sent and refused
    And removing that protection turns this scenario red
    And so does withholding those same four changes from a merely suspended subscription — my account area offers all four on one of those, and a surface that refuses them has taken something away from me rather than protected me

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
    And a product that is merely suspended is not one I have finished with — on that one I can still stop it renewing, ask for it to be cancelled, change how it is paid for and change how it is invoiced, exactly as my account area lets me today

  # A one-off purchase is not a smaller subscription: my account area offers it a
  # smaller set of changes altogether. And once I have already asked a
  # subscription to stop at the end of its term, asking for it to be cancelled
  # outright is no longer something my account area offers me — only carrying on
  # is.
  @AC-11 @manager @guard
  Scenario: A one-off purchase is never offered a consolidation choice
    Given one of my products is a one-off purchase rather than a subscription
    When I look at what I can change about it
    Then the consolidation choice is not offered to me at all
    And forcing it anyway makes no request and is refused
    And the same product on a subscription is offered that choice normally
    And stopping it renewing and changing how it is paid for are not offered to me either — those belong to my subscriptions
    And asking for it to be cancelled is offered only while it is still pending, never once it is live
    And a subscription I have already asked to stop at the end of its term is not offered outright cancellation at all — only carrying on is

  @AC-13 @manager @mutation
  Scenario: A change I make shows up everywhere without me reloading
    Given I am looking at one of my products, at my products list, at its contract, and at my dashboard's count of them, all at the same time
    When I make any of the changes this surface offers me
    Then every one of them shows me the change without my asking them to
    And each of them re-reads from the server rather than guessing

  # === SCHEDULED ACTIONS (part of the product manager's surface) =============

  # These belong to the product I opened, not to a surface of their own: the only
  # route a client is entitled to read them by is the product itself (R10).
  @AC-15 @manager @negative-control
  Scenario: See what is scheduled to happen to one of my products
    Given one of my products has billing actions scheduled against it
    When I open that product's scheduled actions
    Then I see them
    And they come from the product I already loaded, because that is the only place a client is entitled to read them
    And an empty result tells me whether it is empty because there are none, or because the product was loaded without them
    And refreshing them re-reads that product
    And pointing them at the staff-only scheduled-actions route turns this scenario red

  # === WHOLE-MODULE GUARANTEES ===============================================

  @AC-16 @module @guard @negative-control
  Scenario: Nothing is read or changed without an authenticated client session
    Given there is no authenticated client session
    When any of the four surfaces is used, forced or not
    Then no request is made against any contract or product resource
    And any forced read or write is refused as not-authenticated
    And removing that protection from any one of the four surfaces turns this scenario red

  @AC-16 @module @fe-2824 @negative-control
  Scenario: The account I act on is the one my scope resolved
    Given every request resolves whose contracts it is acting on from the scope I opened
    When a caller tries to name a different account through an option
    Then none of the four surfaces offers a "clientId" option, or any alias of it, to a caller — every account id comes from the scope I opened
    And every request and every cached result still belongs to my own account
    And no request URL that is ever observed anywhere contains the literal text "clients/undefined/"
    And re-introducing that option, even for internal use only, turns this scenario red

  @AC-16 @module @guard @negative-control
  Scenario: No staff route is ever reachable from this surface
    Given the routes that approve, reject, acknowledge or immediately cancel a cancellation belong to staff
    And so do modifying terms, activating, setting a manual status, switching currency and transferring ownership
    When every action this module offers me is exercised
    Then not one request is ever addressed to a staff route
    And pointing any action at its staff counterpart turns this scenario red

# NOT A SCENARIO, DELIBERATELY. "The module speaks the platform's vocabulary
# rather than minting its own" was written here as an @AC-12 negative control.
# It is a source-structure fact, not something a client can DO: its only
# possible mutant mutates a declaration, and its only possible assertion reads
# module source. That is a lint, and it now lives in the lint/source lane
# tasks.md T30 already runs, beside the arms determination. AC-12's one and
# only scenario is "See my contract's state and my cancellation request's state
# in the platform's own words" above, which a client can actually observe.
