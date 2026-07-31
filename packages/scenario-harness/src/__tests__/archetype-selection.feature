# Realized as unit tests over `classify()` — src/archetype/__tests__/archetype.test.ts
# (bdd.md "Archetype selection", FE-2976 SDD). This file is the declarative
# spec; the vitest suite is the executable form (bdd.md Execution mapping).

@AC-3
Feature: Archetype selection is deterministic and structural
  As a developer validating a business module
  I want the module's snapshot classified by structure alone
  So that the right validation surface appears without a manifest

  Scenario: A schema-and-model module is classified Form-Flow
    Given a reflected snapshot whose context carries a structurally real JSON schema and a model
    When the snapshot is classified
    Then the archetype is Form-Flow

  Scenario: A module that owns table state is classified List
    Given a reflected snapshot from a port carrying a controlled-table channel
    When the snapshot is classified
    Then the archetype is List

  Scenario: A collection module without a schema is classified List
    Given a reflected snapshot whose context data is a collection and whose context carries no schema
    When the snapshot is classified
    Then the archetype is List

  Scenario: A single-record module without a real schema is classified Detail
    Given a reflected snapshot whose context carries a model and no structurally real schema
    When the snapshot is classified
    Then the archetype is Detail

  Scenario: A bag of callables is classified Action-panel
    Given a reflected snapshot carrying actions but neither schema, model, collection data nor table state
    When the snapshot is classified
    Then the archetype is Action-panel

  Scenario: A boolean-bag uischema is not mistaken for a form
    Given a reflected snapshot whose uischema is a bag of booleans and whose context carries no real schema
    When the snapshot is classified
    Then the archetype is not Form-Flow

  Scenario: A context key merely named like uischema is never inspected by name
    Given a reflected snapshot carrying keys named like uischema whose values are not schemas
    When the snapshot is classified
    Then the archetype is not Form-Flow

  Scenario: No structural match falls back to Action-panel with auditable signals
    Given a reflected snapshot matching no structural signal
    When the snapshot is classified
    Then the archetype is Action-panel
    And every evaluated signal is recorded on the decision
    And no error is raised

  Scenario: The same snapshot always classifies the same way
    Given one reflected snapshot
    When it is classified repeatedly
    Then every decision is identical

  Scenario: A later snapshot may legitimately change the archetype
    Given an early snapshot taken before the module's machine assigns its schema
    And a later snapshot taken after the schema is assigned
    When each snapshot is classified
    Then the early decision is Action-panel and the later decision is Form-Flow
