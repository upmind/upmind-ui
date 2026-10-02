# client-email — the module's ONE feature file: its capability spec, the source
# `client-email.steps.ts` implements, and the playlist the scenario bar plays.
#
# CO-LOCATION IS THE REQUIREMENT (operator ruling 2026-08-05): this file lives at
#   packages/headless/src/modules/client-email/__tests__/client-email.feature
# and it is the only spec this module's tests know.
#
# ONE SCENARIO PER CAPABILITY (operator ruling 2026-09-24). A capability that can
# be driven carries its `@AC-N` tag on the DRIVEN `@layer-e2e` scenario, and there
# is no second declarative twin. A capability nothing can yet drive keeps ONE
# declarative scenario, `@todo`, with the named blocker in the comment above it.
#
# EXECUTED per ADR-020 Amendment 5. A scenario the step catalog matches is
# driveable: it runs, and it appears as a track. A `@todo` scenario is written
# down and not yet driven — a legitimate state.
#
# Business language only, declarative only: no selector, URL or UI mechanic
# appears here, and the steps that drive it reach the module through the `World`
# members and nothing else.
#
# Actors: a client manages their OWN email addresses. There is no staff cell and
# no guest cell in this module — staff capabilities the oracle reveals are
# recorded drops (operator scope ruling 2026-08-05), and an email address belongs
# to a client record, so a guest is neither a client nor acting for one.
#
# The editor (`useClientEmailManager`) is driven as a SECOND scenario key beside
# the collection: booted `{ actor }` for a new address, `{ actor, context }` for
# one opened by id.
#
# THE SIGNED-OUT GUARDS SIT AT TOP LEVEL, outside the `Rule:` that carries the
# signed-in Background (operator-approved restructure, FE-3145 wave 2). A guard
# boots for itself under a guest session, so it does not inherit the Background's
# authenticated-client boot — parseFeatureScenarios gives it backgroundStepCount 0.

