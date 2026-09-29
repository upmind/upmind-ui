@FE-2864
Feature: Pages keep their arrangement and their parts when the host app supplies them
  As a visitor or a client of a brand
  I want the sign-in, registration and browse pages to look and behave as they do today
  So that moving page arrangements and page parts to the host page changes nothing I can see

  @FE-2864 @layer-e2e @smoke
  Scenario Outline: The sign-in pages show in the brand's chosen arrangement
    Given the brand's sign-in pages use the "<arrangement>" arrangement
    When the visitor opens the <screen> page in <host>
    Then the <screen> form is shown in the "<arrangement>" arrangement

    Examples:
      | host                        | screen            | arrangement |
      | the cart                    | sign-in           | two-column  |
      | the cart                    | registration      | split       |
      | the cart                    | password recovery | enclosed    |
      | the stand-alone sign-in app | sign-in           | two-column  |
      | the stand-alone sign-in app | registration      | split       |
      | the stand-alone sign-in app | password recovery | enclosed    |

    @manual
    Examples:
      | host          | screen            | arrangement |
      | the Nuxt cart | sign-in           | two-column  |
      | the Nuxt cart | registration      | split       |
      | the Nuxt cart | password recovery | enclosed    |
      | the portal    | sign-in           | two-column  |
      | the portal    | registration      | split       |
      | the portal    | forgotten password | enclosed   |

  @FE-2864 @layer-e2e
  Scenario: Guests see the basket summary beside the sign-in form
    Given a guest visitor with a product in their basket
    And the brand shows the basket summary on its sign-in pages
    When the visitor opens the sign-in page
    Then the basket summary is shown beside the sign-in form
    And the summary lists the product in their basket

  @FE-2864 @layer-e2e
  Scenario: The guest checkout option is offered when every condition holds
    Given a guest visitor with a one-off product in their basket
    And the brand allows guest checkout
    When the visitor opens the register page
    Then the guest checkout option is offered

  @FE-2864 @layer-e2e
  Scenario: The guest checkout option is hidden when the brand does not allow guest checkout
    Given a guest visitor with a one-off product in their basket
    And the brand does not allow guest checkout
    When the visitor opens the register page
    Then no guest checkout option is offered

  @FE-2864 @layer-e2e
  Scenario: The guest checkout option is not offered for a basket with a subscription product
    Given a guest visitor with a subscription product in their basket
    And the brand allows guest checkout
    When the visitor opens the register page
    Then no guest checkout option is offered

  @FE-2864 @layer-e2e
  Scenario: The guest checkout option is not offered to a client who is signed in
    Given a signed-in client with a one-off product in their basket
    And the brand allows guest checkout
    When the client opens the register page
    Then no guest checkout option is offered

  @FE-2864 @layer-e2e @manual
  Scenario Outline: The portal's <screen> page shows the brand's own chrome
    Given the brand shows a shortcut to its store
    When the visitor opens the portal's <screen> page
    Then the <screen> form is shown
    And the brand's wordmark and footer are shown
    And the store shortcut is offered

    Examples:
      | screen             |
      | sign-in            |
      | registration       |
      | forgotten password |

  @FE-2864 @layer-e2e @manual
  Scenario Outline: The brand's note shows once on the portal's <screen> page
    Given the brand has written a note for its <screen> screen
    And the brand's sign-in pages use the "<arrangement>" arrangement
    When the visitor opens the portal's <screen> page
    Then the brand's note is shown once

    Examples:
      | screen       | arrangement |
      | sign-in      | split       |
      | sign-in      | canvas card |
      | sign-in      | surface box |
      | sign-in      | two-column  |
      | registration | split       |
      | registration | two-column  |

  @FE-2864 @layer-e2e @manual
  Scenario Outline: The store shortcut follows the brand's store on every logged-out page
    Given <store>
    When the visitor opens the portal's <page> page
    Then <offer>

    Examples:
      | store                                     | page           | offer                                               |
      | the brand sells in the portal             | sign-in        | the store shortcut opens the portal's own catalogue |
      | the brand sells in the portal             | reset password | the store shortcut opens the portal's own catalogue |
      | the brand runs its own storefront         | sign-in        | the store shortcut opens the brand's storefront     |
      | the brand runs its own storefront         | reset password | the store shortcut opens the brand's storefront     |
      | the brand sells nothing here              | sign-in        | no store shortcut is offered                        |

  @FE-2864 @layer-e2e @manual
  Scenario: A new client can register in the portal
    Given the brand allows registration in the portal
    When a visitor registers in the portal with valid details
    Then a client account is created for them

  @FE-2864 @layer-e2e @manual
  Scenario: A client who signs in to the portal lands on its home page
    Given a client with an account in the portal
    When the client signs in on the portal's sign-in page
    Then the portal's home page is shown

  @FE-2864 @layer-e2e @manual
  Scenario: The portal starts no guest session
    Given a visitor who is not signed in
    When the visitor opens the portal's sign-in page
    Then no guest session is started for them
