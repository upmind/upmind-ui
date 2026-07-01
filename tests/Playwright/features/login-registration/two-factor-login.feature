@layer-e2e @journey:two-factor-login
Feature: Customer logs in with two-factor authentication

  A customer whose account has two-factor authentication (2FA) enabled must
  complete a second verification step after entering their password before
  they are granted access to their account.

  Scenario: Customer with 2FA enabled is prompted for a verification code
    Given a customer with 2FA enabled on their account
    When they log in with valid credentials
    Then they are prompted to enter a verification code
    And they are not yet logged in to their account

  Scenario: Customer completes 2FA with a valid code
    Given a customer with 2FA enabled has entered their credentials
    And they have been prompted for a verification code
    When they enter a valid verification code
    Then they are logged in to their account
    And they are taken to their account dashboard

  Scenario: 2FA fails with an incorrect code
    Given a customer with 2FA enabled has entered their credentials
    And they have been prompted for a verification code
    When they enter an incorrect verification code
    Then they are shown an error and remain on the verification step
    And they are not logged in

  Scenario: Customer without 2FA logs in directly
    Given a customer who does not have 2FA enabled on their account
    When they log in with valid credentials
    Then they are logged in immediately without a verification step
    And they are taken to their account dashboard
