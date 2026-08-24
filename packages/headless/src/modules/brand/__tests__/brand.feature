@module-brand
Feature: Brand module
  As a storefront consumer
  I need to read brand identity, configuration, and entitlements
  So that I can configure the storefront correctly

  @AC-1 @layer-integration
  Scenario: Read brand settings returns identity bundle
    Given an initialised storefront
    When I read brand settings
    Then I receive the brand identity with currencies and languages

  @AC-2 @layer-integration
  Scenario: Read keyed brand config sends filter[keys|eq] on wire
    Given an initialised storefront
    And config keys to fetch
    When I fetch brand config for those keys
    Then the request contains filter[keys|eq] with the keys
    And the response contains values for the requested keys

  @AC-3 @layer-integration
  Scenario: Read organisation feature flags
    Given an initialised storefront
    When I read organisation config
    Then I receive the feature flags record

  @AC-4 @layer-integration
  Scenario: Check module entitlement
    Given an initialised storefront
    And a module code
    When I check module entitlement
    Then I receive a boolean indicating whether the module is enabled

  @AC-5 @layer-unit
  Scenario: Validate currency returns matched or brand default
    Given a brand currencies list
    And a currency input
    When I validate the currency
    Then I receive the matched currency or the brand default

  @AC-6 @layer-unit
  Scenario: Validate language returns matched or brand default
    Given a brand languages list
    And a language input
    When I validate the language
    Then I receive the matched language or the brand default

  @AC-7 @layer-unit
  Scenario: mapBrandConfig merges template with fetched values
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
