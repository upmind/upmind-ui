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
  # of the eight fails one NAMED row rather than passing a packed line. The
  # category-name row is the one narrowing the legacy client area gives a
  # client and an account holder alone — that oracle note is carried as this
  # comment, never as an asserted line (A19).
  @AC-1 @collection @criteria
  Scenario Outline: Narrow my products the way the product area lets me
    When I narrow my products by <narrowing>
    Then only the products matching what I asked for are returned

    Examples:
      | narrowing                                 |
      | product name                              |
      | category name                             |
      | category                                  |
      | lifecycle status                          |
      | whether they are subscriptions or one-off |
      | when I bought them                        |
      | when they next fall due                   |
      | price                                     |

  # AMENDMENT A23. Clearing a narrowing is an ACTION, so it cannot ride a
  # `Then` of the Outline above — it gets its own scenario with its own When.
  @AC-1 @collection @criteria
  Scenario: Clearing what I asked for brings all my products back
    Given I have narrowed my products
    When I clear the narrowing
    Then all my products come back
    And the cleared key is not sent

  # My brand can decide that one-off purchases are simply not part of my portal.
  # When it has, that is not a narrowing I chose and not one I can undo — it is
  # applied to every read of my products, ahead of anything I ask for.
  #
  # AMENDMENT A18(a). One `<brand choice>` precondition column, one
  # `<narrowing I ask for>` action column and one `<outcome>` column — one
  # action per row, so the "no such choice" case is graded by a row that sets
  # it up rather than by a `Then` that fights its own `Given`.
  @AC-1 @collection @criteria @brand
  Scenario Outline: A brand that hides one-off purchases hides them from me everywhere
    Given my brand <brand choice> one-off purchases from its portal
    And I ask for <narrowing I ask for>
    When I open my products
    Then <outcome>

    Examples:
      | brand choice        | narrowing I ask for | outcome                   |
      | has chosen to hide  | nothing             | only my subscriptions come back |
      | has chosen to hide  | one-off purchases   | only my subscriptions come back — my brand's choice outranks mine |
      | has made no choice about | nothing        | all my products come back |
      | has made no choice about | one-off purchases | my one-off purchases come back |

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
    When I move <move>
    Then <outcome>

    Examples:
      | page I start from | move                      | outcome                                                                  |
      | first             | forward to the next page  | the next page comes back                                                 |
      | second            | back to the previous page | the previous page comes back                                             |
      | first             | forward to the last page  | the last page comes back and I am told there is no further page to go to |

  # MUTANT (amendment A2): patching a narrowing onto the request behind the
  # declared query contract must turn this scenario RED.
  #
  # AMENDMENT A6 + A5. One shaping action per row — a hidden loop over three
  # shapings is worst in a negative control.
  @AC-1 @collection @criteria @negative-control
  Scenario Outline: Every narrowing I ask for travels one way only
    When I <shaping> my products
    Then what I asked for is the only thing that shapes the request
    And a narrowing this surface does not offer is never sent, and I am told it was refused

    Examples:
      | shaping |
      | narrow  |
      | order   |
      | page    |

  @AC-2 @collection @delegation
  Scenario Outline: Choose whether to see products delegated to me
    Given products have been delegated to me by another account
    When I ask to <choice> delegated products
    Then <outcome>
    And the products delegated to me are included, and my own are unchanged

    Examples:
      | choice | outcome                                                 |
      | see    | the products delegated to me are included alongside my own |
      | hide   | only my own products come back                          |

  # AMENDMENT A24. The invariance is graded on a row that sets its own choice
  # up, never on a `Then` that asserts "whether or not I ask" under a `When`
  # that issues no ask.
  @AC-2 @collection @delegation
  Scenario Outline: Never be shown delegated products I do not have
    Given no products have been delegated to me
    And I asked to <choice> delegated products before
    When I open my products
    Then delegated products are excluded
    And I am not offered the choice at all

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

  # AMENDMENT A18(c).
  @AC-18 @collection @delegation
  Scenario: Having nothing delegated to me outranks what I chose before
    Given nothing is delegated to me now
    And I asked to see delegated products before
    When I open my products
    Then delegated products stay hidden

  # AMENDMENT A19.
  @AC-18 @collection @delegation
  Scenario: My choice survives a profile I have open at the same time
    Given I asked to see delegated products
    And I have my profile open
    When I come back later with my profile still open
    Then my choice is still remembered
    And the profile still shows the fields I opened it on, not my preference in their place

  # This read is NOT a mode of the products list — legacy addresses it to my
  # account by id rather than by token, asks for a smaller set of related
  # records, orders it by service, and counts only my live products. Crucially
  # it applies NO delegation rule at all (`design ✅.md` D4a).
  #
  # AMENDMENT A25 + A32. The delegation invariance is graded on a row that sets
  # the choice up, and the four counted states are four NAMED lines, so a
  # module that counts three of the four fails one of them.
  @AC-19 @collection
  Scenario Outline: See my products grouped by category, with a count for each
    Given products have been delegated to me and I asked to <delegation choice>
    When I ask for my products grouped by category
    Then I am given one entry per category with how many of my products are in it
    And only my active products are counted
    And my products awaiting activation are counted
    And my pending products are counted
    And my suspended products are counted
    And they are grouped in service order
    And the same products are counted whichever I chose

    Examples:
      | delegation choice |
      | see delegated     |
      | hide delegated    |

  # AMENDMENT A18(d). The brand claim gets a `Given` and a `When` of its own,
  # rather than riding an invariant line of the scenario above.
  @AC-19 @collection @brand
  Scenario: A brand that hides one-off purchases hides them from my category counts too
    Given my brand has chosen to hide one-off purchases from its portal
    When I ask for my products grouped by category
    Then only my subscriptions are counted here too

  # === MY PRODUCT'S OWN STATE ==================================================

  # AMENDMENT A1. ONE STATE PER LINE. The thirteen reportable states of AC-17
  # (`design ✅.md` §8.7, flow.md §3), in the client's own words, then the three
  # record facts. A module that never reports one of the thirteen fails one
  # NAMED line; thirteen readings on one line let a module that reports twelve
  # of them pass. The client words for the `setup incomplete` node are
  # "awaiting setup".
  @AC-17 @meta
  Scenario: Know what state each of my products is in
    When I look at one of my products
    Then I am told whether it is pending
    And whether it is awaiting activation
    And whether it is active
    And whether it is suspended
    And whether it is expiring
    And whether it is being cancelled
    And whether it is awaiting setup
    And whether it is on trial
    And whether that trial is about to end
    And whether it is still being imported
    And whether it is cancelled
    And whether it has lapsed
    And whether it is flagged for fraud
    And whether it was imported
    And whether it was moved to another product
    And whether it has unpaid recurring invoices

  # AMENDMENT A26. The derivation itself is not something a client observes;
  # the date and the cause are.
  @AC-17 @meta
  Scenario: An expiring subscription is not the same as one that stopped invoicing
    Given one of my subscriptions is set to expire at the end of its term
    When I look at it
    Then it tells me it will expire
    And it tells me the date it will end, and that it is ending because I asked it to stop renewing
    And it is not confused with a subscription whose renewal invoicing was switched off, which this surface tells me about but never changes

  # AMENDMENT A19. The cross-module consistency claim moved to bdd.md's
  # deferral table beside the mappers spec: it is provable only by reading
  # another module's selector, which is not a capability of this one.
  @AC-10 @meta
  Scenario: Know whether an outstanding invoice is still due, and still cancellable
    Given one of my products has an outstanding recurring invoice
    When I look at it
    Then I am told whether that invoice is still due
    And whether it is still in a state where cancelling it means anything

  # === CHANGING ONE PRODUCT ====================================================

  # AMENDMENT A20 + A28(c). Nine lines, one client-readable record each. The
  # last two arrive here and not on `contract.feature`'s `@AC-3` scenario: the
  # PRODUCT read carries `contract.payment_details` and
  # `contract.payment_details.gateway`, and the contract read carries neither
  # (`design ✅.md` §8.1 [o10 `:874-891`]).
  @AC-4 @manager
  Scenario: Open one of my products with what its detail view needs
    When I open one of my products
    Then it arrives with the accounts it belongs to
    And with the images of those accounts
    And with its pending contract request
    And with any cancellation that is scheduled for a future date
    And with its catalogue product
    And with the currency of that product's brand
    And with that product's image
    And with the payment method assigned to its contract
    And with that method's gateway

  # AMENDMENT A19 + A21. The `<what I supply>` column parameterises a
  # precondition, never the `When`: criterion AC5 and `design ✅.md` §8.3 both
  # say the cause and the custom fields travel only when the CLIENT supplies
  # them, and the brand-configuration gate decides the PROMPT, not the body.
  # This module reads no brand setting.
  @AC-5 @manager @mutation
  Scenario Outline: Stop one of my subscriptions renewing, and change my mind
    Given an active subscription on my account
    And I supply <what I supply> with the change
    When I ask for it to stop renewing
    Then it is set to end at the end of its current term
    When I ask for it to carry on instead
    Then it renews as before
    And <outcome>
    And neither of those ever changes the separate renewal-invoicing switch, which this surface reports but never sets

    Examples:
      | what I supply        | outcome                                      |
      | a reason and details | my reason and details travel with the change |
      | nothing              | nothing travels in their place               |

  # Legacy shows the auto-renew message block only when a product is allowed to
  # have its renewal invoicing switched off — but stopping a subscription
  # renewing is a DIFFERENT change, and legacy offers it from three other
  # places that consult no such permission. Gating it here would take away
  # something the account area gives me today.
  #
  # AMENDMENT A22(e) + A21. One `<permission>` column, so the "allowed" case is
  # graded by a row that sets it up.
  @AC-5 @manager @mutation
  Scenario Outline: Stopping a subscription renewing is not the renewal-invoicing permission
    Given a subscription on my account that is <permission> to have its renewal invoicing switched off
    When I ask for it to stop renewing
    Then it is still set to end at the end of its current term — that permission does not govern this change
    And that permission does not change what this surface tells me about renewal invoicing

    Examples:
      | permission  |
      | not allowed |
      | allowed     |

  # AMENDMENT A8. The `<outcome>` column names what a client can SEE on the
  # invoices, never a wire token, and the third row names an observable rather
  # than restating its own choice.
  @AC-9 @manager @mutation
  Scenario Outline: Decide whether one subscription joins my consolidated invoice
    Given a subscription on my account
    When I set its consolidation to "<choice>"
    Then that subscription's invoices are <outcome>
    And my account-level consolidation preference is left exactly as it was

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
  @AC-11 @manager @guard
  Scenario Outline: A suspended subscription is still offered every change
    Given a suspended subscription on my account
    When I <change>
    Then the change is offered and its request is sent

    Examples:
      | change                                          |
      | stop it renewing                                |
      | change whether it joins my consolidated invoice |
      | book a cancellation for a date I choose         |

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
  # why the scenario after this one exists.
  #
  # AMENDMENT A34. "Everything" is unfalsifiable; the named observables are not.
  @AC-11 @manager @guard
  Scenario: A product I have finished with cannot change how it is invoiced
    Given one of my products has been cancelled, or has lapsed
    When I try to change whether it joins my consolidated invoice
    Then I am told the change is not available to me
    And no request is made at all
    And I can still read its state, its product and its dates — only the change is refused

  # A one-off purchase is not a smaller subscription: my account area offers it a
  # smaller set of changes altogether.
  #
  # AMENDMENT A12 + A16. One `<product kind and state>` precondition column
  # with its own `<offered>` outcome, because the carried invariant lines
  # asserted about subjects their own `Given` never set up. The renewal-stop
  # claim is a per-row outcome, never an invariant line that is false on two of
  # four rows.
  @AC-11 @manager @guard
  Scenario Outline: A one-off purchase is never offered a consolidation choice
    Given one of my products is <product kind and state>
    When I look at what I can change about it
    Then <offered>
    And forcing a consolidation change anyway makes no request and is refused

    Examples:
      | product kind and state          | offered                                                                           |
      | a one-off purchase, live        | the consolidation choice is not offered to me, and neither is stopping it renewing |
      | a one-off purchase, still pending | the consolidation choice is not offered to me, and neither is stopping it renewing |
      | a subscription                  | the consolidation choice is offered to me, and so is stopping it renewing          |
      | a subscription already asked to stop | the consolidation choice is offered to me, and aborting that stop is offered in its place |

  # AMENDMENT A7. ONE `<change>` column, one row per write — so a module that
  # refreshes after four of the five fails one NAMED row rather than passing a
  # packed "any of the changes this surface offers me" line. SC-001 and
  # criterion AC13 count EIGHT writes across the story; ruling R21 split them,
  # and this manager offers five. The other three (the payment method, the
  # cancellation request and its withdrawal) are `contract.feature`'s, and
  # `contract.mutations.int.test.ts` holds their re-read-after-write proof.
  @AC-13 @manager @mutation
  Scenario Outline: A change I make shows up everywhere without me reloading
    Given I am looking at one of my products, at my products list, and at my dashboard's count of them, all at the same time
    When I <change>
    Then every one of them shows me the change without my asking them to
    And each of them re-reads from the server rather than guessing

    Examples:
      | change                                  |
      | stop the renewal                        |
      | abort that stop                         |
      | set the consolidation value             |
      | book a cancellation for a date I choose |
      | revoke that booking                     |

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

  # AMENDMENT A22(f).
  @AC-15 @manager
  Scenario Outline: An empty scheduled-actions result tells me why it is empty
    Given one of my products has <cause>
    When I open that product's scheduled actions
    Then I am told which of the two it is

    Examples:
      | cause                        |
      | no billing actions scheduled |
      | not been asked for them yet  |

  # AMENDMENT A22(g). Refreshing is an ACTION, so it cannot ride a `Then` of
  # the scenario above.
  @AC-15 @manager
  Scenario: Refreshing my product's scheduled actions re-reads that product
    Given I have opened one of my products' scheduled actions
    When I refresh them
    Then that product is read again

  # Ruling R18 — the two writes AC-15's data feeds. Neither is the hard
  # cancellation request `useContract().requestCancellation` lodges (that is a
  # CONTRACT-level write, per ruling R22, and lives in `contract.feature`).
  # Booking a scheduled cancellation is a self-transition: it never moves the
  # product's own status node, because `status.cancelling` derives from the
  # hard request alone (flow.md §3).
  #
  # AMENDMENT A33. A `<what I supply>` precondition column, because the cause
  # and the custom fields travel only when the client supplies them.
  @AC-22 @manager @mutation
  Scenario Outline: Book a cancellation for one of my products on a date I choose
    Given an active product on my account, with no cancellation already booked
    And I supply <what I supply> with my booking
    When I book a cancellation for a date I choose
    Then that cancellation is scheduled against my product for the date I chose
    And <outcome>
    And my product's own status is unchanged — a scheduled cancellation is not the hard cancellation request
    And no cancellation request is asked for on my behalf

    Examples:
      | what I supply        | outcome                                    |
      | a reason and details | my reason and details travel with it       |
      | nothing              | nothing travels in their place             |

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
  @AC-22 @manager @todo
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
  # either surface must turn this scenario RED.
  #
  # AMENDMENT A7 + A17. ONE `<use>` column, one row per use — each of this
  # module's TWO surfaces used plainly, and each forced use — so each row
  # performs one action and a hidden loop cannot pass on a partial failure.
  # (A7's carried count of eight rows was written for the single carried file
  # that held FOUR surfaces; ruling R21 split it, and this file owns two.) The
  # `Given` overrides the Background's stated default.
  @AC-16 @module @guard @negative-control
  Scenario Outline: Nothing is read or changed on my products without an authenticated client session
    Given my session has ended and I am no longer signed in
    When <use>
    Then no request is made against any product resource
    And any forced read or write is refused as not-authenticated

    Examples:
      | use                                      |
      | I open my products                       |
      | I open one of my products                |
      | I force one of my subscriptions to stop renewing |
      | I force a consolidation change           |

  # MUTANT (amendment A2): re-introducing a caller-supplied account-id option,
  # even for internal use only, must turn this scenario RED.
  @AC-16 @module @fe-2824 @negative-control
  Scenario: The account I act on is the one my scope resolved
    Given a caller holds a reference to one of the surfaces of this module
    When a caller tries to name a different account through an option
    Then no caller can ask this surface for another account's products
    And every request and every cached result still belongs to my own account

  # MUTANT (amendment A2): pointing any action at its staff counterpart must
  # turn this scenario RED.
  @AC-16 @module @guard @negative-control
  Scenario Outline: No staff route is ever reachable from my product surfaces
    Given the routes that modify terms, activate, set a manual status, switch currency, transfer ownership, or read the staff scheduled-actions collection belong to staff
    When I use <action>
    Then not one request is ever addressed to a staff route

    Examples:
      | action                                          |
      | opening one of my products                      |
      | stopping one of my subscriptions renewing       |
      | changing whether one joins my consolidated invoice |
      | booking a cancellation for a date I choose      |
      | revoking that booking                           |

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
    When I open it
    Then I am told its renewal invoicing is <reading>

    Examples:
      | renewal invoicing | reading |
      | on                | on      |
      | off               | off     |

  # AC-24 (ruling R19). The mapping law, as a client-visible promise: what the
  # module hands a consumer is a view model, not the wire record.
  @AC-24 @mapping
  Scenario: What I am given is the module's own shape, not the server's
    Given a product the server has described in its own words
    When the module gives it to me
    Then every member it publishes is named the way this codebase names things
    And it publishes only the parts this module reads
    And the server's own record is still reachable beside it

  # AC-25 (ruling R20). The write spine, as a client-visible promise: one place
  # a write happens, and the module says so while it is happening.
  @AC-25 @machine
  Scenario: While a change of mine is in flight, the module says so
    Given one of my products
    When I ask for a change
    Then the module reports itself busy while the change is in flight
    And it reports itself settled once the change has landed
    And it has re-read the product before it settles

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
  @AC-6 @manager @mutation
  Scenario: Ask for one of my products to be cancelled outright
    Given an active product on my account
    And I supply a reason and details with my request
    When I ask for it to be cancelled immediately
    Then my cancellation request is lodged, naming my product it is against
    And my reason and details travel with the request, and nothing travels in their place when I supply none
    And an invalid request is never sent, and its error is shown to me on the still-open form
    And what I see afterwards is the server's answer, not an optimistic guess

  @AC-7 @manager @mutation
  Scenario: Change my mind about a cancellation I asked for
    Given I have an outstanding cancellation request on one of my products
    When I withdraw it
    Then the withdrawal names the pending request on my product
    And a refusal by the server is shown to me, not reported as a silent success

  # === WHAT A PAGE READS BEFORE IT DRAWS A CONTROL (FE-3029 module repair) ====

  # The grouped counts are a read I ask for. A page that shows them reads them
  # off my products surface, the same way it reads my products.
  @AC-19 @collection
  Scenario: The grouped counts I asked for are kept for my page to show
    Given I have opened my products
    When I ask for my grouped counts
    Then my products surface holds the entries I was given, one per category, each with its count

  @AC-19 @collection
  Scenario: Asking for my grouped counts again replaces the ones I hold
    Given I already hold my products grouped by category
    When I ask for them again
    Then I hold only the entries of the latest answer, never the earlier ones and never a second copy of any

  # Legacy hides the whole cancellation entry where it offers no option
  # (D27). A page must know that before it offers the form, so no form
  # opens empty.
  @AC-11 @manager @meta
  Scenario Outline: I am told whether the cancellation form is offered before I open it
    Given one of my products is <product kind and state>
    When I look at whether I can cancel it
    Then I am told the cancellation form is <offered>
    And what I am told matches whether the form opens when I ask for it

    Examples:
      | product kind and state                                 | offered     |
      | an active subscription                                 | offered     |
      | a subscription with auto-renew off and no end date     | offered     |
      | a subscription already set to expire                   | not offered |
      | a product with a cancellation booked for a future date | not offered |
      | a product with a cancellation request already pending  | not offered |
      | a subscription still being imported                    | not offered |
      | a cancelled subscription                               | not offered |

  # Legacy offers the consolidation choice on a live subscription that is not
  # being imported, whose product carries the setting and whose account does
  # not refuse consolidation (D28).
  @AC-9 @manager @meta
  Scenario Outline: I am told whether the consolidation form is offered before I open it
    Given one of my products is <product and account>
    When I look at whether I can change how it is invoiced
    Then I am told the consolidation form is <offered>
    And what I am told matches whether the form opens when I ask for it

    Examples:
      | product and account                                           | offered     |
      | a subscription, and my account consolidates                   | offered     |
      | a subscription, and my account follows its default            | offered     |
      | a subscription, and my account never consolidates             | not offered |
      | a subscription whose product carries no consolidation setting | not offered |
      | a one-off purchase                                            | not offered |
      | a subscription still being imported                           | not offered |
      | a cancelled subscription                                      | not offered |

  # === WHAT A HAND DOES ON THE PLAYGROUND PAGES (FE-3029 scenario lane) ======

  # The list page narrows, clears and pages my products through the same
  # criteria surface the module publishes.
  @FE-3029 @collection
  Scenario: Narrow my products to the price one of them costs
    Given I have opened my products
    When I narrow my products to the price one of them costs
    Then only the product at that price is listed

  @FE-3029 @collection
  Scenario: Clear a price narrowing to see every product again
    Given I have narrowed my products to the price one of them costs
    When I clear my price narrowing
    Then every one of my products is listed again

  @FE-3029 @collection
  Scenario: Move forward to the next page of my products
    Given I have opened my products
    When I move to the next page of my products
    Then I am on the second page of my products

  @FE-3029 @collection
  Scenario: Move back to the first page of my products
    Given I have moved to the next page of my products
    When I move back to the previous page of my products
    Then I am on the first page of my products

  # The manager page opens each form from its own slot, so no form opens
  # empty, and it refuses a form the client has not completed.
  @FE-3029 @manager
  Scenario: Open the cancellation form with the options my product allows
    Given I have one of my active subscriptions open
    When I open the cancellation form
    Then the cancellation form is open
    And it offers cancelling at the end of the term, cancelling immediately, and cancelling on a future date I choose

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

  @FE-3029 @manager
  Scenario: Reset my product to read it afresh
    Given I have one of my active subscriptions open
    When I reset my product
    Then my product is read again and shown as active

  # === WHAT THE MANAGER PUBLISHES ABOUT THE PRODUCT I HAVE OPEN =============
  # One scenario per template context/action member ruling R37 restores, and
  # per the failed-load settlement decisions D43/D44. Each is proven over the
  # recorded corpus by contract-product.manager-members.int.test.ts. These are
  # capability spec, driven by no step catalog entry.

  @FE-3029 @manager @member
  Scenario: The product I have open tells me which product it is
    Given I have a product of mine open in the manager
    When I read which product the manager is addressing
    Then it is the very product I opened

  @FE-3029 @manager @member
  Scenario: The product I have open shows me its name
    Given I have a product of mine open in the manager
    When I read the title of the product I have open
    Then it is the name of that product

  @FE-3029 @manager @member
  Scenario: The product I have open shows me its description
    Given I have a product of mine open in the manager
    When I read the description of the product I have open
    Then it is the description of that product

  @FE-3029 @manager @member
  Scenario: The cancellation custom fields my product allows are loaded ready for the form
    Given I have a product of mine open in the manager
    When I read the loaded cancellation lookups
    Then they are the cancellation custom fields my product carries

  @FE-3029 @manager @member
  Scenario: When reading my product fails I am shown why
    Given reading one of my products fails
    When I read the error the manager kept
    Then it is the message the failed read returned

  @FE-3029 @manager @member
  Scenario: A failed read stops loading and settles on an error instead of hanging
    Given reading one of my products fails
    When I look at whether the manager is still loading
    Then it has stopped loading and reports an error

  @FE-3029 @manager @member
  Scenario: A failed read tells me at once that my product is not ready
    Given reading one of my products fails
    When I wait to be told whether my product is ready
    Then I am told at once that it is not ready

  @FE-3029 @manager @member
  Scenario: When a change I make finishes I am told it is done
    Given I have a product of mine open in the manager
    When I stop one of my subscriptions renewing and wait for it to finish
    Then I am told the change is done

  # === A FORM LEAVES NOTHING BEHIND WHEN MY PRODUCT IS READ AGAIN ============
  # A page draws each form from its own slot, so no dialog opens empty. Once
  # my product is read again — a change landed, a refresh or a reset — the
  # manager holds no form I have not opened again, so no dead form sits beside
  # the control that opens it (FE-3029 Verify repair).

  @FE-3029 @manager @member
  Scenario: A cancellation I submit leaves no cancellation form behind
    Given I have the cancellation form open on one of my products, with an option it accepts
    When my cancellation is submitted and lands
    Then the manager holds no cancellation form

  @FE-3029 @manager @member
  Scenario: A consolidation choice I submit leaves no consolidation form behind
    Given I have the consolidation form open on one of my subscriptions, with a choice it accepts
    When my consolidation choice is submitted and lands
    Then the manager holds no consolidation form

  @FE-3029 @manager @member
  Scenario: A refresh of my product drops the cancellation form I left open
    Given I left the cancellation form open on one of my products without submitting it
    When my product is read again through a refresh
    Then the manager holds no cancellation form

  @FE-3029 @manager @member
  Scenario: A reset of my product drops the cancellation form I left open
    Given I left the cancellation form open on one of my products without submitting it
    When my product is read again through a reset
    Then the manager holds no cancellation form

  @FE-3029 @manager @member
  Scenario: A refresh of my product drops the consolidation form I left open
    Given I left the consolidation form open on one of my products without submitting it
    When my product is read again through a refresh
    Then the manager holds no consolidation form

  @FE-3029 @manager @member
  Scenario: A reset of my product drops the consolidation form I left open
    Given I left the consolidation form open on one of my products without submitting it
    When my product is read again through a reset
    Then the manager holds no consolidation form
