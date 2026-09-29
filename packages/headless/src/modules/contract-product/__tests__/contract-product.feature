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
# DOC PATHS. The real SDD bundle for this story is
# `docs/sdd/FE-3029-contracts-client/`; the reference bundle this story ports
# from is the READ-ONLY `docs/sdd/FE-3029-v3.REFERENCE/` (ruling R3). Two files
# of the live bundle carry a completion glyph in their filename on disk —
# `design ✅.md` and `tasks ✅.md` — so a bare `design.md` citation does not
# resolve. Every citation below names the file as it sits on disk. The dead
# path `docs/sdd/FE-3029/` that earlier revisions cited is not used here.
#
# DRIVEABILITY. The package eagerly glob-loads every modules/*/__tests__/*.feature
# into the playback registry and pairs it with that module's ONE *.steps.ts.
# Which scenarios are driveable is the catalog's answer, never this header's
# (ADR-020 Amendment 5): a scenario is a playable track only when a real step
# drives every one of its lines, and one nothing drives stays spec. The
# colocated unit test (`contract-product.utils.test.ts`), the integration
# suite (`contract-product.*.int.test.ts`) and the replay
# (`contract-product.replay.int.test.ts`, which runs every driveable scenario
# over the recorded corpus) are this module's executable proof, and the
# playground pages are where a hand drives the same capability.
#
# SEAT LANE. agent-seat-separation.companion.md puts the co-located feature in
# the PROVER's lane. This revision was authored from `design ✅.md`, flow.md
# section 3, review-notes.md rulings R19-R31, **bdd.md's binding amendment set
# A1-A34** and parity.yaml ONLY — no implementation source under
# packages/headless/src/modules/contract-product/ was read to write it, except
# the exported *.types.ts surface. bdd.md is a BINDING input, not an optional
# one: review-notes.md:904 puts the feature, bdd.md and tasks.md downstream of
# the legacy research and above a seat's own reading of design prose, and
# ruling R31 cites amendment A22(d) as binding. Every amendment that acts on
# the text this file carries is applied below.
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
# `design ✅.md`. No tag is dropped, renamed or renumbered from the carried set
# this file now owns, and AC-22/AC-23 are newly scheduled here under ruling
# R18 (`design ✅.md` §8.3, flow.md §3's two added self-transitions).
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
# ONE READING PER LINE (amendments A1, A20, A28 and A32). A `Then`/`And` line
# names ONE record or ONE state. Thirteen readings on one line recreate the
# packing defect: a step matches one string, so a module that reports twelve of
# the thirteen still passes.
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
    Given I am an authenticated client acting on my own account, unless a scenario says otherwise

  # === THE PRODUCTS COLLECTION ===============================================

  # AMENDMENT A28(a). One record per line — the client-readable records of the
  # products-list read (`design ✅.md` §8.1's 12 `with` members [o2]), so a
  # module that omits one fails one NAMED line.
  @AC-1 @collection
  Scenario: See the products on my own account
    When I open my products
    Then I see the first page of my products, and it updates as my products change
    And each one arrives with its status
    And each one arrives with its catalogue product
    And each one arrives with that product's brand
    And each one arrives with its category
    And each one arrives with its tags
    And each one arrives with its pending contract request
    And each one arrives with any cancellation scheduled against it for a future date
    And each one arrives with the product it was moved to
    And no other client's products are ever loaded

  # AMENDMENT A6 + A19. One narrowing per row, so a module that honours seven
  # of the eight fails one NAMED row rather than passing a packed line. Each
  # row is one control the legacy client list (`cProdsListing.vue` and the
  # client-route filters) gives a client — the quick-search box, the
  # product-name and category-name boxes, the category and status pickers, the
  # two date controls and the price control. The category-name row is the one
  # narrowing the legacy client area gives a client and an account holder
  # alone — that oracle note is carried as this comment, never as an asserted
  # line (A19). Subscriptions versus one-off is the three-way toggle below.
  @AC-1 @collection @criteria
  Scenario Outline: Narrow my products the way the product area lets me
    When I narrow my products by <narrowing>
    Then only the products matching what I asked for are returned

    Examples:
      | narrowing               |
      | a quick-search term     |
      | product name            |
      | category name           |
      | category                |
      | lifecycle status        |
      | when I bought them      |
      | when they next fall due |
      | price                   |

  # AMENDMENT A23. Clearing a narrowing is an ACTION, so it cannot ride a
  # `Then` of the Outline above — it gets its own scenario with its own When.
  @AC-1 @collection @criteria
  Scenario: Clearing what I asked for brings all my products back
    Given I have narrowed my products
    When I clear what I narrowed my products by
    Then all my products come back
    And the cleared key is not sent

  # My brand can decide that one-off purchases are simply not part of my portal.
  # When it has, that is not a narrowing I chose and not one I can undo — it is
  # applied to every read of my products, ahead of anything I ask for.
  #
  # AMENDMENT A18(a). One `<narrowing I ask for>` action column and one
  # `<outcome>` column — one action per row. The two "no choice" rows were
  # dropped per legacy grading (nathan-verdicts L165): every other list scenario
  # already reads a brand that made no choice, so the brand's choice is the
  # scenario's own precondition. Staff set the portal brand to hide one-off
  # purchases for the recording, the brand read is recorded where the session
  # boots on it, and the brand is put back after it.
  @AC-1 @collection @criteria @brand
  Scenario Outline: A brand that hides one-off purchases hides them from me everywhere
    Given my brand has chosen to hide one-off purchases from its portal
    And I ask for <narrowing I ask for>
    When I open my products
    Then <outcome>

    Examples:
      | narrowing I ask for | outcome                                                            |
      | nothing             | only my subscriptions come back                                    |
      | one-off purchases   | only my subscriptions come back — my brand's choice outranks mine |

  # AMENDMENT A22(a) + A29. The paging clause left this scenario, so the title
  # no longer says "page".
  @AC-1 @collection @criteria
  Scenario Outline: Order my products
    Given I have more products than fit on one page
    When I order them by <ordering>
    Then my products come back in that order

    Examples:
      | ordering                |
      | status                  |
      | when I bought them      |
      | when they next fall due |
      | when they were cancelled |

  @AC-1 @collection @criteria
  Scenario Outline: Move through the pages of my products
    Given I have more products than fit on one page
    And I am on the <page I start from> page of them
    When I move <move> of my products
    Then <outcome>

    Examples:
      | move                      | page I start from | outcome                                                                  |
      | forward to the next page  | first             | the next page comes back                                                 |
      | back to the previous page | second            | the previous page comes back                                             |
      | forward to the last page  | first             | the last page comes back and I am told there is no further page to go to |

  # DELETED per legacy grading (nathan-verdicts L212): "narrowing travels one
  # way" is a request-shape negative control the replay wall already proves for
  # every driven scenario.

  # The delegation is REAL and arranged for the recording: the delegate owner
  # invites my account, I accept, and the owner grants me one of its products;
  # the delegation is removed after it. My session's own `/self`, carrying what
  # is delegated to it, is recorded where the session boots on it. My choice is
  # the show-delegated preference my account holds (legacy stores it in my
  # account's preferences), made for the recording and put back after it.
  @AC-2 @collection @delegation
  Scenario Outline: Choose whether to see products delegated to me
    Given products have been delegated to me by another account
    When I ask to <choice> delegated products
    Then <outcome>

    Examples:
      | choice | outcome                                                 |
      | see    | the products delegated to me are included alongside my own |
      | hide   | only my own products come back                          |

  # AMENDMENT A24. The invariance is graded on a row that sets its own choice
  # up, never on a `Then` that asserts "whether or not I ask" under a `When`
  # that issues no ask. The "see" row ABSORBS "Having nothing delegated to me
  # outranks what I chose before" (nathan-verdicts L291): a session with
  # nothing delegated to it is never shown delegated products, whatever it
  # chose before. Each row's choice is ARRANGED on my account and restored.
  # It also absorbs "The product picker offers the delegated products my list
  # offers" (nathan-verdicts L1204) — see the note where that scenario stood.
  @AC-2 @AC-18 @collection @delegation
  Scenario Outline: Never be shown delegated products I do not have
    Given no products have been delegated to me
    And I asked to <choice> delegated products before
    When I open my products
    Then delegated products are excluded

    Examples:
      | choice |
      | see    |
      | hide   |

  # MUTANT (amendment A2): recording only the choice that changed, rather than
  # the whole set of preferences my account already holds, must turn this
  # scenario RED.
  #
  # AMENDMENT A18(b). ONE `<choice>` column; the two claims that performed a
  # second action, and the "nothing delegated outranks" claim, each leave for a
  # scenario of their own (A18(c), A19).
  # The delegation and the choice are arranged and restored as they are for
  # "Choose whether to see products delegated to me" above. This module only
  # READS the preference; the write that keeps every other preference is
  # client-personal-details' (its meta-merge mutant grades it), and a write
  # from here would be a request no step recorded.
  @AC-18 @collection @delegation @negative-control
  Scenario Outline: My choice about delegated products is remembered
    Given products have been delegated to me
    And I have asked to <choice> them
    When I come back later, in a new session
    Then <outcome> — I do not have to ask again
    And remembering my choice does not disturb any other preference I have set on my account

    Examples:
      | choice | outcome                                                     |
      | see    | my products still include the ones delegated to me          |
      | hide   | my products still leave out the ones delegated to me        |

  # MERGED per legacy grading (nathan-verdicts L291): "Having nothing delegated
  # to me outranks what I chose before" is the "see" row of "Never be shown
  # delegated products I do not have" above.

  # DELETED per legacy grading (nathan-verdicts L302): "My choice survives a
  # profile I have open at the same time" — legacy keeps one preference in user
  # meta and has no concurrent-profile behaviour of its own to grade.

  # MERGED per legacy grading (nathan-verdicts L318): "See my products grouped
  # by category, with a count for each" folded into "Ask for my products grouped
  # by category and see a count for each" below. Legacy groups by category AND
  # service identifier, counts only live products and applies no delegation
  # rule (`design ✅.md` D4a) — so its delegation rows had nothing to grade.

  # AMENDMENT A18(d). The brand claim gets a `Given` and a `When` of its own,
  # rather than riding an invariant line of the scenario above. The brand is
  # arranged and restored as it is there.
  @AC-19 @collection @brand
  Scenario: A brand that hides one-off purchases hides them from my category counts too
    Given my brand has chosen to hide one-off purchases from its portal
    When I ask for my products grouped by category
    Then only my subscriptions are counted here too

  # === MY PRODUCT'S OWN STATE ==================================================

  # One row per reportable state (AC-17, `design ✅.md` §8.7) staging can hold.
  # Each row's product is a real one of mine, put into that state for the
  # recording and put back after it. The "no other state" line grades the
  # other reportable states of the row as false, so a module that reports a
  # second state beside the right one fails.
  @AC-17 @meta
  Scenario Outline: Open one of my products and see what state it is in
    Given one of my products is <state>
    When I look at it
    Then I am told it is <state>, and in no other state of its lifecycle
    And I am told it <setup> setting up

    Examples:
      | state               | setup           |
      | pending             | still needs     |
      | awaiting activation | still needs     |
      | active              | no longer needs |
      | suspended           | no longer needs |
      | expiring            | no longer needs |
      | being cancelled     | no longer needs |
      | cancelled           | no longer needs |
      | lapsed              | no longer needs |

  # Each row's product is a real one of mine, put into that state for the
  # recording and closed after it. The trial that ends is the optional-trial
  # product ordered while its trial is set to end by cancelling.
  @AC-17 @meta
  Scenario Outline: Open one of my products in a state only the platform puts it in
    Given one of my products is <platform state>
    When I open it to see its state
    Then I am told it is <platform state>

    Examples:
      | platform state                   |
      | on a trial that is about to end  |

  # Staging refuses the import upload that puts a product in these states:
  # legacy's route `POST api/admin/import/files` answers 422 "Brand id
  # required in organisation mode!", with `brand_id` sent or not.
  @AC-17 @meta @todo
  Scenario Outline: Open one of my products in a state only the platform puts it in
    Given one of my products is <platform state>
    When I open it to see its state
    Then I am told it is <platform state>

    Examples:
      | platform state                   |
      | still being imported             |
      | imported from another platform   |

  # Only the platform's fraud engine sets `contract_fraud`: the staff fraud
  # event sets the contract's fraud_status alone, and the manual-status route
  # refuses the code (422 "Selected status is not allowed!").
  @AC-17 @meta @todo
  Scenario Outline: Open one of my products in a state only the platform puts it in
    Given one of my products is <platform state>
    When I open it to see its state
    Then I am told it is <platform state>

    Examples:
      | platform state                   |
      | flagged for fraud                |

  # Only the platform's migration sets `moved`: the staff product change
  # changes the product in place and leaves `moved` false.
  @AC-17 @meta @todo
  Scenario Outline: Open one of my products in a state only the platform puts it in
    Given one of my products is <platform state>
    When I open it to see its state
    Then I am told it is <platform state>

    Examples:
      | platform state                   |
      | moved to another product         |

  # Arranged on the catalogue's optional-trial product, ordered with its trial
  # started.
  @AC-17 @meta
  Scenario: Open one of my products while it is on trial
    Given one of my products is on trial
    When I look at it
    Then I am told it is on trial

  # AMENDMENT A26. The derivation itself is not something a client observes;
  # the date and the cause are.
  @AC-17 @meta
  Scenario: An expiring subscription is not the same as one that stopped invoicing
    Given one of my subscriptions is set to expire at the end of its term
    When I look at it
    Then it tells me it will expire
    And it tells me the date it will end, and that it is ending because I asked it to stop renewing
    And I am told separately whether its renewal invoicing is still on, as the product records it

  # The renewal invoice is ARRANGED for the recording: staff raise the next
  # recurring invoice on a fresh subscription of mine
  # (POST /api/admin/invoices/contract/{c}/products/{cp}/recurring, the
  # invoices.fixtures.ts route), and the subscription is closed after it.
  @AC-10 @meta
  Scenario: Know whether an outstanding invoice is still due, and still cancellable
    Given one of my products has an outstanding recurring invoice
    When I look at it
    Then I am told it has an unpaid recurring invoice
    And I am told whether that invoice is still due
    And I am told whether that invoice can still be cancelled

  # === CHANGING ONE PRODUCT ====================================================

  # AMENDMENT A20 + A28(c). Nine lines, one client-readable record each. The
  # last two arrive here and not on `contract.feature`'s `@AC-3` scenario: the
  # PRODUCT read carries `contract.payment_details` and
  # `contract.payment_details.gateway`, and the contract read carries neither
  # (`design ✅.md` §8.1 [o10 `:874-891`]).
  # Every line reads its record off the product read this scenario recorded.
  # Absorbs the three "The product I have open …" member scenarios (which
  # product, its name, its description).
  @AC-4 @manager
  Scenario: Open one of my products with what its detail view needs
    When I open one of my products
    Then it is the very product I opened, under its own name and description
    And it arrives with the account and the client it belongs to
    And with that client's image
    And with its pending contract request, as the platform holds it
    And with any cancellation that is scheduled for a future date, as the platform holds it
    And with its catalogue product
    And with the currency of that product's brand
    And with that product's image
    And with the payment method assigned to its contract
    And with that method's gateway

  # The two rows differ in what the stop sends: the first row sends my reason
  # with it, the second sends none. The brand configuration decides whether I
  # am PROMPTED for a reason, never what the body carries; this module reads no
  # brand setting.
  @AC-5 @manager @mutation
  Scenario Outline: Stop one of my subscriptions renewing, and change my mind
    Given an active subscription on my account
    When I ask for it to stop renewing, <giving a reason>
    Then it is set to end at the end of its current term
    When I ask for it to carry on instead
    Then it renews as before

    Examples:
      | giving a reason      |
      | with my reason       |
      | without a reason     |

  # Legacy shows the auto-renew message block only when a product is allowed to
  # have its renewal invoicing switched off — but stopping a subscription
  # renewing is a DIFFERENT change, and legacy offers it from three other
  # places that consult no such permission. Gating it here would take away
  # something the account area gives me today.
  #
  # AMENDMENT A22(e) + A21. One `<permission>` column, so the "allowed" case is
  # graded by a row that sets it up. The two rows are two different products:
  # "not allowed" is a subscription whose catalogue product forbids switching
  # renewal invoicing off, "allowed" a fresh one whose catalogue product
  # permits it (arranged for the recording, closed after it).
  @AC-5 @manager @mutation
  Scenario Outline: Stopping a subscription renewing is not the renewal-invoicing permission
    Given a subscription on my account that is <permission> to have its renewal invoicing switched off
    When I ask for it to stop renewing
    Then it is still set to end at the end of its current term — that permission does not govern this change
    And I am told its renewal invoicing as the platform now holds it

    Examples:
      | permission  |
      | not allowed |
      | allowed     |

  # AMENDMENT A8. The `<outcome>` column names what a client can SEE on the
  # invoices, never a wire token, and the third row names an observable rather
  # than restating its own choice. Each row's subscription starts on a value
  # other than the one it chooses (arranged for the recording, put back after),
  # so every submit is a real change. Absorbs "A consolidation choice I submit
  # leaves no consolidation form behind".
  @AC-9 @manager @mutation
  Scenario Outline: Decide whether one subscription joins my consolidated invoice
    Given a subscription on my account, with its consolidation form open
    When I submit "<choice>" in the consolidation form
    Then that subscription's invoices are <outcome>
    And my account-level consolidation preference is left exactly as it was
    And no consolidation form is left open behind it

    Examples:
      | choice            | outcome                                             |
      | opted out         | kept out of my consolidated invoice                 |
      | opted in          | joined to my consolidated invoice                   |
      | follow my account | consolidated exactly as the rest of my account is   |

  # MUTANT (amendment A2): removing the staged-import protection must turn this
  # scenario RED, and so must withholding those same changes from a merely
  # suspended subscription — the parity-loss limb, which the scenario below
  # grades on its own rows.
  @AC-11 @manager @guard @negative-control
  Scenario: A product still being imported cannot be changed
    Given one of my products is still being imported
    When I try to stop it renewing, change its consolidation, or book a cancellation
    Then I am told the change is not available to me
    And no request is made at all — not one that is sent and refused

  # AMENDMENT A10 + A11. The parity-loss claim gets a scenario whose `Given`
  # sets a SUSPENDED product up, instead of riding a `Then` inside a scenario
  # about an imported or a finished product. An over-refusing surface silently
  # takes capability from the client, so this is graded per change.
  # The suspended subscription is ARRANGED for the recording (a fresh one of
  # mine, suspended with the staff manual-status route and closed after it).
  # The three rows record together against that one product. Stopping the
  # renewal moves it from suspended to expiring (flow.md §3), so the outcome
  # is the change itself, not the suspended node.
  @AC-11 @manager @guard
  Scenario Outline: A suspended subscription is still offered every change
    Given a suspended subscription on my account
    When I <change>
    Then <outcome>

    Examples:
      | change                                | outcome                                               |
      | ask for it to stop renewing           | it is set to end at the end of its current term       |
      | set its consolidation to "opted out"  | that subscription's invoices are kept out of my consolidated invoice |
      | book a cancellation for a date I choose | a cancellation is booked against it for a future date |

  # === SCHEDULED ACTIONS (part of this manager's surface) =====================

  # These belong to the product I opened, not to a surface of their own: the
  # only route a client is entitled to read them by is the product itself (R10).
  #
  # MUTANT (amendment A2): pointing them at the staff-only scheduled-actions
  # route must turn this scenario RED.
  #
  # AMENDMENT A31. The entitlement RULE is not something a client observes; the
  # absence of a second request is.
  @AC-15 @manager @negative-control
  Scenario: See what is scheduled to happen to one of my products
    Given one of my products has billing actions scheduled against it
    When I open that product's scheduled actions
    Then I see them
    And they come from the product I already loaded, with no second request of my own

  # Ruling R18 — the two writes AC-15's data feeds. Neither is the hard
  # cancellation request `useContract().requestCancellation` lodges (that is a
  # CONTRACT-level write, per ruling R22, and lives in `contract.feature`).
  # Booking a scheduled cancellation is a self-transition: it never moves the
  # product's own status node, because `status.cancelling` derives from the
  # hard request alone (flow.md §3).
  #
  # The two rows differ in what the booking sends: the first sends my reason
  # with it, the second sends none. The date I am told is the one the platform
  # booked, read off the product after the booking.
  @AC-22 @manager @mutation
  Scenario Outline: Book a cancellation for one of my products on a date I choose
    Given an active product on my account, with no cancellation already booked
    When I book a cancellation for a date I choose, <giving a reason>
    Then that cancellation is scheduled against my product for the date I chose
    And <what is recorded>
    And my product's own status is unchanged — a scheduled cancellation is not the hard cancellation request
    And no cancellation request is asked for on my behalf

    Examples:
      | giving a reason  | what is recorded                                                        |
      | with my reason   | my reason is recorded against the booking                               |
      | without a reason | the platform's own wording is recorded against the booking, not a reason of mine |

  # NO SPEC STATES THE DERIVATION, SO NO ASSERTION IS AUTHORED (@todo).
  # `minFutureCancellationDate` is published on this manager's context and a
  # date derivation gates it, but NO artefact of this bundle — `design ✅.md`
  # §8.3/§8.7, flow.md §3, requirements.md AC22, parity rows P23/P24 —
  # states which date it is or how it is derived. The prover's Read-block law
  # (§3.9) puts the only remaining statement of it, the implementation, out of
  # reach, and inferring the expected value from the code is the tautological
  # self-validation ADR-021 bars. This scenario is carried `@todo` so the
  # capability is visible and unproven rather than silently dropped; it becomes
  # provable the moment the bundle states the rule.
  # DRIVEN (operator ruling): legacy states the derivation —
  # vue-app contractCancellation.ts ~L396-470: the earliest is next_due_date
  # (cycle 0), stepped forward in whole billing cycles when next_due_date is
  # past. The recorded product's next_due_date is future, so the earliest is
  # that date; the step asserts the published `minFutureCancellationDate`.
  @AC-22 @manager
  Scenario: The earliest date I can book a cancellation for is the one my product allows
    Given an active subscription on my account
    When I look at when I could book its cancellation for
    Then I am told the earliest date I am allowed to choose

  @AC-23 @manager @mutation
  Scenario: Revoke a scheduled cancellation I booked
    Given one of my products has a cancellation booked for a future date
    When I revoke that booking
    Then my product no longer carries a scheduled cancellation
    And my product's own status is unchanged by the revoke, exactly as the booking left it unchanged

  # === WHOLE-MODULE GUARANTEES ================================================

  # MUTANT (amendment A2): removing the authenticated-session protection from
  # the products collection must turn this scenario RED.
  #
  # AMENDMENT A7 + A17. ONE `<use>` column, one row per use — the collection
  # used plainly, and forced — so each row performs one action and a hidden
  # loop cannot pass on a partial failure. The `@signed-out` seed boots the
  # store's own guest session, so the Background's client is not signed in
  # here. No row records a request: a request any row makes is a capture gap
  # and fails that row by name. One surface per outline — the collection and
  # the manager are separate keys.
  @AC-16 @collection @guard @negative-control @signed-out
  Scenario Outline: Nothing is read from my products without an authenticated client session
    Given my session has ended and I am no longer signed in
    When <use>
    Then what I opened reports itself unavailable to me
    And no request is made against any of my products

    Examples:
      | use                                             |
      | I open my products while signed out             |
      | I force my products to be read while signed out |

  # MUTANT (amendment A2): removing the authenticated-session protection from
  # the product manager must turn this scenario RED.
  @AC-16 @manager @guard @negative-control @signed-out
  Scenario Outline: Nothing is read or changed on one of my products without an authenticated client session
    Given my session has ended and I am no longer signed in
    When <use>
    Then what I opened reports itself unavailable to me
    And no request is made against any product resource

    Examples:
      | use                                              |
      | I open one of my products while signed out       |
      | I force one of my subscriptions to stop renewing |
      | I force a consolidation change                   |

  # DELETED per legacy grading: "The account I act on is the one my scope
  # resolved" and "No staff route is ever reachable from my product surfaces" —
  # the replay wall already proves, for every driven scenario, that no request
  # goes to another account or to a staff route (such a request has no
  # recording and gaps). Their mutants now grade driven write scenarios.