@module:client-email @variant:hybrid @cell:client-self @FE-2977
Feature: A client manages their own email addresses

  A client holds one or more email addresses — one marked default, each
  independently verifiable. Two surfaces serve them: a COLLECTION they read and
  act on row by row, and a per-email FORM EDITOR they open to add or change an
  address. Both act on that client's own addresses, under that client's own
  identity, and never on another account's.

  # === THE SIGNED-OUT GUARDS (no Background) ==================================

  @AC-10 @collection @guard @signed-out @layer-e2e
  Scenario: Nothing touches a client's emails without an authenticated client session
    Given there is no authenticated client session
    When my client-email collection is used
    Then the collection reports itself unavailable
    And no request is made against any client's email resource

  @AC-12 @manager @guard @signed-out @layer-e2e
  Scenario: The editor is inert without an authenticated client session
    Given I open the editor without an authenticated client session
    Then the editor reports itself unavailable
    And no request is made against any client's email resource

  # The signed-in boot's list read is a recorded 500, so the collection settles
  # errored on a genuine request the recording overrides.
  @AC-3 @collection @errored @layer-e2e
  Scenario: When my list cannot be read, the collection tells me it errored
    Given I am an authenticated client whose email collection cannot be read
    Then the email collection reports it errored

  Rule: A signed-in client manages their own addresses

    Background:
      Given I am an authenticated client managing my own account
      And every request I make is addressed to my own email collection as that client

    # === THE COLLECTION, DRIVEN ==============================================

    @AC-1 @collection @layer-e2e @smoke
    Scenario: A client sees their email collection
      Then I see my email addresses

    @layer-e2e @smoke
    Scenario: A client adds an email address
      When the client adds the address "client-email-added@example.com"
      Then the collection reports no failure
      And "client-email-added@example.com" is listed

    @AC-4 @collection @layer-e2e
    Scenario: A client deletes an email address
      When the client deletes the address the server allows them to delete
      Then the collection reports no failure

    @AC-6 @collection @layer-e2e
    Scenario: A client resends a verification email
      When the client resends the verification for their unverified address
      Then the collection reports no failure

    @AC-5 @collection @layer-e2e
    Scenario: A client sets a default email
      When the client makes their non-default address the default
      Then the collection reports no failure
      And the address I chose is now my default

    @AC-8 @collection @layer-e2e
    Scenario: A client refreshes their collection
      When the client refreshes the collection
      Then I see my email addresses

    @AC-8 @collection @layer-e2e
    Scenario: Asking for a page that is not there is refused, not guessed
      When the client asks for a next page they do not have
      And the client asks for a previous page they do not have
      Then I see my email addresses

    @AC-9 @collection @layer-e2e
    Scenario: Discarding the collection releases it
      When the client discards the collection
      Then the collection reports no failure

    @AC-8 @collection @layer-e2e
    Scenario: Filtering narrows the collection
      When the client filters to unverified addresses only
      Then I see my email addresses
      And the collection reports that it is filtered

    @AC-8 @collection @layer-e2e
    Scenario: Sorting reorders the collection
      When the client sorts the collection by address descending
      Then the collection is sorted by "email" descending
      And the collection reports no failure

    # === THE PER-EMAIL EDITOR, DRIVEN ========================================

    @AC-13 @manager @layer-e2e
    Scenario: The editor refuses a malformed new address
      Given I open a new email address in the editor
      When I give the editor the address "not-an-email"
      Then the editor refuses the address

    @AC-13 @manager @layer-e2e
    Scenario: The editor accepts a well-formed new address
      Given I open a new email address in the editor
      When I give the editor the address "prover-new@example.com"
      Then the editor accepts the address

    @AC-19 @manager @layer-e2e
    Scenario: A new email editor reports itself as new
      Given I open a new email address in the editor
      When I give the editor the address "prover-new@example.com"
      Then the editor reports it is editing a brand-new address

    @AC-17 @manager @layer-e2e
    Scenario: The editor forgets a cleared change
      Given I have typed a change into a new email address editor
      When I clear the editor
      Then the editor reports no unsaved change

    @AC-15 @manager @layer-e2e
    Scenario: A client saves a new address in the editor
      Given I open a new email address in the editor
      When I enter "client-email-editor-new@example.com" and save it in the editor
      Then the editor reports the address saved

    @AC-11 @manager @layer-e2e
    Scenario: A client opens one of their saved addresses in the editor
      Given I open one of my saved addresses in the editor
      Then the editor is populated with that address

    @AC-14 @manager @layer-e2e
    Scenario: A client saves a change to one of their addresses
      Given I open my saved address for a change in the editor
      When I change the address to "client-email-editor-edited@example.com" and save it
      Then the editor reports the address saved

    # === THE ERRORED COLLECTION (forced 5xx) =================================
    # === THE LIST AND THE EDITOR TOGETHER ====================================

    @AC-20 @manager @collection @layer-e2e
    Scenario: Saving in the editor updates my list
      Given my email addresses are open in one place and the editor in another
      When I save a change in the editor
      Then my list of addresses shows the saved value

    # === THE EDITOR SCHEMA ===================================================

    @AC-16 @manager @layer-e2e
    Scenario: The editor tells me how to render its form
      Given I open a new email address in the editor
      Then the email editor offers its form schema and UI definition

    # === CAPABILITIES PROVEN BY A PURE UNIT TEST =============================
    # No driven scenario: the mapper / public-surface unit tests name these ids.

    @AC-2 @collection
    Scenario: See the details and status of each of my addresses
      Given one of my addresses is my default, unverified, and has bounced
      When I view my email addresses
      Then that address is shown as default, unverified, and bounced, with when it bounced
      And each address carries its display title, description, and account-email type
      And an address the server marks non-deletable is shown as non-deletable

    @AC-24 @module @public-surface @negative-control
    Scenario: The module offers both surfaces and every consumer keeps compiling
      Given consumers depend on the collection AND the per-email editor
      When the module is built
      Then both are offered, with every type a consumer imports
      And removing the editor from what the module offers turns this red
      And every dependent module still compiles with no new error

  # AC-18 (two new-address forms do not interfere) DELETED as a scenario per
  # operator ruling (FE-3145 wave 2): the World holds at most one editor cell, so
  # two independent drafts cannot be observed side by side.
