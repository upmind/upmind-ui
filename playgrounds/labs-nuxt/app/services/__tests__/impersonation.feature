@FE-2973
Feature: Impersonation Services

  Staff can search for and impersonate clients or other users via the admin API.
  The services wrap the API calls and return the expected data structures.

  Background:
    Given a staff user with impersonation permissions

  @AC-R5.1a @layer-unit
  Scenario: Search clients returns matching results
    When the staff user searches for clients with query "john"
    Then the service calls GET /admin/clients with query parameter "john"
    And the service returns an array of ClientSearchResult

  @AC-R5.1b @layer-unit
  Scenario: Impersonate client returns access token
    Given a client with id "client-123"
    When the staff user impersonates the client
    Then the service calls POST /admin/clients/client-123/access_token
    And the service returns the access_token string

  @AC-R5.2a @layer-unit
  Scenario: Search users returns matching results
    When the staff user searches for users with query "admin"
    Then the service calls GET /admin/users with query parameter "admin"
    And the service returns an array of UserSearchResult

  @AC-R5.2b @layer-unit
  Scenario: Impersonate user returns access token
    Given a user with id "user-456"
    When the staff user impersonates the user
    Then the service calls POST /admin/users/user-456/access_token
    And the service returns the token string

  @AC-R5.1c @layer-integration @todo
  Scenario: Client search debounces API calls
    When the staff user types "jo" then "john" within 250ms
    Then only one API call is made with query "john"
    # Blocked: requires ActingForSegment.vue extension (R5 OPEN per design.md)

  @AC-R5.1d @layer-integration @todo
  Scenario: Selected client impersonation adds session
    Given search results include client "client-789"
    When the staff user selects the client from results
    Then the impersonation token is fetched
    And a new client session is added to the session store
    # Blocked: requires ActingForSegment.vue extension (R5 OPEN per design.md)
