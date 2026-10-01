# client-email-history — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT, mirroring the client-email canary and the
# client-address / client-phone precedent. The delivered copy lives at
#   packages/headless/src/modules/client-email-history/__tests__/client-email-history.feature
# and THAT copy is the single source of truth: it is what
# client-email-history.traceability.test.ts reads and enforces the @AC link
# against, both ways. Nothing in the suite reads a planning artefact — those are
# gitignored, absent from a fresh clone and from CI.
#
# ONE SCENARIO PER CAPABILITY (operator ruling 2026-09-24, ADR 035 Amendment 1).
# A capability that can be driven carries its `@AC-N` tag on a DRIVEN scenario
# with its own per-step recording under `scenarios/<slug>/`. A capability proven
# by a pure unit test carries its `@AC-N` on a declarative scenario the unit test
# names. A capability no scenario can drive keeps ONE declarative scenario tagged
# `@todo`, with the named blocker in the comment above it. A capability whose
# behaviour lives in another module (token / transport / scope-target) is tagged
# `@moved`. Never a driven + declarative twin for the same capability.
#
# EXECUTED per ADR-020 Amendment 5: the sibling client-email-history.steps.ts
# catalog decides, scenario by scenario, which entries are driveable; the replay
# plays every recorded one and asserts one folder per step.
#
# Business language only — the wire-level read-backs that PROVE each scenario
# (request URL, filter keys, pagination offsets, session token) live in the
# module's own recordings, not here.
#
# Actors: a client reads their OWN email history. There is no staff cell and no
# guest cell in this module, and — unlike client-email — that is not a recorded
# drop: the oracle exposes NO client-targeted email-history endpoint for another
# actor, so there is nothing to drop (parity M3/M4/M5). There are no mutation
# scenarios because the oracle has no mutations anywhere (parity M6).
#
# The single received email (useClientReceivedEmail) is a SEPARATE composable
# that marks its record with the builder's `.withId(id)` and refuses `.for()`
# (FE-3095). It is DRIVEN as a second scenario key, booted `{ actor: client, id }`
# — the World scope seam's `id` maps to `.as(actor).withId(id)`. Its reads
# (AC-14/AC-15/AC-17) are driven scenarios; AC-13's body-default branch stays a
# pure mapper unit test, because a body-never-stored row is a wire-negative the
# recorded corpus does not hold.

