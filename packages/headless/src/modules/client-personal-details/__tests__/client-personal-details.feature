# client-personal-details — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATED COPY, authored by the PROVER seat. Every capability the module owns
# is PROVEN — either a DRIVEN scenario with its own per-step recording (operator
# ruling 2026-09-24, ADR 035 + Amendment 1) replayed through the World, or a
# capability proven no-network by one of this module's PURE `*.test.ts` (which
# Amendment 1 keeps). Only a capability NO test can honestly prove here is
# `@todo`, with its one-line blocker. One composable is booted: `usePersonalDetails`
# under `client_personal_details` — it serves both the profile read and the editor.
#
# Which test proves each non-driven capability:
#   - client-personal-details.mappers.test.ts — AC-32, AC-33, AC-48, AC-49, AC-59.
#   - client-personal-details.surface.test.ts — AC-44, AC-55, AC-56, AC-57.
#   - client-personal-details.scenario-contract.test.ts — AC-60.
#   - client-personal-details.drop-receipt-contract.test.ts — AC-61.
#   - client-personal-details.docs-contract.test.ts — AC-62.
#   - client-personal-details.playground-admin-removed.test.ts — AC-60, AC-61.
# Capabilities that belong to OTHER modules (token/transport/auth identity) are
# not scenarios here at all — see DECISIONS "moved" (query / session-store / auth).
#
# Four facts are NOT capabilities (ADR 035 Amendment 1) and carry no scenario:
# the whole-set custom-field projection (was AC-63) is proven by
# client-personal-details.mappers.test.ts over `mapProfileFields`; the brand
# language list (was AC-34, a surface/lookup fact), the own-cache invalidation
# (was AC-52, a request-count fact), and the out-of-schema strip on load
# (was AC-53, a parse/schema absence) live at the service seam, not a scenario —
# see DECISIONS.md.
#
# There is exactly ONE live cell — client x self (ADR-001). The scope matrix sets
# SELF / STAFF / GUEST to `null as never`, so staff and guest resolve to no
# context to act through. The oracle-exhibited staff-acting-for-a-client profile
# surface is a recorded, tracked drop — not described here as a capability this
# module has, because it does not.

