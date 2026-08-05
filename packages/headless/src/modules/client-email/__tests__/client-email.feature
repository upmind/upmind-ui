# client-email — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT (operator ruling 2026-08-05): this file lives at
#   packages/headless/src/modules/client-email/__tests__/client-email.feature
# The copy in docs/sdd/client-email/ is the planner's source; the co-located copy
# is what client-email.traceability.test.ts reads and what the @AC link is
# enforced against, both ways.
#
# NON-EXECUTABLE per ADR-020 (".feature files are spec-only, not executable").
# No runner touches it and no steps file is produced — the colocated unit and
# integration specs are the tests that run, each anchored to a scenario by its
# @AC tag.
#
# One scenario per capability the parity table carries, INCLUDING every manager
# behaviour (load-one, readiness, input/validate, save-edit, save-draft,
# schema-via-context, clear, isolated drafts, state flags, refresh-the-list,
# lifecycle). Business language only — the wire-level read-backs that PROVE each
# scenario (URL retarget, token, headers) live in requirements.md / parity.yaml.
#
# Actors: a client manages their OWN email addresses. There is no staff cell and
# no guest cell in this module — staff capabilities the oracle reveals are
# recorded drops (parity.yaml R27-R33, operator scope ruling 2026-08-05), and an
# email address belongs to a client record, so a guest is neither a client nor
# acting for one.

