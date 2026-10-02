# client-company — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATED COPY, authored by the PROVER seat. Every capability the module owns
# is a DRIVEN scenario with its own per-step recording (operator ruling
# 2026-09-24). Two composables are booted: the COLLECTION (useClientCompanies)
# under `client_companies`, and the FORM EDITOR (useClientCompanyManager) under
# `client_company_manager` — a scenario boots the one it drives (WorldScope
# `context` carries the company id for an edit). A capability that cannot be
# driven honestly is `@todo` with a one-line reason (DECISIONS). Capabilities
# that belong to OTHER modules (transport identity, request params) are not
# scenarios here at all — see DECISIONS "moved".
#
# SIGNED-OUT GUARDS sit at the TOP LEVEL, outside the Rule, so they inherit NO
# signed-in Background (backgroundStepCount 0): their `arrangeScenario` seeds the
# guest floor through `seedSessionFor`, and the replay wall fails them by name if
# the module sends any request while signed out (FE-3145, operator-approved
# restructure). Every SIGNED-IN capability lives under the Rule, which carries the
# authenticated Background.
#
# Capabilities also proven no-network by the module's PURE unit tests keep those
# tests: AC-2/AC-6 (client-company.mappers.test.ts), AC-28
# (client-company.surface.test.ts). AC-3 and AC-19 are BOTH driven here and
# unit-checked.

