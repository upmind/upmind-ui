@layer-e2e @FE-2790
Feature: Auth overlay exit paths

  The sign-in overlay (FE-1365) is a deep-linkable overlay layered over the page
  a visitor was on. The existing coverage proves the way IN — a visitor can open
  it and sign in — but never the way OUT: leaving the overlay must close it and
  restore the page underneath. These scenarios cover the exit paths the overlay
  actually offers: going back restores the page it was opened over; signing in
  hands the visitor on to the page they should return to; and, cold-loaded from
  a fresh link, the overlay still renders. The email-verification overlay is the
  one exception — it is deliberately locked so a visitor cannot escape the
  verification step. The route wiring, container choice and derived state stay at
  the unit layer.

  Scenario: Going back closes an auth overlay and returns to the underlying page
    Given a visitor on a product page
    And they have opened the sign-in overlay over that page
    When they go back
    Then the sign-in overlay is no longer shown
    And they are returned to the product page

  Scenario: Signing in from the auth overlay returns the visitor to the return target
    Given a visitor at the sign-in overlay that carries a return target
    When they sign in with valid credentials
    Then the sign-in overlay is no longer shown
    And they are taken to the return target

  Scenario: The sign-in overlay renders when it is opened directly
    Given a visitor who arrives directly at the sign-in overlay
    When the page has finished loading
    Then the sign-in overlay is shown

  Scenario: Opening a saved basket while signed out sends the visitor to the sign-in overlay, then back
    Given a signed-out visitor with a saved basket
    When they open that basket
    Then they are shown the sign-in overlay over that basket
    And signing in with valid credentials returns them to that same basket

  Scenario: The email-verification overlay cannot be dismissed
    Given a customer who must verify their email before checking out
    And they are shown the email-verification overlay
    When they attempt to dismiss it
    Then the email-verification overlay remains open
