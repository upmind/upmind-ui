# client-personal-details — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT: this file lives at
#   packages/headless/src/modules/client-personal-details/__tests__/client-personal-details.feature
# This co-located copy is the SINGLE SOURCE OF TRUTH — there is no docs/sdd/ copy and none is
# planned. docs/sdd/ is gitignored, so a traceability assertion against it cannot pass in CI
# (see the module's own traceability test for the CI-safe shape this drives).
#
# Two composables, one resolving cell each (client x self — ADR-001; cited, not restated):
#   - the PROFILE read half, a real query
#   - the PROFILE editor half, a dataManagerMachine-backed manager
# Both consume client-custom-fields' published contract for value semantics rather than
# re-deriving it. There is no staff cell delivered by this module. The oracle-exhibited
# staff-acting-for-a-client profile surface (thirteen distinct capabilities) is a recorded,
# tracked drop — not described here as capability this module has, because it does not.

@module:client-personal-details @variant:hybrid @cell:client-self
Feature: A client reads and manages their own personal details, including their custom field values

  A client has exactly one profile: their own name, public name, language, and custom field
  values. They read it and they edit it. Both acts are on that client's own profile, under that
  client's own identity, and never on another client's.

  Background:
    Given I am an authenticated client with my own profile
    And every request I make about my profile is addressed to my own profile

  # === READING MY PROFILE ======================================================

  @AC-30 @read
  Scenario: My profile shows my actual custom field values, not a placeholder
    Given I hold values against some of my custom fields
    When I read my profile
    Then those values are shown to me as they actually are
    And they are not the placeholder word "undefined"

  @AC-30 @read @negative-control
  Scenario: Reading and saving my profile always address the very same profile, and no one else's
    Given I open my profile
    When I read it and later save a change to it
    Then both the read and the save address exactly the same profile
    And nothing outside this module can retarget either to a different client

  @AC-63 @read
  Scenario: My profile shows a row for every one of my brand's custom fields, even ones I've never answered
    Given my brand offers custom fields I hold no value for
    When I read my profile
    Then every one of those fields still appears in my profile, alongside my native fields
    And each shows its type's own empty value rather than being left out entirely

  @AC-31 @read
  Scenario: I can tell when my profile failed to load, and I'm never left waiting forever
    Given loading my profile fails
    When I wait for it to be ready
    Then I am told it is not ready, with the failure visible to me
    And I am not left waiting indefinitely

  @AC-32 @read
  Scenario: Each of my profile fields correctly tells me whether it's read-only for me
    Given one of my custom fields is marked read-only for a client and another is not
    When I view my profile fields
    Then the read-only field reports as read-only and the other does not
    And my native fields report the permission state they actually have, not a fixed one

  @AC-33 @read
  Scenario: My selected language is tracked by its identity, not by its display name
    Given my profile's language is set to a particular language
    When I view and then save my profile unchanged
    Then the language I hold is still that same language
    And what I see displayed is its name, while what is held and round-tripped is its identity

  @AC-34 @read
  Scenario: The languages I can choose from are the ones my own brand offers
    Given my own brand offers a different set of languages than whatever brand the app currently has selected
    When I view my profile's language choices
    Then I am offered my own brand's languages

  @AC-35 @read
  Scenario: If my current language isn't offered any more, I still see it, just not selectable
    Given my profile's language is no longer in my brand's offered list
    When I view my profile's language choices
    Then my current language still appears, shown but not selectable
    And it is not silently blanked out

  @AC-41 @read
  Scenario: Opening my profile before I'm fully signed in still loads the right profile once I am
    Given I open my profile before my session has finished resolving
    When my session finishes resolving
    Then my profile loads for the profile that turned out to be mine
    And no request was ever made without knowing whose profile it was for

  # === MANAGING MY PROFILE — THE JTBD'S OWN VERB ===============================

  @AC-40 @manager
  Scenario: My editor never sits waiting forever while it doesn't yet know my custom field definitions
    Given loading my custom field definitions fails
    When I wait for my profile editor to be ready
    Then it settles rather than staying stuck loading
    And it tells me it is not ready, rather than hanging indefinitely

  @AC-42 @manager
  Scenario: A failed sign-in check never leaves an unexplained error, and my editor stops acting once I'm done with it
    Given my session fails to resolve while my editor is waiting on it
    When I check whether my editor is ready
    Then I am told it is not ready, with nothing left unexplained
    And after I discard my editor, a session resolving late causes no further action

  @AC-43 @manager
  Scenario: I can open my profile editor without passing it anything
    When I open my profile editor with no arguments
    Then it constructs successfully and reaches a settled state

  @AC-44 @manager
  Scenario: An error I see from my profile editor is still shown in my own language
    Given my profile editor reports an error to me
    When I read that error
    Then it is shown in my own language, the same as any other message in the module

  @AC-45 @manager
  Scenario: Saving my profile only sends what I actually changed, and sends nothing when nothing changed
    Given I have opened my profile in the editor
    When I change only one field and save
    Then only that one field is sent
    And when I save without having changed anything, nothing is sent at all, and it succeeds

  @AC-46 @manager
  Scenario: Clearing one of my custom field values on my profile actually clears it
    Given one of my custom fields currently holds a value
    When I clear that field and save
    Then the save explicitly carries that field as cleared
    And it is not simply left out of what was sent

  @AC-47 @manager
  Scenario: Clearing my name, or switching a toggle off, or setting a number to zero, is saved as I set it
    Given I set a text field to empty, a toggle to off, and a number to zero
    When I save my profile
    Then all three of those changes are sent
    And none of them is silently dropped for looking empty

  @AC-48 @manager
  Scenario: My document language only changes when I actually change my interface language
    Given I have opened my profile in the editor
    When I change only my first name and save
    Then no document-language change is sent
    And when I do change my interface language and save, my document language changes to match

  @AC-49 @manager
  Scenario: Saving my profile only ever touches the fields that are mine to change
    When I save every field available to me in my profile editor
    Then only the fields that are mine to change are sent
    And none of the fields that belong only to staff appear in what was sent

  @AC-50 @manager
  Scenario: I can discard my edits and get back exactly what I started with
    Given I have made two changes to my profile in the editor
    When I discard my edits
    Then my profile in the editor is exactly what it was before I started
    And it is no longer reported as changed

  @AC-51 @manager
  Scenario: Saving is refused before anything is sent when a required custom field is left empty
    Given a required custom field on my profile is left empty
    When I try to save
    Then the save is refused before any request is made
    And I am told which field is the problem and why

  @AC-52 @manager
  Scenario: Saving my profile refreshes my own profile only
    Given I have just saved a change to my profile
    When that save completes
    Then my own profile is refreshed
    And nothing else in the app is refreshed as a result

  @AC-53 @manager
  Scenario: Anything that doesn't belong in my profile form never quietly appears in it
    Given something outside my profile's own fields ends up in what gets loaded into the editor
    When I open my profile editor
    Then that extra piece is stripped before I see it

  @AC-54 @manager
  Scenario: My editor starts loading the moment it knows which profile is mine
    Given my editor does not yet know which profile is mine
    When it learns which profile is mine
    Then it moves on to loading right away, and for that reason alone

  @AC-55 @manager @public-surface
  Scenario: A consumer referring to my profile's types by name gets exactly the type they expect
    Given a consumer imports this module's profile types by name
    When they use those names to annotate their own code
    Then they resolve to exactly this module's types, with no collision and no shadowing

  @AC-56 @manager @public-surface
  Scenario: Nothing in this module's own documentation talks about a different part of the account
    When this module's own documentation is read
    Then it describes this module's own profile capability
    And nothing in it describes phone numbers, addresses, or a shopping basket

  @AC-57 @manager @public-surface @negative-control
  Scenario: Only what this module curates is reachable, and only for a client acting on their own profile
    Given the module's published surface is the only way anything outside it can act
    When something outside the module tries to reach its internal machinery directly, act as staff, or act on behalf of a different client
    Then none of those are offered by the module — the internal machinery is not reachable, and no affordance exists to become another actor or to name another client
    And the client acting on their own profile continues to work exactly as before

  @AC-59 @manager
  Scenario: My saved custom field values are computed the very same way everywhere they're computed
    Given I make the same mixed edit to my custom field values
    When that edit is prepared for saving through my profile editor and, separately, through the custom field values module directly
    Then both produce exactly the same result

  # === CONSUMERS AND DOCUMENTATION =============================================

  @AC-60 @module
  Scenario: The pages that show and edit my profile still work end to end
    Given I open the page that shows my profile and the page that edits it
    When I make an edit on the editing page and apply it
    Then the change is saved
    And I am returned to a profile page that shows the updated values

  @AC-61 @module @negative-control
  Scenario: Nowhere in the app can staff end up viewing their own profile while it claims to be someone else's
    Given a staff user navigates to what used to be the admin profile pages for a client
    When they arrive there
    Then they are never shown their own profile presented as if it were that client's
    And that outcome is achieved by the page being absent, or by an explicit not-supported notice

  @AC-62 @module
  Scenario: "custom field" and "personal details" are documented consistently, and the written request shape matches reality
    When the glossary and the module documentation are read
    Then "custom field" and "personal details" (with "profile" as an alias) each resolve to one documented term
    And the documented shape of what gets sent when saving matches what is actually sent — a set keyed by field, never a list
