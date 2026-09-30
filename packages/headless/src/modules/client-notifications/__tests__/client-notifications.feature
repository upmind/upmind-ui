# client-notifications — the module's behavioural source of truth (capability
# altitude). ONE scenario per capability; the driven ones carry @AC-N and are
# replayed by client-notifications.replay.int.test.ts against their own per-step
# recordings (ONE scenario, ONE recording — FE-3145, ADR 035). A capability no
# scenario can drive keeps ONE @todo scenario with its named blocker, so its
# absence is a recorded decision, never a silent drop.
#
# CO-LOCATION IS THE REQUIREMENT, mirroring client-email / client-notes:
#   packages/headless/src/modules/client-notifications/__tests__/client-notifications.feature
# is the single truth client-notifications.traceability.test.ts reads and
# enforces the @AC link against, both ways.
#
# ADR-020 governs the declarative, non-executable style. ADR-001 governs the
# actor x context altitude. Cited, never restated.
#
# ONE LIVE ACTOR — client x self. Both scope matrices set every actor cell to
# `null as never`, so `.for(anything, id)` is never spellable: the module is
# preferences for the acting identity alone. That is a declared absence (AC-13),
# not a silently-missing branch, and staff acting for a client is
# Not-supported-with-reason — every endpoint is session-implicit, with no
# clients/{id} segment and no acting-as parameter to drop.
#
# THE EMAILED-LINK CASE CANNOT BE RECORDED. No recorded oracle exists for the
# link token and nothing in the repo can mint one, so its scenarios are @todo
# with that named blocker rather than proven against a hand-authored response
# presented as recorded (ADR 035 forbids a fabricated provenance).

