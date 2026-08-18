# client-custom-fields — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT: this file lives at
#   packages/headless/src/modules/client-custom-fields/__tests__/client-custom-fields.feature
# This co-located copy is the SINGLE SOURCE OF TRUTH — there is no docs/sdd/ copy and none is
# planned. docs/sdd/ is gitignored, so a traceability assertion against it cannot pass in CI
# (see the module's own traceability test for the CI-safe shape this drives).
#
# NON-EXECUTABLE per ADR-020 (".feature files are spec-only, not executable"). No runner touches
# it and no steps file is produced — the co-located unit and integration specs are the tests that
# run, each anchored to a scenario by its @AC tag.
#
# Two composables, one resolving cell each (client x self — ADR-001; cited, not restated):
#   - the DEFINITIONS collection, read-only, brand-scoped to the client's own brand
#   - the per-field IMAGE value editor, wrapping system-upload
# There is no staff cell and no guest cell delivered by this module. The oracle-exhibited
# staff/guest capabilities (admin definition CRUD + reorder, staff acting for another client,
# guest basket-token image upload) are recorded, tracked drops — not described here as capability
# this module has, because it does not.

@module:client-custom-fields @variant:hybrid @cell:client-self
Feature: A client reads their brand's custom field definitions and manages their own field values

  A client's brand defines a catalogue of custom fields. The client reads that catalogue and
  reads and manages the VALUES they hold against it, including uploading an image for an IMAGE
  field. Every one of these acts on the client's own value set, under the client's own identity,
  addressed to the client's own brand — never another client's.

  Background:
    Given I am an authenticated client with my own custom field values
    And every request I make about my custom fields is addressed to my own value set

  # === THE DEFINITIONS COLLECTION ============================================

  @AC-1 @definitions
  Scenario: See the custom fields my brand defines
    When I open my custom field definitions
    Then I see the definitions my own brand has configured
    And no other brand's definitions are ever loaded

  @AC-2 @definitions
  Scenario: My definitions come from my own brand, not whatever brand is currently selected
    Given my own brand differs from whatever brand the app currently has selected
    When I open my custom field definitions
    Then the definitions I see are my own brand's
    And a later change to my resolved brand re-reads the definitions for the new brand

  @AC-3 @definitions
  Scenario: My definitions appear in the order my brand configured
    Given my brand's definitions were configured in a specific order
    When I open my custom field definitions
    Then I see them in exactly that order

  @AC-4 @definitions
  Scenario: Each definition shows its full configuration, not a partial one
    Given one of my brand's definitions is hidden, staff-only, non-editable, and ordered
    When I open my custom field definitions
    Then that definition's full configuration is visible to me, with nothing left unmapped

  @AC-5 @definitions
  Scenario: Being read-only and being disabled are told apart
    Given one definition is not editable but is not marked read-only, and another is both
    When I open my custom field definitions
    Then the first is disabled but not read-only, and the second is both
    And the two states never collapse into the same flag

  @AC-6 @definitions
  Scenario: Waiting to know whether my definitions are ready never hangs, even when something goes wrong
    Given loading my custom field definitions can fail, or my session can fail to sign in
    When I wait for my definitions to be ready
    Then I am told they are not ready rather than waiting forever
    And nothing is left running once I have that answer

  @AC-6 @definitions
  Scenario: Waiting to know whether my definitions are ready never hangs when the failure is in resolving my own brand, not just the definitions themselves
    Given resolving my own brand fails, separately from the definitions request itself
    When I wait for my definitions to be ready
    Then I am told they are not ready rather than waiting forever
    And I can still see what went wrong afterwards

  @AC-7 @definitions
  Scenario: Asking for fresh definitions refreshes only my definitions
    Given I have already loaded my custom field definitions
    When I ask for a fresh copy
    Then my definitions are re-read
    And nothing unrelated to my definitions is re-read as a result

  @AC-8 @definitions
  Scenario: I can filter my definitions without a new request
    Given I have loaded my custom field definitions
    When I filter them by a property
    Then I see only the matching definitions
    And no new request was needed to filter them

  @AC-9 @definitions
  Scenario: I can tell how many definitions there are, including none at all
    Given my brand defines no custom fields
    When I open my custom field definitions
    Then I am told the list is empty, with a count of zero
    And when my brand does define some, I am told exactly how many

  @AC-10 @definitions
  Scenario: My values round-trip through the model without losing any of them
    Given I hold values against several of my custom fields
    When those values are loaded into my model and then prepared for saving unchanged
    Then every one of those values is still present, keyed to its own field

  # === VALUE SEMANTICS ========================================================

  @AC-11 @definitions
  Scenario: The form for my custom fields is generated for me, and required rules stay narrowable
    When I open the form for my custom field values
    Then a required field's rule is present and a non-required field's is not
    And a caller may still narrow which fields it treats as required, without losing the rest

  @AC-12 @definitions
  Scenario: My form's on-screen layout is generated for me, including for an image field
    When I open the form for my custom field values
    Then every definition has a matching on-screen control
    And an image field's control carries what it needs to know which field it belongs to

  @AC-13 @definitions
  Scenario: Opening my values seeds the form with what I already have
    Given I already hold a value for one of my custom fields
    When I open the form for my custom field values
    Then that field starts with my existing value, not overwritten by a default

  @AC-14 @definitions
  Scenario Outline: A value of any kind reads back as itself, never as a placeholder
    Given a custom field of type "<type>" with <state>
    When I read that field's value
    Then it shows as "<shown>"

    Examples:
      | type         | state             | shown                          |
      | TEXT         | no value set      | nothing, never the word undefined |
      | DATE         | a stored date     | that date, correctly formatted |
      | NUMBER       | no value set      | nothing, never NaN              |
      | SELECT_RADIO | no value set      | unchecked, never the word undefined |
      | IMAGE        | a stored image    | the image itself, unchanged     |

  @AC-15 @definitions
  Scenario: A choice field offers a blank option only when it isn't required
    Given a choice field is not required
    When I open the form for my custom field values
    Then that field offers a blank option alongside its real choices
    And the same field marked required offers no blank option
    And duplicate or empty choices never appear twice

  @AC-16 @definitions
  Scenario: I can see a value and its definition even before my definitions have finished loading
    Given a value I hold carries its own field definition embedded in it
    And my definitions collection has not been loaded at all
    When I read that value
    Then it still shows correctly, matched to its own definition
    And no definitions request was needed to show it

  @AC-17 @definitions
  Scenario: A value shows in the way it's meant to be read, not in its raw stored form
    Given I hold a choice value, a yes/no value, and an image value
    When I view my custom field values read-only
    Then the choice shows its label, the yes/no shows its word, and the image shows a preview and a link to it

  # === THE IMAGE VALUE FLOW ===================================================

  @AC-18 @image
  Scenario: Uploading an image for a field shows me its progress
    When I upload an image for one of my custom fields
    Then I can see that it is uploading and how far it has got
    And once it settles I am told it is no longer uploading

  @AC-19 @image
  Scenario: An image upload problem is reported against the field, not a generic image error
    Given uploading an image for one of my custom fields is rejected
    When I inspect what went wrong
    Then the problem is reported against that specific field
    And not under a generic, unattributed image error

  @AC-20 @image
  Scenario: A stored image gives me a link to it and a preview, and clearing it removes both
    Given one of my custom fields holds a stored image
    When I view that field
    Then I see a link to the image and a preview of it
    And clearing that field's value leaves neither behind

  @AC-21 @image
  Scenario: A changed image is safely stored before the rest of my save happens
    Given I have changed the image for one of my custom fields
    When I save my changes
    Then that image is stored first
    And the value that gets saved afterwards carries the stored image, not the raw upload

  @AC-22 @image
  Scenario: Only the images I actually changed get uploaded again
    Given I have two image fields, one I changed and one I left alone
    When I save my changes
    Then only the changed image is uploaded
    And the untouched one is left exactly as it was

  # === REQUEST SHAPE, IDENTITY, SURFACE ========================================

  @AC-23 @module
  Scenario: My changed values are sent as a set keyed by their own field, never as a list
    Given I have changed one or more of my custom field values
    When I save my changes
    Then what is sent is a set of values keyed by field, not a list of entries
    And it contains exactly the fields I changed

  @AC-24 @module
  Scenario: Clearing a value sends an explicit "this is empty" signal, not nothing at all
    Given one of my custom fields currently holds a value
    When I clear that field to empty and save
    Then what is sent for that field is an explicit empty signal
    And reading the value back afterwards shows it as empty

  @AC-25 @module @guard
  Scenario: Nothing about my custom field values is touched unless I am actually signed in
    Given I am not signed in as a client
    When my custom field values are read or acted on
    Then no request is made against any client's values
    And forcing a read or a change is refused as not-signed-in, rather than being sent anyway

  @AC-27 @module @public-surface @negative-control
  Scenario: Only what this module curates is reachable, and only for a client acting on their own values
    Given the module's published surface is the only way anything outside it can act
    When something outside the module tries to reach its internal machinery directly, act as staff or as a guest, or act on behalf of a different client
    Then none of those are offered by the module — the internal machinery is not reachable, and no affordance exists to become another actor or to name another client
    And the client acting on their own value set continues to work exactly as before
