# client-address-dry — business-logic source of truth (NON-EXECUTABLE)
#
# Produced by /code-test-bdd from the story contract (design.md §6 + parity.yaml
# + the public barrel's scope matrix). Non-executable per ADR-020 — no runner
# touches it. It is the module's single behavioural source of truth: one
# scenario per ADR-001 actor×context matrix cell — a populated cell states what
# that actor can do; an empty cell states that actor's denial; and self is
# described for every actor. Every capability test in this dir anchors to a
# scenario here by its @AC-* tag; the co-located
# client-address-dry.traceability.test.ts enforces the link both ways. This
# file leads; the tests follow.
#
# Actors: a "client" manages their own postal addresses; a "staff member" acts
# on a named client's addresses in two distinct ways — from the admin panel
# (under their own staff identity, on the admin API) and while acting AS that
# client (impersonation, under a client identity minted for that client). A
# guest has no access.

Feature: Client postal addresses
  A client holds one or more postal addresses (one marked default): list, add,
  edit, remove, set-default. The same capability serves a client on their own
  addresses and a staff member on a named client's addresses. It differs by
  whose addresses are worked on, under whose identity, and on which endpoint.

  # --- Access (guest: no session → denial) ------------------------------------

  @AC-MATRIX @guest
  Scenario: A guest cannot reach anyone's addresses
    Given a visitor with no authenticated client or staff session
    When they try to open an address list
    Then they get no address data and no way to add, edit, remove, or set a default
    And access is possible only as a client (own addresses) or staff (a named client's)

  # --- The client, on their own addresses (self) ------------------------------

  @AC-A1 @client
  Scenario: A client lists their own addresses
    Given an authenticated client
    When they open their address list
    Then they see the postal addresses belonging to their own account
    And never another account's addresses

  @AC-A2 @client
  Scenario: An address that cannot be deleted is not deleted
    Given a client whose list contains an address marked not-deletable
    When they try to remove that address
    Then no deletion happens
    But a deletable address in the same list can still be removed

  @AC-S1 @client @staff
  Scenario: Every address carries a type
    Given a client (or staff member) adding or editing an address
    When they submit without choosing a type
    Then the submission is rejected because a type — home, office, holiday, or company — is required
    And when a type is chosen it is saved with the address, never forced to a fixed value

  @AC-REGION @client @staff
  Scenario: A region is required only when the brand demands it
    Given a brand configured to require a region in addresses
    When an address is added or edited under that brand
    Then a region must be chosen for the address to be valid
    But under a brand that does not require a region, the region stays optional

  @AC-STAGED @client @staff
  Scenario: Addresses still being imported are included in the list
    Given an address list that includes a staged (still-importing) address
    When the list is opened
    Then the staged address is included in the results

  @AC-CART @client
  Scenario: Checkout can read the client's default address
    Given an authenticated client at checkout
    When checkout reads the address surface
    Then the client's default address and full list are available

  # --- A staff member, from the admin panel (for-client, admin identity) -------

  @AC-B1 @staff
  Scenario: Staff read a named client's addresses from the admin panel, as staff
    Given a staff member acting on a named client's behalf from the admin panel
    When they open that client's address list
    Then the addresses belong to the named client — not the staff member's own account
    And the read is made from the admin surface under the staff member's own identity

  @AC-B2 @staff
  Scenario: Staff changes from the admin panel apply to the named client's addresses
    Given a staff member acting on a named client's behalf from the admin panel
    When they add, edit, remove, or set-default an address
    Then the change is applied to the named client's addresses from the admin surface under the staff member's identity

  @AC-B3 @staff
  Scenario: Staff may delete an address only with the delete capability
    Given a staff member acting on a named client's behalf who lacks the delete-address capability
    When they look for a way to remove an address
    Then removing an address is not offered
    But once the delete capability is granted, removing an address is offered

  @AC-B4 @staff
  Scenario: Staff may add an address only with the create capability
    Given a staff member acting on a named client's behalf who lacks the create-address capability
    When they look for a way to add an address
    Then adding an address is not offered
    But once the create capability is granted, adding an address is offered

  @AC-B5 @staff
  Scenario: Staff see which address actions they are allowed, as readable capability flags
    Given a staff member acting on a named client's behalf who holds the list, create, update, and delete capabilities
    When they read the address surface
    Then it reports that listing, creating, updating, and deleting are each allowed
    But when the same staff member lacks the delete capability
    Then it reports that deleting is not allowed while the others remain allowed
    And a client working on their own addresses is never shown these staff capability flags at all

  # --- A staff member, acting AS the named client (impersonation, self) --------

  @AC-C1 @staff
  Scenario: Staff acting as a client work on that client's addresses under the client's identity
    Given a staff member who has begun acting as a named client
    When they open the address list while acting as that client
    Then the addresses belong to the named client
    And the read is made under the client's own identity — as that client, not as staff and not on the admin surface
