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
# DOC PATHS. The real SDD bundle for this story is
# `docs/sdd/FE-3029-contracts-client/`; the reference bundle this story ports
# from is the READ-ONLY `docs/sdd/FE-3029-v3.REFERENCE/` (ruling R3). Two files
# of the live bundle carry a completion glyph in their filename on disk —
# `design ✅.md` and `tasks ✅.md` — so a bare `design.md` citation does not
# resolve. Every citation below names the file as it sits on disk.
#
# DRIVEABILITY. The package eagerly glob-loads every modules/*/__tests__/*.feature
# into the playback registry and pairs it with that module's ONE *.steps.ts.
# `contract.steps.ts` documents, per ADR-020 Amendment 5, that every scenario
# here sweeps to `notYet`: this module's `World` wiring (the scenario-harness
# registration a driven catalog needs) is not among the prover seat's
# contract-fed, Read-permitted inputs, so no catalog entry is authored blind
# against an unverifiable action-id surface. The colocated unit test
# (`contract.utils.test.ts`) and the integration suite
# (`contract.mutations.int.test.ts`) are this module's executable proof.
#
# ONE SPEC-ONLY LINE, NAMED HERE (bdd.md amendment A14). The `@AC-12` line
# "And a state neither vocabulary knows is shown to me as it is" is proven at
# unit by `contract.utils.test.ts`'s unknown-code block with a LITERAL
# argument; no recorded response can carry an unknown code, by the recording
# rule. It stays in this file, named here as spec-only with that cause.
#
# SEAT LANE. agent-seat-separation.companion.md puts the co-located feature in
# the PROVER's lane. This revision was authored from `design ✅.md`, flow.md
# section 3, review-notes.md rulings R19-R31, **bdd.md's binding amendment set
# A1-A34** and parity.yaml ONLY — no implementation source under
# packages/headless/src/modules/contract/ was read to write it. bdd.md is a
# BINDING input, not an optional one: review-notes.md:904 puts the feature,
# bdd.md and tasks.md downstream of the legacy research and above a seat's own
# reading of design prose, and ruling R31 cites amendment A22(d) as binding.
# Every amendment that acts on the text this file carries is applied below.
#
# SCOPE — ONE ADR-001 cell: client x self (review-notes.md C3, parity.yaml).
# STAFF and GUEST are `null as never` in both scope matrices (`ContractsScopeMatrix`,
# `ContractScopeMatrix`), so no staff or guest scenario exists here to imply an
# advertised-but-absent capability. SELF is a matrix key, always present,
# resolved at runtime — it is not a scenario of its own.
#
# TRACEABILITY. Every @AC-n tag resolves 1:1 to an acceptance criterion in
# `design ✅.md`. No tag is dropped, renamed or renumbered from the carried set
# this file still owns (AC-3, AC-6, AC-7, AC-8, AC-12, AC-14, AC-16).
#
# NEGATIVE CONTROLS. Each @negative-control scenario names the mutation that
# must turn it RED in a COMMENT directly above the scenario (amendment A2) —
# never in a `Then` line, because a claim about the test run is not a
# capability and no step can drive it. The PROVER authors every
# `*.must-fail.patch` and applies it blind; the developer names no mutation.
#
# ONE ACTION PER ROW (amendment A18's restated law). A `Scenario Outline`
# carries AT MOST ONE placeholder on its `When`. A placeholder in a `Given` is
# a precondition and an `<outcome>` placeholder is the assertion; neither is an
# action, and neither counts against the law.
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
    Given I am an authenticated client acting on my own account, unless a scenario says otherwise

  # === THE CONTRACTS COLLECTION ===============================================

  @AC-14 @collection
  Scenario: See the contracts on my own account
    Given I have more contracts than fit on one page
    When I open my contracts
    Then I see the first page of my contracts, and it updates as my contracts change
    And I am told which page I am on and how many there are

  @AC-14 @collection
  Scenario Outline: Move through the pages of my contracts
    Given I have more contracts than fit on one page
    And I am on the <page I start from> page of them
    When I move <move>
    Then <outcome>

    Examples:
      | page I start from | move                      | outcome                                                                  |
      | first             | forward to the next page  | the next page comes back                                                 |
      | second            | back to the previous page | the previous page comes back                                             |
      | first             | forward to the last page  | the last page comes back and I am told there is no further page to go to |

  # === MY CONTRACT'S OWN STATE ================================================

  @AC-12 @meta
  Scenario: See my contract's state and my cancellation request's state in the platform's own words
    When I look at one of my contracts
    Then its lifecycle state is named in the platform's own contract vocabulary
    And the state of any cancellation request on it is named in the platform's own cancellation vocabulary
    And a state neither vocabulary knows is shown to me as it is, rather than quietly turned into one that is

  # === CHANGING ONE CONTRACT =================================================

  # AMENDMENT A28(b). The twelve `Then` lines below are the twelve members of
  # the client contract read (`design ✅.md` §8.1, ADR-29, [o28]) — one record
  # per line, so a module that omits one fails one NAMED line. The payment
  # method, its gateway, and each product's scheduled actions, allowed
  # migrations, brand and unpaid recurring invoices are NOT members of this
  # read: they ride the PRODUCT read, and amendment A20 lands the two
  # payment-method lines on `contract-product.feature`'s `@AC-4` scenario.
  @AC-3 @manager
  Scenario: Open one of my contracts with everything the account area needs
    When I open one of my contracts
    Then it arrives with the cancellation request on it
    And with that cancellation request's custom fields
    And with that cancellation request's state
    And with the contract's own status
    And with my account's image
    And with each of its products' status
    And with each of its products' tags
    And with each of its products' pending contract request
    And with that contract request's custom fields
    And with any cancellation scheduled against each of its products for a future date
    And with each of its products' catalogue product image
    And with the currency of each of its products' brand
    And with the products that are still being imported included rather than hidden

  # What I pick in the legacy cancellation modal — "don't cancel", "cancel at
  # the end of the term", "cancel immediately" — decides WHICH of two things
  # happens, it is not part of what is sent. The first two are the product
  # manager's soft cancel; only "cancel immediately" lodges a request here.
  # What IS sent is which product the request is against, plus my reason and
  # details WHEN I SUPPLY THEM. Amendment A22(c): the brand configuration
  # decides whether I am PROMPTED, never what the body carries, and this
  # module reads no brand setting — so the column is what I supply.
  @AC-6 @manager @mutation
  Scenario Outline: Ask for one of my contracts to be cancelled outright
    Given a contract on my account with a product I want cancelled
    And I supply <what I supply> with my request
    When I ask for that product to be cancelled immediately
    Then my cancellation request is lodged against that contract, naming the product it is against
    And <outcome>
    And what I see afterwards is the server's answer, not an optimistic guess

    Examples:
      | what I supply        | outcome                                       |
      | a reason and details | my reason and details travel with the request |
      | nothing              | nothing travels in their place                |

  @AC-7 @manager @mutation
  Scenario: Change my mind about a cancellation I asked for
    Given I have an outstanding cancellation request on one of my contracts
    When I withdraw it
    Then the request is removed and my contract carries on

  # Legacy gives a client no way to UNASSIGN a contract's payment method — its
  # one dispatch site sends the chosen method and nothing else, and the submit
  # is refused unless a method is actually selected. The removal half is OUT
  # (`design ✅.md` D1 row C5b, signoff R7), so no scenario advertises it.
  #
  # AMENDMENT A13 + A16. Ruling R11 withdrew the product-level gate, so NO
  # product state refuses this CONTRACT-level write: every row's outcome is the
  # same. Each row names a contract holding a product of that kind, because the
  # write is at contract level and the column name is loose (bdd.md's own note).
  @AC-8 @manager @mutation
  Scenario Outline: Point a contract at a different stored payment method
    Given a contract on my account paying by one of my stored methods
    And the product on it is <product state>
    When I point the contract at a different stored payment method
    Then the change is offered and that contract bills against the method I chose

    Examples:
      | product state            |
      | an active subscription   |
      | a suspended subscription |
      | a one-off purchase       |
      | delegated to me          |

  # AMENDMENT A22(d). The OPPOSITE outcome to the Outline above, so it cannot
  # be one of its rows: a selection that changes nothing sends nothing. This is
  # the caller/action-layer condition `design ✅.md` §8.3's AC8 row states ("the
  # client selected a method, and it is different" [o13]); the machine itself
  # carries no guard (ADR-17).
  @AC-8 @manager @mutation
  Scenario Outline: Nothing is sent when my selection changes nothing
    Given a contract on my account paying by one of my stored methods
    When I select <selection>
    Then no request is sent at all

    Examples:
      | selection                  |
      | no method at all           |
      | the method it already uses |

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

  # MUTANT (amendment A2): removing the authenticated-session protection from
  # either surface must turn this scenario RED.
  #
  # AMENDMENT A7 + A17. ONE `<use>` column, one row per use — each of this
  # module's TWO surfaces used plainly, and each of its writes forced — so each
  # row performs one action and a hidden loop cannot pass on a partial failure.
  # (A7's carried count of eight rows was written for the single carried file
  # that held FOUR surfaces; ruling R21 split it, and this file owns two.) The
  # `Given` overrides the Background's stated default.
  @AC-16 @module @guard @negative-control
  Scenario Outline: Nothing is read or changed on my contracts without an authenticated client session
    Given my session has ended and I am no longer signed in
    When <use>
    Then no request is made against any contract resource
    And any forced read or write is refused as not-authenticated

    Examples:
      | use                                              |
      | I open my contracts                              |
      | I open one of my contracts                       |
      | I force a change to my contract's payment method |
      | I force a cancellation request                   |

  # MUTANT (amendment A2): re-introducing a caller-supplied account-id option,
  # even for internal use only, must turn this scenario RED.
  @AC-16 @module @fe-2824 @negative-control
  Scenario: The account I act on is the one my scope resolved
    Given a caller holds a reference to one of the surfaces of this module
    When a caller tries to name a different account through an option
    Then no caller can ask this surface for another account's contracts
    And every request and every cached result still belongs to my own account

  # MUTANT (amendment A2): pointing any action at its staff counterpart must
  # turn this scenario RED.
  @AC-16 @module @guard @negative-control
  Scenario Outline: No staff route is ever reachable from my contract surfaces
    Given the routes that approve, reject, acknowledge or immediately cancel a cancellation belong to staff
    When I use <action>
    Then not one request is ever addressed to a staff route

    Examples:
      | action                              |
      | opening one of my contracts         |
      | changing how a contract is paid for |
      | asking for a cancellation           |
      | withdrawing a cancellation request  |
