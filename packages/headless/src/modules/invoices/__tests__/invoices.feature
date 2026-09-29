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
# REBUILT TO THE FE-3145 MODEL (ADR 035 + Amendment 1). Each driven scenario is
# a recording: invoices.steps.ts drives the COLLECTION (useInvoices) scenarios —
# filter, sort, page, payment-outcome refetch, credit-notes preset, and the
# undeclared-filter refusal — each replayed by invoices.replay.int.test.ts
# against its own scenarios/<slug>/ recording. The module's ONLY integration
# test is that replay; every capability *.int.test.ts was deleted once its
# capability became a driven scenario or a pure mapper unit test.
#
# The SINGLE READ (useInvoice, a .withId(id) useDetail whose scope matrix refuses
# every actor) IS driven: World.boot takes a WorldScope.id, invoices.steps.ts's
# openDetail boots the detail cell as .as(client).withId(id), and the "Read one of
# my invoices in full" / consolidation / bundle / credit-note / pending-detect /
# failed-load scenarios below are all driven that way. Pure mapping is
# additionally proven by invoices.mappers.test.ts. Token/transport/auth behaviour
# is MOVED to query/session-store/auth.
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

  # === REFUSED WITHOUT AN ADDRESSABLE CLIENT (signed-out, top-level) ==========
  # A @signed-out guard boots the guest floor with no Background: it must resolve
  # unavailable and read nothing. The replay arms no recording, so any request it
  # makes is an unmatched request the replay wall fails it by name on.

  @AC-14 @client @module @guard @signed-out
  Scenario: Refuse to read when no client is addressable
    Given no client is addressable for my invoices
    When any invoice read is attempted while signed out
    Then my invoices report themselves unavailable
    And no invoice request is made

  @AC-17 @client @module @guard @signed-out
  Scenario: Refuse to download when no client is addressable
    Given no client is addressable for my invoices
    When an invoice download is attempted while signed out
    Then my invoices report themselves unavailable
    And no invoice request is made

  Rule: A signed-in client reads their invoices

    Background:
      Given I am an authenticated client reading my invoices

  # === THE COLLECTION — READING MY OWN INVOICES (client×self) ===============

  @AC-2 @client @cell:client-self
  Scenario: Filter my invoice list to what I need
    When I filter my invoice list by status, category, amount or date
    Then only the invoices matching every filter I set are returned
    And an unpaid-status filter and a category filter narrow the list together

  @AC-2 @client @cell:client-self
  Scenario: Sort my invoice list
    Given before I sort, I see the default order: most recently created first
    When I sort my invoice list by due date, newest first
    Then my invoice list comes back ordered by due date, newest first

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

  # The count is a NUMERIC meta the collection publishes; the World's expectMeta
  # now grades numbers exactly (world.types.ts), and reading it fires a single
  # limit=1 count read the recording carries — never a load of every matching
  # invoice, which is the half AC-2 guards.
  @AC-2 @client @cell:client-self
  Scenario: See how many of my invoices could be consolidated
    When I ask how many of my invoices could be consolidated
    Then I am given a count, without the module loading every matching invoice

  # The detail cell is driven by id (openDetail); `refreshUnpaidAmount` is the
  # published action the World fires with a new currency, and `unpaidAmount` is a
  # context sibling of `data` the World's expectContext reads. Two currencies are
  # recorded (£72 vs DZD 12,763.69), so the re-read returns a genuinely fresh
  # amount, never the one already held.
  @AC-1 @client @cell:client-self
  Scenario: Re-read the live unpaid amount for one invoice
    Given an invoice of mine that still owes money
    When I ask what I still owe on it
    Then I am given the current unpaid amount in its currency
    And asking again after changing the currency gives me a fresh amount, never the one I already had

  # Arranged with a STAFF manual payment (never a real third-party gateway,
  # never a client-initiated one — confirmed live, 2026-09-28: every
  # non-type-10 gateway this brand offers 422s a client POST /api/payments
  # with "This gateway does not support automatic payments", and every
  # type-1 gateway answers 200 with a real third-party redirect, which is
  # banned). The generator creates this settlement fresh every run.
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

  # AC-8's two scenarios (detecting a payment already in flight; telling apart
  # waiting-on-me from waiting-on-the-gateway) are DELETED — operator ruling
  # 2026-09-28: an integration test never exercises a real third-party payment
  # gateway (a redirect/browser flow is e2e's job), and both scenarios' data
  # only existed via a type-10 AWAITING_CLIENT gateway (Blockonomics/BitPay).
  # AC-16's "pending" arm (below) still proves the module reports a pending
  # payment state; it is arranged with an OFFLINE/manual gateway, not AC-8's
  # deleted third-party one.

  # The "absent" example is not replayed: staging sets next_charge_date on every
  # invoice, a one-off included (the Hat, billing cycle 0, still answers
  # next_charge_date 2026-09-26 — recorder run 2026-09-29).
  @AC-9 @client @cell:client-self
  Scenario: Read the next charge date of an invoice that is on a recurring product
    Given an invoice that "is on a recurring product"
    When I read that invoice's next charge date
    Then the next charge date is "shown"

  @AC-10 @client @cell:client-self
  Scenario: Find out whether I owe anything at all
    When I ask whether I have anything unpaid
    Then I am told yes or no, without the module loading my whole invoice list

  # AC-11 "See my outstanding balance distinct from the raw unpaid amount" was
  # DELETED — operator ruling: balance vs. unpaid_amount divergence is backend
  # arithmetic (whether a credit note offsets a balance), not this module's
  # responsibility to prove; the module only reads and passes through both
  # fields as given.

  # === WHOLE-INVOICE PAYMENT STATE ============================================
  # Carried forward from the pre-conversion module's flat `meta` computed
  # (four booleans that could disagree with each other) — design D3 wires
  # these into ONE discriminated PAYMENT_STATE instead of dropping them.
  # AC-16 is minted here (beyond the story's own AC1-AC13), same precedent as
  # AC-14/AC-15 above and client-email-history.feature's AC-18..21.

  # The four PAYMENT_STATE arms, one plain scenario each (the outline is split so
  # each example is its own driven scenario-recording folder set — there is no
  # driven Scenario Outline convention in this repo). Free and partly-paid rows
  # are arranged through the real client order→convert(→pay) flow and reused by
  # id (arranged-invoices.json); paid and pending come from the client's own
  # corpus. The state flags are boolean-assertable (world.types.ts).

  @AC-16 @client @cell:client-self
  Scenario: Read an invoice with no charge as free
    Given I have opened a free invoice of mine
    When I read that invoice's payment state
    Then it is reported as free

  @AC-16 @client @cell:client-self
  Scenario: Read a fully paid invoice as paid
    Given I have opened a fully paid invoice of mine
    When I read that invoice's payment state
    Then it is reported as paid

  @AC-16 @client @cell:client-self
  Scenario: Read a partly paid invoice as partially paid
    Given I have opened a partly paid invoice of mine
    When I read that invoice's payment state
    Then it is reported as partially paid

  @AC-16 @client @module @guard
  Scenario: A failed invoice load reports no guessed payment state
    Given an invoice load that failed
    When I ask for its payment state
    Then I am told the load failed rather than given a guessed payment state

  # === RETARGETING AND ATTRIBUTION — READING A SUB-ACCOUNT'S OR DELEGATOR'S
  #     INVOICES (client×client) =============================================

  # Recorded as the delegate MEMBER reading the client it is entitled to
  # (delegateOwner), which now holds an invoice of its OWN (arranged through the
  # real order flow, arranged-invoices.json). The retarget read carries
  # client_id=<owner> and returns a row owned by the owner — distinct from the
  # reading client — so "not my own" is observable; the self re-read carries
  # client_id=<me>. The recorded owner row's client id differing from the reading
  # client is what a dropped `.for()` (FE-2824) would fail.
  @AC-12 @client @cell:client-client @negative-control @fe-2824
  Scenario: Retarget my reading at an entitled client
    Given I am entitled to act for another client
    When I read that client's invoices
    Then I am given that client's invoices, not my own
    And reading without naming a target client still gives me my own

  # A sub-account created once by the recorder (child of this client, with its
  # own invoice); the client's own list co-mingles both. The delegated
  # attribution is driven by "A delegated invoice is not mine to settle" below.
  @AC-13 @client @cell:client-client @negative-control
  Scenario: Attribute each invoice in a co-mingled list
    Given a list mixing my own invoices and a sub-account's
    When I read that list
    Then my own invoices are attributed to me, and my sub-account's to the sub-account

  # Recorded as the delegate MEMBER reading a delegated invoice (delegate_related:
  # true -> isDelegated, isSettleable:false), contrasted with the reading client's
  # OWN invoice (isSettleable:true) read as itself.
  @AC-13 @client @cell:client-client @negative-control
  Scenario: A delegated invoice is not mine to settle
    Given an invoice attributed to me as delegated
    When I look at what I can do with it
    Then it tells me I cannot settle it
    And an invoice attributed as my own or my sub-account's carries no such restriction

  # === WHOLE-MODULE GUARANTEES ===============================================

  @AC-15 @client @module @negative-control
  Scenario: Refuse an undeclared filter, and never let one bypass the declared criteria
    Given the filters, sort and pagination my invoice list accepts are all declared
    When I try to filter by something the module has not declared
    Then that filtering is refused rather than silently ignored or silently applied
    And no filter ever reaches the platform outside what my declared criteria produced

