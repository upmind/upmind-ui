# stats — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT: this is the SOLE copy the tests know about —
# the one stats.traceability.test.ts reads, and the one the @AC link is
# enforced against, both ways. docs/sdd is gitignored, so a planning-bundle
# copy of this table dies with the worktree; this file is the tracked record.
#
# ONE SCENARIO, ONE RECORDING (ADR 035 + Amendment 1, FE-3145). Every driven
# scenario replays VERBATIM staging recordings, one folder per step, through the
# module's own step catalog (stats.replay.int.test.ts). Token and transport
# behaviour — per-query loading, refetch, abort-on-destroy, the session's own
# package-limit hold, and the scope's self-resolution — belong to the query,
# session-store and scope modules and are tagged @moved here, never re-tested per
# module (handover §6). A headless module has no UI, so every driven scenario
# tests a CAPABILITY — an action, a guard, a transition or a state — never
# display (operator ruling 2026-09-29).
#
# Cell: client x self ONLY. The oracle names no cell where a client acts for
# another client, and no cell where staff addresses this leaf (parity.yaml), so
# the module declares a SELF-only, all-`never` scope matrix. There are NO staff
# capabilities: the staff token only ARRANGES staging state for a recording
# (AC-7's brand support-system flag), it is never an actor in a scenario.

@module:stats @variant:query @cell:client-self
Feature: A client reads the counts of their own dashboard

  A client holds four counts on their own account. They are the orders they
  placed, the invoices they hold, the invoices they still owe, and the support
  tickets they left open. The same account can carry a usage block. The client
  reads all of it under their own identity, and never another account's.

  # === AC-19: THE SIGNED-OUT GUARD (top-level — it seeds no client) ============
  # Placed before the Rule's Background so it does not inherit the authenticated
  # open. A signed-out caller is offered neither the counts nor the usage block
  # as available.

  @AC-19 @client @module @guard @signed-out
  Scenario: Nothing of mine is read before I sign in
    Given I have not signed in yet
    When I try to use my dashboard counts or my usage
    Then nothing of mine is offered to me as available

  Rule: A signed-in client reads their own dashboard counts

    Background:
      Given I am an authenticated client reading my own dashboard counts

    # === THE FOUR DASHBOARD COUNTS ===========================================

    @AC-1 @client @cell:client-self
    Scenario: See how many orders I have placed
      When I look at my dashboard counts
      Then I see the total number of orders I have placed

    @AC-2 @client @cell:client-self
    Scenario: See how many invoices I hold, in every currency I hold them in
      When I look at my dashboard counts
      Then I see the total number of invoices, across every currency I hold them in

    @AC-3 @client @cell:client-self
    Scenario: See how many of my invoices I have still to pay
      When I look at my dashboard counts
      Then I see how many of my invoices are unpaid or overdue

    @AC-4 @client @cell:client-self
    Scenario: See how many of my support tickets are still open
      When I look at my dashboard counts
      Then I see how many of my support tickets are still open

    # === ABSENCE AND ZERO =====================================================
    # Absence and a real zero are DISTINCT capabilities: an absent report key
    # stays null (never coalesced to zero), and a real zero stays zero (never
    # promoted to an absence). Each is driven off its own real recording.

    @AC-6 @client @cell:client-self
    Scenario: Having none of something shows me nothing, and never a zero
      Given I have none of one of my counted things
      When I look at my dashboard counts
      Then that count shows me nothing, and never a zero

    @AC-6 @client @cell:client-self
    Scenario: Having zero of something shows me the zero
      Given I truly have zero of one of my counted things
      When I look at my dashboard counts
      Then that count shows me the zero

    # === THE TICKET COUNT AND MY BRAND'S SUPPORT SYSTEM =======================
    # The ticket count is a GUARD on the brand's support-system setting, not a
    # display claim: with the setting arranged off on staging (staff writes
    # ui.client_area.disable_support_system, restored after the recording), the
    # count is not offered. The unreadable-config twin was CUT (operator ruling
    # 2026-10-03): legacy reads the setting `?? false`, so an absent setting is
    # the normal visible case, and a failed brand read is a banned "server
    # fails" scenario.

    @AC-7 @client @cell:client-self
    Scenario: My ticket count is not offered when my brand turns its support system off
      Given my brand has turned its support system off
      When I look at my dashboard counts
      Then my ticket count is not offered to me

    # === THE USAGE BLOCK, REFUSAL PATH ========================================
    # The usage read is a SECOND concern of the same composable, on distinct
    # members, gated on the Upmind host context. The refusal is the real
    # recorded 409 ("This client is not an Upmind client!"). AC-14 asserts the
    # refusal STATUS and flag, never the message text (grade ruling).

    @AC-13 @client @cell:client-self
    Scenario: I am offered no usage block when my usage is refused me
      Given I am a client whose usage the server refuses
      When I ask for my usage
      Then I am offered no usage block

    @AC-14 @client @cell:client-self
    Scenario: A refused usage read is reported as refused
      Given I am a client whose usage read the server turns away
      When I ask for my usage
      Then I am told my usage was refused

    # === THE EMPTY FLAG =======================================================
    # isEmpty is the module's own net-add guard: a real zero among real numbers
    # is not an empty account.

    @AC-23 @client @cell:client-self
    Scenario: Holding a real zero does not tell me my account is empty
      Given one of my counts is a true zero, and the others hold numbers
      When I read all of my dashboard counts
      Then I am not told my account is empty

    # === MOVED — query / session-store / scope own these ======================
    # Per-query loading independence (AC-8), abort-on-destroy (AC-10), the
    # refetch-on-ask contract (AC-16, AC-21, AC-22), the session's own
    # package-limit hold (AC-18), and the scope's self-resolution whoever is
    # named (AC-20) are platform behaviour, proved once by their owning module,
    # never re-tested per consuming module (handover §6).

    @AC-8 @client @module @moved
    Scenario: Each of my counts arrives on its own, and waits for no other
      Then each count reports its own loading, and an arrived count waits for no other

    @AC-10 @client @module @moved
    Scenario: When I am done with my counts, nothing is still read for me
      Then a destroyed scope aborts its in-flight reads

    @AC-16 @client @module @moved
    Scenario: Asking again for my usage asks the server again
      Then asking again for a read issues a fresh request

    @AC-18 @client @module @moved
    Scenario: I hold my own package limits as soon as I sign in
      Then the session carries the client's package limits from sign-in

    @AC-20 @client @module @moved
    Scenario: My counts stay mine, whoever else is named as asking
      Then the scope resolves self to the signed-in client, whoever is named

    @AC-21 @client @module @moved
    Scenario: I am not told my counts are ready until the last one arrives
      Then readiness waits for every count's own read to settle

    @AC-21 @client @module @moved
    Scenario: Asking again for my counts asks the server again
      Then asking again for the counts issues a fresh request for every count

    @AC-22 @client @module @moved
    Scenario: When I drop my counts, they are read again from the server
      Then dropping every held count reads each again from the server
