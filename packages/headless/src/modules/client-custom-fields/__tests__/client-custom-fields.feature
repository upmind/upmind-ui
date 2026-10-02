# client-custom-fields — the module's ONE feature file: its capability spec, the source
# `client-custom-fields.steps.ts` implements, and the playlist the scenario bar plays.
#
# CO-LOCATION IS THE REQUIREMENT (operator ruling 2026-08-05): this file lives at
#   packages/headless/src/modules/client-custom-fields/__tests__/client-custom-fields.feature
# and it is the only spec this module's tests know.
#
# ONE SCENARIO PER CAPABILITY (operator ruling 2026-09-24, ADR 035 Amendment 1). A
# capability that can be driven carries its `@AC-N` tag on the DRIVEN `@layer-e2e`
# scenario, and there is no second declarative twin. A capability proven by a pure
# unit test carries its `@AC-N` on a NON-driven scenario named by that unit test. A
# capability nothing can yet drive keeps ONE declarative scenario, `@todo`, with the
# named blocker in the comment above it.
#
# EXECUTED per ADR-020 Amendment 5. A scenario the step catalog matches is driveable:
# it runs, and it appears as a track. A `@todo` scenario is written down and not yet
# driven — a legitimate state.
#
# Business language only, declarative only: no selector, URL or UI mechanic appears
# here, and the steps that drive it reach the module through the `World` members and
# nothing else.
#
# Two composables, one resolving cell each (client x self — ADR-001):
#   - the DEFINITIONS collection, read-only, brand-scoped to the client's own brand
#     (`useClientCustomFields`)
#   - the per-field IMAGE value editor (`useClientCustomFieldImage`, wrapping
#     system-upload)
# There is no staff cell and no guest cell delivered by this module. The oracle-
# exhibited staff/guest capabilities are recorded, tracked drops — not described
# here as capability this module has, because it does not.