# NOT A SCENARIO, DELIBERATELY. "The module speaks the platform's vocabulary
# rather than minting its own" is a source-structure fact for THIS module too
# (`design ✅.md` §8.10, R19), not something a client can DO. Its only possible
# assertion reads module source, so it lives in the lint/source lane, not
# here — the same disposition contract.feature's own header records.
#
# TWO MORE LINES LEFT THIS FILE UNDER AMENDMENT A3, FOR THE SAME REASON: "no
# request URL … contains the literal text `clients/undefined/`" and "not a
# second copy of it invented here" are a string fact and a source fact, not
# capabilities. The integration suite still asserts the first as a supporting
# line inside the AC-16 scope-identity tests, where the load-bearing assertion
# is the resolved-id allow-list.

  # AC-20 (ruling R10). The client browses the categories they ALREADY bought
  # into, not the shop's catalogue. Three named readings, one per line: the
  # right endpoint is asked, the shop is not, and the delegated categories
  # follow the same choice the product list follows.
  @AC-20 @collection
  Scenario: Browse the categories I have already bought into
    Given I am signed in and I have bought products in several categories
    When I ask for the categories I have bought into
    Then the categories I have bought into are requested
    And the shop catalogue is not requested
    And my delegated choice rides that request

  # AC-21 (ruling R9). One product fact, in the client's own words: a product
  # that no longer raises its own renewal invoice says so.
  @AC-21 @meta
  Scenario Outline: Know whether a product still invoices its own renewal
    Given a product whose renewal invoicing is <renewal invoicing>
    When I open that product
    Then I am told its renewal invoicing is <reading>

    Examples:
      | renewal invoicing | reading |
      | on                | on      |
      | off               | off     |

  # DELETED per legacy grading (nathan-verdicts L768): "What I am given is the
  # module's own shape" is the mapping law, proven by every driven scenario that
  # reads a mapped member.

  # AC-25 (ruling R20). The write spine, as a client-visible promise: one place
  # a write happens, and the module says so while it is happening. Absorbs
  # "When a change I make finishes I am told it is done".
  @AC-25 @machine
  Scenario: While a change of mine is in flight, the module says so
    Given one of my products
    When I ask for a change
    Then the module reports itself busy while the change is in flight
    And it reports itself settled once the change has landed
    And what it shows me afterwards is my product as the platform re-read it
    And I am told the change is done

  # === MY PRODUCT'S HARD CANCELLATION (moved from the contract, ruling R33) ===

  # AC-6/AC-7 moved here from `contract.feature` with ruling R33: "If it has to
  # know about the contract product state, and it's changing the contract
  # product, it's the job of the contract product." What I pick in the legacy
  # cancellation modal — "cancel at the end of the term", "cancel immediately",
  # "schedule a future cancellation" — is the ONE combined form's option (R35);
  # only "cancel immediately" (HARD) lodges the request this scenario names.
  # What is sent is this product's own id, plus my reason and details WHEN I
  # SUPPLY THEM — the brand configuration decides whether I am PROMPTED for the
  # fields, never what the body carries, and this module reads no brand setting.
  # AC-6 absorbs "A cancellation I submit leaves no cancellation form behind".
  @AC-6 @manager @mutation
  Scenario: Ask for one of my products to be cancelled outright
    Given an active product on my account, with the cancellation form open
    When I choose to cancel it immediately, giving my reason, and submit the form
    Then my cancellation request is lodged against my product, with my reason
    And my product is shown to me as being cancelled, as the platform re-read it
    And no cancellation form is left open behind it

  @AC-7 @manager @mutation
  Scenario: Change my mind about a cancellation I asked for
    Given I have an outstanding cancellation request on one of my products
    When I withdraw it
    Then my product no longer carries that request
    And my product is no longer shown as being cancelled

  # === WHAT A PAGE READS BEFORE IT DRAWS A CONTROL (FE-3029 module repair) ====

  # The grouped counts are a read I ask for. A page that shows them reads them
  # off my products surface, the same way it reads my products. Legacy groups
  # them by category AND service identifier and counts only my active products.
  @AC-19 @collection
  Scenario: Ask for my products grouped by category and see a count for each
    Given I have opened my products
    When I ask for my grouped counts
    Then my products surface holds the entries I was given, one per category, each with its count
    And each category is split by service identifier, each with its own count

  # Legacy hides the whole cancellation entry where it offers no option
  # (D27). A page must know that before it offers the form, so no form
  # opens empty. Every row's product is a real one of mine, put into that
  # state for the recording and closed after it.
  @AC-11 @manager @meta
  Scenario Outline: I am told whether the cancellation form is offered before I open it
    Given one of my products is <product kind and state>
    When I look at whether I can cancel it
    Then I am told the cancellation form is <offered>
    And what I am told matches whether the cancellation form opens when I ask for it

    Examples:
      | product kind and state                                         | offered     |
      | an active subscription                                         | offered     |
      | a subscription already set to expire                           | not offered |
      | a product with a cancellation booked for a future date         | not offered |
      | a product with a cancellation request already pending          | not offered |
      | a cancelled subscription                                       | not offered |
      | a live one-off purchase                                        | not offered |

  # Legacy hides the cancellation entry on an accepted request and on an
  # import in progress (cProdProvider.vue:274-300); it OFFERS it on a
  # subscription whose renewal invoicing is off with no end date.
  @AC-11 @manager @meta
  Scenario Outline: I am told why the cancellation form is not available to me
    Given one of my products is held back from cancelling because <cause>
    When I look at whether I can cancel it now
    Then I am told the cancellation is <shown>

    Examples:
      | cause                                         | shown                        |
      | its cancellation request was already accepted | not shown                    |
      | its auto-renew is off and it has no end date  | offered                      |

  # Staging refuses the import upload that puts a product in this state:
  # legacy's route `POST api/admin/import/files` answers 422 "Brand id
  # required in organisation mode!", with `brand_id` sent or not.
  @AC-11 @manager @meta @todo
  Scenario Outline: I am told why the cancellation form is not available to me
    Given one of my products is held back from cancelling because <cause>
    When I look at whether I can cancel it now
    Then I am told the cancellation is <shown>

    Examples:
      | cause                                         | shown                        |
      | it is still being imported                    | not shown                    |

  # Legacy refuses the cancellation to anyone while a pro-rata invoice is
  # pending, and to a client whenever the platform says the product cannot
  # be cancelled, overdue invoices or not (cProdProvider.vue cancelOption).
  # Each row's product is a real one of mine, arranged for the recording and
  # closed after it; the catalogue setting it needs is put back after it.
  @AC-11 @manager @meta
  Scenario Outline: I cannot ask to cancel a product the platform holds back from cancelling
    Given one of my products <hold>
    When I ask to cancel it
    Then I am told I cannot ask to cancel it
    And no cancellation form opens and no cancellation is sent

    Examples:
      | hold                                            |
      | has a pending pro-rata invoice                  |
      | has platform settings that do not allow cancelling |
      | cannot be cancelled and has overdue invoices    |

  # Legacy offers the consolidation choice on a live subscription that is not
  # being imported, whose product carries the setting and whose account does
  # not refuse consolidation (D28). Absorbs "A product I have finished with
  # cannot change how it is invoiced" and "A one-off purchase is never offered
  # a consolidation choice". Legacy draws the choice DISABLED, not hidden, on
  # a cancelled or lapsed subscription; the module publishes one flag for
  # both, so those rows read "not offered".
  @AC-9 @manager @meta
  Scenario Outline: I am told whether the consolidation form is offered before I open it
    Given one of my products is <product and account>
    When I look at whether I can change how it is invoiced
    Then I am told the consolidation form is <offered>
    And what I am told matches whether the consolidation form opens when I ask for it

    Examples:
      | product and account                                   | offered     |
      | a subscription, and my account consolidates           | offered     |
      | a subscription, and my account follows its default    | offered     |
      | a subscription, and my account never consolidates     | not offered |
      | a subscription already asked to stop renewing         | offered     |
      | a one-off purchase, live                              | not offered |
      | a one-off purchase, still pending                     | not offered |
      | a cancelled subscription, for its invoicing           | not offered |
      | a lapsed subscription, for its invoicing              | not offered |

  # === WHAT A HAND DOES ON THE PLAYGROUND PAGES (FE-3029 scenario lane) ======

  # The list page narrows, clears and pages my products through the same
  # criteria surface the module publishes.
  # The FE-3029 price-narrow, clear, and paging twins were DELETED — they
  # duplicate the AC-1 narrow ("price" column) and paging outlines.

  # The manager page opens each form from its own slot, so no form opens
  # empty, and it refuses a form the client has not completed.
  @FE-3029 @manager
  Scenario: Open the cancellation form with the options my product allows
    Given I have one of my active subscriptions open
    When I open the cancellation form
    Then the cancellation form is open
    And it offers cancelling at the end of the term, cancelling immediately, and cancelling on a future date I choose

  # Legacy's client option list (contractCancellation.ts:303-333) follows the
  # product's state: a pending contract is offered the immediate request
  # (:157). The product is arranged for the recording and closed after it.
  @FE-3029 @manager
  Scenario: The cancellation form on a pending product offers the immediate request
    Given I have one of my products open that is still pending
    When I open the cancellation form
    Then the cancellation form is open
    And it offers cancelling immediately

  @FE-3029 @manager
  Scenario: A cancellation form I submit without a choice is not sent and tells me why
    Given I have the cancellation form open on one of my products
    When I submit the cancellation form without choosing an option
    Then the cancellation form stays open and is not valid
    And I am shown that an option is required

  @FE-3029 @manager
  Scenario: Close the cancellation form without cancelling
    Given I have the cancellation form open on one of my products
    When I close the cancellation form
    Then the cancellation form is closed
    And my product is still active

  @FE-3029 @manager
  Scenario: Open the consolidation form with the choices a subscription allows
    Given I have one of my active subscriptions open
    When I open the consolidation form
    Then the consolidation form is open
    And it offers opting in, opting out, or following my account

  # Legacy refuses a consolidation submit that changes nothing (the form's
  # formIsChanged gate): choosing the value the subscription already has sends
  # nothing, and the form stays open.
  @AC-9 @FE-3029 @manager
  Scenario: A consolidation choice that changes nothing is not sent
    Given I have the consolidation form open on one of my subscriptions, with no choice made
    When I submit the consolidation form choosing the value my subscription already has
    Then my consolidation choice is not sent and the consolidation form stays open

  # Absorbs "Refreshing my product's scheduled actions re-reads that product":
  # a refresh and a reset each read the product again.
  @FE-3029 @manager
  Scenario Outline: Read my product afresh
    Given I have one of my active subscriptions open
    When I <read again> my product
    Then my product is read again and shown as active

    Examples:
      | read again |
      | reset      |
      | refresh    |

  # === WHAT THE MANAGER PUBLISHES ABOUT THE PRODUCT I HAVE OPEN =============
  # One scenario per template context/action member ruling R37 restores, and
  # per the failed-load settlement decisions D43/D44. Each is proven over the
  # recorded corpus by contract-product.manager-members.int.test.ts. These are
  # capability spec, driven by no step catalog entry.

  @FE-3029 @manager @member
  Scenario: The cancellation custom fields my brand defines are loaded ready for the form
    Given I have a product of mine open in the manager
    When I read the loaded cancellation lookups
    Then they are the cancellation custom fields my brand's catalogue holds, read when my product was opened
    And a cancellation custom field my brand defines is among them

  # The product is a real one on ANOTHER client's account, ordered for the
  # recording by that client and closed after it. Absorbs the three failed-read
  # member scenarios (the reason, the settled error, the at-once not-ready).
  @FE-3029 @manager
  Scenario: Opening a product that is not mine fails, and I am shown why at once
    Given a product that is on another client's account
    When I open it as if it were one of mine
    Then I am shown the reason my read of it was refused
    And the manager has stopped loading and reports an error
    And I am told at once that the product is not ready

  # AMENDMENT (FE-3029 R38 item 1). A subscription and a one-time purchase are
  # mutually exclusive, so the narrowing is one three-way toggle, never two:
  # moving the toggle replaces the position it was at, and never adds to it.
  # The `<from>` column is the position a row starts at — the One-time row
  # starts at Subscriptions, so it grades that the two are never sent at once.
  @AC-1 @collection @criteria @driveable
  Scenario Outline: A subscription-type toggle shows all my products, only my subscriptions, or only my one-time purchases
    Given I am looking at my products with the subscription-type toggle at <from>
    When I set the subscription-type toggle to <position>
    Then <outcome>

    Examples:
      | position      | from          | outcome                                                                                 |
      | All           | Subscriptions | my products come back whether they are subscriptions or not                             |
      | Subscriptions | All           | only my subscriptions come back                                                         |
      | One-time      | Subscriptions | only my one-time purchases come back, and the subscriptions narrowing no longer applies |

  # === R38 — THE LIST ROWS AND THE PICKER (FE-3029) ==========================
  # R38 items 8 and 10: every column shows a value the mapper maps, never a
  # `raw.*` read. Item 2: `useContractProduct` with no id draws its picker from
  # a `schemas.contractProductPicker` pair on `useContractProducts`, as
  # `useTicket` draws `schemas.ticketPicker`; the picked value is what the
  # manager loads by. Dates read as the account area shows them, and the
  # billing cycle as legacy `getBillingCycleName` names it (vue-app
  # mixins/cProdMixin.ts:51-53).

  @AC-1 @collection
  Scenario: Each of my products shows the date I bought it
    Given I am looking at my products
    When my products are read
    Then each one shows the date I bought it

  @AC-1 @manager
  Scenario: My product shows when it next falls due and how often it bills
    Given I open one of my products
    When it is read
    Then it shows the date it next falls due
    And it shows how often it bills, in words

  @FE-3029 @collection @member
  Scenario: Picking one of my products opens that very product
    Given I have no product open yet
    When I pick one of my products
    Then the product the manager opens is the one I picked

  # === THE REPAIR OF G4 TO G8 — PRICE, STATUS BADGE, BILLING CYCLE, PICKER ===
  # `playground-derivation.md` gaps G4 to G8. The price follows legacy
  # `getPriceTermSummary` (vue-app mixins/cProdMixin.ts:36-50): the recurring
  # price for a subscription, the discounted price for a one-time product, net
  # or gross per the brand's tax type (the record's brand, else the portal
  # brand), each as the brand formats it in its own currency. The status reads
  # as a translated name plus one flag per status code. The picker names each
  # product as legacy does: its name, then its service identifier in brackets
  # (vue-app store/modules/data/contracts/products.ts:201-208).

  # The brand's tax rule is staging's own: the generator verifies the portal
  # brand prices without tax and records that brand read where the session
  # boots on it. The opened subscription carries tax, so its price before tax
  # differs from its price with tax added. One surface per scenario — the list
  # and the opened product are separate keys.
  @AC-1 @collection
  Scenario: A subscription in my list shows what it costs each time it renews, as my brand's tax rule prices it
    Given my brand prices its products without tax
    When my subscriptions are read
    Then each subscription shows its renewal price before tax, as my brand formats it

  @AC-1 @manager
  Scenario: A subscription I open shows what it costs each time it renews, as my brand's tax rule prices it
    Given my brand prices its products without tax
    When I open one of my subscriptions
    Then it shows its renewal price before tax as my brand formats it, never the price with tax added

  @AC-1 @collection
  Scenario: A one-time purchase shows the price I paid for it, as my brand's tax rule prices it
    Given my brand prices its products without tax
    When my one-time purchases are read
    Then each one-time purchase shows its purchase price before tax, never a renewal price of nothing

  @AC-1 @collection
  Scenario: Each of my products shows its status in words, with one flag for that status
    Given I am looking at my products
    When my products are read
    Then each one shows the name of its status, and only the flag for that status is raised

  @AC-1 @collection
  Scenario: Each of my products shows how often it bills, in words
    Given I am looking at my products
    When my products are read
    Then each one shows its billing cycle as a word, never a number of months

  # The picker's option labels (legacy "name (service identifier)") and values
  # are proven by `contract-product.picker.test.ts` over recorded rows — the
  # options sit behind the picker schema's lookup, which no World step reads.

  # MERGED per legacy grading (nathan-verdicts L1204): "The product picker
  # offers the delegated products my list offers" folds into "Never be shown
  # delegated products I do not have". The picker's own read is reached only
  # through the published picker schema's lookup, which no World action fires,
  # so no step drives that half yet — an open gap, reported (FE-3145).

  # === FE-3029 · THE FORMLESS WRITES, DRIVEN (operator ruling) ================
  # Each fires the real `useContractProduct` action against the module's own
  # recorded staging write, the way `tickets` fires reply/close. The Then is a
  # settle-only read of the manager's published meta — the wire body, route and
  # re-read of each write are proven by `contract-product.mutations.int.test.ts`.

  # The FE-3029 formless-write twins (stop renewing, book cancellation, set
  # consolidation) were DELETED — they duplicate AC-5, AC-22 and AC-9, which are
  # driven with their real writes and re-reads.

  # Driveable once the scenario runner replays the read that follows a write:
  # each write below re-reads the product to confirm, and today's replay serves
  # the pre-write read (operator ruling 2026-09-28). The behaviour itself is
  # proven by `contract-product.mutations.int.test.ts`.

  # The 4 "as a playground track" @FE-3029 twins (cancel-now, withdraw, resume,
  # revoke-booked) were DELETED (FE-3145 conversion): they duplicated AC-6, AC-7,
  # AC-5 (resume) and AC-23, which carry the capability and are driven there.

  # The FE-3029 subscription-type-toggle and sort twins (see-only-subscriptions,
  # see-only-one-time, see-every-type, order-by-next-due) were DELETED — they
  # duplicate the AC-1 subscription-type-toggle and order outlines.
