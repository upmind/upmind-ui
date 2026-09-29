# client-notes — the module's behavioural source of truth (capability altitude).
#
# EXECUTABLE per ADR-020 Amendment 5 + ADR 035 (FE-3145). This co-located
# `.feature` IS the executed artefact: `client-notes.steps.ts` is its ONE step
# catalog and `client-notes.replay.int.test.ts` replays every driven scenario
# against the real composables — ONE scenario, ONE recording. Each driven
# scenario plays its own per-step fixtures under `scenarios/<slug>/<NN>/`,
# recorded by `client-notes.fixtures.ts` through `Generator`
# (`pnpm fixtures:generate client-notes`). `client-notes.traceability.test.ts`
# reads this file and enforces the @AC link both ways.
#
# ONE scenario per capability (ADR 035 Amendment 1). The driven scenario carries
# its `@AC-N`; a capability no scenario can drive keeps ONE `@todo` scenario with
# its named blocker, so its absence is a recorded decision, never a silent drop.
# An editor is a SECOND scenario key — the manager (`useClientNoteManager`) boots
# beside the collection: `{ actor }` for a new record, `{ actor, context }` for an
# existing one.
#
# Business language only. The wire-level read-backs live in the per-step
# recordings and in parity.yaml, not here.
#
# ONE SCENARIO CARRIES @blocked-on-platform: AC-29 is a proven capability
# whose proving test is `.skip`-ped over a PRE-EXISTING PLATFORM DEFECT outside
# this module (useQueryCriteria.ts). The tag marks an exemption from the
# traceability gate, not an absent capability.
#
# AC-15 (the staged-import vault lock) is REMOVED (operator ruling): staging
# never signs in a staged-import client, so the guard was unreachable in
# production. No scenario asserts it here.
#
# THE JOB: "Let a consumer have and use a full-parity client notes-and-secrets
# (Vault) module AND the driveable labs-nuxt playground page that proves it —
# notes and secrets are ONE entity, the `encrypted` flag decides which."
#
# Actors: a client acts on their OWN vault. There is exactly ONE live cell —
# client x self. Both scope matrices set SELF / STAFF / GUEST to `null as never`,
# so acting as staff or as a guest is a compile-time error, not a
# silently-missing branch.
#
# THE ORACLE DOES EXPOSE STAFF CAPABILITY this delivery does NOT carry — recorded
# as signed drops in parity.yaml (S1-S6, C16, C11b), each with an operator
# sign-off. No capability there has a scenario here; that absence IS the record.
#
# ONE DELIBERATE DIVERGENCE FROM THE ORACLE: converting a label-less note into a
# secret REFUSES with a named missing field instead of opening a modal (AC-23).
# Headless owns capability, not presentation. Recorded as design decision D4.

