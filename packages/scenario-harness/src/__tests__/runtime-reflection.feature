# Realized as unit tests (src/reflection/__tests__/reflect.test.ts) plus, for
# the live-useAuth group only, the journeys-lane integration adapter
# (tests/journeys/scenario-harness/reflection.int.test.ts) — bdd.md
# "Runtime reflection" §Placement.

@AC-2
Feature: Runtime reflection of a live scope-based composable
  As a developer changing a business module
  I want the reflected surface to be the live surface on every pull
  So that what I validate against can never drift from the code

  Scenario: The reflected surface is exactly the live surface
    Given the auth module booted as a client
    When the core reflects it through its port
    Then the reflected action names are exactly the live action enumeration
    And the reflected context carries every live context key including schema and uischema
    And the reflected meta carries every live flag

  Scenario: Action sets differ per actor and both are reported truthfully
    Given the auth module booted once as a client and once as staff
    When each booted module is reflected
    Then the client's action names include guest registration and the staff's do not
    And both sets include the shared lifecycle members

  Scenario: Meta crosses the port as already-evaluated booleans
    Given the auth module booted as a client
    When the core reflects it through its port
    Then every reflected meta value is a plain true or false
    And no reactive wrapper crosses the port

  Scenario: A snapshot taken after a schema re-assignment carries the new schema
    Given a booted module that re-assigns its schema during the session
    When a fresh snapshot is pulled after the re-assignment
    Then the reflected schema is the newly assigned one

  Scenario: Reflection never instantiates through the scope builder
    Given a scope builder that records every instantiation
    When the core reflects through a port built from the layer factories' returns
    Then no instantiation beyond the one deliberate boot is recorded

  @AC-8
  Scenario: A module descriptor survives a JSON round-trip unchanged
    Given a module descriptor reflected from a booted module
    When the descriptor is serialized to JSON and parsed back
    Then the parsed descriptor equals the original
