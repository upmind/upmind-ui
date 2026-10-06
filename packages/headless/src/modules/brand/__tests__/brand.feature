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

  # FE-3237 AC5. Blocker: the brand module has no replay test, so no
  # scenario can drive useBrand over a recorded session. The unit spec
  # brand.show-store.test.ts proves the rule (describe "AC-9: store visibility").
  @AC-9 @layer-unit @todo
  Scenario: The store shows only when my brand's display mode and my session allow it
    Given my brand sets how the store shows
    When I read the brand as an anonymous guest, a signed-in client or a staff member
    Then the store shows when the mode is unset or show, never when it is hide
    And when the mode is show-to-signed-in, it shows to a client or a staff member and not to an anonymous guest
