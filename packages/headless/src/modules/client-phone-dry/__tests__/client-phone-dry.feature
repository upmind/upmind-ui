# client-phone-dry — business-logic source of truth (NON-EXECUTABLE)
#
# Produced by /code-test-bdd from the story contract (design.md §6 + parity.yaml
# + the public barrel's scope matrix). Non-executable per ADR-020 — no runner
# touches it. It is the module's single behavioural source of truth: one scenario
# per ADR-001 actor×context matrix cell — a populated cell states what that actor
# can do; an empty cell states that actor's denial; and self is described for
# every actor. Every capability test in this dir anchors to a scenario here by
# its @AC-* tag; the co-located client-phone-dry.traceability.test.ts enforces
# the link both ways. This file leads; the tests follow.
#
# Actors: a "client" manages their own phone numbers; a "staff member" acts on a
# named client's phone numbers on that client's behalf, and — as any actor —
# has their own numbers too. A guest has no access.

Feature: Client phone numbers
  A client holds one or more phone numbers (one marked default): list, add,
  edit, remove, set-default. The same capability serves a client on their own
  numbers and a staff member on a named client's numbers, differing only in
  whose numbers are worked on and under whose identity.

  # --- Access (guest: no session → denial) ------------------------------------

  @AC-MATRIX @guest
  Scenario: A guest cannot reach anyone's phone numbers
    Given a visitor with no authenticated client or staff session
    When they try to open a phone list
    Then they get no phone data and no way to add, edit, remove, or set a default
    And access is possible only as a client (own numbers) or staff (a named client's)

  # --- The client, on their own phones (self) ---------------------------------

  @AC-A1 @client
  Scenario: A client lists their own phone numbers
    Given an authenticated client
    When they open their phone list
    Then they see the phone numbers belonging to their own account
    And never another account's numbers

  @AC-A2 @client
  Scenario: A phone that cannot be deleted is not deleted
    Given a client whose list contains a number marked not-deletable
    When they try to remove that number
    Then no deletion happens
    But a deletable number in the same list can still be removed

  @AC-S1 @client @staff
  Scenario: Every phone carries a type
    Given a client (or staff member) adding or editing a phone number
    When they submit without choosing a type
    Then the submission is rejected because a type — mobile, home, office, or personal — is required
    And when a type is chosen it is saved with the number

  @AC-S2 @client @todo
  Scenario: A new phone defaults its country from the active brand
    Given a client adding a phone under a brand, with no country chosen
    When the new-phone form is prepared
    Then the phone's country defaults to that brand's country

  @AC-12a @client @staff
  Scenario: Phone numbers still being imported are shown, and flagged
    Given a phone list that includes a staged (still-importing) number
    When the list is opened
    Then the staged number is shown
    And it is marked as staged

  @AC-12b @client @staff
  Scenario: A staged phone number is read-only until it is reconciled
    Given a staged (still-importing) phone number
    When an edit, set-default, or removal is attempted on it
    Then nothing changes
    But a normal number in the same list can still be changed

  @AC-CART @client
  Scenario: Checkout can read the client's default phone
    Given an authenticated client at checkout
    When checkout reads the phone surface
    Then the client's default phone and full list are available
    And the phone form schema checkout needs is available

  # --- A staff member, on a named client's phones (for-client) -----------------

  @AC-B1 @staff
  Scenario: Staff read the named client's phones, as the staff member
    Given a staff member acting on a named client's behalf
    When they open that client's phone list
    Then the numbers belong to the named client — not the staff member's own account
    And the read is made under the staff member's own identity — never the client's login

  @AC-B2 @staff
  Scenario: Staff changes are applied to the named client's phones
    Given a staff member acting on a named client's behalf
    When they add, edit, remove, or set-default a number
    Then the change is applied to the named client's phones under the staff member's identity — never the client's login

  @AC-B3 @staff
  Scenario: Staff may delete a phone only with the delete capability
    Given a staff member acting on a named client's behalf who lacks the delete-phone capability
    When they look for a way to remove a number
    Then removing a number is not offered
    But once the delete capability is granted, removing a number is offered

  @AC-B4 @staff
  Scenario: Staff may add a phone only with the create capability
    Given a staff member acting on a named client's behalf who lacks the create-phone capability
    When they look for a way to add a number
    Then adding a number is not offered
    But once the create capability is granted, adding a number is offered

  # --- A staff member, on their OWN phones (self) -----------------------------

  @AC-C1 @staff @todo
  Scenario: A staff member manages their own phone numbers
    Given a staff member with no named client in context
    When they open their own phone list
    Then they see and manage their own numbers exactly as a client manages theirs