# === DRIVEN CATALOG ========================================================
# `invoices.steps.ts` drives every scenario in this feature, and
# `invoices.replay.int.test.ts` replays each against its own
# scenarios/<slug>/ recording. The generator (`invoices.fixtures.ts`) creates
# the state each scenario needs on staging and restores it afterwards.

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
# augmentation law. A fresh `Rule:` resets Gherkin's own Background
# inheritance from the "signed-in client" Rule above — a scenario declared
# under the SAME Rule with no Rule: reset still structurally inherits that
# Rule's Background step, whatever a comment claims (confirmed live,
# 2026-09-28: the replay harness expanded these scenarios' step lists to
# include the inherited Background, and its recorder-reserved-but-empty
# leading step folder failed by name on the very first request).

  Rule: Capabilities appended after the story's own AC set, each with its own boot Given

  # DRIVEN (FE-3145 resume, 2026-09-28): `pnpm fixtures:generate invoices`
  # captured a real binary GET api/invoices/{id}/download (200, __binary body)
  # against a real anchor invoice. Proven headless, not e2e: the replay wall
  # proves the recorded download GET is the exact request the module fires (a
  # dropped/renamed request gaps as an unmatched request), and the Then proves
  # `downloadPdf()` resolves without error against that response (operator
  # ruling 2026-09-28 — no browser Blob/filename assertion at this layer; that
  # belongs to whatever consumer actually saves the file).
  @AC-17 @client @cell:client-self
  Scenario: Download an invoice's PDF document
    Given I have opened one of my invoices
    When I download its PDF document
    Then I receive that invoice's PDF file

  # DRIVEN (FE-3145 resume, 2026-09-28): same binary download GET recorded on
  # a credit note; same headless proof shape as the invoice PDF scenario above.
  @AC-17 @client @cell:client-self
  Scenario: Download a credit note's PDF document the same way
    Given I have opened one of my credit notes
    When I download its PDF document
    Then I receive that credit note's PDF file, the same way any invoice's is

