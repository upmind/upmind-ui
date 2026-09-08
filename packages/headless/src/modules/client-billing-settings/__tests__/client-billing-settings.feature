# client-billing-settings — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT: this file lives at
#   packages/headless/src/modules/client-billing-settings/__tests__/client-billing-settings.feature
# This co-located copy is the SINGLE SOURCE OF TRUTH for this module.
#
# One resolving cell (client x settings — ADR-001; cited, not restated). Two composables:
#   - the SETTINGS read half, a real query
#   - the SETTINGS editor half, a dataManagerMachine-backed manager
# There is no staff cell delivered by this module (Dropped-with-Linear-issue, FE-3137) and
# no guest cell (NOT-SUPPORTED-IN-LEGACY-with-reason). Neither is described here as capability
# this module has, because it does not. CO-2's brand-default derivation, conditional field
# visibility and presentation concerns (FE-3039) are likewise not described here — this module
# reads and writes the five persisted values; it does not derive or present them.
#
# JTBD (binding, verbatim): "read and write the client's invoice-consolidation preference on
# the client record."
#
# Exactly nineteen scenarios, one per @AC-* tag in docs/sdd/FE-3033/requirements.md §5 —
# no more, no fewer.

@module:client-billing-settings @variant:hybrid @cell:client-settings
Feature: A client reads and manages their own invoice-consolidation preference

  A client has exactly one invoice-consolidation preference: whether consolidation is on, off,
  or follows their brand, the base rule it runs on, and the cadence details for that rule. They
  read it and they edit it, on their own client record, under their own identity.

  Background:
    Given I am an authenticated client
    And every request I make about my consolidation preference is addressed to my own client record

  # === READING MY PREFERENCE ====================================================

  @AC-1 @read @negative-control
  Scenario: My preference shows my actual saved values, addressed to my own record
    Given I hold saved values for consolidation, its base rule, and its cadence
    When I read my consolidation preference
    Then the five values I see are the ones actually saved against my own record
    And nothing outside this module can make that read address a different client's record

  @AC-2 @read
  Scenario: My preference is re-read when the client record it addresses changes
    Given I have already read one client's consolidation preference
    When the client record my preference addresses changes to a different one
    Then what I see is that new client's saved values, not the previous client's

  @AC-19 @read
  Scenario: Reading my preference shares my client record with other readers at no extra cost
    Given something else in the app is also reading my client record at the same time
    When I read my consolidation preference
    Then no extra request is made to read my client record on my behalf
    And what the other reader sees of my client record is unchanged by my own read

  # === CHANGING MY PREFERENCE ===================================================

  @AC-3 @write
  Scenario: I can turn consolidation on, off, or set it to follow my brand
    Given I have opened my consolidation preference in the editor
    When I choose to turn consolidation on, off, or to follow my brand, and save
    Then the state I saved is exactly the state I chose, never a different one

  @AC-18 @write @negative-control
  Scenario: Turning consolidation off is saved as an explicit off, never as no value at all
    Given my consolidation preference is currently on
    When I turn it off and save
    Then my saved preference explicitly records it as off
    And it is not left out of what was saved, as though nothing had changed

  @AC-4 @write
  Scenario: I can choose a base rule for my consolidation cadence, or follow my brand's
    Given I have opened my consolidation preference in the editor
    When I choose a base rule and save, and later clear that choice and save again
    Then my chosen rule is saved when I chose one
    And clearing it is saved as an explicit choice to follow my brand's rule, not left unspecified

  @AC-5 @write
  Scenario: I can choose which day of the week my weekly cadence runs on, or follow my brand's
    Given my base rule is a weekly cadence
    When I choose a day of the week and save, and later clear that choice and save again
    Then my chosen day is saved when I chose one
    And clearing it is saved as an explicit choice to follow my brand's day, not left unspecified

  @AC-6 @write
  Scenario: I can choose which day of the month my monthly cadence runs on, or restore my brand's default
    Given my base rule is a monthly cadence
    When I choose a valid day of the month and save, and later restore the default and save again
    Then my chosen day is saved when I chose a valid one
    And restoring the default is saved as an explicit choice to follow my brand's day, not left unspecified
    And choosing a day outside the valid range is refused before I can save it

  @AC-7 @write
  Scenario: I can choose the day my invoice is due, or leave it at the earliest available day
    Given I have opened my consolidation preference in the editor
    When I choose a valid due-date day and save, and later clear that choice and save again
    Then my chosen due-date day is saved when I chose a valid one
    And clearing it is saved as an explicit choice for the earliest available day, not left unspecified
    And choosing a due-date day outside the valid range is refused before I can save it

  @AC-12 @write
  Scenario: Saving my preference updates only what I changed, on my own record, and refreshes what every reader sees
    Given I have opened my consolidation preference in the editor and changed some of the values
    When I save my changes
    Then only the values I changed are saved against my own client record, addressed the same way my read was
    And afterwards, reading my preference again reflects the saved changes rather than stale values

  # === EDITING SAFELY ============================================================

  @AC-8 @manager
  Scenario: I am told when I have unsaved changes, compared against what was last loaded
    Given I have opened my consolidation preference in the editor
    When I change a value, and later set that value back to what was loaded
    Then I am told I have unsaved changes only while a value differs from what was last loaded

  @AC-9 @manager
  Scenario: I can abandon my unsaved changes and get back exactly what was last loaded
    Given I have changed several values in my consolidation preference editor without saving
    When I discard those changes
    Then I see exactly the values that were last loaded
    And discarding them made no request to save or reload anything

  @AC-10 @manager
  Scenario: I cannot save an invalid value — the save is refused and nothing is sent
    Given I have set one of my consolidation values to something outside its valid range
    When I try to save
    Then the save is refused
    And no request to save anything is made

  @AC-11 @manager @negative-control
  Scenario: Saving with nothing changed makes no request and still succeeds
    Given I have opened my consolidation preference in the editor and changed nothing
    When I save
    Then no request to save anything is made
    And the save is treated as having succeeded

  @AC-13 @manager
  Scenario: While my save is in progress, every control is unavailable, and recovers once the save settles
    Given I have started saving a change to my consolidation preference
    When the save is still in progress
    Then every control in my editor reports itself unavailable to edit
    And once the save settles, whether it succeeded or failed, every control becomes available again

  @AC-15 @manager @negative-control
  Scenario: A consumer can lock my editor from outside, independent of the editor's own state
    Given the app I am using has locked my consolidation preference editor
    When I look at any control in the editor
    Then every control reports itself unavailable to edit
    And attempting to change a value while locked leaves my preference unchanged

  @AC-16 @read @negative-control
  Scenario: A failed read tells me it failed, and I can retry it into success
    Given loading my consolidation preference fails
    When I wait for it to be ready
    Then I am told it is not ready, with the failure visible to me, rather than waiting forever
    And when I retry, a successful load lands my actual saved values

  # === HONEST AVAILABILITY =======================================================

  @AC-14 @availability @negative-control
  Scenario: My editor is locked while my client record is still a staged, unprocessed import
    Given my client record is a staged import that has not finished processing
    When I look at any control in my consolidation preference editor
    Then every control reports itself unavailable to edit
    And trying to save any change I make is refused, with no request made

  @AC-17 @availability @negative-control
  Scenario: My preference surface is hidden unless my brand has explicitly opted clients in
    Given my brand has not explicitly turned on client-managed consolidation
    When I look for my consolidation preference surface
    Then it is hidden from me
    And it only becomes visible once my brand explicitly turns it on for clients
