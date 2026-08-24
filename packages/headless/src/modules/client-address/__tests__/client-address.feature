# client-address — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT, mirroring the client-email / client-phone /
# client-company precedent. The delivered copy lives at
#   packages/headless/src/modules/client-address/__tests__/client-address.feature
# and THAT copy is the single source of truth: it is what
# client-address.traceability.test.ts reads and enforces the @AC link against,
# both ways. Nothing in the suite reads a planning artefact — those are not
# deliverables and are absent from a fresh clone and from CI. This bundle copy
# is the plan of that file, not a second oracle.
#
# Per ADR-020 Amendment 5 this file IS the played artefact: the sibling
# client-address.steps.ts catalog decides — scenario by scenario — which
# entries are driveable on the playground. The colocated unit and integration
# specs remain the proofs, each anchored to a scenario by its @AC tag.
#
# One scenario per capability the parity table carries, at actor x context
# altitude (ADR-001) — INCLUDING every editor behaviour. This module ships
# BOTH halves, the collection AND the per-address editor, because
# variant=hybrid was DERIVED from the oracle: the module interprets
# dataManagerMachine today. The 2026-08-05 client-email amputation (a
# variant=query run against an oracle that shipped a manager, every gate
# green) is the receipt that derivation exists to prevent.
#
# Business language only. The wire-level read-backs that PROVE each scenario
# — request URL retarget, session token, acting-as headers, request body,
# request ABSENCE — live in requirements.md section 5 and parity.yaml, not
# here.
#
# Actors: a client manages their OWN postal addresses. There is exactly ONE
# live cell — client x self — by operator ruling R2 (2026-08-14). Both scope
# matrices set SELF / STAFF / GUEST to `null as never` (AC-33, AC-34).
#
# What that `null as never` actually enforces, exactly — `.as()` accepts every
# `ScopeActorTypes` at compile time; a `null as never` matrix row removes
# `.for(...)` for that actor and nothing else. What the type system enforces:
# `.as('staff'|'guest'|'self').for(ADDRESS, id)` do not compile,
# `.as('client').for(ADDRESS, id)` does, and
# `useClientAddressManager(undefined, { clientId })` is `TS2554`. Delivering a
# compile error on `.as('staff')` itself would require `scope.builder.ts`
# (protected core).
#
# THE ORACLE DOES EXPOSE STAFF CAPABILITY. Legacy vue-app ships a distinct
# admin endpoint family (api/admin/clients/{id}/addresses), an acting-as-client
# impersonation branch (isMockClientContext), four staff permission gates, a
# per-client admin cache scope and a staff-only copy affordance. Every one is a
# REAL, oracle-demonstrated capability this delivery does NOT carry. Recorded
# here — not silently missing — so a reader cannot mistake a signed drop for an
# oversight. Each carries operator ruling R2 (2026-08-14, tier-1) and a
# Dropped-with-Linear-issue row in parity.yaml. THE LINEAR REFERENCE IS OWED
# AND UNFILED on all eight; no issue ID has been invented.
#   D1  reading/writing ANOTHER client's addresses via the admin endpoint family
#   D2  acting AS a client (impersonation) while managing their addresses —
#       the FE-2824 shape verbatim. Its restoration owes the A7 read-back:
#       the request-URL retarget AND the auth identity transport.
#   D3  the list_client_addresses staff gate
#   D4  the create_client_address staff gate
#   D5  the update_client_address staff gate
#   D6  the delete_client_address staff gate
#   D7  the per-client admin cache scope ($client_{id} / $client_{id}_selector)
#   D8  the staff-only copy-to-clipboard affordance (UAddress.vue, v-if=isAdmin)
#
# WITHDRAWN AT REVISION 2: revision 1 carried a ninth drop, "a staff member's
# own Upmind-side profile addresses". Plan searched the oracle for it and found
# no such surface. The row is withdrawn rather than quietly re-labelled.
#
# NOT-SUPPORTED, with the evidence that proves the absence:
#   N1  guest — neither oracle has a guest address route; every legacy path is
#       clients/{id}/addresses under a client or admin session, and headless
#       rejects NotAuthenticatedError on every write.
#   N2  staged-import lock / with_staged_imports — IAddress carries no
#       staged_import field (packages/types/src/models/addresses.ts:5-26,
#       checked field by field). Legacy's UAddress isStaged is a prop
#       defaulting false that no address caller passes. Building it would be
#       the advertised-but-absent defect this story exists to close (R8g).
#   N3  Google Places script loading, session tokens and prediction UI —
#       browser-bound, stays with the consumer. The region-resolution half is
#       headless and IS carried (see AC-19 and parity row L9).