# === NARROWING THE LIST TO ONE CONTRACT PRODUCT (client×self, client×client)
#     — appended by T19's dispatch, correcting the prior pass's "no scenario
#     owed" call =============================================================
# The prior pass minted no AC-18 scenario, reasoning the module's filtering
# capability was already scenario'd generically (AC-2's "filter my invoice
# list by status, category, amount or date"). Reopened here: AC-18 is not a
# rephrasing of that generic filter capability, it is two hand-driveable
# outcomes AC-2 never names — narrowing to ONE contract product through the
# module's own DECLARED column (never a hand-appended param), and that
# narrowing surviving a `.for()` retarget without re-widening it back to my
# own invoices. Both are capabilities a hand can drive, so both are owed a
# scenario, per the traceability gate's own AC-link requirement. Append-only:
# no Background:, no second Feature:, nothing above narrowed or deleted. Each
# scenario below carries its own boot Given, per the augmentation law.

  # DRIVEN (FE-3145 resume, 2026-09-28): recorded via `pnpm fixtures:generate
  # invoices` — the narrowed read (filter[products.contracts_product_id]=<cp>,
  # driven via .for('contracts_product', id), WorldScope.context) returns a
  # genuinely narrowed set: total 2 vs 1180 unfiltered, read off the recordings.
  # Row-level product linkage is still not on the World-visible mapped list
  # `data` (a SEAM gap named here for the record), so both Thens are proven the
  # same way the design intended for the filter-reached claim: the replay wall
  # matches by exact recorded request, so this exact narrowed total (2, never
  # the 1180 unfiltered) can only settle if the module actually sent the
  # declared `contracts_product` context param — a dropped/renamed one would
  # gap (unmatched request) or resolve the unfiltered recording instead.
  @AC-18 @client @cell:client-self
  Scenario: Narrow my invoice list to one contract product's invoices
    Given I have opened my invoice list
    When I narrow it to one contract product's invoices
    Then only that product's invoices are returned
    And the narrowing reached the platform as the module's own declared filter column

  # Recorded as the delegate MEMBER: the owner grants it ONE contract product
  # (PUT api/clients/{owner}/delegates/{record} {full_delegate:false,
  # add_contract_product_ids:[cp]}), restored to full after. Legacy's product
  # page asks with no client_id — the actor's own context.
  @AC-18 @client @cell:client-client
  Scenario: Narrowing to a product does not re-widen a retargeted reading
    Given I have been entrusted with another client's invoices
    When I narrow that client's invoices to one contract product's invoices
    Then I am given only that client's invoices for that product
    And my reading is still attributed to that client, not to me
