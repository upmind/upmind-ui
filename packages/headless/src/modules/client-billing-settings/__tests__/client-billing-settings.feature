# client-billing-settings — the module's ONE feature file: its capability spec, the source
# `client-billing-settings.steps.ts` implements, and the playlist the scenario bar plays.
#
# CO-LOCATION IS THE REQUIREMENT: this file lives at
#   packages/headless/src/modules/client-billing-settings/__tests__/client-billing-settings.feature
# and it is the only spec this module's tests know.
#
# ONE SCENARIO PER CAPABILITY (operator ruling 2026-09-24, ADR 035 Amendment 1). A capability
# that can be driven carries its `@AC-N` tag on the DRIVEN `@layer-e2e` scenario, and there is
# no second declarative twin. A capability nothing can yet drive keeps ONE declarative scenario,
# `@todo`, with the named blocker in the comment above it.
#
# EXECUTED per ADR-020 Amendment 5 / ADR 035. A scenario the step catalog matches is driveable:
# it runs against this module's own scenario recordings, step by step, and appears as a track. A
# `@todo` scenario is written down and not yet driven — a legitimate state.
#
# Business language only, declarative only: no selector, URL or UI mechanic appears here, and
# the steps that drive it reach the module through the `World` members and nothing else.
#
# One resolving cell (client x settings — ADR-001; cited, not restated). Two composables share
# the cell: the read half (`useBillingSettings`) and the `dataManagerMachine`-backed editor half
# (`useBillingSettingsManager`). There is no staff cell (Dropped-with-Linear-issue, FE-3137) and
# no guest cell (NOT-SUPPORTED-IN-LEGACY). The driven scenarios boot the editor half, which loads
# the record on entry, so a read capability and an edit capability are both driven through it.
#
# Token, transport and auth-header behaviour belong to the `query`, `session-store` and `auth`
# modules, not to this module (operator ruling 2026-09-24) — the `@todo` blockers below name
# those cases as MOVED where they belong to a platform seam this module only consumes.
#
# Four wire-body / request-count / form-schema facts are NOT capabilities (ADR 035 Amendment 1)
# and carry no scenario here: the explicit-off body (was AC-18) and the diff-only body (was AC-12)
# are proven by `client-billing-settings.write-body.test.ts` over `mapIBillingSettingsFields`; the
# no-op save's empty diff (was AC-11) by the same file; the currency-choice ordering and own-currency
# append (was AC-24) is a form-schema / lookups fact carried by the service seam, recorded in
# `DECISIONS.md`, not a driven scenario.
#
# One driven scenario per @AC-* tag, EXCEPT AC-23 (the currency-choice gate),
# which is split one scenario per gate state (operator option B, FE-3145): both
# scenarios carry @AC-23, each with its own staff-arranged recording, so neither
# needs a mid-scenario cache clear. AC-17 stays @todo — see its comment.