@module:client-notifications @variant:hybrid @cell:client-self
Feature: A client manages which notifications reach them, and on which channels

  Notification preferences are a grid: every notification TOPIC crossed with
  every CHANNEL it can be delivered on, each pair either on or off. Two
  surfaces serve them — a COLLECTION that reads the grid as the server holds
  it, and an EDITOR that holds an unsaved draft of it and writes the whole set
  back in one save. Some topics are locked: they are essential, and no one may
  opt out of them.

  One actor reaches the grid: the CLIENT, on their own preferences. This module
  is preferences ONLY — there is no inbox, no message list, nothing to mark as
  read.

  Background:
    Given I am an authenticated client managing my own notification preferences

  # === THE COLLECTION: SEEING THE GRID =======================================

  @AC-1 @client @collection
  Scenario: See every topic, every channel, and the state of each pair
    When I open my notification preferences
    Then I see every notification topic offered to me
    And I see every channel my notifications can be delivered on
    And my preferences are available to read without error

  @AC-2 @client @collection
  Scenario: See the whole grid, never a first page of it
    Given my whole notification grid is ready to read
    When I read my whole notification grid
    Then I see every topic and every channel of my grid at once
    And my preferences are available to read without error

  @AC-11 @AC-1 @client @collection
  Scenario: See my preferences settle, rather than wait on a check that never ends
    When I wait for my notification preferences to be ready
    Then I can see whether they are loading, errored, or ready
    And they settle as ready without error

  @AC-6 @client @collection
  Scenario: See which of my topics are locked
    Given one of my topics is locked and another is not
    When I view my notification preferences
    Then the locked topic is shown as one I cannot opt out of
    And the other topic is shown as one I can

  @AC-12 @client @collection @contract
  Scenario: Find no filter or sort on my grid, because all of it is always shown
    Given my notification preferences are ready to read
    When I look for a way to filter or sort the grid
    Then my whole grid is present, so there is nothing a filter would reveal

  # === THE EDITOR: CHANGING THE GRID =========================================
  #
  # The editor is the always-PUT aggregate manager (`useClientNotificationsManager`),
  # driven as a SECOND composables key in the replay. It boots bare —
  # `.as(CLIENT)`, no `.for()` context, since it edits the one account-wide
  # opt-out aggregate — loads the whole grid into an unsaved draft
  # (`model.preferences`, keyed `"<topicId>::<channelId>"`), and writes the whole
  # set back in one save. The pair identities each scenario asserts are read from
  # that scenario's own recording, never copied literals.

  @AC-3 @client @editor
  Scenario: Turn one channel off for one topic and save
    Given my preferences are open in the editor
    When I turn one channel off for an unlocked topic and save
    Then that pair is recorded as off for me
    And every opt-out I already had is still recorded

  @AC-3 @AC-4 @AC-5 @client @editor @post-save
  Scenario: My saved change survives the save settling
    Given my preferences are open in the editor
    When I turn one channel off for an unlocked topic, save, and let it settle
    Then the pair I changed still reads as off
    And my whole preference grid is still present, not emptied

  @AC-4 @client @editor
  Scenario: Turn every channel back on for a topic at once
    Given my preferences are open in the editor
    When I turn every channel back on for a topic that was fully off and save
    Then that topic reaches me on every channel

  @AC-5 @client @editor
  Scenario: Abandon my unsaved changes
    Given my preferences are open in the editor
    When I turn one channel off for an unlocked topic without saving, then revert
    Then the editor holds no unsaved change

  @AC-6 @client @editor @guard
  @AC-14 @guard
  Scenario: The editor refuses to opt out of an essential topic
    Given my preferences are open in the editor
    When I try to turn a locked topic's channel off
    Then the editor keeps that locked topic reaching me on that channel
    And it reports no unsaved change, because an essential topic cannot be opted out

  @AC-7 @client @editor
  Scenario: Be told when my save fails, and keep the work to retry
    # The rejection is a forced fault on the REAL save request (Generator
    # forceStatus): a control response, so ADR 035's recorded-only law does not
    # apply and the request carrying it is the account's own real PUT.
    Given my preferences are open in the editor
    And I have a change waiting to save
    When my save of the aggregate is rejected by the server
    Then I am told the save failed
    And my change is still there to save again

  @AC-3 @client @editor @post-save
  Scenario: A second save always carries my whole current set, never an empty one
    # Recorded save -> re-read -> second save -> re-read, one folder per step: each
    # opt-outs re-read is its own step so the same request answers with the set the
    # prior save left (ADR 035 — a re-read after a write is a new step).
    Given my preferences are open in the editor
    And I have turned one channel off for an unlocked topic and saved
    When I turn a different channel off for another unlocked topic and save again
    Then the pair from my first save is still turned off
    And the pair from my second save is turned off
    And my whole preference grid is still present, not emptied

  # === THE EMAILED LINK: THE SAME GRID, REACHED WITHOUT SIGNING IN ===========

  # DRIVEN (FE-3145): the recorder mints a real link token in plain node and
  # records the token shape the module actually sends — only the opt-outs read and
  # write carry `?token=` (no bearer); topics/channels are brand-global and
  # recorded untokenised under a guest session. Verified green 2026-09-27.
  @AC-8 @client @signed-out @link
  Scenario: Manage my preferences from an emailed link without signing in
    Given I am a client who followed an emailed notification-preferences link
    When I open my preferences from that link and save a change
    Then my change is recorded against the account the link addresses
    And I am identified by the link alone

  @AC-10 @client @signed-out @link
  Scenario: See the topics and channels on offer when following an emailed link
    Given I am a client who followed an emailed notification-preferences link
    When I open my preferences from that link to read the grid
    Then I see every notification topic and every channel a signed-in client sees

  # The link token appears in NONE of what the module publishes — proven with
  # world.expectAbsent, which serialises the whole published context+meta and fails
  # if the token is a substring anywhere.
  @AC-18 @client @security @signed-out @link
  Scenario: My emailed link is never exposed anywhere else on the page
    Given I am a client who followed an emailed notification-preferences link
    When anything else on the page reads what this module publishes about me
    Then my link is never found anywhere in it

  # === HARDENING: SESSION TIMING =============================================

  @AC-16 @client @editor @hardening @signed-out @session-topup
  Scenario: Open my preferences before I am signed in, and edit them once I am
    Given I open my notification preferences before my session has resolved who I am
    When my session later resolves my identity
    Then I can change my preferences without reopening them

  # === DENIED CELLS: WHO CANNOT ACT, AND WHY =================================

  @AC-13 @staff @client @denial
  Scenario: No one can point this at another person's preferences
    # PROVEN by client-notifications.surface.test.ts (compile-time): both scope
    # matrices are all `null as never`, so `.for(actor, id)` does not type-check
    # and cannot be spelled as a runtime step — a compile-time denial with no
    # driven World scenario, not a @todo gap.
    Given any actor reaches this module
    When that actor looks for an account to act on behalf of
    Then none is offered, on either the collection or the editor
