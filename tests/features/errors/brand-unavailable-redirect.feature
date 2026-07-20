@layer-e2e @FE-2793
Feature: An unavailable brand sends visitors to the Upmind platform

  A cart is always served for one brand, resolved from the domain the visitor
  arrived on. When that domain resolves to no configured brand there is no
  storefront to show, so rather than stranding the visitor on a broken shell the
  app abandons its own start-up and hands them straight to the central Upmind
  platform (FE-2554). This scenario covers that single user-visible promise: a
  visitor who lands on a domain with no brand behind it is taken to the Upmind
  platform instead of ever seeing the cart. Whether a brand counts as available,
  and the internal start-up short-circuit that performs the hand-off, are both
  covered at the lower layers.

  Scenario: A visitor on a domain with no configured brand is sent to the Upmind platform
    Given a visitor arrives on a domain that resolves to no configured brand
    When the cart starts up
    Then the visitor is sent to the Upmind platform instead of the cart
