@orders @FE-3136 @flow:deep-link
Feature: Acting on an email deep link
  As a client who followed a link from an Upmind email
  I want the screen to open already doing what the link asked for
  So that I finish the job in one step

  Background:
    Given I am a signed-in client
    And I have an unpaid invoice

  @smoke
  Scenario: My invoice page shows me my own invoice
    Given I am looking at that invoice
    When the invoice finishes loading
    Then I see that invoice's own number and status

  @smoke
  Scenario: A pay deep link opens the payment surface on an unpaid invoice
    Given that invoice is unpaid
    When I follow a pay deep link to it
    Then I can pay that invoice from where I am

  Scenario: A pay deep link waits for the invoice before deciding
    Given that invoice has not finished loading
    When I follow a pay deep link to it
    Then nothing is decided until the invoice has loaded
    And the payment surface opens only once it has

  Scenario: A pay deep link on an invoice that is not paid still opens the payment surface
    Given that invoice is cancelled rather than paid
    When I follow a pay deep link to it
    Then I can pay that invoice from where I am
    And the deep-link instruction is no longer in the address bar

  Scenario: A pay deep link on a settled invoice opens nothing
    Given that invoice is already paid
    When I follow a pay deep link to it
    Then no payment surface is opened
    And the deep-link instruction is no longer in the address bar

  Scenario: A pay deep link that names no invoice opens nothing
    Given the link does not say which invoice it means
    When I follow it
    Then nothing is opened
    And the deep-link instruction is no longer in the address bar

  Scenario: A pay deep link to an invoice nobody can read opens nothing
    Given that invoice cannot be read
    When I follow a pay deep link to it
    Then nothing is opened
    And the deep-link instruction is no longer in the address bar

  Scenario: A pay deep link gives up on an invoice that never finishes loading
    Given that invoice never finishes loading
    When I follow a pay deep link to it
    Then nothing is opened once the screen has waited as long as it will
    And the deep-link instruction is no longer in the address bar

  Scenario: The deep-link instruction is spent once it has been acted on
    Given that invoice is unpaid
    When I follow a pay deep link to it
    Then the deep-link instruction is no longer in the address bar
    And it stays gone as I keep using the page
    And the page I am looking at was never reloaded

  Scenario: Following the same pay deep link again opens the same payment surface
    Given I have already followed that pay deep link
    When I follow the same one again
    Then I can pay that invoice from where I am
    And the deep-link instruction is no longer in the address bar

  Scenario: A page I reached with no deep-link instruction opens nothing
    Given that invoice is unpaid and no instruction came with the link
    When I arrive at it
    Then nothing is opened

  # @todo — proven ABSENT, 2026-09-10: the order page's own funnel state carries
  # no session gate, so a signed-out arrival is never asked to sign in there and
  # the instruction is spent on arrival instead. Raised at the FE-3136 test
  # hand-off; the upgrade half of the same capability IS delivered, below.
  @todo
  Scenario: A pay deep link survives signing in
    Given I am signed out
    When I follow a pay deep link to my unpaid invoice
    Then I am asked to sign in over that invoice
    And once I have signed in I can pay that invoice

  Scenario: An upgrade deep link survives signing in
    Given I am signed out
    When I follow an upgrade deep link to one of my products
    Then I am asked to sign in over that product
    And once I have signed in the upgrade surface is open over it

  Scenario: A deep link survives the app moving me onto my own scoped page
    Given the app moves me onto my own scoped page as I arrive
    When I follow a pay deep link to my unpaid invoice
    Then the deep-link instruction comes with me
    And the words the sign-in journey owns are left behind

  Scenario: An upgrade deep link opens the upgrade surface on a product
    Given I am looking at one of my products
    When I follow an upgrade deep link to it
    Then the upgrade surface is open over the product
    And the deep-link instruction is no longer in the address bar

  Scenario: A deep-link instruction nobody recognises is ignored safely
    Given I am looking at that invoice
    When I follow a deep link carrying an instruction nobody recognises
    Then nothing is opened
    And nothing fails
    And the deep-link instruction is no longer in the address bar

  Scenario: The order page a pay deep link opens over still shows its own invoice
    Given I am looking at that invoice's order page
    When it finishes loading
    Then I see that invoice's own number
    And the part of the page where I pay it is still there