@module:client-notes @variant:hybrid @cell:client-self
Feature: A client keeps notes and secrets in their own vault

  A client's vault holds notes and secrets. They are ONE kind of thing with a
  flag: a note is readable as written, a secret is stored encrypted and shown
  masked until the client asks to see it. Every one can be pinned, labelled,
  attached to a product they bought, and flipped from one kind to the other.
  Two surfaces serve them: a COLLECTION the client reads, narrows and acts on
  row by row, and a per-asset EDITOR they open to write a new one or change an
  existing one. Both act on that client's own vault, under that client's own
  identity, and never on another client's.

  # === SIGNED-OUT GUARDS + TRANSIENT FAULT (top level, no Background) =========
  # These carry NO signed-in Background (backgroundStepCount 0): a guard seeds the
  # guest floor through `seedSessionFor` and the replay wall fails it by name if
  # the module sends any request while signed out; the transient-fault scenario
  # arranges a failed provider-settings read at boot, which the signed-in
  # Background (it settles the vault available) could never hold.

  @AC-17 @collection @guard @signed-out
  Scenario: My vault never hangs waiting for a client that will not arrive
    When I wait for my vault while signed out
    Then my vault is not available to me
    And forcing a re-read while signed out is refused, asking the vault for nothing

  @AC-32 @collection @guard @signed-out
  @AC-34 @identity
  Scenario: My vault reveals nothing to me once I am signed out
    When I look at my vault while signed out
    Then my vault is not available to me
    And no vault request escapes while I am signed out

  @AC-43 @manager @identity @guard @signed-out
  Scenario: The editor holds no secret of mine once I am signed out
    When I open the vault editor while signed out
    Then the editor is not available to me
    And no vault request escapes while I am signed out

  # The vault gate is read with the module's OWN single-key request
  # (`GET /api/config/brand/values?keys=security.ui.allow_vault`). The generator
  # arranges the flag off with the staff account, records the client's own gate
  # read returning `security.ui.allow_vault: false` into this scenario's
  # "I look at my vault" step, then restores the flag. With the gate off the module
  # folds it into isAvailable and asks NOTHING of the vault — any vault request is
  # unmatched and the wall fails by name.
  @AC-14 @collection @guard @vault-gate
  Scenario: My vault is unavailable when my brand switches it off
    Given my brand has notes and secrets switched off
    When I look at my vault
    Then I am told the vault is not available to me
    And nothing is ever asked of the server on my behalf

  # AC-33 carries NO signed-in Background (the Background settles the vault
  # available, which this scenario's not-yet-arrived window could never hold).
  # `@held-brand` tells the replay to arm this scenario's brand-config answer
  # with a delay (`replayStep`'s `delayMs`), so the boot observes the vault
  # WAITING (isLoading) rather than prematurely unavailable, then ready once the
  # held answer arrives. The gate stays ON — no admin arrange; the delay is a
  # replay-time timing concern, not a recorded value.
  @AC-33 @collection @guard @held-brand
  Scenario: My vault waits for my brand's own settings before saying it is not ready
    Given I am authenticated and addressable as a client
    And my brand's own settings have not yet arrived
    When I wait for my vault to be ready
    Then I am not told it is unavailable while my brand's settings are still arriving
    And once they arrive I am told my vault is ready

  Rule: A signed-in client keeps notes and secrets in their vault

    Background:
      Given I am an authenticated client acting on my own vault
      And my brand has notes and secrets switched on
      And every request I make is addressed to my own vault as that client

  # === THE COLLECTION ========================================================

  @AC-1 @collection
  Scenario: Read my own vault
    When I open my vault
    Then I see the reactive list of my own notes and secrets together
    And no other client's vault is ever loaded

  @AC-2 @collection @jtbd
  @AC-31 @criteria @proof
  Scenario: I show only my notes, or only my secrets
    Given my vault holds both notes and secrets
    When I choose to see only my notes
    Then I see exactly my notes and none of my secrets
    And when I choose to see only my secrets I see exactly my secrets and none of my notes
    And the choice between the two is offered to me as part of the vault's own filter controls
    When only-notes and only-secrets are each asked of the real system
    Then each is answered with exactly that kind and no other
    And together they account for everything in my vault

  @AC-3 @collection
  Scenario: Narrow my vault by label
    Given my vault holds assets with different labels
    When I search my vault for part of a label
    Then I see only the assets whose label contains what I searched for

  @AC-4 @collection
  Scenario: Narrow my vault to pinned or unpinned assets
    Given some of my vault assets are pinned and some are not
    When I choose to see only pinned assets
    Then I see only my pinned assets
    And choosing to see only unpinned assets shows me only those
    And clearing the choice shows me both again

  @AC-5 @collection
  Scenario: Narrow my vault to one product I bought
    Given some of my vault assets are attached to a product I bought
    When I narrow my vault to that product
    Then I see only the assets attached to that product
    And I am still looking at my own vault, not at anyone else's

  @AC-6 @collection
  Scenario: Read my vault a page at a time
    Given my vault holds more assets than fit on one page
    When I open my vault a page at a time
    Then I am given the first page of my assets and told how many I have in total
    And I can move to the next page and back again
    And I can ask for a larger or smaller page

  @AC-7 @collection
  Scenario: Order my vault by a column I choose
    Given my vault holds assets with different labels
    When I first open my vault
    Then I am given the order the server chooses, with my pinned assets brought forward
    And when I then ask for my vault ordered by label, I see it ordered by label
    And asking for it in the opposite direction reverses that order

  @AC-8 @collection
  Scenario: Pin and unpin an asset from my vault list
    Given one of my vault assets is not pinned
    When I pin it
    Then it is recorded as pinned and my vault list reflects that
    And unpinning it records it as unpinned again

  @AC-9 @collection
  Scenario: Delete an asset from my vault list
    Given I no longer want one of my vault assets
    When I delete it
    Then it is removed from my vault
    And I am told the deletion succeeded
    And if the deletion fails I am told that, and my vault records the failure for me to read

  @AC-10 @collection @jtbd
  Scenario: Turn one of my notes into a secret, and a secret back into a note
    Given one of my vault assets is a secret
    When I turn it into a note
    Then it is recorded as a note and shown as one
    And turning a labelled note into a secret records it as a secret
    And turning an UNLABELLED note into a secret is refused, telling me a label is needed first

  @AC-11 @collection @jtbd
  Scenario: Reveal one of my secrets, hide it again, and reveal it once more
    Given one of my vault assets is a secret shown to me masked
    When I ask to see it
    Then I am shown its real value
    And hiding it again masks it without asking the server anything
    And asking to see it a second time fetches it again, because its value was never kept

  # AC-32 / AC-34 (a revealed secret never outlives my session) is driven at the
  # top level as a `@signed-out` guard — its full cross-session-transport limb
  # (logout, a second client's sign-in) belongs to session-store / auth.

  @AC-16 @collection
  Scenario: Know whether my vault is loading, empty, or errored
    When I open my vault
    Then I can see whether my vault is loading, empty, or errored
    And when something goes wrong my vault records the failure for me to read rather than interrupting me

  # AC-17 (my vault never hangs waiting for a client that will not arrive) is
  # driven at the top level as a `@signed-out` guard.


  # === THE EDITOR ============================================================

  @AC-18 @editor @jtbd
  Scenario: Open one of my secrets for editing and see its real value
    Given one of my vault assets is a secret I want to edit
    When I open it for editing
    Then the form holds its real value, not its mask
    And opening one of my NOTES for editing asks the server for nothing extra

  @AC-19 @editor
  @AC-20 @jtbd
  Scenario: I write a new note, or a new secret
    Given I open a blank editor for a new vault asset
    When I write it as a new note and save it
    Then the editor stores it as a note
    And the editor confirms it saved
    Given I open a blank editor for a new vault asset
    When I write it as a new secret with a label and save it
    Then the editor stores it as a secret
    And the secret it stored carries the label I gave it

  @AC-21 @editor
  Scenario: Change one of my existing vault assets
    Given I open one of my existing notes in the editor
    When I change its body and save
    Then the editor holds the changed body
    And the label I did not touch is unchanged

  @AC-22 @editor
  @AC-41 @manager @jtbd
  Scenario: I attach one of my notes to a product I bought, and detach it
    Given I open a note of mine that is attached to no product
    When I attach it to a product I bought and save
    Then the editor records it attached to that product I bought
    And that product is one of the products my provider offers me
    And detaching it again records it attached to nothing

  @AC-23 @editor @jtbd
  Scenario: Turn an unlabelled note into a secret by giving it a label
    Given I open one of my label-less notes in the editor
    When I make it a secret without giving it a label
    Then the editor refuses the save until a label is given
    And giving it a label and saving stores it as a secret with that label

  @AC-24 @editor @jtbd
  Scenario: The form asks me for a label only when I am writing a secret
    Given I open a blank editor for a new vault asset
    When I make the new asset a secret without a label
    Then the editor refuses it for the missing label
    And the editor offers me somewhere to write a label
    When I make the new asset a note instead
    Then the editor accepts it with no label at all

  @AC-25 @editor
  Scenario: Know the state of the editor while I use it
    Given I have opened an existing vault asset for editing
    Then the editor tells me it is an existing asset, not a new one
    And it tells me when what I have typed differs from what is stored
    And it tells me while it is saving, when it has saved, and when the save failed

  @AC-26 @editor @manager @jtbd
  Scenario: What I save in the editor is my last edit, and my vault list shows it
    Given I open one of my existing notes in the editor beside my vault list
    When I give one value, then quickly replace it, and save
    Then what is stored is my second value, not my first
    And my vault list shows my second value

  # === HOW THE WHOLE MODULE BEHAVES ==========================================

  @AC-27 @identity
  Scenario: Everything I do acts on my own vault, as me
    Given I read my vault and then save a change to one of its assets
    Then both acted on my own vault
    And both acted under my own identity

  @AC-28 @provenance
  Scenario: Every recorded response the module is graded against came from the real system
    Given the vault has no existing recorded acceptance anywhere
    When the module is graded
    Then it is graded against responses captured from the real system, each carrying what was asked and what came back
    And no response the module is graded against was written by hand

  @AC-29 @criteria @blocked-on-platform
  Scenario: Everything I ask of my vault goes through one door
    Given I narrow, order and page my vault
    Then each of those changes what is asked of the server
    And asking for something my vault does not offer is refused, leaves my current view standing, and asks the server nothing

  @AC-30 @criteria @proof
  Scenario: Every way I can sort my vault actually sorts it
    Given my vault offers me a set of columns to order by
    When each of those orders is asked of the real system
    Then each one is answered
    And any that is not answered is withdrawn from what my vault offers me

  # === THE 2026-08-31 UPGRADE PASS — ten scenarios ==========================
  # Each closes a verified drift between the plan and the landed module, or a
  # gap the plan never had. Capability altitude, business language, one `When`.

  @AC-35 @manager
  Scenario: Clearing the editor gives me a blank note, not the one I was editing
    Given I have the editor open on a note I already have
    When I clear it
    Then what I save next is a NEW note
    And the note I was editing is left exactly as it was

  @AC-36 @manager
  Scenario: What I wrote is still there when I come back to it
    Given I open one of my notes and change its body in the editor
    When the editor settles
    Then the editor still holds my changed body
    And changing its label too keeps both my changes

  @AC-37 @manager @jtbd
  Scenario: The editor only offers me fields it will actually save
    Given I open the editor on any note or secret
    Then it offers me the body, the label, the related product and whether my provider can see it
    And it does not offer me a pin control, because pinning is done from the list

  @AC-42 @criteria
  Scenario: I can narrow my vault to one of my products
    Given my vault holds notes attached to different products of mine
    When I narrow it to one product
    Then I see only the notes attached to that product
    And I am still looking at my own vault, not somewhere else

  # AC-43 (a secret I opened in the editor does not outlive my session) is driven
  # at the top level as a `@signed-out` guard on the editor — its cross-session
  # sign-out/sign-in limb belongs to session-store / auth.