@module:client-email-history @variant:query @cell:client-self
Feature: A client reads their own email history

  Every email the system has sent to a client is recorded in that client's
  history. Two surfaces serve it: a COLLECTION the client browses, searches,
  sorts, narrows and pages through, and a SINGLE EMAIL they open to read in
  full. Both read that client's own history, under that client's own identity,
  and never another account's.

  # === REFUSED WITHOUT AN AUTHENTICATED CLIENT (signed-out, top-level) ========
  # A @signed-out guard boots the guest floor with no Background: it must resolve
  # unavailable and read nothing. The replay arms no recording for it, so any
  # request it makes is an unmatched request the replay wall fails it by name on.

  @AC-5 @AC-16 @AC-18 @collection @single-email @guard @negative-control @signed-out
  Scenario: Nothing of anyone else's email history is ever readable
    Given there is no authenticated client session for my email history
    When my email history is used while signed out
    Then my email history reports itself unavailable
    And no request is made against any email-history resource

  # The errored limb of the loading/empty/errored triad: the boot list read is a
  # recorded 500 (Generator forceStatus — a control response), so the collection
  # settles errored on a genuine request the recording overrides.
  @AC-4 @collection @errored
  Scenario: Know when my email history has errored
    Given I am an authenticated client whose email history cannot be read
    Then my history reports that it errored

  # The same recorded-500 boot as AC-4: the failure is shown ON my history's own
  # state for me to read, and the module surfaces it rather than throwing — the
  # boot settles on the error instead of raising it.
  @AC-21 @collection @errored
  Scenario: A problem with my history is shown to me where I read it, not thrown
    Given I am an authenticated client whose email history cannot be read
    When I inspect my history after a read has failed
    Then I can read that my history errored

  Rule: A signed-in client reads their own history

    Background:
      Given I am an authenticated client reading my own account
      And every request I make is addressed to my own email history as that client

  # === THE COLLECTION, DRIVEN ================================================

  @AC-1 @collection
  Scenario: See my own email history
    Then I see my email history

  @AC-6 @collection
  Scenario: Sort my history by subject
    When I sort my history by subject
    Then my history is ordered by subject
    And no email-history failure is reported

  @AC-7 @collection
  Scenario: Search my history
    When I search my history for a word
    Then my search narrows the history
    And no email-history failure is reported

  @AC-8 @collection
  Scenario: Narrow my history to what happened to each email
    When I narrow my history to the emails that were sent
    Then only sent emails are returned
    And no email-history failure is reported

  @AC-9 @collection
  Scenario: Page through my history
    When I go to the next page of my history
    And I come back to the previous page
    Then I see my email history
    And no email-history failure is reported

  @AC-11 @collection
  Scenario: Refresh my history
    When I refresh my history
    Then I see my email history
    And no email-history failure is reported

  @AC-12 @collection
  Scenario: Discarding a history collection releases it
    When I discard the collection
    Then no email-history failure is reported

  # === ONE RECEIVED EMAIL, DRIVEN ============================================
  # The single read (useClientReceivedEmail) is a second scenario key, booted
  # `{ actor: client, id }` — the builder's `.withId(id)`. The id is read from
  # the scenario's own recording.

  @AC-14 @single-email
  Scenario: See that email's details and whether it reached me
    When I open one of my emails
    Then I see that email's subject

  @AC-15 @single-email
  Scenario: Know whether that email is loading, empty, or errored, and wait for it
    When I open one of my emails
    Then that email becomes available to read
    And no email-history failure is reported

  @AC-17 @single-email
  Scenario: Refresh one email, and release it when done
    Given I have opened one of my emails
    When I refresh that email
    Then no email-history failure is reported
    And when I discard that email it is released

  # === CAPABILITIES PROVEN BY A PURE UNIT TEST ===============================
  # No driven scenario: the mapper / public-surface unit tests name these ids.

  @AC-2 @collection
  Scenario: See what each email said and who it went to
    Given one of my emails in the recorded history
    When the row is mapped for display
    Then it carries its subject, its sender, its recipients and its recipient's name, address and picture
    And it carries when it was sent, when it bounced and when it errored

  @AC-3 @collection
  Scenario: See whether each email reached me
    Given a recorded email row in a given delivery state
    When the row is mapped for display
    Then it is shown as sent, sending, bounced or failed, with error taking precedence over a bounce

  @AC-13 @single-email
  Scenario: Read one of my emails in full
    Given a recorded single email
    When it is mapped for display
    Then it carries its full body, and an email whose body was never stored shows as empty, not broken

  @AC-20 @module @public-surface @negative-control
  Scenario: The module offers both surfaces and every consumer keeps compiling
    Given consumers depend on my email history AND on reading one email
    When the module is built
    Then both are offered, with every name a consumer imports today
    And removing the single-email surface, or the sort-order naming, turns this red

  # === WRITTEN DOWN, NOT YET DRIVEN ==========================================
  # Each carries the blocker that keeps it off the World seam today.

  # @moved: the request-URL retarget and the auth-token identity transport are
  # proven in the query / session-store / auth modules, not here (operator ruling
  # 2026-09-24). This module resolves whose history it reads from the scope it was
  # opened for; the transport that carries that identity is not its to prove.
  @AC-19 @module @fe-2824 @negative-control @moved
  Scenario: The history I read is the one my scope named — not whatever a global setting says
    Given every request resolves whose history it is reading from the scope I opened
    When that resolution is broken so it instead reads from a global setting
    Then every read in this module turns red
