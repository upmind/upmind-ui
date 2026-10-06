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

  @AC-14 @client @module @guard @signed-out @collection
  Scenario: Refuse to read when no client is addressable
    Given no client is addressable for my invoices
    When any invoice read is attempted while signed out
    Then my invoices report themselves unavailable
    And no invoice request is made

  @AC-17 @client @module @guard @signed-out @collection
  Scenario: Refuse to download when no client is addressable
    Given no client is addressable for my invoices
    When an invoice download is attempted while signed out
    Then my invoices report themselves unavailable
    And no invoice request is made

  Rule: A signed-in client reads their invoices

    Background:
      Given I am an authenticated client reading my invoices

  # === THE COLLECTION — READING MY OWN INVOICES (client×self) ===============

  # FE-3237 AC11
  @AC-2 @client @cell:client-self @collection
  Scenario: Filter my invoice list to what I need
    When I filter my invoice list by status, then add a category filter, then an amount or a date filter
    Then only the invoices matching every filter I set are returned
    And each new filter keeps the filters I set before it

  # FE-3237 AC10
  @AC-2 @client @cell:client-self @collection
  Scenario: Sort my invoice list
    Given I am on page two of my invoice list, most recently created first
    When I sort my invoice list by due date, newest first
    Then my invoice list comes back ordered by due date, newest first
    And I stay on page two

  @AC-2 @client @cell:client-self @collection
  Scenario: Page through my invoice list
    Given I have more invoices than fit on one page
    When I open my invoice list
    Then I am given the first page, and the total number of invoices I have
    And asking for the next page of my invoices gives me the next page

  @AC-2 @AC-5 @client @cell:client-self @collection
  Scenario: Read one of my invoices in full
    Given one of my invoices
    When I open that invoice
    Then I see it in full, including its client, its status, and its payments

  # The count is a NUMERIC meta the collection publishes; the World's expectMeta
  # now grades numbers exactly (world.types.ts), and reading it fires a single
  # limit=1 count read the recording carries — never a load of every matching
  # invoice, which is the half AC-2 guards.
  @AC-2 @client @cell:client-self @collection
  Scenario: See how many of my invoices could be consolidated
    When I ask how many of my invoices could be consolidated
    Then I am given a count, without the module loading every matching invoice

  # === THE PAY CURRENCY OF ONE INVOICE (client×self) =========================
  # Rewritten for fix-invoices-no-basket (docs/plans/fix-invoices-no-basket.md).
  # The pay currency belongs to the invoice, never to the basket. The platform
  # is the authority: at open and after every re-read, the invoice carries the
  # pay currency the platform holds. A change converts the amount the invoice
  # still owes and moves the next payment into that currency. Two currencies
  # are recorded (£72 vs DZD 12,770.49), so a change is observable as a
  # different amount, never the one already held.
  #
  # Cells: client×self, the same cell set as the rest of this feature (staff is
  # dropped, see the header). The guest cell is a @todo at the end of this
  # file, outside the signed-in-client Rule, so it inherits no client Background.

  @AC-1 @client @cell:client-self @pay
  Scenario: Open an invoice in the pay currency the platform holds for it
    Given an invoice of mine that still owes money
    When I open that invoice
    Then it owes its unpaid amount in the pay currency the platform holds for it
    And the payment I make next is taken in that currency

  @AC-1 @client @cell:client-self @pay
  Scenario: Change the pay currency of an invoice I still owe money on
    Given I have opened an invoice of mine that still owes money
    When I change its pay currency
    Then it owes its unpaid amount converted into the currency I chose, never the amount it held before
    And the payment I make next is taken in the currency I chose

  @AC-1 @client @cell:client-self @negative-control @pay
  Scenario: Changing the pay currency of an invoice leaves my basket alone
    Given I have opened an invoice of mine that still owes money
    When I change its pay currency
    Then my basket's currency is unchanged

  @AC-1 @client @cell:client-self @pay
  Scenario: An invoice reports itself processing while its pay currency changes
    Given I have opened an invoice of mine that still owes money
    When I change its pay currency
    Then the invoice reports itself processing until the converted amount arrives

  @AC-1 @client @cell:client-self @negative-control @pay
  Scenario: A pay-currency change the platform cannot convert keeps the invoice as it was
    Given I have opened an invoice of mine that still owes money
    When I change its pay currency to one the platform cannot convert to
    Then I am told the change failed
    And the invoice keeps the pay currency and the amount it held before

  @AC-1 @client @cell:client-self @guard @pay
  Scenario: I cannot change the pay currency while a payment is in progress
    Given a payment on an invoice of mine is in progress
    When I try to change that invoice's pay currency
    Then the payment continues in the currency it started in

  # Legacy parity (invoicePaymentModal.vue canChangeCurrency): the brand must
  # allow a different pay currency, and a partly paid invoice keeps its currency.
  @AC-1 @client @cell:client-self @guard @pay
  Scenario: I cannot change the pay currency when my brand does not allow it
    Given my brand does not allow paying in a different currency
    When I try to change the pay currency of an invoice I still owe money on
    Then the invoice keeps the pay currency and the amount it held before

  @AC-1 @client @cell:client-self @guard @pay
  Scenario: I cannot change the pay currency of a partly paid invoice
    Given I have opened a partly paid invoice of mine
    When I try to change its pay currency
    Then that partly paid invoice keeps its pay currency and the amount it held before

  @AC-1 @client @cell:client-self @pay
  Scenario: A fresh read of an invoice honours the platform's pay currency
    Given I have changed the pay currency of an invoice of mine
    When the invoice is read again from the platform
    Then it carries the pay currency the platform holds, not the one I chose locally

  # Arranged with a STAFF manual payment (never a real third-party gateway,
  # never a client-initiated one — confirmed live, 2026-09-28: every
  # non-type-10 gateway this brand offers 422s a client POST /api/payments
  # with "This gateway does not support automatic payments", and every
  # type-1 gateway answers 200 with a real third-party redirect, which is
  # banned). The generator creates this settlement fresh every run.
  @AC-3 @client @cell:client-self @collection
  Scenario: See a payment's outcome reflected without a manual reload
    Given I have just made a payment on one of my invoices
    When that payment settles or fails
    Then my invoice list reflects the new payment row on its own
    And I do not have to reopen or reload my invoice list to see it

  @AC-4 @client @cell:client-self @collection
  Scenario: Assign a payment method to an invoice
    Given one of my invoices has no payment method assigned
    When I assign a payment method to it
    Then that invoice now shows the payment method I chose

  @AC-4 @client @cell:client-self @negative-control @collection
  Scenario: Clear the assigned payment method back to "none selected"
    Given one of my invoices has a payment method assigned
    When I clear the assigned payment method
    Then that invoice shows "none selected" for its payment method

  @AC-5 @client @cell:client-self @collection
  Scenario: Read the consolidation identity and credit fields of a merged invoice
    Given one of my invoices was merged into a consolidation
    When I open that invoice
    Then I see which document it merged into, which credit note partners it, and how much is queued for credit

  @AC-5 @client @cell:client-self @collection
  Scenario: Read a consolidated invoice's line items grouped by subscription
    Given a consolidated invoice with line items from more than one subscription
    When I open that invoice
    Then its line items are grouped, one group per subscription they came from
    And a line item with no subscription of its own is grouped separately, never dropped

  @AC-6 @client @cell:client-self @negative-control @collection
  Scenario: Know a bundle is large without counting a truncated line-item array
    Given a consolidated invoice bundling more line items than the platform returns in one page
    When I open that invoice
    Then it tells me the bundle is large
    And that answer comes from the platform's own count, not from how many line items actually arrived

  @AC-7 @client @cell:client-self @collection
  Scenario: Read my credit notes as a filtered view of my invoices
    When I ask for my credit notes
    Then I am given only the invoices categorised as a credit note

  @AC-7 @client @cell:client-self @collection
  Scenario: Tie a credit note back to the invoice it credits
    Given one of my credit notes
    When I open it
    Then it names the invoice it credits

  @AC-7 @client @cell:client-self @negative-control @collection
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
  @AC-9 @client @cell:client-self @collection
  Scenario: Read the next charge date of an invoice that is on a recurring product
    Given an invoice that "is on a recurring product"
    When I read that invoice's next charge date
    Then the next charge date is "shown"

  @AC-10 @client @cell:client-self @collection
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

  @AC-16 @client @cell:client-self @collection
  Scenario: Read an invoice with no charge as free
    Given I have opened a free invoice of mine
    When I read that invoice's payment state
    Then it is reported as free

  @AC-16 @client @cell:client-self @collection
  Scenario: Read a fully paid invoice as paid
    Given I have opened a fully paid invoice of mine
    When I read that invoice's payment state
    Then it is reported as paid

  @AC-16 @client @cell:client-self @collection
  Scenario: Read a partly paid invoice as partially paid
    Given I have opened a partly paid invoice of mine
    When I read that invoice's payment state
    Then it is reported as partially paid

  @AC-16 @client @module @guard @collection
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
  @AC-12 @client @cell:client-client @negative-control @fe-2824 @collection
  Scenario: Retarget my reading at an entitled client
    Given I am entitled to act for another client
    When I read that client's invoices
    Then I am given that client's invoices, not my own
    And reading without naming a target client still gives me my own

  # A sub-account created once by the recorder (child of this client, with its
  # own invoice); the client's own list co-mingles both. The delegated
  # attribution is driven by "A delegated invoice is not mine to settle" below.
  @AC-13 @client @cell:client-client @negative-control @collection
  Scenario: Attribute each invoice in a co-mingled list
    Given a list mixing my own invoices and a sub-account's
    When I read that list
    Then my own invoices are attributed to me, and my sub-account's to the sub-account

  # Recorded as the delegate MEMBER reading a delegated invoice (delegate_related:
  # true -> isDelegated, isSettleable:false), contrasted with the reading client's
  # OWN invoice (isSettleable:true) read as itself.
  @AC-13 @client @cell:client-client @negative-control @collection
  Scenario: A delegated invoice is not mine to settle
    Given an invoice attributed to me as delegated
    When I look at what I can do with it
    Then it tells me I cannot settle it
    And an invoice attributed as my own or my sub-account's carries no such restriction

  # === WHOLE-MODULE GUARANTEES ===============================================

  @AC-15 @client @module @negative-control @collection
  Scenario: Refuse an undeclared filter, and never let one bypass the declared criteria
    Given the filters, sort and pagination my invoice list accepts are all declared
    When I try to filter by something the module has not declared
    Then that filtering is refused rather than silently ignored or silently applied
    And no filter ever reaches the platform outside what my declared criteria produced

  # === THE ORDER HISTORY — MY PLACED ORDERS (client×self) — FE-3237 ==========
  # An order is an invoice of the new-contract category. The @collection
  # scenarios below read useInvoices().as('client').for('new_contract'); the
  # @detail scenarios read one order through useInvoice().withId(id).

  # FE-3237 AC1
  @AC-19 @client @cell:client-self @collection
  Scenario: List only the orders I placed
    Given I have placed orders and I have other invoices
    When I open my order history
    Then only my new-contract invoices are returned, ten on the first page
    And no client identifier is sent with the list
    And my unpaid check counts only my own invoices

  # FE-3237 AC2
  @AC-20 @client @cell:client-self @collection
  Scenario: Read my order list with its brand and item counts
    Given I have placed orders with several items
    When I open my order history
    Then each order carries its brand and its item count

  # FE-3237 AC3
  @AC-21 @client @cell:client-self @collection
  Scenario: Page through my orders and choose the page size
    Given I have more orders than fit on one page
    When I go to the next page, then to page three, then back one page, then choose five orders a page
    Then each move gives me the orders of that page and keeps my page size
    And at each step I am told if a next page, a previous page and more than one page exist
    And choosing a page size takes me back to page one

  # FE-3237 AC3
  @AC-21 @client @cell:client-self @collection
  Scenario: Read a search of my orders that matches nothing as empty
    Given no order of mine has the number I search for
    When I search my orders for that number
    Then my order history is empty, with a total of zero

  # FE-3237 AC4
  @AC-22 @client @cell:client-self @collection
  Scenario: Go back to the first page when my page has no orders
    Given my orders are narrowed to none
    When I ask for page two
    Then I am taken back to page one

  # FE-3237 AC24, divergence 3
  @AC-22 @client @cell:client-self @collection
  Scenario: Land on the last page when I ask for a page past it
    Given I have orders on three pages
    When I ask for page nine
    Then I am given the last page of my orders

  # FE-3237 AC6
  # Blocker: staging cannot arrange a refund-changed order. A staff refund of a
  # manual payment answers 200 (POST api/admin/payments/refund) and leaves the
  # order paid with no refund_changed, so no first page holds the four kinds.
  @AC-23 @client @cell:client-self @collection @todo
  Scenario: Read the row of each of my orders
    Given I have a paid, a cancelled, a delegated and a refund-changed order
    When I open my order history
    Then each row carries its number, total, items, dates, status, brand and markers

  # FE-3237 AC7, AC24 divergence 1
  @AC-24 @client @cell:client-self @collection
  Scenario: Narrow my orders by item, category, service, number and amount
    Given I am on page two of my orders of several products and amounts
    When I narrow my orders by item name, product category, service, number or total
    Then only the orders that match each filter I set are returned
    And each narrowing takes me back to page one
    And each equal comparison is sent with its explicit equal operator
    And a second filter on one text column replaces the first

  # FE-3237 AC8
  @AC-25 @client @cell:client-self @collection
  Scenario: Narrow my orders by when I placed or paid them
    Given I have orders placed and paid on different dates
    When I narrow my orders to the last seven days, or to a date I give
    Then only the orders placed or paid in that period are returned

  # FE-3237 AC9
  @AC-26 @client @cell:client-self @collection
  Scenario: Narrow my orders by status
    Given I have paid, unpaid and adjusted orders
    When I narrow my orders to the unpaid ones, then to all but the paid ones
    Then the unpaid choice gives the unpaid and the adjusted orders together
    And the second choice replaces the first

  # FE-3237 AC9
  @AC-26 @client @cell:client-self @collection
  Scenario: Refuse an equal and a not-equal status narrowing together
    Given my orders are narrowed to the unpaid ones
    When I ask for the unpaid ones and all but the paid ones in one narrowing
    Then the narrowing is refused and nothing is read
    And my orders stay narrowed to the unpaid ones

  # FE-3237 AC10
  @AC-27 @client @cell:client-self @collection
  Scenario: Sort my orders and stay on my page
    Given I am on page two of my orders, newest first
    When I sort my orders by total, then by status, then by order number
    Then each sort gives me page two of my orders in that order

  # FE-3237 AC11
  @AC-28 @client @cell:client-self @collection
  Scenario: Find one order by its number while a filter is on
    Given my orders are narrowed to the unpaid ones and then to one product category, and I am on page two
    When I search for one order number
    Then I get that order on page one
    And both filters stay on

  # FE-3237 AC11, AC24 divergence 2
  @AC-36 @client @cell:client-self @collection
  Scenario: Only my last number search or number filter narrows my orders
    Given I have two orders, A and B
    When I filter my orders to the number of A, then search for B, then filter to the number of A again
    Then after each write only the number of that write is sent
    And after each write only that order is returned

  # FE-3237 AC12
  @AC-29 @client @cell:client-self @collection
  Scenario: Keep my order history to the orders I placed
    Given my order history is open
    When I narrow it by a filter, then by the credit-notes narrowing, then by a search, then by a raw criteria write that names another category
    Then each write sends one new read
    And each read still asks for my placed orders only
    And the narrowing to credit notes or to another category is dropped
    And no error is reported

  # FE-3237 AC13
  @AC-30 @client @cell:client-self @detail
  Scenario: Open one of my orders
    Given one of my orders and an order number that does not exist
    When I open each of them, then reload the first
    Then the first opens with its staged imports and is read again on reload
    And the second is reported as not available

  # FE-3237 AC14
  # Blocker: no order of the staging client carries custom fields or an
  # affiliate referrer, and no arrangement route for either is known.
  @AC-31 @client @cell:client-self @detail @todo
  Scenario: Read the details of one of my orders
    Given one of my orders with notes, custom fields and a referrer
    When I open that order
    Then I see its number, status, totals, dates, contract, notes, custom fields and referrer

  # FE-3237 AC15
  @AC-32 @client @cell:client-self @detail
  Scenario: Read the items of one of my orders
    Given one of my orders with a subscription, options and a snapshot
    When I open that order
    Then I see each item from the snapshot, with its term, billing cycle name, tags and sub-items

  # FE-3237 AC16
  @AC-33 @client @cell:client-self @detail
  Scenario: See the catalogue image of each item I ordered
    Given one of my orders whose snapshot items have catalogue images
    When I open that order
    Then each item shows its catalogue image, or its product image when it has none

  # FE-3237 AC18
  @AC-34 @client @cell:client-self @detail
  Scenario: Read an unpaid order as due and payable
    Given one of my orders is unpaid
    When I open that order
    Then it reads as due, payable and cancellable, the pay gate is open and the cancel gate is open
    And every other condition reads as its truth-table row

  # FE-3237 AC18
  @AC-34 @client @cell:client-self @detail
  Scenario: Read an overdue order as overdue
    Given one of my orders is overdue
    When I open that order
    Then it reads as overdue, due, payable and cancellable
    And every other condition reads as its truth-table row

  # FE-3237 AC18
  @AC-34 @client @cell:client-self @detail
  Scenario: Read a paid order as paid
    Given one of my orders is paid
    When I open that order
    Then it reads as paid, the pay gate is closed and the cancel gate is closed
    And every other condition reads as its truth-table row

  # FE-3237 AC18
  @AC-34 @client @cell:client-self @detail
  Scenario: Read a partly paid order as partly paid
    Given one of my orders is partly paid
    When I open that order
    Then it reads as partly paid, due, payable and cancellable
    And every other condition reads as its truth-table row

  # FE-3237 AC18
  @AC-34 @client @cell:client-self @detail
  Scenario: Read a cancelled order as cancelled
    Given one of my orders is cancelled
    When I open that order
    Then it reads as cancelled, the pay gate is closed and the cancel gate is closed
    And every other condition reads as its truth-table row

  # FE-3237 AC19
  # Blocker: the one pending payment on staging came through a third-party
  # gateway (Blockonomics), which the operator ruling of 2026-09-28 bars from
  # an integration test; a staff manual payment settles at once.
  @AC-35 @client @cell:client-self @detail @todo
  Scenario: Read an order with a payment in flight as pending
    Given one of my orders has a payment that has not settled
    When I open that order
    Then it reads as having a pending payment

  # FE-3237 AC19
  # The house delegated scenario "A delegated invoice is not mine to settle" is
  # @cell:client-client. This one stays @cell:client-self: the delegated marker
  # is a field of my own order read, and parity.yaml lists it under client x self.
  @AC-35 @client @cell:client-self @detail
  Scenario: Read an order of a client who delegated to me as delegated
    Given a client delegated one of their orders to me
    When I open that order
    Then it reads as delegated

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
  @AC-17 @client @cell:client-self @collection
  Scenario: Download an invoice's PDF document
    Given I have opened one of my invoices
    When I download its PDF document
    Then I receive that invoice's PDF file

  # DRIVEN (FE-3145 resume, 2026-09-28): same binary download GET recorded on
  # a credit note; same headless proof shape as the invoice PDF scenario above.
  @AC-17 @client @cell:client-self @collection
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
  @AC-18 @client @cell:client-self @collection
  Scenario: Narrow my invoice list to one contract product's invoices
    Given I have opened my invoice list
    When I narrow it to one contract product's invoices
    Then only that product's invoices are returned
    And the narrowing reached the platform as the module's own declared filter column

  # Recorded as the delegate MEMBER: the owner grants it ONE contract product
  # (PUT api/clients/{owner}/delegates/{record} {full_delegate:false,
  # add_contract_product_ids:[cp]}), restored to full after. Legacy's product
  # page asks with no client_id — the actor's own context.
  @AC-18 @client @cell:client-client @collection
  Scenario: Narrowing to a product does not re-widen a retargeted reading
    Given I have been entrusted with another client's invoices
    When I narrow that client's invoices to one contract product's invoices
    Then I am given only that client's invoices for that product
    And my reading is still attributed to that client, not to me

# === THE PAY CURRENCY — GUEST CELL (guest×self) — fix-invoices-no-basket =====
# `useInvoice` resolves for a guest (INVOICE_SCOPE_MATRIX), so the guest cell is
# not silent. No guest invoice is recorded yet, so the scenario is @todo. It
# sits under the appended Rule, which resets the signed-in-client Background.

  @AC-1 @guest @cell:guest-self @todo @pay
  Scenario: As a guest, change the pay currency of an invoice I still owe money on
    Given as a guest I have opened an invoice I still owe money on
    When I change its pay currency
    Then it owes its unpaid amount converted into the currency I chose
