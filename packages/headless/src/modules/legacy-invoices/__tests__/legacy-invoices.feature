# legacy-invoices — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT: this is the SOLE copy
# legacy-invoices.traceability.test.ts reads, and the one the @AC link is
# enforced against, both ways.
#
# ONE SCENARIO, ONE RECORDING (ADR 035 + Amendment 1, FE-3145). Every driven
# scenario replays VERBATIM staging recordings, one folder per step, through the
# module's own step catalog. A capability nothing can drive keeps its scenario
# declarative until it is converted; a capability no recorder can reach keeps a
# @todo scenario with a named, verified blocker (operator-approved only).
#
# Cell: client x self ONLY. Every other cell is NOT-SUPPORTED-IN-LEGACY or
# Dropped. The all-`never` scope matrix makes every retarget a COMPILE-TIME
# refusal, proved by legacy-invoices.types.test.ts, never narrated here. There
# are NO staff capabilities: the staff token only ARRANGES staging state for a
# recording, it is never an actor in a scenario. A headless module has no UI, so
# every scenario tests a CAPABILITY — an action, a guard, a transition or a
# state — never display (operator ruling 2026-09-29).

@module:legacy-invoices @variant:query
Feature: A client reads their archive of imported invoices

  A client who imported invoices from a prior system reads that archive —
  narrowing, ordering and paging it — opens one imported invoice to see its
  preserved bill and its paid / overdue / credited / staged / proforma
  conditions, and downloads its PDF document. Read-only: the archive offers no
  pay, cancel, refund, share or edit action, because the legacy application
  never did either.

  # === AC-13: THE SIGNED-OUT GUARD (top-level — it seeds no client) ===========
  # Placed before the Rule's Background so it does not inherit the authenticated
  # open. The no-write surface and the client-path-for-every-actor guarantee are
  # COMPILE-TIME facts (the all-`never` matrix), proved by
  # legacy-invoices.types.test.ts — never narrated as a runtime scenario.

  @AC-13 @client @module @guard @signed-out
  Scenario: A signed-out caller reads no archive and sends no request
    Given there is no authenticated client session for my imported-invoice archive
    When any read of my imported-invoice archive is attempted
    Then my imported-invoice archive reports itself unavailable
    And no request is made against any client's imported-invoice resource

  Rule: A signed-in client reads their own archive

    Background:
      Given I am an authenticated client reading my archive of imported invoices

    # === AC-1 (+AC-17): THE ARCHIVE — THE CLIENT'S OWN IMPORTED INVOICES ======
    # AC-17 (a client is served only their own imported invoices, never another
    # client's) is the SAME capability as AC-1 (operator ruling 2026-10-02): the
    # archive read returns the acting client's own rows and no other's. One
    # scenario proves both; the @AC-17 tag was dropped with cache-key.int.test.

    @AC-1 @client @cell:client-self
    Scenario: I read my archive of imported invoices
      When I open my archive of imported invoices
      Then I am given my own imported invoices, with the server's own total

    # === AC-2 / AC-10 / AC-11 / AC-14: NARROWING THE ARCHIVE ==================
    # One narrowing capability, its declared columns each a step. The outcome is
    # the rows that come back, never the comparison that reached the wire
    # (AC-10/AC-11's wire-serialisation detail is a schema unit test; AC-14's
    # contains-only shortfall is the negative half of this same capability).

    @AC-2 @AC-10 @AC-11 @AC-14 @client @cell:client-self
    Scenario: Narrowing my archive returns only the invoices that match
      When I narrow my archive to part of one invoice's number
      Then I am given only imported invoices whose number contains what I asked for
      When I narrow my archive to something no number contains
      Then I am given no imported invoices

    # === AC-3: ORDERING =======================================================
    # Sorting is ONE capability; `order` is out of fixture identity, so the
    # default order, order-by-date and order-by-amount are STEPS of one scenario.

    @AC-3 @client @cell:client-self
    Scenario: Ordering my archive reorders the invoices I am given
      Then before I set an order, my archive is ordered by issue date, newest first
      When I order my archive by total amount
      Then my archive comes back ordered by total amount

    # === AC-4: THE PAGE WINDOW AND THE SERVER'S TOTAL =========================
    # Paging is ONE capability (invoices precedent); the next page is a STEP. No
    # fixed row count is asserted — the first page and the server's own total are
    # the outcome. Needs a multi-page archive arranged on staging.

    @AC-4 @client @cell:client-self
    Scenario: I am given one page of my archive at a time, with the server's total
      When I open my archive, landing on its first page
      Then I am given the first page of my archive, and the server's own total
      When I ask for the next page of my archive
      Then I am given that next page of my archive

    # === AC-5: AVAILABILITY, AND AN EMPTY ARCHIVE =============================

    @AC-5 @client @cell:client-self
    Scenario: My archive reports itself available when I have imported invoices
      Given my client record carries an imported-invoice history
      Then my archive reports itself available

    @AC-5 @client @cell:client-self
    Scenario: My archive reports an empty result when it holds no rows
      Given my archive holds no imported invoices
      When I open my empty archive
      Then I am given an empty result, and my archive reports itself unavailable

    # === AC-6: OPEN ONE RECORD, AND THE ABSENT-RECORD BRANCH ==================

    @AC-6 @client @cell:client-self
    Scenario: I open one of my imported invoices
      Given one of my imported invoices
      When I open that imported-invoice record
      Then I am given that imported invoice, with its staged-import state

    @AC-6 @client @cell:client-self
    Scenario: Opening an imported invoice that does not resolve publishes no record
      Given an imported invoice id that does not resolve
      When I open that imported-invoice record
      Then no record is published

    # === AC-7: THE RECORD'S CONDITIONS, AS ARRANGED STATES ====================
    # Each condition is a STATE read off its own arranged record (invoices
    # PAYMENT_STATE precedent). Paid and overdue are driven off a committed
    # import; credited is @todo (no import producer, see its blocker); staged and
    # proforma are CUT (operator rulings 2026-10-02 — staged is staff-only, and
    # legacy never defines isProforma).

    @AC-7 @client @cell:client-self
    Scenario: A paid imported invoice reports itself paid
      Given one of my imported invoices that is paid
      When I open that imported-invoice record
      Then it reports itself paid

    @AC-7 @client @cell:client-self
    Scenario: An overdue imported invoice reports itself overdue
      Given one of my imported invoices that is overdue
      When I open that imported-invoice record
      Then it reports itself overdue

    # No import can produce a credited legacy invoice: the csv_data importer
    # drops every credit column (partial_amount_credited, _converted,
    # credited_amount, credit_amount, amount_credited at invoice and product
    # level), a row imported as invoice_credited stores
    # partial_amount_credited_converted = 0 (the field legacy isCredited reads,
    # legacyInvoiceProvider.vue:146), legacy's import has no credit step (vue-app
    # data/enums/imports.ts:5-12), and imported invoices are immutable (no invoice
    # id, admin invoice route 404).
    @AC-7 @client @cell:client-self @todo
    Scenario: A credited imported invoice reports itself credited
      Given one of my imported invoices that carries a credit
      When I open that imported invoice
      Then it reports itself credited


    # === AC-8: DOWNLOAD THE PDF DOCUMENT ======================================

    @AC-8 @client @cell:client-self
    Scenario: I download an imported invoice's document
      Given one of my imported invoices with a built document
      When I download its document
      Then the download condition is raised while it runs, and cleared once it completes

    # === AC-9: THE HALF-WRITTEN PAGE WINDOW (moved) ===========================
    # A half-written window is the query schema's own default fill — the module
    # declares both defaults itself. That is a pure schema unit test, not a
    # recorded capability.

    @AC-9 @client @cell:client-self @moved
    Scenario: A half-written page window keeps the written half and defaults the other
      When I write only one half of my page window
      Then the other half comes from the module's own declared default

    # === AC-14: RE-NARROWING RESETS THE PAGE, AND AN OVER-SHOT PAGE CLAMPS =====

    @AC-14 @client @cell:client-self
    Scenario: Narrowing or re-ordering my archive returns it to its first page
      Given my archive is not on its first page
      When I narrow or re-order my archive
      Then my archive returns to its first page

    @AC-14 @client @cell:client-self
    Scenario: Asking beyond my archive's last page lands me on the last page
      Given my archive holds more than one page
      When I ask for a page beyond my archive's last page
      Then my archive recovers onto its last page

    # === AC-15: THE PLAYGROUND DECLARATION (labs-nuxt, unit layer) ============
    # AC-15's proof is the labs-nuxt playground declaration specification (D-35),
    # which the traceability gate reads as a declared EXTRA path — not a
    # module-specific labs test (banned), and not a runtime capability of either
    # composable, so no driven scenario here.

    @AC-15 @client @module @moved
    Scenario: Both composables declare a scenario the playground can drive
      Then both the collection and the single read declare a playground scenario key

    # === AC-16: THE LOAD, ERROR, AND RETRY CONDITIONS (moved) =================
    # The loading lifecycle, the error condition and the refetch-on-retry are the
    # TanStack query lifecycle, owned by the query module — not re-tested here.

    @AC-16 @client @module @moved
    Scenario: Each composable reports loading while its own read is in flight
      Then each composable reports itself loading while its read is in flight, and settled once done

    @AC-16 @client @cell:client-self @moved
    Scenario: A failed read reports its error, and the reload control asks again
      Given a read that fails
      When I ask again
      Then the error is reported, and a fresh request is sent

