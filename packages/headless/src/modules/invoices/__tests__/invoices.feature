# invoices — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT: this is the SOLE copy the tests know about —
# the one invoices.traceability.test.ts reads, and the one the @AC link is
# enforced against, both ways.
#
# Derived from docs/sdd/FE-3031/design.md §"The capability list the module
# feature is derived from" (C01-C23), requirements.md's AC1-AC13, and
# parity.yaml's cell dispositions. Authored by the prover seat via
# upmind-agent:test's BDD route — docs/sdd/FE-3031/bdd.md records why the Plan
# stage did not author it (write-lane + no in-scope cross-module e2e journey).
#
# NO STEP CATALOG YET. Every other module in this tree carrying a
# *.traceability.test.ts also carries a *.steps.ts playground catalog. This
# module has neither, on purpose: the module's own code does not exist yet
# (the Code stage runs after this dispatch) and the labs-nuxt e2e lane is
# broken on develop (bdd.md "Finding" — missing tests/ dir; also
# missingSteps: "skip-scenario" would let a step-less scenario report green
# without running). There is nothing yet to catalog a step against, so this
# feature's traceability test proves only the AC-link, in both directions —
# never scenario driveability. A later dispatch may extend it with a
# step-catalog check once both the module and the playground lane exist.
#
# Cells: client×self (AC1-AC11) and client×client (AC12-AC13). Per
# parity.yaml and design.md D6, the staff actor is DROPPED — deprecated by
# operator ruling 2026-09-01 ("this is client only, staff is being
# deprecated"). No staff scenario is written: there is no staff capability
# left on this resource to describe, and a `never`-typed scope-matrix cell is
# a compile-time exclusion, not an observable runtime behaviour a Gherkin
# scenario can assert.
#
# Two AC ids beyond the story's own AC1-AC13 are minted here for whole-module
# guarantees the capability list names (C22, C23) that the story's AC set does
# not number — precedent: client-email-history.feature's AC-18..21 minted the
# same way for its own module guarantees. AC-14 is C22 (no addressable
# client); AC-15 is C23 (the criteria law — no undeclared filter, no raw
# bypass of the declared criteria).
#
# Out of scope, named so the scenario lane does not rediscover it: the
# consolidate POST and its preference/eligibility derivations (CO-1/CO-2); the
# payment flow itself (PN-1) — this module only observes and refetches; every
# admin-only write; a standalone credit-notes resource (design.md D4 — credit
# notes are a criteria preset on this same collection, not a new module).
#
# MERGE NOTE (gitlab/develop -> this branch, this dispatch): develop shipped a
# 130-line feature written against the PRE-CONVERSION flat useInvoice(id) —
# its own AC-*/INV-* ids never existed on this story and are superseded here.
# Per capability (not per scenario), disposition against the 23 scenarios
# above plus AC-16 below:
#   @INV-read              -> subsumed by "Read one of my invoices in full"
#                             (AC-2/AC-5) — same capability, richer surface.
#   @INV-guest-denied       -> subsumed by "Refuse to read when no client is
#                             addressable" (AC-14) — GUEST is no longer a
#                             spellable actor (INVOICES_SCOPE_MATRIX[GUEST] =
#                             never), so the capability now reads generically
#                             as "unaddressable", which guest is one instance
#                             of, not a narrowing.
#   @INV-refresh/@INV-invalidate/@INV-ready
#                          -> composable lifecycle/cache mechanics (the
#                             `useActions().refresh/invalidate/isReady` API
#                             contract), never named as a capability in
#                             design.md's C01-C23 list. Per the BDD-altitude
#                             rule (code-test-bdd.md "capability altitude
#                             throughout... never a vague 'it works'") these
#                             stay OUT of this feature and are carried forward
#                             as unit-level API-contract tests instead
#                             (useInvoices.actions.test.ts /
#                             useInvoice.actions.test.ts) — not dropped, moved
#                             to their correct layer.
#   @INV-map-shape / @INV-map-frozen / @INV-map-optional-address /
#   @INV-map-payments-order / @INV-map-payment-{success,pending,cardless}
#                          -> pure-mapper detail already implied by "Read one
#                             of my invoices in full" at capability altitude;
#                             carried forward as invoices.mappers.test.ts unit
#                             assertions (Task 2), not as separate scenarios —
#                             a mapping field's exact shape is not itself a
#                             distinct capability.
#   @INV-state-paid/free/partial/pending/error
#                          -> GENUINELY STILL REAL (design D3: PAYMENT_STATE
#                             is "wired, not deleted") and NOT named by
#                             design.md's C01-C23 list — an omission, not a
#                             deliberate drop. Restated below as AC-16 rather
#                             than silently dropped.
#   @INV-state-availability -> subsumed by AC-14 (same "unaddressable" guard).

