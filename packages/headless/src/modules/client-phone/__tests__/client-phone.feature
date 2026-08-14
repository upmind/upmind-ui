# client-phone — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT, mirroring the client-email precedent: this
# file lives at
#   packages/headless/src/modules/client-phone/__tests__/client-phone.feature
# This co-located copy is the single source of truth: it is what
# client-phone.traceability.test.ts reads and enforces the @AC link against,
# both ways. Nothing in the suite reads a planning artefact — those are not
# deliverables and are absent from a fresh clone and from CI.
#
# NON-EXECUTABLE per ADR-020 (".feature files are spec-only, not executable").
# No runner touches it and no steps file is produced — the colocated unit and
# integration specs are the tests that run, each anchored to a scenario by its
# @AC tag.
#
# One scenario per capability the parity table carries, at actor x context
# altitude (ADR-001) — INCLUDING every editor behaviour (load-one, readiness,
# input/validate, save-edit, save-draft, schema-via-context, clear, isolated
# drafts, state flags, refresh-the-list, lifecycle). This module ships BOTH
# halves — the collection AND the per-phone editor — because the 2026-08-05
# client-email amputation (a variant=query run against an oracle that shipped
# a manager, every gate green) is the receipt this run's variant=hybrid
# derivation exists to prevent. Business language only — the wire-level
# read-backs that PROVE each scenario (URL retarget, token, request body) live
# in requirements.md / parity.yaml, not here.
#
# Actors: a client manages their OWN phone numbers. There is exactly ONE live
# cell — client x self — by operator ruling 1 (2026-08-08). Both scope
# matrices set SELF / STAFF / GUEST to `null as never`, so acting as staff or
# as a guest is a compile-time error (AC-31), not a silently-missing branch.
#
# THE ORACLE DOES EXPOSE STAFF CAPABILITY — unlike client-email-history, whose
# oracle had no client-targeted endpoint at all. Legacy vue-app ships a
# distinct admin endpoint family, four staff capability gates, an
# acting-as-client impersonation branch, and staff-specific copy. Every one of
# the following is a REAL, oracle-demonstrated capability this delivery does
# NOT carry. Recorded here — not silently missing — so a reader cannot mistake
# a signed drop for an oversight. Each carries an operator sign-off dated
# 2026-08-08 (tier-1) and a Linear issue reference in parity.yaml
# (Dropped-with-Linear-issue, per verify-parity-oracle.companion.md):
#   - S1 reading/writing ANOTHER client's phones through the admin endpoint family
#   - S2-S5 the four staff capability gates (list / create / set-default / delete)
#   - S6 acting AS a client (impersonation) while managing their phones — the
#     FE-2824 shape verbatim. Its restoration owes the A7 read-back: the
#     request-URL retarget AND the auth identity transport (which session
#     token, which acting-as headers) — never the response payload alone.
#   - S7 staff-specific guidance copy on the phones section
#   - R1 the advertised-but-absent `clientId` targeting option on the editor —
#     removed because it never worked (ruling 2), not because it is out of
#     scope; see AC-32 below, which proves the removal itself
#   - L1 choosing a phone TYPE when adding or editing (legacy's required select
#     — the field stays visible on every row, see AC-2, but cannot be set)
#   - L2 including staged imports in the list (`with_staged_imports: 1`)
#   - L3 deterministic list ordering (legacy sorts by created_at; current
#     headless and this delivery send no sort — the server default applies)
#   - L9 a confirmation toast on a successful add or edit from the editor
# No capability above has any scenario in this file. That absence IS the
# record — do not add one without a new operator ruling reversing the drop.
#
# TWO DELIBERATE DIVERGENCES FROM THE client-email REFERENCE, so a later
# reader does not "correct" them back to match that module:
#   - W6: this module KEEPS feedback (a confirmation on success, a message on
#     failure) on `remove` and `setDefault` (AC-7, AC-8, AC-9) even though
#     client-email raises none anywhere. THIS oracle raises feedback on
#     exactly those two mutations; the oracle wins over the cross-module
#     pattern. The editor half raises none on save, matching both oracles.
#   - L10 / NOT-SUPPORTED-IN-LEGACY: there is no phone VERIFICATION action.
#     Whether a phone is verified is read-only, display-only, in BOTH
#     oracles — recorded explicitly because client-email DOES ship a `verify`
#     action, and a reader pattern-matching from that module would otherwise
#     expect one here and mistake its absence for an amputation.

