@FE-2864
Feature: The domain search in the catalogue
  As a guest visitor browsing a domain category
  I want the domain search in the catalogue
  So that I can find a domain name without leaving the page

  @FE-2864 @layer-e2e
  Scenario: A domain category shows the domain search in the catalogue
    Given the brand's catalogue has a category set to show the domain search
    When the visitor browses that category
    Then the visitor can search for a domain name in the catalogue

  @FE-2864 @layer-e2e
  Scenario: A product category shows no domain search in the catalogue
    Given the brand's catalogue has a category not set to show the domain search
    When the visitor browses that category
    Then the category's products are listed
    And no domain search is shown
