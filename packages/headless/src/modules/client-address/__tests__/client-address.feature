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
#
# THE SIGNED-OUT GUARDS SIT AT TOP LEVEL, outside the `Rule:` that carries the
# signed-in Background (operator-approved restructure, FE-3145 wave 2). A guard
# boots for itself under a guest session, so it does not inherit the signed-in
# boot — parseFeatureScenarios gives it backgroundStepCount 0.

Feature: A client manages their own postal addresses

  As a client of a brand
  I want to keep my postal addresses up to date
  So that my orders, invoices and billing details go to the right place

  # ---------------------------------------------------------------------------
  # The signed-out guards (no Background)
  # ---------------------------------------------------------------------------

  @AC-3 @AC-11 @AC-13 @AC-34 @collection @scope @guard @not-supported @signed-out @layer-e2e
  Scenario: Signed out, nothing of mine is read or changed
    Given I am not signed in
    When something tries to open my saved addresses
    Then no lookup of my addresses happens
    And my addresses are reported as unavailable
    When something tries to delete an address of mine
    Then no deletion is attempted at all
    When something tries to change my default address
    Then no change is attempted at all
    When a signed-out visitor tries to open an address to manage
    Then the address editor is not theirs to open

  @AC-4 @AC-26 @editor @readiness @guard @signed-out @layer-e2e
  Scenario: The address form is inert without an authenticated client session
    Given I open the address form without an authenticated client session
    Then the form reports itself unavailable
    And no request is made against any address resource

  @AC-4 @AC-26 @collection @readiness @errored @layer-e2e
  Scenario: When my address list cannot be read, I am told it failed
    Given I am signed in as a client whose address list cannot be read
    Then the address collection reports it errored

  Rule: A signed-in client manages their own addresses

    Background:
      Given I am signed in as a client managing my addresses
      And my account has saved postal addresses


    # -------------------------------------------------------------------------
    # The collection — reading my addresses
    # -------------------------------------------------------------------------

    @AC-1 @collection @client
    Scenario: I see the addresses saved on my account
      When I open my saved addresses
      Then I see every address on my account
      And each one shows its name, its full written-out address and its country

    @AC-2 @collection @client @identity
    @moved
    # @moved: request-URL retarget + auth-token transport is proven in the query / session-store / auth modules, not here (operator rule 2026-09-24).
    Scenario: I only ever see my own addresses
      When I open my saved addresses
      Then the addresses I am shown belong to my account and no other

    @AC-5 @collection @default @layer-e2e
    Scenario: I can tell which address is my default
      Then one of my addresses is shown as my default

    @AC-7
    @AC-8
    @collection @lookup @filter @fix @layer-e2e
    Scenario: I find an address by typing part of it
      When I search my addresses for part of one
      Then only the addresses matching my search remain

    @AC-9 @collection @pagination @layer-e2e
    Scenario: I can page through a long list of addresses
      When I set my address page size to one
      Then I am shown the first page of my addresses
      When I move to the next page of addresses
      Then I am shown the next page of my addresses


    # -------------------------------------------------------------------------
    # The collection — changing my addresses
    # -------------------------------------------------------------------------

    @AC-10 @collection @remove
    Scenario: I delete an address I no longer use
      When I delete one of my addresses
      Then that address is removed from my account
      And my list of addresses no longer shows it

    @AC-12 @collection @default
    Scenario: I choose which address is my default
      When I make one of my addresses my default
      Then that address becomes my default
      And my list reflects the change

    @AC-14 @collection @errors @layer-e2e
    Scenario: When a change to my addresses fails, I am told, not interrupted
      Given deleting an address will fail
      When I delete that address
      Then I am shown why it failed, by the addresses themselves
      And nothing I was doing is thrown off course

    @AC-15 @collection @refresh
    Scenario: An address I have just saved shows up in my list
      When I save a new address
      Then my list of addresses includes it without my having to reload


    # -------------------------------------------------------------------------
    # The editor — adding and changing an address
    # -------------------------------------------------------------------------

    @AC-16 @editor @manager @create
    Scenario: I start a blank address form
      Given I am starting a brand new address
      Then the editor gives me an empty form that reports itself new

    @AC-17 @editor @manager
    Scenario: I open one of my saved addresses in the editor
      Given I am editing one of my saved addresses
      Then the editor shows that saved address and reports it is not new

    @AC-18 @editor @lookups @layer-e2e
    Scenario: The form offers me real countries and regions
      Given I am editing an address that has a region
      Then the form offers me countries and regions to choose from

    @AC-19 @editor @dependent-fields @layer-e2e
    Scenario: Changing the country gives me that country's regions
      Given I am editing an address that has a region
      When I change the country to another
      Then I am offered the new country's regions
      And the region I had chosen is cleared

    @AC-20 @editor @validation @region-gate @layer-e2e
    Scenario: Where this brand requires a region, I must give one
      Given this brand requires a region on every address
      When I complete the address form without a region
      Then a region is required of me

    @AC-21 @editor @lock-country @fix @lock-gate @layer-e2e
    Scenario: I cannot change the country of an address I already saved
      Given this brand does not allow saved addresses to be changed freely
      When I open one of my existing addresses to edit
      Then the country is shown but locked

    @AC-24 @editor @manager @create
    Scenario: I add a brand new address
      Given I am starting a brand new address
      When I provide a new address and save it
      Then the new address is added and the editor is no longer new

    @AC-27 @editor @schema @layer-e2e
    Scenario: The form I am shown is the form that is checked
      Given I am editing one of my saved addresses
      Then the address editor offers its form schema and UI definition

    # AC-29 (I edit two addresses at once without them interfering) DELETED as a
    # scenario per operator ruling (FE-3145 wave 2): the World holds at most one
    # editor cell, so two independent editors cannot be observed side by side.

    @AC-30 @editor @identity
    @moved
    # @moved: the save-URL retarget + token transport is proven in the query / session-store / auth modules, not here (operator rule 2026-09-24).
    Scenario: The address I edit belongs to the account the editor was opened for
      When I save a change to an address
      Then the change is made to that account's address
      And it stays that account's address even if my sign-in state changes mid-save


    # -------------------------------------------------------------------------
    # How an address reads
    # -------------------------------------------------------------------------

    @AC-31 @display @fix
    Scenario: My address is written the same way here as everywhere else in the product
      Given my address has a street, a second line, a town, a state, a postcode, a region and a country
      When I see it written out
      Then it reads street, second line, town, state, postcode, region, country — in that order
      And nothing about it is missing

    @AC-32 @display @verified
    Scenario: I can see whether my address has been verified
      When I look at one of my addresses
      Then I can tell whether it has been verified
      And how far that verification went is not thrown away


    # -------------------------------------------------------------------------
    # What this module deliberately does not do
    # -------------------------------------------------------------------------

    # AC-33 is enforced at the point of asking for an ADDRESS, not at the point of
    # naming the actor — see the exact enforcement in the header. AC-34 carries the
    # same enforcement and rides the signed-out guard at top level.

    @AC-33 @scope @drop
    Scenario: Nobody can use this to open someone's address as a member of staff
      When someone tries to open an address to manage as a member of staff
      Then this simply is not something they can ask for
      And the staff capability the legacy portal does have is recorded as owed, not as missing by accident

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


    # -------------------------------------------------------------------------
    # The rest of the product
    # -------------------------------------------------------------------------

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


    # -------------------------------------------------------------------------
    # The collection — filter-bar and sort infrastructure (FE-3103 gap closure)
    # -------------------------------------------------------------------------

    @AC-41
    @AC-42
    @AC-44
    @collection @filter @sort @schema @layer-e2e
    Scenario: I get a filter bar and a sort over my addresses from one place
      Then I am offered a filter-bar description and the sort choices from one place

    @AC-43 @collection @criteria @layer-e2e
    Scenario: My address list opens already sorted and searchable the way my account declares
      Then my address list opens with the declared sort and paging

    # -------------------------------------------------------------------------
    # Page-driven scenarios (appended by the factory scenario lane)
    # -------------------------------------------------------------------------

    @AC-1 @FE-3103 @playground
    Scenario: The addresses playground lists my saved addresses
      Given I am an authenticated client on the addresses page
      Then no failure is reported

    @AC-15 @FE-3103 @playground
    Scenario: The playground refreshes my address collection
      Given I am an authenticated client on the addresses page
      When I refresh the address collection
      Then no failure is reported

    @AC-10 @FE-3103 @playground
    Scenario: The playground removes a non-default address
      Given I am an authenticated client on the addresses page
      When I remove a non-default address
      Then the collection shows the address I removed is gone

    @AC-12 @FE-3103 @playground
    Scenario: The playground makes a non-default address the default
      Given I am an authenticated client on the addresses page
      When I make the non-default address my default
      Then the newly defaulted address is now the default


    # -------------------------------------------------------------------------
    # The editor — driven through the per-address manager (AC-22/23/25/28)
    # -------------------------------------------------------------------------

    @AC-23 @editor @manager
    Scenario: I change the town of a saved address and save it
      Given I am editing a saved address of mine
      When I change the town and save
      Then the editor shows the town I saved

    @AC-22 @editor @manager
    Scenario: I change the kind of a saved address and save it
      Given I am editing a saved address of mine
      When I change the address type and save
      Then the editor shows the type I saved

    @AC-25 @editor @manager @validation
    Scenario: An incomplete address is refused before it is saved
      Given I am editing a saved address of mine
      When I clear the postcode
      Then the editor refuses to save an incomplete address

    @AC-28 @editor @manager
    Scenario: I abandon my changes to a saved address
      Given I am editing a saved address of mine
      When I change the town and then discard my changes
      Then the editor shows the address as it was loaded
