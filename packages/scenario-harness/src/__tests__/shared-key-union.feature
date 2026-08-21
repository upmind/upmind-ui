# Realized as a type-level suite — src/registry/__tests__/registry.types.test.ts.
# `@compile-time`: the Then is a compilation failure. `test:unit` runs
# `tsc -p tsconfig.test.json` over this suite, so the two committed
# `@ts-expect-error` fixtures (missing-key/extra-key) are enforced on every
# run; the rename mutation is proven by an ad hoc tsc pass over a scratch
# copy, not a committed failing file (renaming a manifest key after a
# registry has bound against it breaks every construction site bound to that
# key at once, by construction). The registry contract is generic — the
# package ships no manifest of its own; every consumer supplies its own
# key union at construction time, and this proof holds for any manifest a
# consumer supplies, not one baked into the package.

@AC-6 @compile-time
Feature: A registry stays exhaustive against its own manifest
  As a developer maintaining my own module-key manifest
  I want every registry I construct against it to fail compilation the moment it drifts
  So that key drift across my own construction sites is impossible, not just unlikely

  Scenario: Renaming a manifest key fails compilation at every site bound against it
    Given a manifest and every registry constructed against its key union
    When a key in that manifest is renamed
    Then compilation fails at each construction site still bound to the old key

  Scenario: A registry missing a manifest key fails compilation
    Given a registry declared against its own manifest's key union
    When the registry omits a manifest key
    Then compilation fails naming the missing key

  Scenario: A registry with a key outside the manifest fails compilation
    Given a registry declared against its own manifest's key union
    When the registry adds a key the manifest does not define
    Then compilation fails naming the extra key