@module:client-phone @variant:hybrid @cell:client-self
Feature: A client manages their own phone numbers

  A client holds one or more phone numbers — one marked default, each with its
  own delete-eligibility and verification status. Two surfaces serve them: a
  COLLECTION they read and act on row by row, and a per-phone FORM EDITOR they
  open to add or change a number. Both act on that client's own phone numbers,
  under that client's own identity, and never on another client's.

  Background:
    Given I am an authenticated client managing my own account
    And every request I make is addressed to my own phone collection as that client

  # === THE COLLECTION ========================================================

  @AC-1 @collection
  Scenario: List my own phone numbers
    When I open my phone numbers
    Then I see the reactive list of my own phone numbers
    And no other client's phone numbers are ever loaded

  @AC-2 @collection
  Scenario: See the details and status of each of my phone numbers
    Given one of my phone numbers is my default, one cannot be deleted, and one is unverified
    When I view my phone numbers
    Then that default phone number is shown as my default
    And the non-deletable one is shown as unable to be deleted
    And the unverified one is shown as unverified
    And each phone number carries its parsed number, its national number, its
      country calling code, its country, and its display title and description
    And each phone number shows its type without any way to change it by saving

  # Two scenarios, one AC: the state of the list itself, and whether the list
  # is mine to read at all.

  @AC-3 @collection
  Scenario: Know whether my list is loading, empty, or errored
    When I open my phone numbers
    Then I can see whether the list is loading, empty, or errored

  @AC-3 @collection @guard
  Scenario: Know whether my phone collection is mine to read at all
    Given I am signed in as a client
    When I look at my phone collection
    Then it tells me the collection is available to me
    And before I am signed in it tells me the collection is not available
    And the moment my session goes away it tells me the collection is no longer available

  @AC-4 @collection
  Scenario: Wait for the collection to become ready without hanging
    Given my session has settled with no client for me to address
    When I wait for my phone collection to be ready
    Then I am told it will never become ready, rather than waiting forever

  @AC-5 @collection
  Scenario: Read my default phone number
    Given one of my phone numbers is marked as my default
    When I ask which of my phone numbers is the default
    Then I am given that phone number
    And if none of my phone numbers is the default I am told I have none

  @AC-6 @collection
  Scenario: Look a phone number up by its id
    Given I know the id of one of my phone numbers
    When I look it up by that id
    Then I am given that phone number
    And looking up an id I do not hold gives me nothing

  @AC-6 @collection
  Scenario: Find a phone number by its parsed number
    Given one of my phone numbers has a known parsed number
    When I look for a phone number by that parsed number
    Then I am given that phone number
    And nothing is requested from the server to answer me

  @AC-7 @collection
  Scenario: Delete one of my phone numbers
    Given I have a phone number the server allows me to delete
    When I delete that phone number
    Then it is removed from my collection
    And it no longer appears in my list
    And I am given confirmation that it was removed

  @AC-8 @collection
  Scenario: Promote a phone number to my default
    Given I have a phone number that is not currently my default
    When I make that phone number my default
    Then that phone number becomes my default
    And my previous default is no longer the default
    And I am given confirmation that it is now my default

  @AC-9 @collection
  Scenario: A failed row change is reported to me as state, not just announced
    Given one of my attempts to delete or set-as-default fails
    When I inspect my phone collection afterwards
    Then the collection tells me it is now in an error state
    And I am also given a message describing what went wrong
    And both of those are true together, not just one of them

  @AC-10 @collection
  Scenario: Force a fresh read of my phone numbers from the server
    Given my phone collection cannot currently be addressed
    When I force a fresh read
    Then that fresh read is refused rather than silently returning nothing
    And when my phone collection can be addressed, the same fresh read succeeds

  @AC-10 @collection
  Scenario: Mark my cached phone numbers as stale
    Given I have already read my phone numbers once
    When I mark that read as stale
    Then the next time I read my phone numbers, they are fetched again

  @AC-11 @collection
  Scenario: Page through my phone numbers
    Given I have more phone numbers than fit on one page
    When I ask for the next page
    Then I am given the next page of my phone numbers
    And asking for the previous page brings me back to where I was

  @AC-12 @collection
  Scenario: Filter my phone numbers by free text
    Given I have several phone numbers
    When I filter my phone numbers by some free text
    Then I am given only the phone numbers matching that text
    And my previous, unfiltered read is not re-fired to answer it

  @AC-13 @collection
  Scenario: Adding a phone number I already have does not duplicate it
    Given one of my phone numbers already matches the number I am about to add
    When I add that same phone number again
    Then I get back my existing phone number
    And no new phone number is created

  @AC-14 @collection
  Scenario: Discarding my phone collection releases it
    Given I have opened my phone collection
    When I destroy that collection
    Then it is released
    And opening my phone numbers again gives me a fresh collection

  @AC-15 @collection @guard
  Scenario: Nothing touches my phone numbers without an authenticated client session
    Given there is no authenticated client session
    When my phone collection is used
    Then no request is ever made against any client's phone numbers
    And any forced read or change is refused as not-authenticated

  # === THE PER-PHONE EDITOR ==================================================
  # Every scenario below belongs to the single "editor" half the 2026-08-05
  # client-email run amputated. They are client x self capabilities, not
  # variant artifacts, and this module ships every one of them.

  @AC-16 @manager @fe-2824 @negative-control
  Scenario: The per-phone editor exists at all, alongside the collection
    Given a consumer depends on both my phone collection and my per-phone editor
    When the module is built
    Then the editor is offered exactly as the collection is
    And removing the editor from what the module offers turns this red

  @AC-17 @manager
  Scenario: Open one of my phone numbers for editing, or start a fresh one
    When I open one of my existing phone numbers in the editor
    Then the form is populated with that phone number
    And the editor knows which of my phone numbers it is editing
    When I instead start a fresh phone number
    Then the form opens empty, ready for a brand-new entry

  @AC-17 @manager
  Scenario: Two fresh drafts do not interfere with each other
    Given I have started two new phone numbers at the same time
    When I type into the first
    Then the second is left completely untouched

  @AC-18 @manager
  Scenario: The form resolves my country before it is usable
    When I open the editor
    Then it waits until my country has been resolved before I can use it
    And the form opens already dialled to that resolved country
    And it is not reported as changed before I have typed anything

  @AC-19 @manager
  Scenario: The editor tells me how to render its form
    When I open the editor
    Then the editor gives me the form's schema and its matching UI definition
    And the module offers no other way to obtain them

  @AC-20 @manager
  Scenario Outline: Typing a phone number parses it against my resolved country
    Given the editor has resolved my country to "<context country>"
    When I type "<input>" into the editor
    Then the parsed number reads "<parsed number>"
    And the parsed country calling code reads "<parsed code>"

    Examples:
      | context country | input        | parsed number | parsed code |
      | GB               | 07911123456  | +447911123456 | 44          |
      | GB               | +14155552671 | +14155552671  | 1           |

  @AC-20 @manager
  Scenario: Typing into the editor is debounced, not fired on every keystroke
    Given I am typing a phone number into the editor
    When I type several characters in quick succession
    Then only the settled result of my typing is parsed
    And saving right after typing uses what I actually typed, never a stale value

  @AC-21 @manager
  Scenario: Invalid input is reported as field-level state, not thrown at me
    Given I have opened the editor
    When I type a phone number that cannot be parsed
    Then the editor tells me my input is invalid
    And it tells me which part of the phone number is wrong
    And nothing is sent to the server while it is invalid

  @AC-22 @manager
  Scenario: Save a brand-new phone number
    Given I have started a new phone number in the editor
    When I enter a phone number and save
    Then the new phone number is created on my own collection
    And a phone number I already hold is returned to me instead of being duplicated

  @AC-23 @manager
  Scenario: Save a change to an existing phone number without losing what I just typed
    Given I have opened one of my phone numbers in the editor
    When I change it and save straight away, before any pause in my typing
    Then my saved phone number reflects the value I just typed, not the one I opened with

  @AC-24 @manager @collection
  Scenario: Saving in the editor updates my list
    Given my phone numbers are open in one place and the editor in another
    When I save a change in the editor
    Then my list of phone numbers shows the saved value

  @AC-25 @manager
  Scenario: See the editor's own progress while I work
    When I open the editor and type into it
    Then I can see whether it is loading, ready, changed, valid, saving, or finished
    And whether the phone number I am editing is a brand-new one

  @AC-26 @manager
  Scenario: Read the model, its identity, its display strings and its errors
    Given I have opened one of my phone numbers in the editor
    Then I can read its current value, which phone number it is
    And a title and description for it
    And any errors, general or field-level, currently against it

  @AC-27 @manager
  Scenario: Clear the form back to where it started
    Given I have typed a change into the editor
    When I clear the form
    Then the form returns exactly to its starting state
    And it is no longer reported as changed

  @AC-27 @manager
  Scenario: Stop, discard, and await completion of the editor
    Given I have opened the editor
    When I stop it, it stops working but is still there
    And when I destroy it, it is released and opening that phone number again gives me a fresh editor
    And I can wait for a save that is in flight to finish before moving on

  @AC-28 @manager @guard
  Scenario: The editor waits for an addressable client instead of firing early
    Given the editor is opened before my client identity has resolved
    When it is used before that identity resolves
    Then it holds without sending any request
    And it becomes usable the moment my identity resolves
    And a later, unrelated identity refresh never overwrites an identity it already resolved

  @AC-35 @manager @session
  Scenario: The editor stays responsive across a sustained single session
    Given my session has booted once and my brand is already ready, as in a real visit
    When I open, edit, save, and close several of my phone numbers one after
      another in that same session, including starting a fresh one among them
    Then each editor becomes ready within the same short, bounded time
    And no later opening in that session becomes slower than that bound

  # === WHOLE-MODULE GUARANTEES ===============================================

  @AC-29 @module @public-surface
  Scenario: The module offers exactly the collection and the editor, nothing more
    Given consumers depend on the phone collection AND the per-phone editor
    When the module is built
    Then both are offered, with every type a consumer imports
    And no other way to reach the module's internals is offered
    And every dependent module still compiles with no new error

  @AC-30 @module @provenance
  Scenario: Every proof of this module's behaviour replays a genuinely recorded exchange
    Given this module shipped with no prior tests and no prior recorded behaviour
    When its behaviour is proven
    Then every proof replays an exchange actually captured from the real phone service
    And no proof is built from data invented for the occasion

  @AC-31 @module @guard
  Scenario: Acting as staff or as a guest on a client's phones is refused before the code ever runs
    Given the phone collection and the phone editor both declare who may address them
    When a consumer tries to act as staff or as a guest
    Then that attempt fails to build, not merely to run
    And only a client acting for themselves ever reaches either surface

  @AC-32 @manager @public-surface
  Scenario: The editor cannot be pointed at a client other than the one it opened for
    Given the editor was once advertised as able to edit a phone belonging to another named client
    When the editor is opened today
    Then it offers no way to name a different client
    And it always edits within the client whose scope opened it

  @AC-33 @module
  Scenario: Every existing consumer of the phone module keeps working after the conversion
    Given fourteen call sites across the client app, the cart funnels, and other headless
      modules already depend on my phone collection or my phone editor
    When the module is converted to the scoped shape
    Then every one of those call sites still compiles and behaves as it did before
    And the cross-module find-or-create seam used by client company and unified billing keeps working
    And the unified billing schema still composes my phone form's schema and UI definition

  @AC-34 @module @negative-control
  Scenario: Every safeguard this module relies on is proven by trying to break it first
    Given each safeguard this module claims — the editor's presence, the
      authentication guard, the scoped identity resolution, the delete
      confirmation, the number-parsing fallback, and the default-promotion request
    When that safeguard is deliberately broken
    Then the scenario proving it turns red
    And restoring the safeguard returns it green
