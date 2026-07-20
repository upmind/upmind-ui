@basket @promo @smoke
Feature: Apply a promo code to the basket
  As a customer building a basket
  I want to redeem a promo code
  So that I pay the discounted price at checkout

  # This is the reference example for the declarative style (ADR 020 Phase B).
  # It is documentation-only: there is no matching .spec.ts and it is never run.
  # Read it alongside tests/Playwright/docs/10-feature-style.md and use it as the
  # shape for real scenarios. Notice what is absent: no selectors, no URLs, no
  # click/type/fill/press. Every step says WHAT the customer wants, not HOW the
  # UI is driven.

  Background:
    Given the catalogue has a "Starter Hosting" product priced at 10.00 GBP

  Scenario: Valid percentage-off code reduces the basket total
    Given my basket contains 1 "Starter Hosting"
    When I apply the promo code "WELCOME10"
    Then the basket total is 9.00 GBP
    And the promo "WELCOME10" is shown as applied

  Scenario: Expired code is rejected with a clear message
    Given my basket contains 1 "Starter Hosting"
    When I apply the promo code "EXPIRED2025"
    Then I see the error "This code has expired"
    And the basket total remains 10.00 GBP