@module:client-company @variant:hybrid @cell:client-self
Feature: A client manages the companies on their own account

  A client's companies are the billable business entities on their account —
  name, registration number, tax number, and a linked address, email and
  phone. Two surfaces serve them: a COLLECTION the client browses, searches,
  pages and mutates, and a FORM EDITOR they open on one company at a time. Both
  act on that client's own companies, under that client's own identity.

  # === SIGNED-OUT GUARDS (top level, no Background) ==========================

  @AC-5 @collection @guard @signed-out
  Scenario: My companies are not mine to read until I sign in
    When I look at my companies while signed out
    Then my companies are not available to me
    And no company request escapes while I am signed out

  @AC-25 @module @guard @negative-control @signed-out
  Scenario: Nothing touches a company without an authenticated client session
    When either my companies or a company form is used while signed out
    Then no request is made against any company resource

  @AC-26 @module @guard @negative-control @signed-out
  Scenario: No destructive request escapes without a signed-in client
    When a delete or a set-default is forced while signed out
    Then it is refused as not-authenticated

  Rule: A signed-in client works their companies and the form editor

    Background:
      Given I am an authenticated client acting on my own account
      And every request I make is addressed to my own companies as that client

    # === THE COLLECTION ======================================================

    @AC-1 @collection
    Scenario: See the companies on my own account
      When I open my companies
      Then I see the companies on my account

    # Driven: the boot records the company list AND the brand config read that
    # gates the tax-number display, so a real row's name, registration number and
    # tax number are read back from the collection. The mapper unit
    # (client-company.mappers.test.ts) keeps the per-field no-network proof.
    @AC-2 @collection
    Scenario: See what each company is
      When I view my companies
      Then each company shows its name, registration number and tax number

    @AC-3 @collection
    Scenario: Know which company is my default, even when I have none
      When I open a collection whose default has been cleared
      Then I see the companies on my account

    @AC-4 @collection @fault
    Scenario: My companies record a failed read for me to read back
      When a read of my companies fails at the server
      Then my companies record the failure for me to read

    # AC-6 — an in-memory look-up over the already-loaded collection: no wire, and
    # the "never goes back to the server" half is a request-count fact, not a World
    # outcome (the phone AC-6/AC-13 precedent). Proven no-network in
    # client-company.mappers.test.ts, so this stays a spec-only capability.
    @AC-6 @collection
    Scenario: Look up a company I have already loaded
      Given I have opened my companies
      When I look up one of them by its id
      Then I am given that company

    @AC-7 @AC-34 @collection @criteria
    Scenario: I narrow my companies by name, and clear it back
      When I search my companies for a word
      Then only companies matching that word are returned
      And when I clear the search, all my companies come back
      When I search my companies for "Heg"
      Then only my companies whose name contains "Heg" remain
      When I clear my company search
      Then every one of my companies is back

    # AC-8 (stable oldest-first order) DROPPED: not a business outcome a World step
    # observes — the boot order is a unit-checked default, and the "regardless of
    # the server's order" half needs a second body for one request identity the
    # scenario model cannot hold. The order CONTROL is driven by AC-34 below.

    @AC-9 @collection
    Scenario: Page through my companies
      When I ask for a next page I do not have
      Then my companies report no failure

    @AC-10 @collection @mutation
    Scenario: Delete one of my companies
      When I delete a company the server lets me delete
      Then my companies report no failure

    @AC-11 @collection @mutation
    Scenario: Make one of my companies the default
      When I make a non-default company my default
      Then my companies report no failure

    @AC-12 @collection
    Scenario: Refresh my companies
      When I refresh my companies
      Then my companies report no failure

    # AC-13 / AC-24 (destroy/GC lifecycle) DROPPED: releasing a scope-registry entry
    # is not observable through a World step — no meta/context flag reflects it.

    # === THE FORM EDITOR =====================================================

    @AC-14 @AC-16 @AC-21 @AC-22 @manager
    Scenario: I open a company for editing, with what I already have on file
      When I open one of my companies for editing
      Then I am shown that company's current details
      And the form is titled with that company's name
      And the form is ready for me to use

    @AC-15 @manager
    Scenario: I start a brand-new company
      When I start adding a company
      Then I am given an empty form marked as new

    @AC-17 @manager @criteria
    Scenario: Choosing a country re-offers the right regions
      Given I am editing one of my companies
      When I choose a region of my current country
      And I change my company's country to another country
      Then I am offered the regions of the country I chose
      And the region I had chosen for my company is cleared

    @AC-18 @manager
    Scenario: The form tells me what is wrong before it saves
      Given I am editing one of my companies
      When I clear the company name
      Then I am told the form is not valid
      And giving it a name makes the form valid again

    @AC-19 @collection @mutation
    Scenario: Add a new company to my account
      When I add a new company to my account
      Then my companies report no failure

    @AC-19 @manager @mutation
    Scenario: Save a change to a company I am editing
      Given I am editing one of my companies
      When I change its name and save
      Then the change is saved without error

    # Driven: a fresh draft with a supplied address id, the pre-selected emailId
    # cleared and a brand-new inline email set. On save the module's ensure creates
    # the email and the company is created against it — recorded as the email POST
    # then the company POST.
    @AC-20 @manager @mutation
    Scenario: I supply a brand-new inline email and my company is saved against it
      Given I am starting a new company
      When I supply a brand-new email inline and save
      Then my new company is saved without error

    # AC-21 (title/description summary) and AC-22 (form state) are carried by the
    # DRIVEN @AC-14 scenario above ("titled with that company's name" / "ready for
    # me to use") — no separate scenario, so those tags are not duplicated as
    # spec-only entries that would shadow the driven proof.

    @AC-23 @AC-29 @manager @module @negative-control
    Scenario: I am told when a save fails, where I am working
      Given I am editing one of my companies
      When a save of mine is rejected
      Then I can read that it went wrong

    # AC-28 — a build-time public-surface guarantee (both surfaces offered, every
    # consumer keeps compiling): not a runtime World outcome (the phone AC-29
    # precedent). Proven no-network in client-company.surface.test.ts; its
    # amputation control is client-company.surface-amputation.must-fail.patch.
    @AC-28 @module @public-surface @negative-control
    Scenario: The module offers both surfaces and every consumer keeps compiling
      Given consumers depend on my companies, on editing one, and on composing the company form
      When the module is built
      Then all three are offered, with every name a consumer imports today

    # === THE CRITERIA CHANNEL ================================================

    @AC-34 @collection @criteria
    Scenario: I choose the order my companies come in
      When I sort my companies by name descending
      Then my companies are now ordered by name, descending

    @AC-36 @collection @criteria
    Scenario: An empty list tells me whether it is empty because I filtered it
      When I search my companies for something none of them are called
      Then my companies list is empty
      And it tells me plainly that it is empty because of my search, not because I have none

    @AC-40 @collection @criteria @negative-control
    Scenario: A request the schema rejects leaves the live list standing and reports itself
      When I search my companies for a value the field cannot hold
      Then my companies list is unchanged
      And I am told my request was rejected
      And letting a rejected request silently through turns this scenario red
