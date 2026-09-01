@module-basket-billing
Feature: Basket billing module
  As a storefront customer completing checkout
  I need to manage the billing details on my basket
  So that my order carries a valid billing address, company, and phone

  # --- Basket billing composable (useBasketBilling) ---

  @AC-1 @layer-unit
  Scenario: Set billing model without triggering an update
    Given a ready billing actor
    When I set a billing model
    Then the model is stored on the actor
    And no billing update is requested

  @AC-2 @layer-unit
  Scenario: Update billing model commits and settles
    Given a ready billing actor
    When I update the billing model
    Then the change is committed
    And the call resolves once the actor settles

  @AC-3 @layer-unit
  Scenario: Update billing model surfaces a failure
    Given a ready billing actor that will fail the update
    When I update the billing model
    Then the call rejects with a billing update error

  @AC-4 @layer-unit
  Scenario: Clear the billing details
    Given a ready billing actor holding a model
    When I clear the billing details
    Then the actor discards the stored model

  @AC-5 @layer-unit
  Scenario: Pause and resume billing validation
    Given a ready billing actor
    When I put billing into a wait state
    And I resume billing
    Then billing revalidates the details

  @AC-6 @layer-unit
  Scenario: Read the current billing readiness and requirements
    Given a billing actor that has loaded
    When I read the billing meta
    Then it reports availability, validity, and dirtiness
    And it reports whether address, company, and phone are required

  @AC-7 @layer-unit
  Scenario: Capture the initial billing snapshot
    Given a billing actor with a persisted base model
    When I capture the initial billing snapshot
    Then I receive the persisted base model

  # --- Unified billing-detail composable (useUnified) ---

  @AC-8 @layer-unit
  Scenario: Open a new personal billing detail
    Given no billing-detail type is specified
    When I open a unified billing detail
    Then a personal billing detail is prepared

  @AC-9 @layer-unit
  Scenario: Input a billing-detail model for validation
    Given an available unified billing detail
    When I input a billing-detail model
    Then the model is validated
    And the checked model is returned

  @AC-10 @layer-unit
  Scenario: Save a unified billing detail
    Given an available unified billing detail with changes
    When I save the billing detail
    Then the saved model is returned

  @AC-11 @layer-unit
  Scenario: Saving an invalid billing detail is rejected
    Given an available unified billing detail that will not validate
    When I save the billing detail
    Then the save rejects with a billing-detail error

  @AC-12 @layer-unit
  Scenario: Clear a unified billing detail
    Given an available unified billing detail holding a model
    When I clear the billing detail
    Then the billing-detail context is reset

  @AC-13 @layer-unit
  Scenario: Stop a unified billing detail
    Given a running unified billing detail
    When I stop the billing detail
    Then its service is torn down

  # --- Unified add() collaborator seam (crosses client-phone/company/address) ---

  @AC-14 @layer-integration
  Scenario: Business billing detail folds the phone into one company create
    Given a business billing-detail model with a phone
    When the billing detail is added
    Then the phone rides inside the single company create
    And no standalone phone create fires

  @AC-15 @layer-integration
  Scenario: Personal billing detail creates the phone once
    Given a personal billing-detail model with a phone
    When the billing detail is added
    Then the phone is created exactly once on its own
    And no company create fires

  @AC-16 @layer-integration
  Scenario: Personal billing detail creates the address directly
    Given a personal billing-detail model with an address
    When the billing detail is added
    Then the address is created from the model directly