@module:client-email @variant:hybrid @cell:client-self
Feature: A client manages their own email addresses

  A client holds one or more email addresses — one marked default, each
  independently verifiable. Two surfaces serve them: a COLLECTION they read and
  act on row by row, and a per-email FORM EDITOR they open to add or change an
  address. Both act on that client's own addresses, under that client's own
  identity, and never on another account's.

  Background:
    Given I am an authenticated client managing my own account
    And every request I make is addressed to my own email collection as that client

  # === THE COLLECTION ========================================================

  @AC-1 @collection
  Scenario: List my own email addresses
    When I open my email addresses
    Then I see the reactive list of my own email addresses
    And no other client's addresses are ever loaded

  @AC-2 @collection
  Scenario: See the details and status of each of my addresses
    Given one of my addresses is my default, unverified, and has bounced
    When I view my email addresses
    Then that address is shown as default, unverified, and bounced, with when it bounced
    And each address carries its display title, description, and account-email type
    And an address the server marks non-deletable is shown as non-deletable

  # Two scenarios, one AC: the state of the list itself, and whether the list is
  # mine to read at all (restored 2026-08-05 on the verifier finding, D-16).

  @AC-3 @collection
  Scenario: Know whether my list is loading, empty, or errored, and wait for it
    When I open my email addresses
    Then I can see whether the list is loading, empty, or errored
    And I can wait for the list to be ready before reading it

  @AC-3 @collection @guard
  Scenario: Know whether my email collection is mine to read at all
    Given I am signed in as a client
    When I look at my email collection
    Then it tells me the collection is available to me
    And before I am signed in it tells me the collection is not available, while still
      telling me it is loading
    And the moment my session goes away it tells me the collection is no longer available
    And I never have to inspect the session myself to learn any of this

  @AC-4 @collection
  Scenario: Delete a deletable email address
    Given I have an email address the server allows me to delete
    When I delete that address
    Then the address is removed from my collection
    And it no longer appears in my list

  @AC-5 @collection
  Scenario: Set a verified address as my default
    Given I have a verified email address that is not my default
    When I make that address my default
    Then that address becomes my default
    And my previous default is no longer the default

  @AC-6 @collection
  Scenario: Resend the verification email for an unverified address
    Given I have an unverified email address
    When I request a fresh verification email for it
    Then a verification email is sent for that address

  @AC-7 @collection
  Scenario: Adding an address I already have does not duplicate it
    Given "a@b.com" is already one of my addresses
    When I add "a@b.com" again
    Then I get back my existing address
    And no new address is created

  # Two scenarios, one AC: fetching all of them is the DEFAULT, and paging is
  # what I get only when I ask for it (operator ruling 2026-08-05, D-14).

  @AC-8 @collection
  Scenario: Refresh and filter my addresses, and get all of them at once
    Given I have not asked for my addresses a page at a time
    When I open my email addresses
    Then I am given all of my addresses at once, as a single page
    And asking for a next or a previous page tells me there is no other page to go to
    And refreshing or filtering the list re-reads it and reflects what I asked for
    And invalidating the list makes the next read fetch it again

  @AC-8 @collection
  Scenario: Page through my addresses when I ask for them a page at a time
    Given I ask for my addresses a page at a time
    And I have more addresses than fit one page
    When I ask for the next page
    Then I am given the next page of my addresses
    And asking for the previous page brings me back to the first

  @AC-9 @collection
  Scenario: Discarding a collection releases it
    Given I have opened my email collection
    When I destroy that collection
    Then it is released
    And opening my email addresses again gives me a fresh collection

  @AC-10 @collection @guard
  Scenario: Nothing touches a client's emails without an authenticated client session
    Given there is no authenticated client session
    When my client-email collection is used
    Then no request is made against any client's email resource
    And any forced read or mutation is rejected as not-authenticated

  # === THE PER-EMAIL EDITOR ==================================================
  # Every scenario below was inside the single "manager" drop row the 2026-08-05
  # run built from. They are client x self capabilities, not variant artifacts.

  @AC-11 @manager
  Scenario: Open one of my email addresses for editing
    Given I have an existing email address
    When I open that address in the editor
    Then the form is populated with that address
    And the editor knows which of my addresses it is editing

  @AC-12 @manager
  Scenario: Wait for the editor to be ready
    When I open the editor
    Then I can wait until it is ready to accept my input
    And it never sends a request before it knows whose address it is editing

  @AC-13 @manager
  Scenario Outline: Type an address and see whether it is acceptable
    When I type "<address>" into the editor
    Then the editor reports the address as "<outcome>"
    And when it is rejected I can read which field is wrong and why

    Examples:
      | address      | outcome  |
      |              | rejected |
      | not-an-email | rejected |
      | a@b.com      | accepted |

  @AC-14 @manager
  Scenario: Save a change to one of my addresses
    Given I have opened one of my addresses in the editor
    When I change it to a new address and save
    Then my address reflects the new value
    And changing the address re-marks it as unverified

  @AC-15 @manager
  Scenario: Save a brand-new address
    Given I have started a new email address in the editor
    When I enter an address and save
    Then the new address is created on my own collection
    And an address I already hold is returned to me instead of being duplicated

  @AC-16 @manager
  Scenario: The editor tells me how to render its form
    When I open the editor
    Then the editor gives me the form's schema and its matching UI definition
    And the module offers no other way to obtain them

  @AC-17 @manager
  Scenario: Clear the form
    Given I have typed a change into the editor
    When I clear the form
    Then the form returns to its starting state
    And it is no longer reported as changed

  @AC-18 @manager
  Scenario: Two new-address forms do not interfere
    Given I have started two new email addresses at the same time
    When I type into the first
    Then the second is untouched

  @AC-19 @manager
  Scenario: See the editor's state while I work
    When I open the editor and type into it
    Then I can see whether it is loading, ready, changed, valid, saving, or finished
    And whether the address I am editing is a brand-new one

  @AC-20 @manager @collection
  Scenario: Saving in the editor updates my list
    Given my email addresses are open in one place and the editor in another
    When I save a change in the editor
    Then my list of addresses shows the saved value

  @AC-21 @manager
  Scenario: Discarding an editor releases it
    Given I have opened the editor
    When I stop it, it stops working but is still there
    And when I destroy it, it is released and opening that address again gives me a fresh editor

  # === WHOLE-MODULE GUARANTEES ==============================================

  @AC-22 @module
  Scenario: Problems are reported to me, never announced by the module
    Given something goes wrong while I read or save an address
    When I inspect the collection or the editor
    Then I can read what went wrong, and which field caused it
    And the module itself raises no message, toast or notification on my behalf

  @AC-23 @module @fe-2824 @negative-control
  Scenario: The addresses I act on are the ones my scope named — not whoever is logged in
    Given every request resolves its target client from the scope I opened
    When that resolution is broken so it instead uses some other client
    Then every read and every save in this module turns red
    And restoring the resolution returns them green

  @AC-24 @module @public-surface @negative-control
  Scenario: The module offers both surfaces and every consumer keeps compiling
    Given consumers depend on the collection AND the per-email editor
    When the module is built
    Then both are offered, with every type a consumer imports
    And removing the editor from what the module offers turns this red
    And every dependent module still compiles with no new error