@module:client-personal-details @variant:hybrid @cell:client-self
Feature: A client reads and manages their own personal details, including their custom field values

  A client has exactly one profile: their own name, public name, language, and
  custom field values. They read it and they edit it. Both acts are on that
  client's own profile, under that client's own identity, and never on another's.

  # === REFUSED WITHOUT AN AUTHENTICATED CLIENT (signed-out, top-level) ========
  # A @signed-out guard boots the guest floor with no Background: it must resolve
  # unavailable and read nothing. The replay arms no recording for it, so any
  # request it makes is an unmatched request the replay wall fails it by name on.

  @AC-41 @AC-54 @read @manager @guard @signed-out
  Scenario: My profile is not readable without an authenticated client session
    Given there is no authenticated client session for my profile
    When my profile is read while signed out
    Then my profile reports itself unavailable
    And no request is made against any profile resource

  # Driven: the manager now settles isReady false and update raises a
  # NotAuthenticatedError when signed-out (module fix, FE-3145), so the editor guard
  # is a clean unavailable state. The @signed-out tag seeds the guest floor and arms
  # no recording; the replay wall proves no profile request escapes.
  @AC-42 @manager @guard @signed-out
  Scenario: My profile editor is inert without an authenticated client session
    Given I open my profile editor without an authenticated client session
    When I try to use my profile editor while signed out
    Then my profile editor reports itself unavailable

  Rule: A signed-in client reads and manages their own profile

    Background:
      Given I am an authenticated client with my own profile

  # === READING MY PROFILE ======================================================

  @AC-30 @read
  Scenario: My profile shows my actual custom field values
    When I read my profile
    Then my profile is available to me
    And my profile reports no failure

  # The profile read is issued for real, its response forced to a 500 (Generator
  # forceStatus — a control response), so the read half settles errored on a
  # genuine request the recording overrides.
  @AC-31 @AC-40 @read @manager @errored
  Scenario: I am told when my profile fails to load, and I am never left waiting
    When I inspect my profile after its load has failed
    Then my profile reports that it failed to load

  @AC-32 @read
  Scenario: Each of my profile fields correctly tells me whether it's read-only for me
    When I view my profile fields
    Then a read-only field reports as read-only and the others do not

  @AC-33 @AC-48 @read @manager
  Scenario: My language is tracked by which language it is, and only changes when I change it
    When I view and then save my profile unchanged
    Then the language I hold is still that same language

  @AC-35 @read
  Scenario: If my current language isn't offered any more, I still see it, just not selectable
    When I view my profile's language choices
    Then my current language still appears, shown but not selectable

  # === MANAGING MY PROFILE — THE JTBD'S OWN VERB ===============================

  @AC-43 @manager
  Scenario: I can open my profile editor without passing it anything
    When I open my profile editor with no arguments
    Then my profile editor reaches a settled, ready state

  @AC-44 @manager @public-surface
  Scenario: Any problem with my profile is shown to me in my own language
    When my profile editor reports an error to me
    Then it is shown in my own language

  @AC-45 @manager
  Scenario: Saving my profile only sends what I actually changed
    Given I have opened my profile in the editor
    When I change only my first name and save
    Then my profile editor saves without failure

  @AC-46 @AC-47 @manager
  Scenario: Clearing a value on my profile actually clears it
    Given I have opened my profile in the editor
    When I clear one of my custom fields and save
    Then my profile editor saves without failure

  @AC-49 @manager
  Scenario: Saving my profile only ever touches the fields that are mine to change
    When I save every field available to me in my profile editor
    Then only the fields that are mine to change are sent

  @AC-50 @manager
  Scenario: I can discard my edits and get back exactly what I started with
    Given I have opened my profile in the editor
    And I have made two changes to my profile in the editor
    When I discard my edits
    Then my profile editor is no longer reported as changed

  # Driven: the generator arranges a REQUIRED client custom-field (admin), records
  # the boot against it, deletes it. With that field required and empty the editor
  # refuses the save client-side; the replay wall proves no PUT escapes. NOTE: the
  # admin create is a shared-brand mutation the sandbox refuses when an AGENT runs
  # the generator, so the OPERATOR runs `pnpm fixtures:generate client-personal-details`
  # to produce this scenario's recording (recorder + steps are authored and ready).
  @AC-51 @manager
  Scenario: Saving is refused before anything is sent when a required custom field is left empty
    When I clear a required custom field and try to save
    Then the save is refused before any request is made

  @AC-55 @manager @public-surface
  Scenario: A consumer referring to my profile's types by name gets exactly the type they expect
    When a consumer imports this module's profile types by name
    Then they resolve to exactly this module's types

  @AC-56 @manager @public-surface
  Scenario: Nothing in this module's own documentation talks about a different part of the account
    When this module's own documentation is read
    Then it describes this module's own profile capability only

  @AC-57 @manager @public-surface @negative-control
  Scenario: Only what this module curates is reachable, and only for a client on their own profile
    When something outside the module tries to reach its internal machinery
    Then none of it is offered — no internal machinery, no way to become another actor

  @AC-59 @manager
  Scenario: My saved custom field values are computed the very same way everywhere
    When my custom field values are prepared for saving
    Then they are computed exactly as the custom field values module computes them

  # === CONSUMERS AND DOCUMENTATION =============================================

  @AC-60 @module
  Scenario: The pages that show and edit my profile still work end to end
    When I make an edit on the editing page and apply it
    Then I am returned to a profile page that shows the updated values

  @AC-61 @module @negative-control
  Scenario: Nowhere in the app can staff view their own profile while it claims to be someone else's
    When a staff user navigates to what used to be the admin profile pages for a client
    Then they are never shown their own profile presented as if it were that client's

  @AC-62 @module
  Scenario: "custom field" and "personal details" are documented consistently
    When the glossary and the module documentation are read
    Then each term resolves to one documented referent, and the documented save shape matches reality