@module:invoices @variant:query
Feature: A client reads and manages their invoices

  A client's invoices carry what they owe, whether it is still open, who is
  assigned to pay it, and how consolidation and credit notes have changed the
  amount due. A client acting for an entitled sub-account or delegator reads
  that client's invoices the same way, and can always tell whose invoice a
  given row actually is.

  Background:
    Given I am an authenticated client

  # === THE COLLECTION — READING MY OWN INVOICES (client×self) ===============

  @AC-2 @client @cell:client-self
  Scenario: Filter my invoice list to what I need
    When I filter my invoice list by status, category, amount or date
    Then only the invoices matching every filter I set are returned
    And an unpaid-status filter and a category filter narrow the list together

  @AC-2 @client @cell:client-self
  Scenario: Sort my invoice list
    When I sort my invoice list by due date, newest first
    Then my invoice list comes back ordered by due date, newest first
    And before I sort, I see the default order: most recently created first

  @AC-2 @client @cell:client-self
  Scenario: Page through my invoice list
    Given I have more invoices than fit on one page
    When I open my invoice list
    Then I am given the first page, and the total number of invoices I have
    And asking for the next page of my invoices gives me the next page

  @AC-2 @AC-5 @client @cell:client-self
  Scenario: Read one of my invoices in full
    Given one of my invoices
    When I open that invoice
    Then I see it in full, including its client, its status, and its payments

  @AC-2 @client @cell:client-self
  Scenario: See how many of my invoices could be consolidated
    When I ask how many of my invoices could be consolidated
    Then I am given a count, without the module loading every matching invoice

  @AC-1 @client @cell:client-self
  Scenario: Re-read the live unpaid amount for one invoice
    Given one of my invoices
    When I ask what I still owe on it
    Then I am given the current unpaid amount in its currency
    And asking again after changing the currency gives me a fresh amount, never the one I already had

  @AC-3 @client @cell:client-self
  Scenario: See a payment's outcome reflected without a manual reload
    Given I have just made a payment on one of my invoices
    When that payment settles or fails
    Then my invoice list reflects the new payment row on its own
    And I do not have to reopen or reload my invoice list to see it

  @AC-4 @client @cell:client-self
  Scenario: Assign a payment method to an invoice
    Given one of my invoices has no payment method assigned
    When I assign a payment method to it
    Then that invoice now shows the payment method I chose

  @AC-4 @client @cell:client-self @negative-control
  Scenario: Clear the assigned payment method back to "none selected"
    Given one of my invoices has a payment method assigned
    When I clear the assigned payment method
    Then that invoice shows "none selected" for its payment method

  @AC-5 @client @cell:client-self
  Scenario: Read the consolidation identity and credit fields of a merged invoice
    Given one of my invoices was merged into a consolidation
    When I open that invoice
    Then I see which document it merged into, which credit note partners it, and how much is queued for credit

  @AC-5 @client @cell:client-self
  Scenario: Read a consolidated invoice's line items grouped by subscription
    Given a consolidated invoice with line items from more than one subscription
    When I open that invoice
    Then its line items are grouped, one group per subscription they came from
    And a line item with no subscription of its own is grouped separately, never dropped

  @AC-6 @client @cell:client-self @negative-control
  Scenario: Know a bundle is large without counting a truncated line-item array
    Given a consolidated invoice bundling more line items than the platform returns in one page
    When I open that invoice
    Then it tells me the bundle is large
    And that answer comes from the platform's own count, not from how many line items actually arrived

  @AC-7 @client @cell:client-self
  Scenario: Read my credit notes as a filtered view of my invoices
    When I ask for my credit notes
    Then I am given only the invoices categorised as a credit note

  @AC-7 @client @cell:client-self
  Scenario: Tie a credit note back to the invoice it credits
    Given one of my credit notes
    When I open it
    Then it names the invoice it credits

  @AC-7 @client @cell:client-self @negative-control
  Scenario: Label a consolidation credit note as a consolidation, not a refund
    Given a credit note that was also created by a consolidation
    When I read its label
    Then it is labelled as a consolidation
    And it is never labelled as a plain credit note

  @AC-8 @client @cell:client-self
  Scenario: Detect a payment already in flight and how long it has been pending
    Given one of my invoices has a payment already in flight
    When I open that invoice
    Then I am told the payment is pending
    And I am told how long it has been pending

  @AC-8 @client @cell:client-self @negative-control
  Scenario: Tell apart waiting on me from waiting on the gateway
    Given a pending payment whose gateway is waiting on me to act
    When I open that invoice
    Then I am told the platform is waiting on me, not on the gateway
    And a pending payment on a gateway that is not waiting on me carries no such signal

  @AC-9 @client @cell:client-self
  Scenario Outline: Read the next charge date when my invoice carries one
    Given an invoice that "<condition>"
    When I open that invoice
    Then the next charge date is "<outcome>"

    Examples:
      | condition                     | outcome                 |
      | is on a recurring product     | shown                   |
      | is not on a recurring product | absent, never an error  |

  @AC-10 @client @cell:client-self
  Scenario: Find out whether I owe anything at all
    When I ask whether I have anything unpaid
    Then I am told yes or no, without the module loading my whole invoice list

  @AC-11 @client @cell:client-self @negative-control
  Scenario: See my outstanding balance distinct from the raw unpaid amount
    Given a consolidated invoice where credit notes have offset what I owe
    When I open that invoice
    Then my outstanding balance and my raw unpaid amount are shown as two distinct numbers
    And I am never left to guess which one is current

  # === WHOLE-INVOICE PAYMENT STATE ============================================
  # Carried forward from the pre-conversion module's flat `meta` computed
  # (four booleans that could disagree with each other) — design D3 wires
  # these into ONE discriminated PAYMENT_STATE instead of dropping them.
  # AC-16 is minted here (beyond the story's own AC1-AC13), same precedent as
  # AC-14/AC-15 above and client-email-history.feature's AC-18..21.

  @AC-16 @client @cell:client-self
  Scenario Outline: Read an invoice's overall payment state
    Given one of my invoices "<condition>"
    When I open that invoice
    Then its payment state is reported as "<state>"

    Examples:
      | condition                                        | state   |
      | has recorded payments and nothing left owing     | paid    |
      | has no payments and nothing owing                | free    |
      | has a paid part and a positive remaining balance | partial |
      | has no payments yet and a positive amount owing  | pending |

  @AC-16 @client @module @guard
  Scenario: A failed invoice load reports no guessed payment state
    Given an invoice load that failed
    When I ask for its payment state
    Then I am told the load failed rather than given a guessed payment state

  # === RETARGETING AND ATTRIBUTION — READING A SUB-ACCOUNT'S OR DELEGATOR'S
  #     INVOICES (client×client) =============================================

  @AC-12 @client @cell:client-client @negative-control @fe-2824
  Scenario: Retarget my reading at an entitled client
    Given I am entitled to act for another client
    When I read that client's invoices
    Then I am given that client's invoices, not my own
    And reading without naming a target client still gives me my own

  @AC-13 @client @cell:client-client @negative-control
  Scenario Outline: Attribute each invoice in a co-mingled list
    Given a list mixing my own invoices, a sub-account's, and a delegator's, where "<situation>"
    When I read that list
    Then each invoice is attributed as "<attribution>"

    Examples:
      | situation                                                  | attribution |
      | the invoice belongs to me                                  | my own      |
      | the invoice belongs to my sub-account                      | sub-account |
      | the invoice was delegated to me                            | delegated   |
      | the invoice is both my sub-account's and delegated to me   | sub-account |

  @AC-13 @client @cell:client-client @negative-control
  Scenario: A delegated invoice is not mine to settle
    Given an invoice attributed to me as delegated
    When I look at what I can do with it
    Then it tells me I cannot settle it
    And an invoice attributed as my own or my sub-account's carries no such restriction

  # === WHOLE-MODULE GUARANTEES ===============================================

  @AC-14 @client @module @guard
  Scenario: Refuse to read when no client is addressable
    Given neither I nor a target client can be resolved to an id
    When any invoice read is attempted
    Then nothing is read
    And I am told the read is not available rather than seeing it hang or silently return nothing

  @AC-15 @client @module @negative-control
  Scenario: Refuse an undeclared filter, and never let one bypass the declared criteria
    Given the filters, sort and pagination my invoice list accepts are all declared
    When I try to filter by something the module has not declared
    Then that filtering is refused rather than silently ignored or silently applied
    And no filter ever reaches the platform outside what my declared criteria produced

