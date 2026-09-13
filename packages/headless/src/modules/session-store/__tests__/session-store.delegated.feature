# session-store delegated access — the delegate augment's behavioural contract.
#
# NON-EXECUTABLE per ADR-020. No runner touches it and there is no steps file;
# the co-located unit and integration specs are what run.
#
# SCOPE OF THIS FILE. FE-3036 (DG-1) only: the `/self` wire already returns
# `delegated_ids` and `mapSessionUser` dropped it. This file describes the
# augment that keeps it — the map on the session user, the two per-record
# helpers, the delegate-side `hasDelegatedProducts` disjunction, and the staff
# and guest rows that must read empty. The module's own session, guest, boot and
# cookie behaviour is NOT restated here; it lives in `session-store.feature`.
#
# WHAT THIS FILE DELIBERATELY DOES NOT DESCRIBE. An earlier cut of this story
# also converted the session into a scope-based composable and described that
# conversion here as acceptance criteria. That conversion was rejected: the
# active session IS the scope the scope builder reads to resolve `self`
# (`scope/scope.utils.ts` -> `resolveSelfActor` -> `useSessionStore`), so the
# session can never be a consumer of scope. Those scenarios are gone with it.
# The delegate surface is read through the ordinary unscoped session.
#
# OWNER-SIDE `hasDelegates` IS NOT HERE. "Do I hold delegated access?" (this
# file) is the delegate side. "How many delegates have I granted?" is the owner
# side and belongs to FE-3041 (DG-2), which owns its count endpoint and its
# optimistic-commit rollback.
#
# THE ANCHOR IS ENFORCED. `session-store.traceability.test.ts` reads this file
# alongside `session-store.feature` and fails when a scenario below has no test
# naming its id, or a test names an id no scenario carries.
#
# THE JOB: a client who has been granted access to someone else's invoices,
# products or tickets can tell which records those are, and who owns them.

@module:session-store @cell:client-self @cell:staff-self @cell:guest-self
Feature: A client can read the delegated access granted to them

  The server already tells us, on `/self`, which objects have been delegated to
  the signed-in client. It arrives keyed by object type. The session keeps it,
  so a consumer can ask two questions of a record it already holds: was this
  delegated to me, and whose is it.

  Background:
    Given the session store holds this device's sessions

  # === THE MAP ON THE SESSION ================================================

  @AC-DG1 @layer-integration
  Scenario: A client with no delegated access reads an empty map
    Given I am signed in as a client who has been granted no delegated access
    When I read my delegated ids
    Then the delegated ids are an empty map

  @AC-DG1 @layer-integration @todo
  Scenario: A client granted access to another client reads that id under the client key
    Given I am signed in as a client who has been granted access to another client
    When I read my delegated ids
    Then the other client's id appears under the client key

  @AC-DG1 @layer-integration @todo
  Scenario: A client granted a delegated product reads that id under the contract-product key
    Given I am signed in as a client who has been granted access to one contract product
    When I read my delegated ids
    Then the product's id appears under the contract-product key

  # === PER-RECORD: WAS THIS DELEGATED TO ME ==================================

  @AC-DG2 @layer-integration @todo
  Scenario: A record the server flagged as delegated is reported as delegated
    Given an invoice the server has flagged as reaching me by delegation
    When I ask whether that invoice was delegated to me
    Then the invoice is reported as delegated

  @AC-DG2 @layer-unit
  Scenario: An invoice belonging to a child account is not reported as delegated
    Given an invoice whose delegation flag is set
    And the invoice belongs to a child account of mine
    When I ask whether that invoice was delegated to me
    Then the invoice is reported as not delegated

  @AC-DG2 @layer-unit
  Scenario: A delegated contract product belonging to a child account is still delegated
    Given a contract product whose delegation flag is set
    And the contract product belongs to a child account of mine
    When I ask whether that contract product was delegated to me
    Then the contract product is reported as delegated

  # === PER-RECORD: WHOSE IS IT ===============================================

  @AC-DG3 @layer-integration @todo
  Scenario: The owning client of a delegated record is resolved from the record
    Given an invoice that reached me by delegation
    When I ask who owns that invoice
    Then I receive the owning client's display name, username and avatar

  @AC-DG3 @layer-unit
  Scenario: A record with no owning client attached resolves to no owner
    Given a delegated contract product with no owning client attached
    When I ask who owns that contract product
    Then no owner is reported

  # === REFRESH ===============================================================

  @AC-DG4 @layer-integration
  Scenario: Refreshing the session re-reads the identity profile rather than the day-old cache
    Given I am signed in as a client whose identity profile has been read once
    When I refresh my session
    Then a second identity-profile request is made as that same client

  @AC-DG4 @layer-integration @todo
  Scenario: Refreshing after a new grant surfaces the newly delegated id
    Given I am signed in as a client who has just been granted access to another client
    When I refresh my session
    Then the newly granted client id appears under the client key

  # === THE OTHER ACTORS ======================================================

  @AC-DG5 @layer-integration
  Scenario: A staff session neither asks for nor exposes delegated access
    Given I am signed in as a member of staff
    When the staff session reads its identity profile
    Then the identity-profile request does not ask for delegated access
    And the staff session's delegated ids are an empty map

  @AC-DG6 @layer-integration
  Scenario: A guest boots unaffected by the delegate surface
    Given I have not signed in
    When the store settles on the guest floor
    Then the guest has no session user
    And the guest's delegated ids are an empty map

  # === DO I HOLD DELEGATED ACCESS AT ALL =====================================

  @AC-DG7 @layer-integration
  Scenario: A client holding delegated contract products or delegated clients holds delegated access
    Given I am signed in as a client who has been granted access to a contract product or to another client
    When I read whether I hold delegated access
    Then the delegated-access flag reads true

  @AC-DG8 @layer-integration
  Scenario: A client holding only a delegated ticket does not hold delegated access
    Given I am signed in as a client who has been granted access to a ticket only
    When I read whether I hold delegated access
    Then the delegated-access flag reads false

  @AC-DG9 @layer-integration
  Scenario: A session stored before delegated access existed reads false rather than failing
    Given I am signed in as a client whose stored session profile predates the delegated-ids field
    When I read whether I hold delegated access
    Then the delegated-access flag reads false
    And no read of the flag fails
