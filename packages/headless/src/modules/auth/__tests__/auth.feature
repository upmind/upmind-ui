# auth — the module's ONE feature file: its capability spec, the copy the
# traceability spec reads.
#
# The planner's source lives under docs/sdd/FE-2984/. This copy keeps its
# wording and declares every scenario @todo: no World boots the landing, since
# the playground keeps `verify_registration` out of its scenario registry and
# auth has no replay runner. Each Blocker comment names the spec that proves it.
#
# Story FE-2984 adds the registration-activation landing. One scenario per
# composable capability. Business language only, declarative only: no selector,
# address, header or UI mechanic appears here. The wire-level read-backs that
# PROVE a scenario (which token, which body keys) live in
# auth.verify-registration.guest.int.test.ts, whose `AC-n ` titles match these tags.
#
# Cells: the graded cell is guest x self (tag @guest). A signed-in client who
# opens the link takes the same path through the same factory, so the
# client x self cell is absorbed by guest x self (parity.yaml). Staff landings
# are out of scope (FE-3028).
#
# Absorbed criteria, with no scenario here:
# - AC20 and AC25 are display on the labs page. The labs page spec proves them.
# - AC23 and AC24 are process. Their read-backs are the fixture lint, the full
#   spec run and a git diff.
# No auth spec names AC-20, AC-23, AC-24 or AC-25 in a title, so the
# traceability gate has no hole.
#
# Tags: the harness reads only @AC-<digits>. AC numbers are module-wide in auth.
# A later auth story continues from AC-26 and adds its own story tag.

