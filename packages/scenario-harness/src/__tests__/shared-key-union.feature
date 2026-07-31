# Realized as a type-level suite — src/registry/__tests__/registry.types.test.ts
# (bdd.md "One shared composable key union"). `@compile-time`: the Then is a
# compilation failure, proven by a tsc pass over the `@ts-expect-error`
# fixtures (scenarios 2-3, committed) and a tsc transcript at read-back time
# for the rename mutation (scenario 1, not a committed failing file).

@AC-6 @compile-time
Feature: One shared composable key union
  As a developer renaming a module key
  I want every consumer of the key to fail compilation at once
  So that key drift between executors is impossible, not just unlikely

  Scenario: Renaming a manifest key fails compilation everywhere
    Given both executor registries and a steps fixture typed against the shared key union
    When a key in the shared manifest is renamed
    Then compilation fails in each executor registry
    And compilation fails in the steps fixture

  Scenario: An executor registry missing a manifest key fails compilation
    Given an executor registry declared against the shared registry contract
    When the registry omits a manifest key
    Then compilation fails naming the missing key

  Scenario: An executor registry with a key outside the manifest fails compilation
    Given an executor registry declared against the shared registry contract
    When the registry adds a key the manifest does not define
    Then compilation fails naming the extra key