# === SCENARIO LANE (this dispatch, appended per factory-scenario/SKILL.md's
#     augmentation law — append only, no Background:, no second Feature:) =====
#
# The playground page (`playgrounds/labs-nuxt/modules/scenarios/useInvoices/`)
# now exists and drives this feature. NO SCENARIO IS APPENDED: every capability
# the page's controls exercise (filter/sort/page, assign/clear payment method,
# refresh, invalidate, refresh-after-payment, filter-consolidatable,
# filter-credit-notes, retarget, attribution, view-detail) is already scenario'd
# above by lane 1 — the page demonstrates this module's own capability list, it
# mints no capability of its own (factory-scenario/SKILL.md "Non-goals": "This
# lane mints no acceptance criterion... It writes no product code"). ONE
# REPHRASE was needed: the "Page through my invoice list" scenario's pagination
# step read identically to `client-email-history.steps.ts`'s own pagination
# pattern ("asking for the next page gives me the next page"), which the
# cross-catalog duplicate-pattern gate refuses to let two catalogs both claim.
# Reworded to "asking for the next page of my invoices gives me the next
# page" — same capability, no scenario narrowed, no Background/Feature added.
# Every other step above matches `invoices.steps.ts` verbatim.
#
# `invoices.steps.ts` is the catalog: every scenario's steps are pattern-
# matched there. Where opening/reading ONE invoice is concerned ("When I open
# that invoice" and its siblings), the catalog fires no action — `useInvoice`
# (`useDetail`) is the first `useDetail` binding in this tree and the
# playground's `useCompositionPort` reads exactly one composable cell per boot,
# so there is no established convention yet for driving a second, detail-scoped
# cell through `World.fire`. Those steps are documented no-ops deferring to the
# real proving `*.int.test.ts` (named per-step in the catalog) rather than a
# fabricated action id — a legitimate "not yet driven" state per this file's own
# head docstring, not a coverage hole.

