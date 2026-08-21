# TEMPLATE FILE (EXTENSION) — doctrine wins over this fragment and the one
# built pair it cites. Authority: the module's own `{module}.feature`, which
# lane 1 AUTHORS. A disagreement between this fragment and that file is a
# surfaced finding, never silently resolved toward either.
#
# Reference: `packages/headless/src/modules/client-email/__tests__/` — the one
# built feature/catalog pair, read while authoring, never a match target.
#
# APPENDED by the PROVER seat to the module's existing
# `packages/headless/src/modules/<module>/__tests__/<module>.feature`, at the
# END of the file, under its existing `Feature:` keyword.
#
# This is a FRAGMENT and asserts nothing about the rest of that file. It opens
# no second `Feature:`, adds no `Background:` (one appended at the end would
# govern scenarios that are not this lane's), deletes no scenario and narrows
# no capability. Rephrasing an existing scenario so a step can match it is the
# one edit this lane makes in place — additive, never destructive, and never a
# claim of authorship.
#
# Where the module's feature already carries a `Background:`, its steps run in
# front of every scenario below, so the sibling catalog defines those too — a
# background step nobody implements makes every appended scenario read as
# driveable while silently being half-matched, which the traceability gate
# fails.
#
# ONE scenario per actor×context cell the page offers. Declarative only: no
# selector, no url, no UI mechanic — the steps reach the module through the
# `World` members and nothing else. Every step below resolves in the sibling
# `{module}.steps.ts`, and the two are each other's gate.
#
# The tag is the module's own STORY tag. This lane mints no `@AC-*`: acceptance
# criteria come from the story, and a page derived from a landed module would
# be inventing them.

  @FE-0000 @layer-e2e @smoke
  Scenario: A client sees their own module collection
    Given the modules playground is generated for the active client
    Then the collection holds 2 items

  @FE-0000 @layer-e2e
  # A track that WRITES ends on the collection the user can see, never on the
  # absence of an error — "reports no failure" is green while the surface shows
  # exactly what it showed before (operator ruling 2026-08-13). Pattern:
  #
  #   Scenario: A client adds a module
  #     When the client adds the module "mock-module-9"
  #     Then the collection reports no failure
  #     And the collection holds 4 items
  #     And "mock-module-9" is listed

  Scenario: A client refreshes their module collection
    Given the modules playground is generated for the active client
    When the client refreshes the collection
    Then the collection holds 2 items
    And the collection reports no failure

  @FE-0000 @layer-e2e
  Scenario: Staff acting for a client read that client's module collection
    Given a staff member acting for that client
    Then the collection holds 2 items
