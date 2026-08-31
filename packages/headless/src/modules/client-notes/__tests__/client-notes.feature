# client-notes — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT, mirroring the client-phone / client-email
# precedent. This copy, at docs/sdd/client-notes-vault/client-notes.feature, is
# the PLANNER's source. The prover mirrors it byte-for-byte to
#   packages/headless/src/modules/client-notes/__tests__/client-notes.feature
# at Test (task T-14), where client-notes.traceability.test.ts reads it and
# enforces the @AC link both ways. The planner seat writes only under
# docs/sdd/**, which is why the mirror is a prover task and not done here.
#
# NON-EXECUTABLE per ADR-020 (".feature files are spec-only, not executable").
# No runner touches it and no steps file is produced — the colocated unit and
# integration specs are the tests that run, each anchored to a scenario by its
# @AC tag.
#
# One scenario per capability the parity table carries, at actor x context
# altitude (ADR-001) — INCLUDING every editor behaviour, because this module
# ships BOTH halves. The 2026-08-05 client-email amputation (a variant=query run
# against an oracle that shipped a manager, every gate green) is the receipt the
# variant=hybrid derivation exists to prevent.
#
# Business language only. The wire-level read-backs that PROVE each scenario
# (URL, session token, request body, filter key) live in requirements.md and
# parity.yaml, not here.
#
# TWO SCENARIOS CARRY @blocked-on-platform (added Test-stage repair cycle 3,
# operator ruling 2026-08-28): AC-15 and AC-29 are proven capabilities whose
# assertions are correct and whose failures are PRE-EXISTING PLATFORM DEFECTS
# outside this module (useQueryCriteria.ts and session-store.mappers.ts
# respectively), filed rather than fixed in this run. See the colocated
# .skip comments in client-notes.cross-cutting.int.test.ts and
# client-notes.guard.int.test.ts for the exact root cause and reversal
# condition. The scenarios are NOT deleted and NOT narrowed — the tag marks
# an exemption from the traceability gate, not an absent capability.
#
# THE JOB, verbatim: "Let a client have and use working notes-and-secrets
# ('Vault') functionality for portal 2.0. Notes and secrets are ONE entity; a
# flag decides which." Every scenario below is evidence toward that sentence.
#
# Actors: a client acts on their OWN vault. There is exactly ONE live cell —
# client x self — by the operator cell ruling (2026-08-27). Both scope matrices
# set SELF / STAFF / GUEST to `null as never`, so acting as staff or as a guest
# is a compile-time error, not a silently-missing branch.
#
# THREE SCENARIOS WERE ADDED AFTER THE FIRST PLAN PASS. None replaces or
# narrows another; each carries behaviour the contract asserted only in prose,
# or not at all.
#
#   AC-32 and AC-33 were added AT TEST STAGE (repair cycle, operator dispatch
#   2026-08-28), covering two of the FIVE defects the integration suite exposed
#   and that were repaired INSIDE the module — AC-32 (the revealed-secret map
#   must not survive a refresh or a destroy) and AC-33 (isReady() must await
#   the brand config rather than racing it). The prover wrote them into the
#   co-located mirror and FILED the gap rather than editing this planner-owned
#   copy, whose write lane is docs/sdd/** alone; the planner closed the gap
#   here (sync dispatch 2026-08-28). Both were asserted in prose only —
#   parity.yaml row C11 and design.md §12 — and no scenario carried them.
#
#   AC-34 was added by the PLANNER (coherence dispatch 2026-08-28) for a NEW
#   capability, under the operator ruling of that date: a revealed secret must
#   not survive a logout. It is not a repair of a scenario that existed; it is
#   the record of a confirmed CROSS-CLIENT PLAINTEXT EXPOSURE and of the
#   in-module fix that closes it (parity.yaml row X8, design decision B6).
#   THIS SCENARIO IS OWED TO THE CO-LOCATED MIRROR — the prover must copy it
#   verbatim, AND land a proving test whose title names AC-34, because
#   client-notes.traceability.test.ts fails any tagged scenario with no
#   proving test.
#
# The two DEFERRED defects — the ones that root-caused to shared platform files
# and were NOT repaired — are AC-15 and AC-29 above (review-notes.md §O.0).
#
# THE ORACLE DOES EXPOSE STAFF CAPABILITY. Every one of the following is a REAL,
# oracle-demonstrated capability this delivery does NOT carry. Recorded here —
# not silently missing — so a reader cannot mistake a signed drop for an
# oversight. Each carries an operator sign-off dated 2026-08-27 (tier-1) and a
# Linear reference in parity.yaml (Dropped-with-Linear-issue, per
# verify-parity-oracle.companion.md):
#   - S1 reading and writing ANOTHER client's vault through the admin endpoint family
#   - S2 the entire lead vault
#   - S3 writing visible_for_client — the hide-from-clients control (admin-only
#        in the oracle; the FIELD is kept because it drives the client-visible
#        "hidden from client" badge, see AC-13)
#   - S4 the vault timeline event family
#   - S5 the admin-only "visible to client" badge
#   - S6 the $userCan vault functionality codes (constant-true for a client)
# And two rows that are NOT drops of oracle capability:
#   - C16 free-text search across the vault — ABSENT from the oracle entirely
#   - C11b copy-to-clipboard — presentation, over the plaintext AC-11 publishes
# No capability above has any scenario in this file. That absence IS the record
# — do not add one without a new operator ruling reversing the drop.
#
# ONE DELIBERATE DIVERGENCE FROM THE ORACLE, so a later reader does not
# "correct" it back: converting a label-less note into a secret REFUSES with a
# named missing field instead of opening a modal (AC-10). Headless owns
# capability, not presentation; the precondition is the capability and it is
# preserved exactly, with the field named so the consumer knows which editor to
# open. Recorded as design decision D4.

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

  Background:
    Given I am an authenticated client acting on my own account
    And my brand has notes and secrets switched on
    And every request I make is addressed to my own vault as that client

  # === THE COLLECTION ========================================================

  @AC-1 @collection
  Scenario: Read my own vault
    When I open my vault
    Then I see the reactive list of my own notes and secrets together
    And no other client's vault is ever loaded

  @AC-2 @collection @jtbd
  Scenario: Show only my notes, or only my secrets
    Given my vault holds both notes and secrets
    When I choose to see only my notes
    Then I see exactly my notes and none of my secrets
    And when I choose to see only my secrets I see exactly my secrets and none of my notes
    And the choice between the two is offered to me as part of the vault's own filter controls

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
    When I open my vault
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

  @AC-32 @collection
  Scenario: Leaving or refreshing my vault clears any secret I had revealed
    Given one of my vault assets is a secret I have revealed
    When I refresh my vault
    Then the secret I revealed is masked again, because a refresh may have changed it
    And when I instead leave my vault entirely, the secret I revealed is masked again there too

  @AC-34 @collection @identity
  Scenario: A secret I revealed does not outlive my session
    Given one of my vault assets is a secret I have revealed
    When I log out
    Then the secret I revealed is masked again
    And when another client signs in on the same device, none of my revealed plaintext is readable to them
    And that client sees only their own vault

  @AC-12 @collection
  Scenario: See who wrote and last changed each of my vault assets
    Given one of my vault assets was written by a member of staff and another by me
    When I view my vault
    Then each asset tells me who wrote it and when
    And each asset that has been changed tells me who changed it and when
    And each asset attached to a product I bought tells me which product

  @AC-13 @collection
  Scenario: See which of my vault assets are hidden from me by staff
    Given one of my vault assets is marked as hidden from clients
    When I view my vault
    Then that asset is shown to me as hidden from clients
    And my other assets are not

  @AC-14 @collection @guard
  Scenario: My vault is unavailable when my brand switches it off
    Given my brand has notes and secrets switched off
    When I look at my vault
    Then I am told the vault is not available to me
    And nothing is ever asked of the server on my behalf

  @AC-15 @collection @guard @blocked-on-platform
  Scenario: My vault is read-only while my account is a staged import
    Given my account is a staged import
    When I open my vault
    Then I can still read my notes and secrets
    But pinning, deleting and converting are all refused
    And nothing is written on my behalf

  @AC-16 @collection
  Scenario: Know whether my vault is loading, empty, or errored
    When I open my vault
    Then I can see whether it is loading, empty, or errored
    And when something goes wrong my vault records the failure for me to read rather than interrupting me

  @AC-17 @collection @guard
  Scenario: Wait for my vault to become ready without hanging
    Given my session has settled with no client for me to address
    When I wait for my vault to be ready
    Then I am told it will never become ready, rather than waiting forever
    And forcing a re-read in that state is refused instead of asking the server

  @AC-33 @collection @guard
  Scenario: My vault waits for my brand's own settings before saying it is not ready
    Given I am authenticated and addressable as a client
    And my brand's own settings have not yet arrived
    When I wait for my vault to be ready
    Then I am not told it is unavailable while my brand's settings are still arriving
    And once they arrive I am told my vault is ready

  # === THE EDITOR ============================================================

  @AC-18 @editor @jtbd
  Scenario: Open one of my secrets for editing and see its real value
    Given one of my vault assets is a secret
    When I open it for editing
    Then the form holds its real value, not its mask
    And opening one of my NOTES for editing asks the server for nothing extra

  @AC-19 @editor
  Scenario: Write a new note
    Given I have something I want to remember about my account
    When I write it as a new note and save it
    Then it is stored in my vault as a note
    And my vault list shows it

  @AC-20 @editor @jtbd
  Scenario: Write a new secret
    Given I have a value I want stored privately
    When I write it as a new secret with a label and save it
    Then it is stored in my vault as a secret
    And it is stored the same way a note is, differing only by being a secret and having a label

  @AC-21 @editor
  Scenario: Change one of my existing vault assets
    Given one of my vault assets holds something out of date
    When I change it and save
    Then my vault holds the changed asset
    And nothing about the asset that I did not change is altered

  @AC-22 @editor
  Scenario: Attach one of my vault assets to a product I bought, and detach it
    Given one of my vault assets is attached to no product
    When I attach it to a product I bought and save
    Then my vault records it as attached to that product
    And detaching it again records it as attached to nothing

  @AC-23 @editor @jtbd
  Scenario: Turn an unlabelled note into a secret by giving it a label
    Given one of my notes has no label
    When I open it to make it a secret and try to save without a label
    Then the save is refused and I am told the label is required
    And giving it a label and saving stores it as a secret with that label, in one go

  @AC-24 @editor @jtbd
  Scenario: The form asks me for a label only when I am writing a secret
    Given I am writing a new vault asset
    When it is a secret
    Then the form requires a label and offers me somewhere to write one
    And when it is a note the form neither requires a label nor offers one

  @AC-25 @editor
  Scenario: Know the state of the editor while I use it
    Given I have opened an existing vault asset for editing
    Then the editor tells me it is an existing asset, not a new one
    And it tells me when what I have typed differs from what is stored
    And it tells me while it is saving, when it has saved, and when the save failed

  @AC-26 @editor
  Scenario: Save exactly what I last typed, and close the editor cleanly
    Given I have typed one value and then quickly replaced it with another
    When I save
    Then what is stored is the second value, not the first
    And closing the editor leaves nothing of it behind

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
  Scenario: Every order my vault offers me actually works
    Given my vault offers me a set of columns to order by
    When each of those orders is asked of the real system
    Then each one is answered
    And any that is not answered is withdrawn from what my vault offers me

  @AC-31 @criteria @proof @jtbd
  Scenario: The split between my notes and my secrets actually works against the real system
    Given my vault holds both notes and secrets
    When only-notes and only-secrets are each asked of the real system
    Then each is answered with exactly that kind and no other
    And together they account for everything in my vault
