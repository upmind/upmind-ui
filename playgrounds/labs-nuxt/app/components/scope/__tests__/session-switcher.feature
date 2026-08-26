@FE-3125
Feature: Session Switcher Badge Slot Migration

  The SessionSwitcher component displays session state using Badge components.
  After migration, Badge content renders via slot children, not label/icon props.

  Background:
    Given the labs-nuxt playground is running
    And the user is authenticated

  @T-1 @developer
  Scenario: Impersonation badge displays content via slot
    Given a staff user is impersonating a client
    When the session switcher renders
    Then the impersonation badge displays the impersonation indicator
    And the badge content is rendered as slot children

  @T-2 @developer
  Scenario: Session expiry badge displays countdown via slot
    Given the session has an expiry time
    When the session switcher renders
    Then the expiry badge displays the remaining time
    And the badge content includes an icon and text as slot children

  @T-3 @developer
  Scenario: Nest count badge displays via slot
    Given multiple nested sessions exist
    When the session switcher renders
    Then the nest count badge displays the session depth
    And the badge content is rendered as slot children

  @contract @developer
  Scenario: Data-test selectors remain valid
    When the session switcher renders
    Then the element with data-test-key "session-switcher" exists
    And the element with data-test-key "session-impersonation-cue" exists when impersonating