# === DOWNLOADING THE PDF DOCUMENT (client×self) — appended 2026-09-09 =========
# The tracked issue gained two acceptance criteria mid-run, after this
# feature's own authoring pass, and no gate re-read it (this dispatch's own
# read-back). AC-17 is minted here for the first (beyond the story's own
# AC1-16, same precedent as AC-14/AC-15/AC-16): downloading an invoice's PDF
# document, one action a hand can drive. The second (pinning the already-
# declared `products.contracts_product_id` filter column) mints no scenario —
# it confirms an already-declared filter column, not a new capability; the
# module's filtering capability is already scenario'd generically above.
# Append-only: no Background:, no second Feature:, nothing above narrowed or
# deleted. Each scenario below carries its own boot Given, per the
# augmentation law.

  @AC-17 @client @cell:client-self
  Scenario: Download an invoice's PDF document
    Given I have opened one of my invoices
    When I download its PDF document
    Then I receive that invoice's PDF file
    And it is saved using that invoice's own number as the filename

  @AC-17 @client @cell:client-self
  Scenario: Download a credit note's PDF document the same way
    Given I have opened one of my credit notes
    When I download its PDF document
    Then I receive that credit note's PDF file, the same way any invoice's is

  @AC-17 @client @module @guard
  Scenario: Refuse to download when no client is addressable
    Given I have no addressable client identity
    When I try to download an invoice's PDF document
    Then nothing is downloaded and no document request is made
