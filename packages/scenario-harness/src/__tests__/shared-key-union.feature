# Realized as a type-level suite — src/registry/__tests__/registry.types.test.ts.
# `@compile-time`: the Then is a compilation failure. `test:unit` runs
# `tsc -p tsconfig.test.json` over this suite, so the two committed
# `@ts-expect-error` fixtures (missing-key/extra-key) are enforced on every
# run; the rename mutation is proven by an ad hoc tsc pass over a scratch
# copy, not a committed failing file (renaming the real, committed key would
# break this whole suite's imports, not just one case).

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
