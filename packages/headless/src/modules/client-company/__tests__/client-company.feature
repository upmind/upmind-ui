# client-company — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATED COPY, authored by the PROVER seat in its own dispatch (agent-seat-
# separation.md — code-author != assertion-author) from the planner's
# bundle-side source at
#   docs/story-bundles/client-company/client-company.feature
#
# THIS IS AN AUTHORING PASS, NOT A BYTE-IDENTICAL COPY. The dispatching
# orchestrator instructed this run specifically to re-express any bundle
# scenario stated at SDD altitude at MODULE-BEHAVIOUR altitude, with concrete
# Given/When/Then a sibling test can actually anchor to, while carrying every
# @AC-1..@AC-29 tag across 1:1. client-company.traceability.test.ts (Tests
# stage, a separate dispatch) enforces the TAG SET match against the bundle
# source, not literal scenario text — "the feature gains the scenario,
# coverage never falls" (client-email.traceability.test.ts precedent). No @AC
# tag is dropped, renamed or renumbered relative to the bundle source.
#
# client-company.traceability.test.ts's SDD_FEATURE constant must point at
#   docs/story-bundles/client-company/client-company.feature
# and NOT at docs/sdd/, which is a tracked-but-broken symlink in this repo (the
# sibling bundle's recorded incident).
#
# NON-EXECUTABLE per ADR-020 (".feature files are spec-only, not executable").
# No runner touches it and no steps file is produced — the colocated unit and
# integration specs are the tests that run, each anchored to a scenario by its
# @AC tag.
#
# Scope: ONE ADR-001 cell — client x self — by operator ruling R1 (2026-08-08,
# review-notes.md #1). Every cell the oracle serves and this module does not is
# dispositioned in parity.yaml (C38-C42); none is silently absent. STAFF and
# GUEST are `null as never` in both scope matrices, so no staff/guest scenario
# exists here to accidentally imply an advertised-but-absent capability.
#
# @AC-25 / @AC-26 / @AC-27 / @AC-28 / @AC-29 are negative-control scenarios.
# Each one's *.must-fail.patch is authored by the DEVELOPER seat, who alone
# knows the exact source line to mutate, and is applied BLIND, confirmed RED,
# and reverted by the prover — never hand-authored by a seat that read module
# source (agent-seat-separation.companion.md, "must-fail patches — who authors
# them"). This dispatch read no implementation file under
# packages/headless/src/modules/client-company/ to write this feature.

