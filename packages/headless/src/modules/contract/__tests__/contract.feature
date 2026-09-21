# contract — the module's behavioural source of truth (capability altitude).
#
# WHAT THIS FILE IS. The co-located business-logic feature for the CONTRACT
# manager and collection ONLY — `useContract` (the per-contract manager) and
# `useContracts` (the contracts collection). It is the COVERAGE CONTRACT that
# the developer builds to and the prover anchors every colocated unit and
# integration test to. It is NOT an e2e journey feature — no portal page
# consumes this module yet, so no @layer-e2e scenario is written (see
# docs/sdd/FE-3029-contracts-client/bdd.md, "Scenarios intentionally NOT
# written").
#
# TWO MODULES, TWO FEATURES (ruling R21, 2026-09-21). This story's capability
# was originally carried in one feature file across both modules. Ruling R21
# reverses the shared-folder design: the contract manager/collection live in
# `modules/contract/`, the contract-product manager/collection live in
# `modules/contract-product/`, each in its own folder from here. This file now
# carries ONLY the `useContract` / `useContracts` scenarios. Every
# contract-product scenario (the products collection, the per-product manager,
# scheduled actions, AC-1/AC-2/AC-4/AC-5/AC-9/AC-10/AC-11/AC-13/AC-15/AC-17/
# AC-18/AC-19, and the two ruling-R18 scheduled-cancellation writes AC-22/
# AC-23) moved to `modules/contract-product/__tests__/contract-product.feature`.
#
# DOC PATH CORRECTION. Every prior revision of this file cited the dead path
# `docs/sdd/FE-3029/`. The real SDD bundle for this story is
# `docs/sdd/FE-3029-contracts-client/`; the reference bundle this story ports
# from is the READ-ONLY `docs/sdd/FE-3029-v3.REFERENCE/` (ruling R3). Both
# citations below now point at the real path.
#
# DRIVEABILITY. The package eagerly glob-loads every modules/*/__tests__/*.feature
# into the playback registry and pairs it with that module's ONE *.steps.ts.
# `contract.steps.ts` documents, per ADR-020 Amendment 5, that every scenario
# here sweeps to `notYet`: this module's `World` wiring (the scenario-harness
# registration a driven catalog needs) is not among the prover seat's
# contract-fed, Read-permitted inputs, so no catalog entry is authored blind
# against an unverifiable action-id surface. The colocated unit test
# (`contract.utils.test.ts`, once authored) and the integration suite
# (`contract.mutations.int.test.ts`) are this module's executable proof.
#
# SEAT LANE. agent-seat-separation.companion.md puts the co-located feature in
# the PROVER's lane. This revision was authored from design.md, flow.md
# section 3, review-notes.md rulings R19-R29, and parity.yaml ONLY — no
# implementation source under packages/headless/src/modules/contract/ was
# read to write it.
#
# SCOPE — ONE ADR-001 cell: client x self (review-notes.md C3, parity.yaml).
# STAFF and GUEST are `null as never` in both scope matrices (`ContractsScopeMatrix`,
# `ContractScopeMatrix`), so no staff or guest scenario exists here to imply an
# advertised-but-absent capability. SELF is a matrix key, always present,
# resolved at runtime — it is not a scenario of its own.
#
# TRACEABILITY. Every @AC-n tag resolves 1:1 to an acceptance criterion in
# design.md. No tag is dropped, renamed or renumbered from the carried set
# this file still owns (AC-3, AC-6, AC-7, AC-8, AC-12, AC-14, AC-16).
#
# NEGATIVE CONTROLS. @negative-control scenarios each name the mutation that
# must turn them RED. The developer authors the *.must-fail.patch; the prover
# applies it blind, confirms RED, and reverts.
#
# ORACLE. vue-app is the parity oracle (R1). Every scenario below states what
# the legacy client area actually does for a client acting on their own
# account — never what this module's own tests will assert.