@module:client-custom-fields @variant:hybrid @cell:client-self @FE-3034
Feature: A client reads their brand's custom field definitions and manages their own field values

  A client's brand defines a catalogue of custom fields. The client reads that
  catalogue and reads and manages the VALUES they hold against it, including
  uploading an image for an IMAGE field. Every one of these acts on the client's own
  value set, under the client's own identity, addressed to the client's own brand —
  never another client's.

  # === SIGNED-OUT GUARD + BOOT FAULT (top level, no Background) ===============
  # These carry NO signed-in Background (backgroundStepCount 0): the guard seeds
  # the guest floor through `seedSessionFor` and the replay wall fails it by name
  # if the module sends any request while signed out; the boot-fault scenario
  # forces the definitions read to fail, which the signed-in Background (it
  # settles the catalogue available) could never hold.

  @AC-25 @module @guard @signed-out
  Scenario: Nothing about my custom field values is touched unless I am actually signed in
    When my custom field values are read while signed out
    Then my custom field values are not available to me
    And no custom-field request escapes while I am signed out

  @AC-6 @definitions @fault
  Scenario: Waiting to know whether my fields are ready always ends when the read fails
    Given loading my definitions fails at the server
    When I wait for my definitions to be ready
    Then I am told they are not ready rather than waiting forever

  Rule: A signed-in client reads their catalogue and manages their field values

    Background:
      Given I am an authenticated client with my own custom field values
      And every request I make about my custom fields is addressed to my own value set

  # === THE DEFINITIONS COLLECTION, DRIVEN ====================================

  @AC-1 @definitions @layer-e2e @smoke
  Scenario: A client sees the custom fields their brand defines
    Then I see the definitions my own brand has configured

  @AC-3 @definitions @layer-e2e
  Scenario: A client's definitions appear in the order their brand configured
    Then my definitions are in their configured display order

  @AC-7 @definitions @layer-e2e
  Scenario: A client asks for a fresh copy of their definitions
    Given I have already loaded my custom field definitions
    When I ask for a fresh copy
    Then my definitions are re-read

  @AC-8 @definitions @layer-e2e
  Scenario: A client narrows the definitions already in front of them
    When I narrow my definitions to one field by its code
    Then I see only the matching definition

  @AC-29 @definitions @criteria @layer-e2e
  Scenario: The catalogue arrives in its own display order by default
    Then the ordering in force is my brand's own display order, ascending

  @AC-30 @definitions @criteria @layer-e2e
  Scenario: A client re-orders the catalogue by a column the catalogue offers
    When I order my definitions by field name, descending
    Then the ordering in force is field name, descending

  @AC-31 @definitions @criteria @layer-e2e
  Scenario: A client searches all their fields by a term
    When I search my definitions for a term
    Then the search in force is that term

  @AC-34 @definitions @criteria @layer-e2e
  Scenario: A client pages the catalogue once a page size is set
    Given I have set a page size on my definitions
    When I ask for the next page of my definitions
    Then the next page of my definitions is in force

  # === CAPABILITIES PROVEN BY A PURE UNIT TEST ===============================
  # No driven scenario: the mapper / schema / public-surface unit tests name these
  # ids. Each is a pure, no-network fact about the module's mapping, form or surface.

  @AC-4 @definitions
  Scenario: Each definition shows its full configuration, not a partial one
    Given one of my brand's definitions is hidden, staff-only, non-editable, and ordered
    When I read my custom field definitions
    Then that definition's full configuration is present, with nothing left unmapped

  @AC-5 @definitions
  Scenario: Being read-only and being disabled are told apart
    Given one definition is not editable but is not marked read-only, and another is both
    When I read my custom field definitions
    Then the first is disabled but not read-only, and the second is both

  @AC-10 @definitions
  Scenario: Every value a client sets is still there when read back
    Given a client holds values against several of their custom fields
    When those values are loaded into the model and then prepared for saving unchanged
    Then every one of those values is still present, keyed to its own field

  @AC-11 @definitions
  Scenario: The form for custom fields is generated, and required rules stay narrowable
    When the form for my custom field values is generated
    Then a required field's rule is present and a non-required field's is not
    And a caller may still narrow which fields it treats as required, without losing the rest

  @AC-12 @definitions
  Scenario: The form's on-screen layout is generated, including for an image field
    When the on-screen layout for my custom field values is generated
    Then every definition has a matching on-screen control
    And an image field's control carries what it needs to know which field it belongs to

  @AC-13 @definitions
  Scenario: Opening a client's values seeds the form with what they already have
    Given a client already holds a value for one of their custom fields
    When the model for my custom field values is generated
    Then that field starts with the existing value, not overwritten by a default

  @AC-14 @definitions
  Scenario: A value of any kind reads back as itself, never as a placeholder
    Given a stored value of a given field type
    When that field's value is read
    Then it shows as itself, never as the word undefined or NaN

  @AC-15 @definitions
  Scenario: A choice field offers a blank option only when it isn't required
    Given a choice field is not required
    When the form for my custom field values is generated
    Then that field offers a blank option alongside its real choices
    And the same field marked required offers no blank option

  @AC-17 @definitions
  Scenario: A value shows in the way it's meant to be read, not in its raw stored form
    Given a client holds a choice value, a yes/no value, and an image value
    When those values are projected for read-only display
    Then the choice shows its label, the yes/no shows its word, and the image shows a preview and a link

  @AC-23 @module
  Scenario: Each value a client changes is saved against its own field, keyed by field
    Given a client has changed one or more of their custom field values
    When those changes are prepared for the request
    Then what is prepared is a set of values keyed by field, not a list of entries

  @AC-24 @module
  Scenario: Clearing a value prepares an explicit empty signal, not nothing at all
    Given one of a client's custom fields currently holds a value
    When that field is cleared to empty and prepared for the request
    Then what is prepared for that field is an explicit empty signal

  @AC-27 @module @public-surface
  Scenario: The module offers both surfaces and every consumer keeps compiling
    Given consumers depend on the definitions collection AND the per-field image editor
    When the module is built
    Then both are offered, with every type a consumer imports
    And the internal machinery is not reachable from outside the module

  @AC-28 @definitions @criteria
  Scenario: What is asked of a client's fields is exactly what they declared
    Given the client has declared how they want the catalogue read
    When the catalogue's request is composed
    Then the request carries only the ordering, narrowing and page the client declared

  @AC-37 @scope @public-surface
  Scenario: The module serves a client on their own catalogue, and no other actor
    Given the module serves a client acting on their own brand's catalogue
    When something asks which actors and targets the module offers
    Then a client acting on their own catalogue is offered
    And staff, guest and self are not offered

  @AC-41 @definitions @catalogue @public-surface
  Scenario: Naming a catalogue is enough; naming a client never is
    Given a catalogue names what is read, while a client names whose fields are read
    When the client says which catalogue they want
    Then the catalogue name alone is enough to read it
    And a catalogue can never be spelled as though it identified somebody

  # AC-6 (readiness always ends) is driven at the top level as a boot-fault
  # scenario: the definitions read is forced to fail, and the catalogue settles
  # errored rather than hanging. The sign-in-failure limb is the @AC-25 guard.

  @AC-9 @definitions @layer-e2e
  Scenario: I can tell how many definitions there are, including none at all
    When I search my definitions for a term no field matches
    Then I am told the list is empty, with a count of zero

  # The image editor is booted as a second scenario key beside the collection;
  # the Generator records the multipart upload, and the replay matcher answers a
  # POST by path+method. `progress` is a documented 0/100 signal (no incremental
  # progress in this transport — useClientCustomFieldImage.meta).
  @AC-18 @image @layer-e2e
  Scenario: I see my image upload progress
    When I upload an image for one of my custom fields
    Then I can see that it is uploading and how far it has got

  @AC-19 @image @layer-e2e
  Scenario: A problem uploading an image is reported beside that field
    Given uploading an image for one of my custom fields is rejected
    When I inspect what went wrong
    Then the problem is reported against that specific field, not a generic image error

  # Blocker: same multipart-upload blocker — the stored-image preview/link and its
  # clearing hang off the system-upload instance the World cannot drive.
  # Steps WRITTEN (client-custom-fields.steps.ts, reading the hash/preview from
  # the recording), recordings exist. Verification BLOCKED: the whole module's
  # replay is currently RED because the module's catalogue read dropped `brand_id`
  # (the parallel brand-lookup change) while the recordings still carry it — every
  # scenario's Background boot capture-gaps on
  # `GET /api/custom_fields?filter[object_type]=client&order=order&limit=0` (no
  # brand_id). Drops to driven once that drift is reconciled (recorder catalogue()
  # drops brand_id) and re-recorded.
  @AC-20 @image
  Scenario: A stored image gives me a link and a preview, and clearing removes both
    Given one of my custom fields holds a stored image
    When I view that field
    Then I see a link to the image and a preview of it

  @AC-21 @image
  Scenario: A changed image is safely stored before the rest of my save happens
    Given I have changed the image for one of my custom fields
    When I save my changes
    Then that image is stored first, and the saved value carries the stored image

  # Driven with TWO live image-editor cells under two scenario keys — one changed,
  # one left alone — now that the World holds one live cell per key (FE-3145). Only
  # the changed field's upload is recorded; the untouched cell short-circuits on
  # its stored hash, so a second upload would fail the scenario by name.
  @AC-22 @image
  Scenario: Only the images I actually changed get uploaded again
    Given I have two image fields, one I changed and one I left alone
    When I save my changes
    Then only the changed image is uploaded

  # AC-25 (nothing touched unless signed in) is driven at the top level as a
  # `@signed-out` guard — the not-authenticated token transport is MOVED to
  # session-store / auth.

  @AC-36 @definitions @criteria @public-surface @layer-e2e
  Scenario: The client can see how their catalogue is being read
    Given I have ordered, searched and paged my definitions
    When I inspect how my catalogue is being read
    Then the ordering, the search and the page in force are all readable

  # The staff account arranges a client-visible invoice field, the client reads
  # that catalogue, and the staff account removes it (ADR 035 — a state staging
  # does not hold is arranged, recorded, then reset).
  @AC-38 @definitions @catalogue @layer-e2e
  Scenario: I read a catalogue of my brand's fields other than my own
    Given my brand keeps a separate catalogue of fields for invoices
    When I open that catalogue by name
    Then the fields I am shown are the ones that catalogue holds

  @AC-40 @definitions @catalogue @cache @layer-e2e
  Scenario: Each catalogue I open keeps its own copy of what it holds
    Given I have already read my own client fields
    When I open a second catalogue in the same sitting
    Then the second catalogue is read for itself rather than answered from the first