@module:client-company @variant:hybrid @cell:client-self
Feature: A client manages the companies on their own account

  A client's companies are the billable business entities on their account —
  name, registration number, tax number, and a linked address, email and
  phone. They drive checkout billing, invoicing and the client's own profile.
  Two surfaces serve them: a COLLECTION the client browses, searches, pages
  and mutates, and a FORM EDITOR they open on one company at a time. Both act
  on that client's own companies, under that client's own identity, and never
  another account's.

  Background:
    Given I am an authenticated client acting on my own account
    And every request I make is addressed to my own companies as that client

  # === THE COLLECTION ========================================================

  @AC-1 @collection
  Scenario: See the companies on my own account
    When I open my companies
    Then I see the reactive list of companies on my account
    And companies still being imported for me are included
    And no other client's companies are ever loaded

  @AC-2 @collection
  Scenario: See what each company is
    When I view my companies
    Then each company shows its name, registration number and tax number
    And each company shows the address it bills from
    And each company shows whether it is verified and whether it can be deleted
    And each company shows whether its tax number has been validated — but only
      where my brand has tax-number validation switched on

  @AC-3 @collection
  Scenario: Know which company is my default
    When I view my companies
    Then the company I have set as my default is identified to me
    And when I have no default company, I am told that plainly rather than shown
      an arbitrary one

  @AC-4 @collection
  Scenario: Know whether my companies are loading, empty, or errored, and wait for them
    When I open my companies
    Then I can see whether they are loading, empty, or errored
    And I can wait for them to be ready before reading them
    And that wait always finishes — it never leaves me waiting forever

  @AC-5 @collection @guard
  Scenario: Know whether my companies are mine to read at all
    Given I am signed in as a client
    When I look at my companies
    Then it tells me they are available to me
    And before I am signed in it tells me they are not available, while still
      telling me they are loading
    And that availability flag is the very same signal my companies' own
      loading gate uses internally, not a second opinion of it
    And I never have to inspect the session myself to learn any of this

  @AC-6 @collection
  Scenario: Look up a company I have already loaded
    Given I have opened my companies
    When I look up one of them by its id, or search the ones I hold for a match
    Then I am given that company
    And asking for one I do not have tells me so rather than failing
    And none of this goes back to the server

  @AC-7 @collection
  Scenario: Search my companies
    When I search my companies for a word
    Then only companies matching that word are returned
    And when I clear the search, all my companies come back

  @AC-8 @collection
  Scenario: See my companies in a stable order
    Given I have more than one company
    When I open my companies
    Then they are always listed oldest first
    And that order is the same every time I open them, regardless of the order
      the server happens to return them in

  @AC-9 @collection
  Scenario: Page through my companies
    Given I have more companies than fit on one page
    When I open my companies
    Then I am given the first page, and told which page I am on and how many there are
    And asking for the next page gives me the next page
    And asking for the previous page brings me back
    And I am told when there is no further page to go to

  @AC-10 @collection @mutation
  Scenario: Delete one of my companies
    Given I have opened my companies
    When I delete one of them
    Then that company is removed from my account
    And my list of companies no longer contains it
    And the delete is addressed to my own account, never to an unresolved one

  @AC-11 @collection @mutation
  Scenario: Make one of my companies the default
    Given I have opened my companies
    When I set one of them as my default
    Then that company becomes my default company
    And my list reflects the change without me reopening it

  @AC-12 @collection
  Scenario: Refresh my companies
    Given I have opened my companies
    When I refresh them
    Then they are re-read from the server
    And invalidating them makes the next read fetch them again
    And refreshing without a signed-in client is refused, and reads nothing

  @AC-13 @collection @lifecycle
  Scenario: Discarding a companies collection releases it
    Given I have opened my companies
    When I destroy that collection
    Then it is released, and nothing is left holding it open
    And opening my companies again gives me a fresh collection, not the one I released

  # === THE FORM EDITOR =======================================================
  # Its own scenarios, not the collection's footnote: a separately exported
  # capability with its own consumers and its own lifecycle (design.md D1).

  @AC-14 @manager
  Scenario: Open one of my companies to edit
    Given a company on my account
    When I open it for editing
    Then I am shown that company's current details
    And I am given the form and the layout needed to edit it

  @AC-15 @manager
  Scenario: Start a new company
    When I start adding a company
    Then I am given an empty form to complete, marked as new
    And if I start a second one at the same time, the two do not interfere with
      each other

  @AC-16 @manager
  Scenario: The form knows what I already have on file
    When I open the company form
    Then it offers me the addresses, emails and phone numbers already on my account
    And it offers me the countries I can pick from
    And it starts with my default address, email and phone already selected
    And it respects whether my brand requires a region in an address

  @AC-17 @manager
  Scenario: Choosing a country re-offers the right regions
    Given I am completing a company address
    When I change the country
    Then I am offered the regions of the country I chose
    And a region I had picked that does not belong to the new country is cleared
      rather than silently kept

  @AC-18 @manager
  Scenario: The form tells me what is wrong before it saves
    Given I am completing a company form
    When I leave the company name empty
    Then I am told the name is required
    And trying to save sends nothing to the server
    And providing the name tells me the form is now valid
    And where I have picked an existing address, the form asks me for that choice
      rather than for a whole new address, and the reverse when I have not

  @AC-19 @manager @mutation
  Scenario Outline: Save a company
    Given I am editing a company that is "<state>"
    When I save it
    Then the company is "<outcome>" on my account
    And only what I actually changed is sent to the server

    Examples:
      | state     | outcome |
      | brand new | created |
      | existing  | updated |

  @AC-20 @manager
  Scenario: Choose which address, email and phone my company uses
    Given I am editing a company
    When I pick one of my existing addresses, emails or phone numbers for it
    Then the company is saved against the ones I picked, and no duplicates are created
    And when I supply a brand-new one inline instead, it is created for me first and
      the company is saved against it

  @AC-21 @manager
  Scenario: See which company I am editing
    When I open a company for editing
    Then the form is titled with that company's name
    And it summarises the company, including its registration number and tax number
    And a brand-new company is titled as new rather than left blank

  @AC-22 @manager
  Scenario: Know what the form is doing, and wait for it
    When I open a company form
    Then I can see whether it is loading, valid, changed, saving, or finished
    And I can wait for it to be ready before using it
    And that wait always finishes — including when I turn out not to be signed in,
      where it finishes by telling me it is not ready rather than waiting forever

  @AC-23 @manager
  Scenario: Be told when a save fails
    Given I am editing a company
    When the save is rejected
    Then I can read what went wrong
    And what I am told is about my company, not about some other part of my account

  @AC-24 @manager @lifecycle
  Scenario: Discarding a company form releases it
    Given I have opened a company for editing
    When I destroy that form
    Then it is released, and nothing is left holding it open
    And opening that company again gives me a fresh form, not the one I released

  # === WHOLE-MODULE GUARANTEES ==============================================

  @AC-25 @module @guard @negative-control
  Scenario: Nothing touches a company without an authenticated client session
    Given there is no authenticated client session
    When either my companies or a company form is used, forced or not
    Then no request is made against any company resource
    And any forced read or write is refused as not-authenticated
    And removing that protection from any surface — the list, any mutation, or the
      form editor — turns this scenario red

  @AC-26 @module @guard @negative-control
  Scenario: No destructive request escapes without a signed-in client
    Given there is no signed-in client to act for
    When a delete or a set-default is forced
    Then it is refused as not-authenticated
    And no request is sent at all
    And no request URL that is ever observed anywhere contains the literal text
      "clients/undefined/" — the exact shape a check that lets an unauthenticated,
      client-less session through would produce
    And inverting that check so it lets those through turns this scenario red

  @AC-27 @module @fe-2824 @negative-control
  Scenario: The account I act on is the one my scope resolved
    Given every request resolves whose companies it is acting on from the scope I opened
    When a caller tries to name a different account through an option
    Then neither surface offers a "clientId" option, or any alias of it, to a caller —
      not on the collection and not on the form editor
    And every request and every cached result still belongs to my own account
    And re-introducing that option, even for internal use only, turns this scenario red

  @AC-28 @module @public-surface @negative-control
  Scenario: The module offers both surfaces and every consumer keeps compiling
    Given consumers depend on my companies, on editing one, and on composing the
      company form into a larger form
    When the module is built
    Then all three are offered, with every name a consumer imports today
    And every dependent module still compiles with no new error
    And removing the company form from what a larger form can compose turns this
      scenario red

  @AC-29 @module @negative-control
  Scenario: Problems are reported to me, never announced by the module
    Given something goes wrong while I read or change my companies
    When I inspect either surface
    Then I can read what went wrong
    And the module itself raises no message, toast or notification on my behalf
    And the surface I am using is the thing that tells me
    And putting that announcement back into the module turns this scenario red