@module:client-billing-settings @variant:hybrid @cell:client-settings @FE-3145
Feature: A client reads and manages their own invoice-consolidation preference

  A client has exactly one invoice-consolidation preference: whether consolidation is on, off,
  or follows their brand, the base rule it runs on, and the cadence details for that rule. They
  read it and they edit it, on their own client record, under their own identity.

  Background:
    Given I am an authenticated client
    And every request I make about my consolidation preference is addressed to my own client record

  # === READING MY PREFERENCE ====================================================

  @AC-1 @read @layer-e2e @smoke
  Scenario: My preference shows my actual saved values, addressed to my own record
    Given I hold saved values for consolidation, its base rule, and its cadence
    When I read my consolidation preference
    Then the five values I see are the ones actually saved against my own record
    And nothing outside this module can make that read address a different client's record

  @AC-2 @read @moved
  # @moved: the re-read on a `.for(client, id)` target change is query / scope-builder
  # reactivity, proven in the query and scope modules, not here (operator rule 2026-09-24).
  Scenario: My preference is re-read when the client record it addresses changes
    Given I have already read one client's consolidation preference
    When the client record my preference addresses changes to a different one
    Then what I see is that new client's saved values, not the previous client's

  @AC-19 @read @moved
  # @moved: sharing one client-record read across readers with no extra request is `query`'s
  # cache-dedupe, proven in the query module, not here (operator rule 2026-09-24).
  Scenario: Reading my preference shares my client record with other readers at no extra cost
    Given something else in the app is also reading my client record at the same time
    When I read my consolidation preference alongside them
    Then no extra request is made to read my client record on my behalf
    And what the other reader sees of my client record is unchanged by my own read

  # === CHANGING MY PREFERENCE ===================================================

  @AC-3 @write @layer-e2e
  Scenario: I can turn consolidation on, off, or set it to follow my brand
    Given I have opened my consolidation preference in the editor
    When I choose to turn consolidation on, off, or to follow my brand, and save
    Then the state I saved is exactly the state I chose, never a different one

  @AC-4 @write @layer-e2e
  Scenario: I can choose a base rule for my consolidation cadence, or follow my brand's
    Given I have opened my consolidation preference in the editor
    When I choose a base rule and save, and later clear that choice and save again
    Then my chosen rule is saved when I chose one
    And clearing it is saved as an explicit choice to follow my brand's rule, not left unspecified

  @AC-5 @write @layer-e2e
  Scenario: I can choose which day of the week my weekly cadence runs on, or follow my brand's
    Given my base rule is a weekly cadence
    When I choose a day of the week and save, and later clear that choice and save again
    Then my chosen day is saved when I chose one
    And clearing it is saved as an explicit choice to follow my brand's day, not left unspecified

  @AC-6 @write @layer-e2e
  Scenario: I can choose which day of the month my monthly cadence runs on, or restore my brand's default
    Given my base rule is a monthly cadence
    When I choose a valid day of the month and save, and later restore the default and save again
    Then my chosen day is saved when I chose a valid one
    And restoring the default is saved as an explicit choice to follow my brand's day, not left unspecified
    And choosing a day outside the valid range is refused before I can save it

  # The due-date field is drawn only for a monthly rule on a never-suspended client. Staff sets
  # never_suspend on the shared client (admin route), the monthly rule is arranged, the boot +
  # due-date save/clear are recorded, and never_suspend is restored (FE-3145).
  @AC-7 @write @layer-e2e
  Scenario: I can choose the day my invoice is due, or leave it at the earliest available day
    Given I have opened my consolidation preference in the editor as a client whose services are never suspended
    When I choose a valid due-date day and save, and later clear that choice and save again
    Then my chosen due-date day is saved when I chose a valid one
    And clearing it is saved as an explicit choice for the earliest available day, not left unspecified
    And choosing a due-date day outside the valid range is refused before I can save it

  # === EDITING SAFELY ============================================================

  @AC-8 @manager @layer-e2e
  Scenario: I am told when I have unsaved changes, compared against what was last loaded
    Given I have opened my consolidation preference in the editor
    When I change a value, and later set that value back to what was loaded
    Then I am told I have unsaved changes only while a value differs from what was last loaded

  @AC-9 @manager @layer-e2e
  Scenario: I can abandon my unsaved changes and get back exactly what was last loaded
    Given I have changed several values in my consolidation preference editor without saving
    When I discard those changes
    Then I see exactly the values that were last loaded
    And discarding them made no request to save or reload anything

  @AC-10 @manager @layer-e2e
  Scenario: I cannot save an invalid value — the save is refused and nothing is sent
    Given I have set one of my consolidation values to something outside its valid range
    When I try to save
    Then the save is refused
    And no request to save anything is made

  @AC-13 @manager @layer-e2e
  Scenario: While my save is in progress, every control is unavailable, and recovers once the save settles
    Given I have started saving a change to my consolidation preference
    When the save is still in progress
    Then every control in my editor reports itself unavailable to edit
    And once the save settles, whether it succeeded or failed, every control becomes available again

  @AC-16 @read @moved
  # @moved: the read error state and its retry-into-success are `query`'s fetch lifecycle,
  # proven in the query module, not here (operator rule 2026-09-24).
  Scenario: A failed read tells me it failed, and I can retry it into success
    Given loading my consolidation preference fails
    When I wait for it to be ready
    Then I am told it is not ready, with the failure visible to me, rather than waiting forever
    And when I retry, a successful load lands my actual saved values

  # === HONEST AVAILABILITY =======================================================

  @AC-17 @availability @restrict-gate @layer-e2e
  Scenario: My preference surface is hidden unless my brand has explicitly opted clients in
    Given my brand has not explicitly turned on client-managed consolidation
    When I look for my consolidation preference surface
    Then it is hidden from me
    And it only becomes visible once my brand explicitly turns it on for clients

  # === READING MY ACCOUNT'S CURRENCIES ==========================================

  @AC-20 @read @currency-gate @layer-e2e
  Scenario: I can see the currency my account bills in, and my preferred payment currency if I have one
    Given I hold a real account with a billing currency, addressed as my own
    When I read my account's currencies
    Then I see the currency my account actually bills in
    And I see my preferred payment currency exactly when one is actually set, never a substitute for it

  # === CHANGING MY ACCOUNT'S CURRENCIES =========================================

  @AC-21 @write @currency-gate @layer-e2e
  Scenario: I can choose a preferred payment currency for my account, and clear it again
    Given my brand lets me pay in a different currency than my account bills in
    When I choose a preferred payment currency and save, and later clear that choice and save again
    Then my chosen payment currency is recorded against my own account when I chose one
    And clearing it is recorded as an explicit choice to have no preferred payment currency, not left unspecified
    And saving with no change to either currency makes no request at all

  @AC-22 @write @currency-gate @layer-e2e
  Scenario: I can change the currency my account bills in
    Given I have opened my account's currencies in the editor
    When I change the currency my account bills in and save
    Then the new billing currency is recorded against my own account
    And changing both my billing currency and my preferred payment currency together saves them in one request

  # AC-23 is split one scenario per gate state (operator option B): the brand gate
  # `billing.payment_currencies.enable_different_currency_payment` is staff-arranged
  # per scenario (FE-3145), recorded, and reset. "Not offered" is the ABSENCE of the
  # preferred-payment-currency field from the model, asserted as an expected `null`
  # (the World matcher reads `null` as absent/cleared —
  # `expectContext({ model: { preferredPaymentCurrencyId: null } })`); "offered" is
  # its presence in the schema. The consolidation surface stays shown either way.
  @AC-23 @availability @layer-e2e
  Scenario: My preferred payment currency choice is not offered when my brand disallows a different currency
    Given my brand does not allow paying in a different currency
    When I open my consolidation preference
    Then the preferred payment currency choice is not offered to me
    And my consolidation preference surface is still shown to me

  @AC-23 @availability @layer-e2e
  Scenario: My preferred payment currency choice is offered once my brand allows a different currency
    Given my brand allows paying in a different currency
    When I open my consolidation preference
    Then the preferred payment currency choice is offered to me
    And my consolidation preference surface is still shown to me

  @AC-25 @availability @moved
  # @moved: addressing a client record that is not my own is scope-target resolution (FE-2824),
  # proven in the scope builder / query modules, not here (operator rule 2026-09-24).
  Scenario: My account's currencies are never shown or changed for a client that is not me
    Given the request is addressed to a client record that is not my own
    When I look for that client's account currencies
    Then neither the currencies nor the preferred-payment-currency choice are shown to me
    And attempting to save any change is refused, with no request made

  @AC-26 @write @currency-gate @layer-e2e
  Scenario: After I save a new preferred payment currency, that is what I and the rest of the app see next
    Given I have just saved a new preferred payment currency for my account
    When I read my account's currencies again
    Then I see the payment currency I just saved, not the one I had before
    And the rest of the app resolves my currency the same new way