Feature: Registration activation landing
  As a guest who got an activation email
  I want the link to activate my account and sign me in
  So that I can start to use my account

  Background:
    Given an activation landing for my link

  # Blocker: the World cannot seed a staff or a client session and reads no
  # request header. The AC-1 cases of the integration spec prove it.
  @FE-2984 @AC-1 @guest @todo
  Scenario: The link is checked with my client session only
    Given I hold a staff session and a client session
    When the landing checks my link
    Then the link check goes out once with my username and my hash
    And it carries my client session and never my staff session

  # Blocker: the World reads no request body or header. The AC-2 case of the
  # integration spec proves it.
  @FE-2984 @AC-2 @guest @todo
  Scenario: An account that has a password is activated at once
    Given my account already has a password
    When the landing checks my link
    Then the activation goes out once with no password and no session
    And the landing reaches the activated state

  # Blocker: no World boots the landing. The AC-3 cases of the
  # integration spec prove it.
  @FE-2984 @AC-3 @guest @todo
  Scenario: The activated account becomes my client session
    Given my account already has a password
    When the landing checks my link
    Then my client session holds the new access token
    And the landing reports the new session id

  # Blocker: no World boots the landing. The AC-4 cases of the
  # integration spec prove it.
  @FE-2984 @AC-4 @guest @todo
  Scenario: A landing that has not started waits and sends nothing
    When nobody starts the landing
    Then the landing reports that it is verifying
    And it reports no other outcome
    And no request goes out

  # Blocker: no staging capture reaches a two-factor account, and the World
  # cannot serve a two-factor answer. The AC-5 cases of the integration spec
  # and the rules spec prove it.
  @FE-2984 @AC-5 @guest @todo
  Scenario: A two-factor account is reported with its provider
    Given my account has two-factor sign-in with the TOTP provider
    When the landing checks my link
    Then the landing reports that two-factor sign-in is necessary
    And it reports the provider as totp

  # Blocker: no World boots the landing. The AC-6 cases of the
  # integration spec prove it.
  @FE-2984 @AC-6 @guest @todo
  Scenario: An account with no name still completes
    Given my account already has a password but no name
    When the landing checks my link
    Then the landing reports that a complete step is necessary
    And the landing reaches the activated state

  # Blocker: no World boots the landing. The AC-7 cases of the
  # integration spec prove it.
  @FE-2984 @AC-7 @guest @todo
  Scenario: An account with no password stops at the set-password step
    Given my account has no password
    When the landing checks my link
    Then the landing waits at the set-password step
    And it offers the set-password form with my username as its username
    And no activation goes out

  # Blocker: no World boots the landing. The AC-8 cases of the
  # integration spec prove it.
  @FE-2984 @AC-8 @guest @todo
  Scenario Outline: A password that breaks a rule is refused
    Given the landing waits at the set-password step
    When I submit the password "<password>" with the confirmation "<confirmation>"
    Then the landing reports one validation error for the <field> under the <rule> rule
    And it stays at the set-password step
    And no activation goes out

    Examples:
      | password | confirmation | field                 | rule      |
      | abcdef1  | abcdef1      | password              | minLength |
      | 12345678 | 12345678     | password              | pattern   |
      | abcdefgh | abcdefgh     | password              | pattern   |
      | abcdefg1 | abcdefg2     | password confirmation | const     |

  # Blocker: the World reads no request body. The AC-9 case of the integration
  # spec proves it.
  @FE-2984 @AC-9 @guest @todo
  Scenario: A valid password activates the account
    Given the landing waits at the set-password step
    When I submit a valid password with an equal confirmation
    Then the activation goes out once with my password and without the confirmation
    And the landing reaches the activated state

  # Blocker: no World boots the landing. The AC-10 cases of the
  # integration spec and the rules spec prove it.
  @FE-2984 @AC-10 @guest @todo
  Scenario: A link past its expiry date is refused at the set-password step
    Given my account has no password
    And my link expired in 2020
    When the landing checks my link
    Then the landing reports the expired-or-invalid outcome with the invalid-link error
    And no activation goes out

  # Blocker: the World cannot set a brand setting or a cookie and reads no
  # request body. The AC-11 cases of the integration spec prove it.
  @FE-2984 @AC-11 @guest @todo
  Scenario: The analytics ids travel with the activation
    Given the brand has an analytics id
    And my browser holds the two analytics cookies
    And my account already has a password
    When the landing checks my link
    Then the activation carries my analytics client id and session id

  # Blocker: no World boots the landing. The AC-12 cases of the
  # integration spec prove it.
  @FE-2984 @AC-12 @guest @todo
  Scenario: A link with no hash is refused at once
    Given my link has a username but no hash
    When the landing checks my link
    Then the landing reports the expired-or-invalid outcome with the invalid-link error
    And no request goes out

  # Blocker: no World boots the landing. The AC-13 cases of the
  # integration spec prove it.
  @FE-2984 @AC-13 @guest @todo
  Scenario: A refused link check shows the failure
    Given the API refuses my link
    When the landing checks my link
    Then the landing reports the expired-or-invalid outcome with the API error
    And no activation goes out

  # Blocker: no World boots the landing. The AC-14 cases of the
  # integration spec prove it.
  @FE-2984 @AC-14 @guest @todo
  Scenario: A refused activation after the set-password step shows the failure
    Given the landing waits at the set-password step
    And the API refuses the activation
    When I submit a valid password with an equal confirmation
    Then the landing reports the expired-or-invalid outcome with the API error

  # Blocker: no World boots the landing. The AC-15 cases of the
  # integration spec prove it.
  @FE-2984 @AC-15 @guest @todo
  Scenario: A refused direct activation shows an error, not an expired link
    Given my account already has a password
    And the API refuses the activation
    When the landing checks my link
    Then the landing reports the completion failure with the API error
    And it does not report the expired-or-invalid outcome

  # Blocker: no staging capture reaches a blocked address, and the World cannot
  # serve the one-field refusal. The AC-16 case of the integration spec proves it.
  @FE-2984 @AC-16 @guest @todo
  Scenario: A blocked address keeps its API code
    Given the API refuses me because my IP address is blocked
    When the landing checks my link
    Then the reported error keeps the refusal status and the blocked-address code

  # Blocker: the World cannot watch the router, the location or the history.
  # The AC-17 cases of the integration spec prove it.
  @FE-2984 @AC-17 @guest @todo
  Scenario: The landing never moves me to another page
    Given my account already has a password
    When the landing checks my link
    Then the landing reaches the activated state
    And no route change happens

  # Blocker: no World boots the landing. The AC-18 cases of the
  # integration spec and the rules spec prove it.
  @FE-2984 @AC-18 @guest @todo
  Scenario Outline: Only a safe return path is offered
    Given my account already has a password
    And my link asks to return to "<target>"
    When the landing checks my link
    Then the landing offers the return path "<offered>"

    Examples:
      | target         | offered        |
      | /billing?tab=1 | /billing?tab=1 |
      | //evil.example | none           |

  # Blocker: no World boots the landing. The AC-19 cases of the
  # integration spec prove it.
  @FE-2984 @AC-19 @guest @todo
  Scenario: The consumer can wait for my new client session
    Given my account already has a password
    And the landing reached the activated state
    When the consumer waits for my new client session
    Then the consumer gets my signed-in user

  # Blocker: no World boots the landing. The AC-21 cases of the
  # integration spec prove it.
  @FE-2984 @AC-21 @guest @todo
  Scenario: A retry checks the link again
    Given the landing refused my link with the invalid-link error
    When the consumer retries
    Then the landing checks the same link values again, with no request when a value is missing
    And it reports the expired-or-invalid outcome again

  # Blocker: no World boots the landing. The AC-22 cases of the
  # integration spec prove it.
  @FE-2984 @AC-22 @guest @todo
  Scenario: A destroyed landing starts fresh
    Given the landing reached the activated state
    When the consumer destroys the landing and opens it again
    Then the new landing waits and sends nothing