Feature: A client manages their own postal addresses

  As a client of a brand
  I want to keep my postal addresses up to date
  So that my orders, invoices and billing details go to the right place

  Background:
    Given I am signed in as a client managing my addresses
    And my account has saved postal addresses


  # ---------------------------------------------------------------------------
  # The collection — reading my addresses
  # ---------------------------------------------------------------------------

  @AC-1 @collection @client
  Scenario: I see the addresses saved on my account
    When I open my saved addresses
    Then I see every address on my account
    And each one shows its name, its full written-out address and its country

  @AC-2 @collection @client @identity
  Scenario: I only ever see my own addresses
    When I open my saved addresses
    Then the addresses I am shown belong to my account and no other

  @AC-3 @collection @guard
  Scenario: Signed out, no address of mine is looked up at all
    Given I am not signed in
    When something tries to open my saved addresses
    Then no lookup of my addresses happens
    And my addresses are reported as unavailable

  @AC-4 @collection @readiness @fix
  Scenario: Waiting for my addresses always ends
    Given my addresses are slow to load and never arrive
    When I wait for them to be ready
    Then the wait ends within a known limit and tells me they are not ready
    And nothing is left waiting in the background

  @AC-5 @collection @default
  Scenario: I can tell which address is my default
    Given one of my addresses is marked as my default
    When I ask which address is my default
    Then I am told which one it is

  @AC-6 @collection @lookup
  Scenario: I can pick out one address I already know of
    When I look up one of my addresses by the one I mean
    Then I get that address back

  @AC-7 @collection @lookup @fix
  Scenario: I can find an address by part of it
    When I search my addresses for the one in a particular town
    Then I get the address in that town back

  @AC-8 @collection @filter
  Scenario: I can narrow my addresses by typing
    When I search with part of an address
    Then I am shown only the addresses matching my search

  @AC-9 @collection @pagination
  Scenario: I can page through a long list of addresses
    Given I have more addresses than fit on one page
    When I move to the next page and then back
    Then I am shown the right addresses for each page
    And asking for a page that does not exist fails cleanly rather than crashing


  # ---------------------------------------------------------------------------
  # The collection — changing my addresses
  # ---------------------------------------------------------------------------

  @AC-10 @collection @remove
  Scenario: I delete an address I no longer use
    When I delete one of my addresses
    Then that address is removed from my account
    And my list of addresses no longer shows it

  @AC-11 @collection @remove @guard @fix
  Scenario: Signed out, nothing of mine is deleted
    Given I am not signed in
    When something tries to delete an address of mine
    Then no deletion is attempted at all

  @AC-12 @collection @default
  Scenario: I choose which address is my default
    When I make one of my addresses my default
    Then that address becomes my default
    And my list reflects the change

  @AC-13 @collection @default @guard @fix
  Scenario: Signed out, my default is not changed
    Given I am not signed in
    When something tries to change my default address
    Then no change is attempted at all

  @AC-14 @collection @errors
  Scenario: When a change to my addresses fails, I am told, not interrupted
    Given deleting an address will fail
    When I delete that address
    Then I am shown why it failed, by the addresses themselves
    And nothing I was doing is thrown off course

  @AC-15 @collection @refresh
  Scenario: An address I have just saved shows up in my list
    When I save a new address
    Then my list of addresses includes it without my having to reload


  # ---------------------------------------------------------------------------
  # The editor — adding and changing an address
  # ---------------------------------------------------------------------------

  @AC-16 @editor @create
  Scenario: I start a new address from a blank form
    When I start adding a new address
    Then I get an empty form
    And the country is already set to the one this brand usually serves

  @AC-17 @editor @edit
  Scenario: I open one of my addresses to change it
    When I open one of my addresses to edit
    Then the form shows that address as it stands

  @AC-18 @editor @lookups
  Scenario: The form waits until it can offer me real countries and regions
    When I open the address form
    Then it is not usable until the list of countries and regions has arrived
    And once they have, I can choose from them

  @AC-19 @editor @dependent-fields
  Scenario: Changing the country gives me that country's regions
    Given my address is in one country with a region of that country chosen
    When I change the country
    Then I am offered the new country's regions
    And the region I had chosen is cleared, because it does not belong there

  @AC-20 @editor @validation
  Scenario: Where this brand requires a region, I must give one
    Given this brand requires a region on every address
    When I complete the address form
    Then a region is required of me
    And where the brand does not require one, it is optional

  @AC-21 @editor @lock-country @fix
  Scenario: I cannot change the country of an address I already saved
    Given this brand does not allow saved addresses to be changed freely
    When I open one of my existing addresses to edit
    Then the country is shown but locked
    And when I am adding a brand new address, the country is mine to choose

  @AC-22 @editor @type @fix
  Scenario: I say what kind of address this is
    When I edit one of my addresses
    Then I can label it as my home, my office, a holiday address or a company address
    And the label I chose is saved with it

  @AC-23 @editor @diff-update @fix
  Scenario: Saving a change sends only what I changed
    Given I open one of my addresses to edit
    When I change only the town and save
    Then only the town is sent
    And nothing I left alone is re-sent

  @AC-24 @editor @create
  Scenario: I add a brand new address
    When I provide a new address and save it
    Then the address is added to my account
    And it is the one I provided

  @AC-25 @editor @validation
  Scenario: An incomplete address is not saved
    When I leave out my postcode and try to save
    Then I am told the postcode is missing
    And nothing is saved

  @AC-26 @editor @readiness @fix
  Scenario: Waiting for the address form always ends
    Given the countries and regions never arrive
    When I wait for the form to be ready
    Then the wait ends within a known limit and I am told it failed

  @AC-27 @editor @schema
  Scenario: The form I am shown is the form that is checked
    When I open the address form
    Then the fields I am shown are exactly the fields my address is checked against

  @AC-28 @editor @clear
  Scenario: I abandon my changes
    Given I have started changing an address
    When I clear the form
    Then my changes are gone and the address stands as it was

  @AC-29 @editor @isolation
  Scenario: I edit two addresses at once without them interfering
    Given I have two addresses open for editing
    When I change one of them
    Then the other is untouched

  @AC-30 @editor @identity
  Scenario: The address I edit belongs to the account the editor was opened for
    When I save a change to an address
    Then the change is made to that account's address
    And it stays that account's address even if my sign-in state changes mid-save


  # ---------------------------------------------------------------------------
  # How an address reads
  # ---------------------------------------------------------------------------

  @AC-31 @display @fix
  Scenario: My address reads the way it does everywhere else
    Given my address has a street, a second line, a town, a state, a postcode, a region and a country
    When I see it written out
    Then it reads street, second line, town, state, postcode, region, country — in that order
    And nothing about it is missing

  @AC-32 @display @verified
  Scenario: I can see whether my address has been verified
    When I look at one of my addresses
    Then I can tell whether it has been verified
    And how far that verification went is not thrown away


  # ---------------------------------------------------------------------------
  # What this module deliberately does not do
  # ---------------------------------------------------------------------------

  # AC-33 and AC-34 are enforced at the point of asking for an ADDRESS, not at
  # the point of naming the actor — see the exact enforcement in the header.

  @AC-33 @scope @drop
  Scenario: Nobody can use this to open someone's address as a member of staff
    When someone tries to open an address to manage as a member of staff
    Then this simply is not something they can ask for
    And the staff capability the legacy portal does have is recorded as owed, not as missing by accident

  @AC-34 @scope @not-supported
  Scenario: A signed-out visitor has no addresses to manage
    When a signed-out visitor tries to open an address to manage
    Then this simply is not something they can ask for

  @AC-35 @surface
  Scenario: There is one front door to this module
    When another part of the product uses addresses
    Then it goes through the module's published surface
    And nothing reaches inside it by another route

  @AC-36 @surface @no-cosplay
  Scenario: Nothing is offered that does not work
    When I look at everything this module offers
    Then every single thing it offers actually does something
    And nothing is advertised that has no effect


  # ---------------------------------------------------------------------------
  # The rest of the product
  # ---------------------------------------------------------------------------

  @AC-37 @consumers
  Scenario: Everywhere in the product that uses my default address still gets the right one
    Given the product asks for my default address in several places
    When each of those places asks
    Then each one gets my actual default address
    And none of them silently gets nothing

  @AC-38 @consumers @e2e
  Scenario: Checkout and billing journeys still set up an address the same way
    When a checkout or billing journey needs an address on my account
    Then it gets one
    And it does so exactly as it did before this change

  @AC-39 @consumers @manage
  Scenario: I still manage my addresses from the billing page
    When I open the billing page's address section
    Then I see my addresses listed there
    And I can add, edit and delete one from that page
    And the one it treats as my default is a real address of mine

  @AC-40 @feedback
  Scenario: Changing my addresses still tells me what happened
    When I delete one of my addresses
    Then I am told it was deleted
    And when I make one my default, I am told that too
    And when either fails instead, I am told why


  # ---------------------------------------------------------------------------
  # The collection — filter-bar and sort infrastructure (FE-3103 gap closure)
  # ---------------------------------------------------------------------------

  @AC-41 @collection @filter @schema
  Scenario: A filter bar can be built over my address search without hand-authoring one
    When something wants to render a filter control for searching my addresses
    Then it is offered a ready-made filter-bar description
    And that description points at the same search my addresses are narrowed by

  @AC-42 @collection @sort
  Scenario: My addresses can be sorted by name or by when they were added
    When something asks how my addresses may be sorted
    Then it is told sorting by name or by date added are the choices on offer

  @AC-43 @collection @criteria
  Scenario: The starting view of my addresses comes from what is declared as sortable and searchable, not a fixed rule
    When I open my saved addresses
    Then the window I see comes from the declared paging rules
    And nothing about that starting view is a fixed value hidden in code

  @AC-44 @collection @schema
  Scenario: The filter-bar description and the search rules it is built from travel together
    When something wants to bind a filter bar to my address search
    Then it can read both the search rules and the filter-bar description from the one place
    And it does not need to reach past the module for either

  # ---------------------------------------------------------------------------
  # Page-driven scenarios (appended by the factory scenario lane)
  # ---------------------------------------------------------------------------

  @FE-3103 @playground
  Scenario: The addresses playground lists my saved addresses
    Given I am an authenticated client on the addresses page
    Then no failure is reported

  @FE-3103 @playground
  Scenario: The playground refreshes my address collection
    Given I am an authenticated client on the addresses page
    When I refresh the address collection
    Then no failure is reported

  @FE-3103 @playground
  Scenario: The playground removes a non-default address
    Given I am an authenticated client on the addresses page
    When I remove a non-default address
    Then the collection shows the address I removed is gone

  @FE-3103 @playground
  Scenario: The playground makes a non-default address the default
    Given I am an authenticated client on the addresses page
    When I make the non-default address my default
    Then the newly defaulted address is now the default
