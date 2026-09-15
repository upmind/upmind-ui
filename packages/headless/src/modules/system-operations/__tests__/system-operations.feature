# Module business-logic feature — systemOperations
#
# Non-executable. This is the module's behavioural source of truth: one scenario
# per capability the module promises. The module's unit and integration tests
# each name the @AC-<n> id of the scenario they prove; the co-located
# system-operations.traceability.test.ts fails on either side of that link
# breaking.
#
# Voice: system voice is intentional here — this broker has no human actor.
#
# Matrix cells. This module is NOT actor-scoped — it has no scope matrix and no
# per-actor arms. Its sole actor is the SYSTEM itself: any module registers a
# handler, and a funnel guard dispatches on return. The axis of variation is the
# operation lifecycle stage (parity.yaml contexts: create, return-signal, clear,
# dispatch, payload-transport, persist, handler-registry, handler-readiness,
# reactive-state, error-surface), so every scenario below carries @system.

Feature: systemOperations — a generic return-path operation registry

  A module stores an operation before an off-site redirect and gets back a short
  identifier (an oid). On return, a funnel guard dispatches the stored operation
  to the handler its owning module registered, hands the handler the stored
  payload, and surfaces the result. Operations are single-use and tab-scoped:
  they survive a same-tab refresh, they are never shared across tabs, and each
  one is removed the moment it settles.

  # ---------------------------------------------------------------------------
  # Create, persist, transport — a module stores an operation before redirect
  # ---------------------------------------------------------------------------

  @AC-1 @system @layer-unit
  Scenario: The system stores an operation and returns an identifier the caller can carry through a redirect
    Given a module has a payload it must resume after an off-site return
    When the module stores that operation under a handler key
    Then it receives a url-safe identifier it can carry through the redirect
    And the stored operation carries the key and payload it was given

  @AC-6 @system @layer-unit
  Scenario: A stored operation survives a same-tab page refresh
    Given a module has stored an operation in this tab
    When the tab is refreshed and the registry is rebuilt from persistence
    Then the operation is still retrievable by its identifier with the same payload

  @AC-7 @system @layer-unit
  Scenario: An operation is scoped to the tab that created it
    Given a module stores an operation in this tab
    When the operation is persisted
    Then nothing is written outside this tab's own per-tab storage
    And the module opens no cross-tab channel

  @AC-13 @system @layer-unit
  Scenario: A storage write failure is surfaced so the caller can abort the redirect
    Given the tab's per-tab storage rejects a write
    When a module tries to store an operation
    Then the storage failure surfaces to the caller before any redirect

  # ---------------------------------------------------------------------------
  # Handler registry and readiness — any module owns a return path
  # ---------------------------------------------------------------------------

  @AC-9 @system @layer-unit
  Scenario: A handler keeps its payload and result types from registration to dispatch
    Given a module registers a typed handler for a key
    When the operation for that key is dispatched
    Then the handler is invoked with the payload it was typed to expect
    And the dispatch resolves with the value the handler returns

  @AC-5 @system @layer-unit
  Scenario: A guard that returns before the handler module loads still dispatches
    Given a module stores an operation but its handler is not registered yet
    When the guard dispatches the operation and the handler registers a moment later
    Then the dispatch waits for readiness and then runs the handler with the stored payload

  # ---------------------------------------------------------------------------
  # Dispatch and clear — the return path runs once, then the operation is gone
  # ---------------------------------------------------------------------------

  @AC-2 @system @layer-unit
  Scenario: Dispatching an operation runs its handler and then removes it
    Given a module has registered a handler and stored an operation for it
    When the operation is dispatched
    Then the handler runs with the stored payload and the dispatch resolves with its result
    And the operation is removed once it settles

  @AC-3 @system @layer-integration
  Scenario: A returning guard dispatching an unknown identifier is told the operation is not found
    Given a guard returns with an identifier that names no stored operation in this tab
    When the guard dispatches that identifier
    Then the dispatch is refused as operation-not-found
    And the guard still strips the identifier from the return path

  @AC-4 @system @layer-unit
  Scenario: An operation whose handler never registers is refused and removed
    Given a module stored an operation but no module ever registers its handler
    When the guard dispatches the operation and the readiness window elapses
    Then the dispatch is refused as handler-not-found
    And the operation is removed

  @AC-10 @system @layer-unit
  Scenario: A handler that throws surfaces its own error, is removed, and records the failure
    Given a module registered a handler that fails and stored an operation for it
    When the operation is dispatched
    Then the dispatch rejects with the handler's own error
    And the operation is removed
    And the last error is recorded in reactive state

  @AC-11 @system @layer-unit
  Scenario: A second dispatch while one is in flight is refused and its operation is kept
    Given one operation is already being dispatched
    When a second operation is dispatched at the same time
    Then the second dispatch is refused as busy
    And the second operation is left intact for a later retry

  # ---------------------------------------------------------------------------
  # Reactive state — the lifecycle is observable
  # ---------------------------------------------------------------------------

  @AC-8 @system @layer-unit
  Scenario: Reactive state tracks pending, executing, and the last outcome
    Given a module has stored an operation
    When the operation is dispatched and then settles
    Then the pending list, the executing flag, and the current identifier follow the lifecycle
    And the last result reflects the settled outcome
