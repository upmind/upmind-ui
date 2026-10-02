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
# Per ADR-020 Amendment 5 the colocated step catalog's presence and coverage
# are the truth. A scenario is driveable exactly when a step definition matches
# every one of its steps; one nothing matches is a capability written down and
# not yet driven.
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
# matrices set SELF / STAFF / GUEST to `null as never`, so staff and guest
# resolve to no context to act through (AC-31) — a declared absence, not a
# silently-missing branch. The matrix constrains CONTEXTS, not actors
# (scope.builder.ts) — `.as('staff')` itself is not what is refused; it is the
# context to act through that staff and guest never get. Staff is out of
# scope for this delivery by direct operator ruling (2026-08-22); this is not
# a gap, it is a signed drop recorded in parity.yaml (cell B, cell C).
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
#
# THE SIGNED-OUT GUARDS SIT AT TOP LEVEL, outside the `Rule:` that carries the
# signed-in Background (operator-approved restructure, FE-3145 wave 2). A guard
# boots for itself under a guest session, so it does not inherit the signed-in
# boot — parseFeatureScenarios gives it backgroundStepCount 0.

@module:client-phone @variant:hybrid @cell:client-self
Feature: A client manages their own phone numbers

  A client holds one or more phone numbers — one marked default, each with its
  own delete-eligibility and verification status. Two surfaces serve them: a
  COLLECTION they read and act on row by row, and a per-phone FORM EDITOR they
  open to add or change a number. Both act on that client's own phone numbers,
  under that client's own identity, and never on another client's.

  # === THE SIGNED-OUT GUARDS (no Background) ==================================

  # DRIVEN to expose the leak (operator directive FE-3145): the guard itself passes signed-out
  # (isAvailable:false, no wire), but driving the signed-out COLLECTION boot poisons the editor
  # half — @AC-20 and @AC-23 (the editor debounce scenarios) TIME OUT at 60000ms downstream,
  # where they pass in ~900ms with these guards NOT driven. Left driven (red) so a developer can
  # find the leak: the guest collection's readiness wait survives destroy and hangs a later
  # manager's isReady. This module's test files are the prover's; the developer diagnoses the fix.
  @AC-3 @collection @guard @signed-out @layer-e2e
  Scenario: Before I am signed in, my phone collection tells me it is not available
    Given I have no authenticated phone session
    When I read my phone collection while signed out
    Then my phone collection reports itself unavailable

  # DRIVEN to expose the leak (operator directive FE-3145): same poison as AC-3 — a driven
  # signed-out collection boot hangs @AC-20/@AC-23 at 60000ms downstream. Left driven (red) so
  # a developer can find and fix the guest-collection readiness leak.
  @AC-15 @collection @guard @signed-out @layer-e2e
  Scenario: Nothing touches my phone numbers without an authenticated client session
    Given I have no authenticated phone session
    When a read or a change is forced on my phone collection while signed out
    Then no phone request is made without a session
    And my phone collection reports itself unavailable

  @AC-17 @AC-28 @manager @guard @signed-out @layer-e2e
  Scenario: The phone editor waits for my account before it asks anything
    Given I open the phone editor without an authenticated client session
    Then the phone editor reports itself unavailable
    And no phone request is made without a session

  # AC-3 / AC-4 — the errored list read. The signed-in boot's list read is a
  # recorded 5xx, so the collection settles errored on a genuine request.
  @AC-3 @AC-4 @collection @errored @layer-e2e
  Scenario: When my phone list cannot be read, I am told it failed
    Given I am an authenticated client whose phone list cannot be read
    Then my phone list tells me it failed

  Rule: A signed-in client manages their own phone numbers

    Background:
      Given I am an authenticated client managing my own phone numbers
      And every request I make is addressed to my own phone collection as that client

    # === THE COLLECTION ======================================================

    # The other-client half ("no other client's phones are loaded") is a scope
    # identity fact, proven by AC-31 / AC-43 (client-phone.surface.test.ts).
    @AC-1 @AC-2 @AC-41 @collection
    Scenario: List my own phone numbers
      Given the client-phone playground boots for the active client
      And the phone collection is ready
      Then my own phone numbers are listed
      And each of my phone numbers shows whether it is my default, can be deleted and is verified
      And I receive the query schema, the filter bar and the order control as plain JSON

    @AC-5 @collection
    Scenario: Read my default phone number
      Given the client-phone playground boots for the active client
      And the phone collection is ready
      Then my default phone number is the one the server marks default

    # AC-6 (look up by id / find by parsed number) DROPPED as a distinct scenario:
    # in-memory lookups over the already-loaded collection — no wire, and the
    # "nothing is requested" half is a request-count fact, not a World outcome.

    # The phone collection refuses an out-of-schema criteria SILENTLY — no wire, no
    # error meta (unlike client-company, which raises hasError). The observable
    # refusal is the standing list, and any request that DID escape is a replay gap.
    @AC-9 @AC-42 @collection
    Scenario: A refused request never narrows my list and never reaches the wire
      Given the client-phone playground boots for the active client
      And the phone collection is ready
      When I filter my phones by a value the schema rejects
      Then my standing phone list is unchanged

    # AC-9 — a failed delete surfaces in the collection's error state (W6). The
    # delete is issued for real, its response forced to a 5xx.
    @AC-9 @collection @errors @layer-e2e
    Scenario: A failed delete shows up in the collection error state
      When I delete a phone and the server refuses
      Then my phone collection reports it is in an error state

    # AC-36 / AC-38 (ordering) driven below as "Order my phone numbers from the
    # playground"; the @AC-38 tag moved there. The declared-boot-order half is a
    # unit-checked default, not a distinct World outcome.

    @AC-37 @collection
    Scenario: A new filter sends me back to the first page
      Given the client-phone playground boots for the active client
      And the phone collection is ready
      When the client sets a page size of two
      And the client advances to the next page
      When I apply a new filter
      Then I am returned to the first page
      And my page size survives

    @AC-39 @collection
    Scenario: A misspelled filter reaches no wire and leaves my list alone
      Given the client-phone playground boots for the active client
      And the phone collection is ready
      When I attempt to filter by an undeclared column
      Then my standing phone list is unchanged after the undeclared filter

    # AC-13 (add does not duplicate) DROPPED as a distinct scenario: find-or-create
    # is an in-memory dedupe over the loaded collection; the "no new phone created"
    # half is a request-count fact, not a World outcome. The create path is driven
    # by AC-22 ("Save a brand-new phone number from the editor").

    # AC-14 (destroy/GC lifecycle) DROPPED: releasing a scope-registry entry is not
    # observable through a World step — no meta/context flag reflects it. AC-27
    # (clear) is kept below as its own blocked scenario.

    # === THE PER-PHONE EDITOR ================================================
    # Every scenario below belongs to the single "editor" half the 2026-08-05
    # client-email run amputated. They are client x self capabilities, not
    # variant artifacts, and this module ships every one of them.

    @AC-16 @manager @fe-2824 @negative-control
    Scenario: I can open a single phone number, not only the whole list
      Given a consumer depends on both my phone collection and my per-phone editor
      When the module is built
      Then the editor is offered exactly as the collection is
      And removing the editor from what the module offers turns this red

    # AC-17 two-drafts DELETED as a scenario per operator ruling (FE-3145 wave 2):
    # the World holds one editor cell, so two independent drafts cannot be observed
    # side by side. The editor-identity guard (AC-17/AC-28) rides the top-level
    # signed-out guard above.

    # Debounced input is driven: any model-affecting action awaits the debounce
    # flush (operator ruling, 0e0e57437), so a type-then-save is deterministic —
    # the last value typed is the one parsed and saved, and the replay wall proves
    # no per-keystroke request escapes.
    @AC-20 @manager
    Scenario: I enter a number and it is checked once I stop, not on every keystroke
      Given I am typing a phone number into the editor
      When I enter several characters in quick succession
      Then only the settled result of my typing is parsed
      And saving right after typing uses what I actually typed, never a stale value

    # Driven via the debounce flush (0e0e57437): the input settles into the model
    # before the save fires, so the saved value is the just-typed one, not the
    # opened one. The normal save-edit path is also driven by "Save a change to a
    # phone number from the editor".
    @AC-23 @manager
    Scenario: Save a change to an existing phone number without losing what I just typed
      Given I have opened one of my phone numbers in the editor
      When I change it and save straight away, before any pause in my typing
      Then my saved phone number reflects the value I just typed, not the one I opened with

    # AC-24 — the collection AND the editor live together: the editor saves a real
    # change and the collection re-reads it.
    @AC-24 @manager @collection @layer-e2e
    Scenario: Saving in the editor updates my list
      Given my phone numbers are open in one place and the editor in another
      When I save a change in the phone editor
      Then my list of phone numbers shows the saved value

    # Driven via the debounce flush (0e0e57437): after a change settles into the
    # model, clearing returns the form to the value it opened with and drops the
    # dirty flag — no real-time timing needed.
    @AC-27 @manager
    Scenario: Clear the form back to where it started
      Given I have typed a change into the editor
      When I clear the form
      Then the form returns exactly to its starting state
      And it is no longer reported as changed

    # AC-35 (sustained-session responsiveness) DROPPED: a performance/timing bound,
    # not a business capability a recorded exchange can hold.

    # === WHOLE-MODULE GUARANTEES =============================================

    @AC-29 @module @public-surface
    Scenario: The module offers exactly the collection and the editor, nothing more
      Given consumers depend on the phone collection AND the per-phone editor
      When the module is built
      Then both are offered, with every type a consumer imports
      And no other way to reach the module's internals is offered
      And every dependent module still compiles with no new error

    # AC-30 (provenance) DROPPED as a scenario: "every proof replays a real recorded
    # exchange" is a property of the whole suite (the recording pipeline and the
    # replay drift gate enforce it), not a single driveable capability.

    @AC-31 @module @guard
    Scenario: Staff and guest have no context to act through on a client's phones
      Given the phone collection and the phone editor each declare an actor-to-context matrix
      When a consumer inspects that matrix for staff or for guest
      Then neither actor is assigned any context to act through
      And only a client acting for themselves resolves to a real context

    @AC-43 @module @guard
    Scenario: The collection is built WITH its scope matrix, not merely typed against it
      Given the client-phone module is constructed
      When I inspect what the collection was actually built with
      Then the collection carries the very scope matrix that gives staff and guest no context
      And that matrix is wired at construction, not a type-only claim left unchecked at runtime

    @AC-32 @manager @public-surface
    Scenario: The editor cannot be pointed at a client other than the one it opened for
      Given the editor was once advertised as able to edit a phone belonging to another named client
      When the editor is opened today
      Then it offers no way to name a different client
      And it always edits within the client whose scope opened it

    # AC-33 (existing consumers keep compiling after the conversion) DROPPED as a
    # scenario: a cross-module compile-time fact, proven by the TypeScript build, not
    # a runtime capability a recorded exchange can drive.

    # AC-34 (every safeguard proven by breaking it first) DROPPED as a scenario: the
    # negative-control lane proves each safeguard through its colocated
    # *.must-fail.patch, not through one narrative scenario.

    @AC-44 @module
    Scenario: Every phone capability the feature names has a step that drives it
      Given the client-phone module carries one step catalog
      And every collection action carries a scenario annotation
      When the traceability test runs
      Then every @scenario-include action has a covering step
      And every @scenario-exclude action has a same-line reason
      And no returned action is left carrying neither tag

    @AC-45 @module
    Scenario: The module publishes exactly what the phone playground's table channel needs
      Given I am a client viewing my phone numbers
      When I ask the collection for what a scenario page's table channel reads
      Then I receive the query schema and the sort control definition
      And I receive the published request state
      And filterBy and sortBy are the only doors that change it

    # AC-45 (the playground drives filter/order/paging) DELETED as a duplicate: the
    # live filter/order/paging capability is driven below by the per-capability
    # playground scenarios (filter, order, page); the @AC-45 tag stays on the
    # published-channel scenario above.

    # === PAGE-DRIVEN SCENARIOS ===============================================
    # Appended for the playground step catalog. Each has its own boot Given
    # that does not inherit Background (step patterns unique to this module).

    @AC-10 @collection @scenario-include
    Scenario: Refresh the phone collection from the playground
      Given the client-phone playground boots for the active client
      And the phone collection is ready
      When the client refreshes the phone collection
      Then no phone collection failure is reported

    @AC-7 @collection @scenario-include
    Scenario: Remove a non-default phone from the playground
      Given the client-phone playground boots for the active client
      And the phone collection is ready
      When the client removes a non-default phone
      Then the phone collection count reflects the removal
      And the removed phone is no longer listed
      And no phone collection failure is reported

    @AC-8 @collection @scenario-include
    Scenario: Promote a phone to default from the playground
      Given the client-phone playground boots for the active client
      And the phone collection is ready
      When the client makes a non-default phone the default
      Then the phone is now the default
      And no phone collection failure is reported

    @AC-11 @collection @scenario-include
    Scenario: Page through my phone numbers from the playground
      Given the client-phone playground boots for the active client
      And the phone collection is ready
      When the client sets a page size of two
      Then the collection reports the page size of two
      When the client advances to the next page
      Then the collection reports the second page window

    @AC-36 @AC-38 @AC-40 @collection @scenario-include
    Scenario: Order my phone numbers from the playground
      Given the client-phone playground boots for the active client
      And the phone collection is ready
      When the client orders by created_at descending
      Then the collection is ordered created_at descending
      When the client reverses the order to ascending
      Then the collection is ordered created_at ascending

    @AC-12 @collection @scenario-include
    Scenario: Filter my phone numbers from the playground
      Given the client-phone playground boots for the active client
      And the phone collection is ready
      When the client filters by the free-text needle
      Then my phone list carries the filter
      And the collection narrows to the matching count
      And no phone collection failure is reported

    # === THE PER-PHONE EDITOR, DRIVEN ========================================
    # Booted through the manager composable key (World.boot context {type:phone,id}).

    @AC-17 @AC-26 @manager @scenario-include
    Scenario: Open one of my phone numbers in the editor
      Given the phone editor opens one of my existing numbers
      Then the editor is populated with that number
      And the editor knows which of my numbers it is editing

    @AC-21 @manager @scenario-include
    Scenario: A mistyped number is flagged in the editor before anything is sent
      Given the phone editor opens one of my existing numbers
      When I enter a number that cannot be parsed
      Then the editor reports my input as invalid

    @AC-23 @manager @scenario-include
    Scenario: Save a change to a phone number from the editor
      Given the phone editor opens one of my existing numbers
      When I change the number in the editor and save
      Then the editor settles with my changed number

    @AC-18 @manager @scenario-include
    Scenario: The editor resolves my country before it is usable
      Given the phone editor opens one of my existing numbers
      Then the editor has resolved my dialling country
      And the editor is not reported as changed before I change anything

    @AC-19 @manager @scenario-include
    Scenario: The editor gives me the form's schema and UI definition
      Given the phone editor opens one of my existing numbers
      Then the editor offers the form's schema and its UI definition

    @AC-20 @manager @scenario-include
    Scenario: Typing a number parses it against my resolved country
      Given the phone editor opens one of my existing numbers
      When I give a bare national number
      Then the editor parses it to an international number

    @AC-25 @manager @scenario-include
    Scenario: The editor reports its progress as I work
      Given the phone editor opens one of my existing numbers
      Then the editor reports it is editing an existing number
      When I change a value in the editor
      Then the editor reports an unsaved change

    @AC-22 @manager @scenario-include
    Scenario: Save a brand-new phone number from the editor
      Given the phone editor opens a fresh number
      When I enter a new number in the editor and save
      Then the editor settles after creating my number
