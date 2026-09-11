@module-basket-billing
Feature: Basket billing module
  As a storefront customer completing checkout
  I need to manage the billing details on my basket
  So that my order carries a valid billing address, company, and phone

  # --- Basket billing composable (useBasketBilling) ---

  @AC-1 @layer-unit
  Scenario: I enter how I am billed without it being saved yet
    Given a ready billing actor
    When I set a billing model
    Then the model is stored on the actor
    And no billing update is requested

  @AC-2 @layer-unit
  Scenario: I save how I am billed, and it sticks
    Given a ready billing actor
    When I update the billing model
    Then the change is committed
    And the call resolves once the actor settles

  @AC-3 @layer-unit
  Scenario: Update billing model surfaces a failure
    Given a ready billing actor that will fail the update
    When I update the billing model
    Then the call rejects with a billing update error

  @AC-4 @AC-12 @layer-unit
  Scenario: I clear my billing details back to empty
    Given a ready billing actor holding a model
    When I clear the billing details
    Then the actor discards the stored model
    Given an available unified billing detail holding a model
    When I clear the billing detail
    Then the billing-detail context is reset

  @AC-5 @layer-unit
  Scenario: I am not nagged about my billing details while I am still entering them
    Given a ready billing actor
    When I put billing into a wait state
    And I resume billing
    Then billing revalidates the details

  @AC-6 @layer-unit
  Scenario: I can see whether my billing details are complete, and what is still missing
    Given a billing actor that has loaded
    When I read the billing meta
    Then it reports availability, validity, and dirtiness
    And it reports whether address, company, and phone are required

  @AC-7 @layer-unit
  Scenario: I can get back to the billing details I started with
    Given a billing actor with a persisted base model
    When I capture the initial billing snapshot
    Then I receive the persisted base model

  # --- Unified billing-detail composable (useUnified) ---

  @AC-8 @layer-unit
  Scenario: I start entering billing details for myself
    Given no billing-detail type is specified
    When I open a unified billing detail
    Then a personal billing detail is prepared

  @AC-9 @layer-unit
  Scenario: I enter my billing details and see what is wrong before I save
    Given an available unified billing detail
    When I input a billing-detail model
    Then the model is validated
    And the checked model is returned

  @AC-10 @layer-unit
  Scenario: I save my billing details, whether they are mine or my company's
    Given an available unified billing detail with changes
    When I save the billing detail
    Then the saved model is returned

  @AC-11 @layer-unit
  Scenario: Saving an invalid billing detail is rejected
    Given an available unified billing detail that will not validate
    When I save the billing detail
    Then the save rejects with a billing-detail error

  @AC-13 @layer-unit
  Scenario: I leave my billing details, and the form lets go of what it held
    Given a running unified billing detail
    When I stop the billing detail
    Then its service is torn down

  # --- Unified add() collaborator seam (crosses client-phone/company/address) ---

  @AC-14 @layer-integration
  Scenario: My company's billing details are saved in one go, phone included
    Given a business billing-detail model with a phone
    When the billing detail is added
    Then the phone rides inside the single company create
    And no standalone phone create fires

  @AC-15 @layer-integration
  Scenario: My phone number is saved once, not twice
    Given a personal billing-detail model with a phone
    When the billing detail is added
    Then the phone is created exactly once on its own
    And no company create fires

  @AC-16 @layer-integration
  Scenario: My address is saved as my address, not as a company's
    Given a personal billing-detail model with an address
    When the billing detail is added
    Then the address is created from the model directly

  # --- Basket-billing seam load (the real basket machine spawns billing) ---

  @AC-17 @layer-integration @client
  Scenario: A logged-in client loads their existing basket
    Given a logged-in client with an existing basket of their own
    When the client loads that basket
    Then the billing seam for that basket becomes available

  @AC-18 @layer-integration @client
  Scenario: Another client cannot load a basket that is not theirs
    Given a logged-in client
    And a basket that belongs to a different client
    When the client tries to load that basket
    Then the load is denied
    And the billing seam never becomes available

  @AC-19 @layer-integration @client
  Scenario: An unclaimed basket loads but never brings billing up
    Given a logged-in client
    And an unclaimed basket that belongs to no client
    When the client loads that basket
    Then the basket becomes ready for shopping
    And the billing seam never becomes available