@module:contract @variant:hybrid @cell:client-self
Feature: A client manages their own contracts

  A client's contract is the agreement one or more of their products sit
  under. Two surfaces serve them: a COLLECTION the client browses and pages,
  and a per-entity MANAGER through which the client changes one contract at a
  time — asks for a product on it to be cancelled, withdraws that request, or
  points the contract at a different stored payment method. Both act on that
  client's own account, under that client's own identity, and never another
  account's.

  Background:
    Given I am an authenticated client acting on my own account
    And every request I make is addressed to my own contracts as that client

  # === THE CONTRACTS COLLECTION ===============================================

  # AC-14's own word is "paged", so this scenario spends its lines on paging.
  # Loading / empty / errored and the wait that always settles are platform
  # lifecycle every collection and manager in this module shares.
  @AC-14 @collection
  Scenario: See and page through the contracts on my own account
    Given I have more contracts than fit on one page
    When I open my contracts
    Then I see the reactive page of contracts on my account
    And I am given the first page, told which page I am on and how many there are, and can move forward and back
    And I am told when there is no further page to go to
    And before I am signed in, nothing is read at all

  # === MY CONTRACT'S OWN STATE ================================================

  @AC-12 @meta
  Scenario: See my contract's state and my cancellation request's state in the platform's own words
    When I look at one of my contracts
    Then its lifecycle state is named in the platform's own contract vocabulary
    And the state of any cancellation request on it is named in the platform's own cancellation vocabulary
    And a state neither vocabulary knows is shown to me as it is, rather than quietly turned into one that is

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
  # happens, it is not part of what is sent. The first two are the product
  # manager's soft cancel; only "cancel immediately" lodges a request here.
  # What IS sent is which product the request is against, plus my reason and
  # details when I am asked for them.
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
  @AC-8 @manager @mutation
  Scenario: Point a contract at a different stored payment method
    Given a contract on my account paying by one of my stored methods
    When I point it at a different stored payment method
    Then that contract bills against the method I chose
    And nothing is sent when I have picked no method, or picked the one it already uses
    And the change is addressed to my own contract, under my own identity
    And a suspended subscription is offered the change normally

  # Ruling R13 — the payment-method write is a self-transition on
  # `unavailable.cancelled` and `unavailable.lapsed` (flow.md §3). A client
  # keeps this one change on a contract that is otherwise read-only.
  @AC-8 @manager @mutation
  Scenario: I can still change how a cancelled or lapsed contract is paid for
    Given a contract on my account that is cancelled, or has lapsed
    When I point it at a different stored payment method
    Then that contract bills against the method I chose
    And no product fact and no contract status ever refuse this one change (ruling R11, R13)

  # === WHOLE-MODULE GUARANTEES ================================================

  @AC-16 @module @guard @negative-control
  Scenario: Nothing is read or changed on my contracts without an authenticated client session
    Given there is no authenticated client session
    When either surface of this module is used, forced or not
    Then no request is made against any contract resource
    And any forced read or write is refused as not-authenticated
    And removing that protection from either surface turns this scenario red

  @AC-16 @module @fe-2824 @negative-control
  Scenario: The account I act on is the one my scope resolved
    Given every request resolves whose contracts it is acting on from the scope I opened
    When a caller tries to name a different account through an option
    Then neither surface offers a "clientId" option, or any alias of it, to a caller — every account id comes from the scope I opened
    And every request and every cached result still belongs to my own account
    And no request URL that is ever observed anywhere contains the literal text "clients/undefined/"
    And re-introducing that option, even for internal use only, turns this scenario red

  @AC-16 @module @guard @negative-control
  Scenario: No staff route is ever reachable from my contract surfaces
    Given the routes that approve, reject, acknowledge or immediately cancel a cancellation belong to staff
    When every action this module offers me is exercised
    Then not one request is ever addressed to a staff route
    And pointing any action at its staff counterpart turns this scenario red
