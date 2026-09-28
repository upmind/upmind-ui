@module-brand
Feature: Brand module
  As a storefront consumer
  I need to read brand identity, configuration, and entitlements
  So that I can configure the storefront correctly

  @AC-1 @layer-integration
  Scenario: I see the shop's own name, logo and colours
    Given an initialised storefront
    When I read brand settings
    Then I receive the brand identity with currencies and languages

  @AC-2 @layer-integration
  Scenario: Only the settings the page asked for are fetched
    Given an initialised storefront
    And config keys to fetch
    When I fetch brand config for those keys
    Then no settings beyond the ones asked for come back
    And the response contains values for the requested keys

  @AC-3 @layer-integration
  Scenario: The shop offers only the features it has turned on
    Given an initialised storefront
    When I read organisation config
    Then I receive the feature flags record

  @AC-4 @layer-integration
  Scenario: A feature the shop is not entitled to is not offered
    Given an initialised storefront
    And a module code
    When I check module entitlement
    Then I receive a boolean indicating whether the module is enabled

  @AC-5 @layer-unit
  Scenario: I am shown prices in a currency the shop accepts, or in its default
    Given a brand currencies list
    And a currency input
    When I validate the currency
    Then I receive the matched currency or the brand default

  @AC-6 @layer-unit
  Scenario: I am shown the shop in a language it offers, or in its default
    Given a brand languages list
    And a language input
    When I validate the language
    Then I receive the matched language or the brand default

  @AC-7 @layer-unit
  Scenario: A setting the shop has not changed keeps its default
    Given a config template with null defaults for requested keys
    And fetched config values from the API
    When mapBrandConfig is called
    Then fetched values override the template nulls
    And missing keys remain null

  @AC-8 @layer-unit
  Scenario: mapBrandSettings transforms i18n structure
    Given raw brand settings with key-first i18n
    When mapBrandSettings is called
    Then i18n is transformed to locale-first structure

  # The AC id is FE-3237 AC17 (design D-17), shared with the client-orders
  # feature so both features trace to one criterion.
  @AC-17 @FE-3237 @layer-integration
  Scenario: The brand publishes the one-time-purchases condition for the order history
    Given a brand that sets its one-time purchases to hidden, to shown, or not at all
    When the order history reads the brand's one-time-purchases setting
    Then the brand publishes the condition for the hidden, the shown and the absent value
