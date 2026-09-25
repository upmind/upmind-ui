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

  # AMENDMENT A28(b) + ruling R34. The eight `Then` lines below are the eight
  # members of the client contract read after R34 — one record per line, so a
  # module that omits one fails one NAMED line. R34 keeps only contract facts,
  # so the product cancellation members (`products.contract_request*`,
  # `products.future_cancellation_request`) and
  # `cancellation_request.custom_fields.field` are dropped: each product loads
  # its own cancellation state through `useContractProduct`.
  @AC-3 @manager
  Scenario: Open one of my contracts with everything the account area needs
    When I open one of my contracts
    Then it arrives with the cancellation request on it
    And with that cancellation request's state
    And with the contract's own status
    And with my account's image
    And with each of its products' status
    And with each of its products' tags
    And with each of its products' catalogue product image
    And with the currency of each of its products' brand
    And with the products that are still being imported included rather than hidden

  # THE HARD CANCELLATION REQUEST AND ITS WITHDRAWAL MOVED TO THE PRODUCT
  # (ruling R33, 2026-09-23). "If it has to know about the contract product
  # state, and it's changing the contract product, it's the job of the contract
  # product." AC-6 (ask for a product to be cancelled outright) and AC-7 (change
  # my mind about it) now live in `contract-product.feature`, and
  # `contract-product.mutations.int.test.ts` holds their wire proof. `useContract`
  # keeps only `setPaymentMethod` (R34).

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

  # === WHAT THE MANAGER PUBLISHES ABOUT THE CONTRACT I HAVE OPEN ============
  # One scenario per template member ruling R37 restores on `useContract`
  # (the manager holds ONE form, so `input` / `clear` / `update` / `isValid`
  # keep their template names), and per the failed-load settlement D43. Each
  # is proven over the recorded corpus by contract.manager-members.int.test.ts.
  # These are capability spec, driven by no step catalog entry.

  @FE-3029 @manager @member
  Scenario: The contract I have open carries everything the manager read about it
    Given I have a contract of mine open in the manager
    When I read everything the manager holds about my contract
    Then it names the very contract I opened, as it was read

  @FE-3029 @manager @member
  Scenario: The contract I have open shows me its name
    Given I have a contract of mine open in the manager
    When I read the title of the contract I have open
    Then it is the name that contract was read with

  @FE-3029 @manager @member
  Scenario: My stored payment methods are loaded ready for the payment-method form
    Given I have a contract of mine open in the manager
    When I read the loaded lookups
    Then they are exactly my stored payment methods, read when my contract was opened

  @FE-3029 @manager @member
  Scenario: When reading my contract fails I am shown why
    Given reading one of my contracts fails
    When I read the error the manager kept
    Then it is the message the failed read returned

  @FE-3029 @manager @member
  Scenario: A failed read of my contract stops loading and settles on an error instead of hanging
    Given reading one of my contracts fails
    When I look at whether the manager is still loading
    Then it has stopped loading and reports an error

  @FE-3029 @manager @member
  Scenario: A failed read tells me at once that my contract is not ready
    Given reading one of my contracts fails
    When I wait to be told whether my contract is ready
    Then I am told at once that it is not ready

  @FE-3029 @manager @member
  Scenario: A reset after a failed read reads my contract again
    Given reading one of my contracts failed and the manager settled on an error
    When I reset my contract
    Then my contract is shown as loading while it is read again
    And once the read lands my contract is shown to me with no error

  @FE-3029 @manager @member
  Scenario: A stored card I choose in the payment-method form is taken in and checked
    Given I have the payment-method form open on one of my contracts
    When I choose one of my stored cards in the form
    Then the form holds the card I chose and reports it valid

  @FE-3029 @manager @member
  Scenario: Close the payment-method form without changing how my contract is paid for
    Given I have the payment-method form open on one of my contracts, with a card chosen
    When I close the payment-method form
    Then the payment-method form is closed and no request is sent
    And opening the payment-method form again draws it in full, with no leftover choice

  @FE-3029 @manager @member
  Scenario: Submit the payment-method form with the card I hand it
    Given I have the payment-method form open on one of my contracts
    When I submit the form with a different stored card handed straight to it
    Then my contract is pointed at the card I handed it
    And I am given my contract as it reads after the change

  @FE-3029 @manager @member
  Scenario: While my payment-method change is being sent I am told it is in progress
    Given I have the payment-method form open on one of my contracts, with a different card chosen
    When I submit the payment-method form and the change has not landed yet
    Then I am told the change is in progress
    And once it lands I am no longer told it is in progress

  @FE-3029 @manager @member
  Scenario: When my payment-method change finishes I am told it is done
    Given I have the payment-method form open on one of my contracts, with a different card chosen
    When I submit the payment-method form and wait to be told the change is done
    Then I am told it is done only once the change has landed, never while it is still being sent

  @FE-3029 @manager @member
  Scenario: A payment-method choice outside my stored cards is not sent and tells me why
    Given I have the payment-method form open on one of my contracts
    When I submit a card that is not one of my stored cards
    Then no request is sent
    And I am shown which field of the form is not valid

  @FE-3029 @manager @member
  Scenario: A card I choose and submit straight away is the one that is sent
    Given I have the payment-method form open on one of my contracts
    When I choose a different stored card and submit the form at once
    Then my contract is pointed at the card I chose, not the one it had

  @FE-3029 @manager @member
  Scenario: With no payment-method change under way I am not told a change is done
    Given I have the payment-method form open on one of my contracts and send no change
    When I wait to be told a payment-method change is done
    Then I am not told it is done

  @FE-3029 @manager @member
  Scenario: A contract read whose status is none I know settles on an error instead of a state
    Given reading one of my contracts returns a status that is not one of the known contract statuses
    When I look at my contract
    Then it has stopped loading and reports an error
    And I am told at once that it is not ready

  @FE-3029 @manager @member
  Scenario: The contract I manage is the one I addressed by id
    Given I address one of my contracts by its id
    When I open the manager on that id
    Then the manager reads that contract, and holds it as the contract I have open
    And a manager I open on another id never holds it
