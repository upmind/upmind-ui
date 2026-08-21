# The @AC-5 exemplar — proves the feature → catalog → world plumbing before
# any real module adopts the lane. The switch is a stand-in domain, not
# product behaviour.

@AC-4 @AC-5
Feature: Fixture switch exemplar
  As a developer proving the BDD plumbing end to end
  I want a minimal scoped module driven only through its declared behaviour
  So that the feature-to-engine wiring is proven before any real module adopts it

  Scenario: A fresh switch starts off
    Given a fresh fixture switch
    Then the switch reports itself as off

  Scenario: Turning the switch on updates its status
    Given a fresh fixture switch
    When the switch is turned on
    Then the switch reports itself as on

  Scenario: Labelling the switch sets its label status
    Given a fresh fixture switch
    When the switch is labelled "demo"
    Then the switch reports a label is set

  Scenario: Turning the switch off after it was on updates its status
    Given a fixture switch that is on
    When the switch is turned off
    Then the switch reports itself as off
