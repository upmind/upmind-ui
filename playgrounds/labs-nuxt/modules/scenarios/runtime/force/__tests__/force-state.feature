# force-state — the subsystem's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT: this is the sole copy the tests know about —
# the one feature-traceability.spec.ts reads, and the one the @anchor link is
# enforced against, both ways. The traceability gate scopes a feature to the
# specs in its OWN directory, so this file declares what the force lane proves.
# The capabilities force hands OUT — the menu that renders the offer, the canvas
# that names an armed preset, the page cache the swap clears — are proven in the
# component and composable lanes and belong to their own features, not this one.
#
# There is no actor x context matrix here. Force-state is labs-only dev tooling
# with no legacy oracle (parity.yaml: both cells NOT-SUPPORTED-IN-LEGACY,
# signoff operator-ruling-2026-08-27), so the actor throughout is the developer
# driving a scenario page.
#
# The governing principle: the module's own committed evidence decides what it
# can honestly be forced into. A state its feature declares that the recordings
# cannot answer is a capture gap with a name — never a silently absent button,
# and never an authored answer.

@FE-3113 @developer
Feature: Force-state offers each module only what its own recordings can answer

  A developer opens a scenario page and forces the module behind it into a
  state — loading, empty, a failed read, a refused write — to see how that
  state looks without waiting for the API to produce it. What is on offer
  varies by module, because what a module can honestly be forced into is
  measured from the recordings it committed, not from a list someone wrote.

  Background:
    Given I am driving a scenario page whose module publishes recordings

  @AC1 @layer-unit
  Scenario: Force reaches every module that publishes recordings
    When I force a state on any scenario page in the playground
    Then that module's own corpus answers it
    And no module is served the offer or the answers of a different one

  @AC2 @layer-unit
  Scenario: The offer is measured from the recordings, never read out of prose
    Given two modules whose features word the same state differently
    When I open the force picker on each
    Then each is offered exactly what its own recordings can answer
    And neither is starved of an offer because of how its feature is worded

  @AC5 @layer-unit
  Scenario: A state nothing recorded is not offered, and its absence is named
    Given a module declares a state its recordings cannot answer
    When I open the force picker for that module
    Then that state is not offered to me
    And the missing capture is reported by name, rather than left to look deliberate

  @AC-NA @layer-unit
  Scenario: No answer is ever authored on the module's behalf
    Given a module whose corpus records no refusal of its own
    When I ask what it can be forced into
    Then it offers no failed state at all
    And it is never handed a refusal no recording behind it ever produced

  @R6-19 @layer-unit
  Scenario: A failed read and a refused write are different states, both offered
    Given a module whose corpus records both a refused read and a refused write
    When I force the refused write
    Then the list I am reading keeps its rows, and only the write is refused
    And forcing the failed read instead fails the read alone, leaving the write as recorded

  @AC-REF @layer-unit
  Scenario: A refusal speaks in the API's own recorded words
    When I force a module's refused write
    Then I am shown a sentence one of that module's own recordings carries
    And never a sentence borrowed from another module or from a failed read

  @S13 @layer-unit
  Scenario: Empty is the recorded answer with its rows removed
    When I force a module's collection empty
    Then I am shown that module's own recorded envelope, holding no rows
    And a narrowed read stays narrowed, because the preset changed the answer and not the corpus

  @AC8.5 @layer-unit
  Scenario: Every answer served comes from the corpus
    When I force any state on a module
    Then every answer I am shown is one of that module's committed recordings
    And where no preset is armed the recordings are served exactly as committed

  @AC8.3 @layer-unit
  Scenario: Arming answers this module's own subject, and nothing else
    Given a module whose capture run also touched the app's chrome
    When I arm a preset on that module
    Then every endpoint belonging to the module's declared subject is answered
    And the chrome it merely touched still reaches the live API, so the app does not hang

  @AC3 @layer-unit
  Scenario: Armed is never reported before the answers are installed
    When I arm a module
    Then it reports armed only once that module's own answers are installed
    And a module nothing published is refused rather than reported armed

  @AC-ZCR @layer-unit
  Scenario: The force runtime names no module of its own
    When the force runtime is read end to end
    Then it quotes no module name, no module path, no endpoint and no cache key
    And every module it serves reaches it by discovery instead

  @S12 @layer-unit
  Scenario: A corpus that can answer nothing offers nothing
    Given a module whose corpus holds no recordings
    When I look for the force affordance on its page
    Then nothing is offered to me
    And the page stays live rather than pretending to be forced
