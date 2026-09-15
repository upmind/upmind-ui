# client-notifications — the module's behavioural source of truth (capability
# altitude). Authored by the BDD route of the test factory at the Plan stage.
#
# CO-LOCATION IS THE REQUIREMENT, mirroring the client-phone / client-email
# precedent: this file lives at
#   packages/headless/src/modules/client-notifications/__tests__/client-notifications.feature
# and it is the single source of truth that
# client-notifications.traceability.test.ts reads and enforces the @AC link
# against, both ways. Nothing in the suite reads a planning artefact — those are
# not deliverables and are absent from a fresh clone and from CI.
#
# ADR-020 governs the declarative, non-executable style. ADR-001 governs the
# actor x context altitude. ADR-021 governs which layer proves each scenario.
# Cited, never restated.
#
# ONE scenario per capability the parity table carries, at actor x context
# altitude. This module ships BOTH halves — the COLLECTION a consumer reads the
# preference grid from, and the per-account EDITOR that changes and saves it —
# because the editor exists in the oracle (it lives in the consuming component,
# NotificationPreferences.vue) and the 2026-08-05 client-email amputation is the
# receipt the hybrid derivation exists to prevent.
#
# ONE CAPABILITY, ONE SCENARIO — however many doors deliver it. Where the same
# capability was once stated once per door (the locked-topic refusal five times,
# each post-save promise once per save direction), it is now stated ONCE with
# one When/Then pair per door inside it, so no door lost its step and no
# capability is claimed twice (feature-file review, 2026-09-10).
#
# Business language only. The wire-level read-backs that PROVE each scenario
# (the request URL, the token, the absent Authorization header, the request
# body) live in requirements.md / parity.yaml, not here.
#
# ONE LIVE ACTOR — client x self. Both scope matrices set
# SELF / STAFF / CLIENT / GUEST to `null as never`, so no actor gets a context
# to act through: the matrix constrains CONTEXTS, not actors, so `.for(anything,
# id)` is never spellable. That is a declared absence, not a silently-missing
# branch — see AC-13. A client is served two ways — signed in, or following an
# emailed link — but that is one actor, not two.
#
# THE ORACLE EXPOSES NO STAFF CAPABILITY HERE. Unlike client-phone, whose
# legacy shipped an admin endpoint family, every endpoint this module reads is
# session-implicit: there is no clients/{id} segment and no acting-as parameter
# anywhere in the oracle. Staff acting for a client is therefore
# Not-supported-with-reason in parity.yaml, NOT a signed drop — there is nothing
# to drop. No scenario claims it, and AC-13 proves it cannot be spelled.
#
# THE EMAILED-LINK CASE SHIPS WITH A DECLARED LIMIT. No recorded oracle exists
# for the link token and nothing in the repo can mint one, so its scenarios are
# proven REQUEST-SIDE: that the request goes out identified by the link and by
# nothing else. The response shape is inherited from the client x self recorded
# capture — the same endpoint. A hand-authored response fixture presented as
# recorded is a run defect, not a shortcut.
#
# CAPABILITIES DELIBERATELY LEFT TO THE CONSUMING PAGE, recorded so a later
# reader does not mistake their absence for an amputation:
#   - the topic-description show-more / show-less clamp (presentation over a
#     string this module already publishes)
#   - the "manage preferences for <username>" page heading (presentation over a
#     route parameter this module never reads)
#
# ORACLE DEFECTS NOT PORTED, each preserving its capability: the uncapped
# readiness poll (AC-11), the cast on the write body, the swallowed save
# failure (AC-7), the undefined channels-list crash (AC-4), the unpaginated
# opt-outs read (AC-2), and the credential in the query cache key.

@module:client-notifications @variant:hybrid @cell:client-self
Feature: A client manages which notifications reach them, and on which channels

  Notification preferences are a grid: every notification TOPIC crossed with
  every CHANNEL it can be delivered on, each pair either on or off. Two
  surfaces serve them — a COLLECTION that reads the grid as the server holds
  it, and an EDITOR that holds an unsaved draft of it and writes the whole set
  back in one save. Some topics are locked: they are essential, and no one may
  opt out of them.

  One actor reaches the grid: the CLIENT, on their own preferences. A client is
  served two ways — signed in, or following an emailed link, identified by that
  link alone. Staff cannot act here, and there is no guest.

  This module is preferences ONLY. There is no inbox, no message list, and
  nothing to mark as read.

  # === THE COLLECTION: SEEING THE GRID =======================================

  Background:
    Given I am an authenticated client managing my own notification preferences

  @AC-1 @client @collection
  Scenario: See every topic, every channel, and the state of each pair
    When I open my notification preferences
    Then I see every notification topic offered to me
    And I see every channel my notifications can be delivered on
    And each topic and channel pair shows whether it is on or off for me
    And no other account's preferences are ever loaded

  @AC-2 @client @collection
  Scenario: See the whole grid, never a first page of it
    Given I have opted out of more pairs than one server page would return
    When I open my notification preferences
    Then every one of my opt-outs is accounted for
    And no pair is shown as on merely because its opt-out was left off a page

  @AC-11 @AC-1 @client @collection
  Scenario: See my preferences load, or be told they failed, never a wait that never ends
    When I wait for my notification preferences to be ready
    Then I am told once they have settled, or that they failed
    And I am never left waiting on a repeating check that has nothing left to wait for
    When I open my notification preferences
    Then I can see whether they are loading, errored, or ready

  # === THE EDITOR: CHANGING THE GRID =========================================

  @AC-3 @client @editor
  Scenario: Turn one channel off for one topic and save it
    Given my notification preferences are ready to edit and save
    When I turn one channel off for one topic and save
    Then that pair is off for me from then on
    And every other opt-out I already had is still recorded
    And the grid I read reflects the change without my reopening it

  @AC-4 @client @editor
  Scenario: Turn every channel on, or every channel off, for one topic at once
    Given my notification preferences are ready to edit
    When I turn on every channel for one topic
    Then that topic reaches me on every channel
    And the topic is reported as having all its channels on
    When I turn off every channel for one topic
    Then that topic reaches me on no channel at all
    And the topic is no longer reported as having all its channels on

  @AC-4 @client @editor @ordering
  Scenario: Turn a whole topic off the instant my preferences open
    Given I act on a whole topic the instant my preferences open, before waiting for anything
    When I turn off every channel for that topic
    Then every channel of that topic is accounted for, not only those that happened to have arrived
    And I could never change my preferences before the whole channel list was known

  @AC-5 @client @editor
  Scenario: Abandon my unsaved changes
    Given I have changed a pair without saving
    When I revert my changes
    Then the grid reads exactly as the server holds it
    And I am no longer told I have unsaved changes

  @AC-5 @client @editor
  Scenario: Be told whether I have unsaved changes, and be refused a pointless save
    Given my notification preferences are ready to edit
    When I save without having changed anything
    Then nothing is written
    And I am told I have no unsaved changes

  @AC-3 @client @editor
  Scenario: See that my save is running until it finishes
    Given I have changed a pair without saving
    When I save my preferences
    Then I am told the save is in progress until it settles

  # The locked-topic refusal is ONE capability reached through five doors — one
  # channel, a whole topic, a direct update, the form renderer's write door, and
  # a bulk clear through that same door. One When/Then pair per door, so the
  # guard is proven on every one of them and claimed only once.

  @AC-6 @AC-14 @client @editor @guard
  Scenario: Be refused every way I try to opt out of an essential topic
    Given one of my topics is locked because it is essential
    When I try to turn a channel off for that locked topic
    Then the pair stays on
    And I am not told I have unsaved changes, because nothing changed
    And a later save of a legitimate change carries no opt-out for that locked topic
    When I try to turn off every channel for that locked topic
    Then that topic still reaches me on every channel it did before
    When I call update directly with a value that newly opts a locked topic out
    Then that locked topic still reaches me on every channel
    And nothing about that locked topic reaches the server
    And the rest of that same save still goes through
    When I change a pair through the form renderer's write door that would newly opt a locked topic out
    Then nothing about that locked topic reaches the server once I save
    When I try to clear every channel of the locked topic through the form renderer's write door
    Then that locked topic still reaches me on every channel it did before

  @AC-6 @client @editor
  Scenario: See which of my topics are locked
    Given one of my topics is locked and another is not
    When I view my notification preferences
    Then the locked topic is shown as one I cannot opt out of
    And the other topic is shown as one I can

  @AC-7 @client @editor
  Scenario: Be told when my save fails, and keep the work
    Given I have changed a pair without saving
    When my save is rejected
    Then I am told the save failed
    And my change is still there to save again
    And I am still told I have unsaved changes

  @AC-3 @AC-6 @client @editor @projection
  Scenario: The channels I turn off are exactly the ones that stop reaching me
    Given my notification preferences are ready to edit
    When I turn one pair on, turn a different pair off, and save
    Then the pair I turned on keeps reaching me
    And the pair I turned off stops reaching me, on exactly that topic and that channel
    And a pair already turned off for me still reads as off, and every other pair reads as on
    And what I saved differs from what was already held for me by exactly the one pair I changed

  # === THE EMAILED LINK: THE SAME GRID, REACHED WITHOUT SIGNING IN ===========

  @AC-8 @client
  Scenario: Manage my preferences from an emailed link without signing in
    Given I am a client who followed an emailed notification-preferences link
    When I open my notification preferences and turn a channel off for a topic and save
    Then I see the same grid a signed-in client sees
    And my change is recorded against the account the link addresses
    And the link I followed is the only thing that identifies me
    And I am never identified by a signed-in account

  @AC-10 @client
  Scenario: See the topics and channels on offer when following an emailed link
    Given I am a client who followed an emailed notification-preferences link
    When I open my notification preferences from that link
    Then I see every notification topic and every channel, exactly as a signed-in client does
    And the topic and channel lists are not addressed by my link

  # === DENIED CELLS: WHO CANNOT ACT, AND WHY =================================
  #
  # The denial is ONE absence — nobody is offered anyone else's preferences —
  # read back from both ends: any actor finds no account to act on behalf of,
  # and staff specifically are offered no way in at all.

  @AC-13 @staff @client @denial
  Scenario: No one can point this at another person's preferences
    Given any actor reaches this module
    When that actor looks for an account to act on behalf of
    Then none is offered, on either the collection or the editor
    And the only preferences reachable are those of the acting identity itself
    Given I am staff
    When I look for a way to manage a named client's notification preferences
    Then this module offers me none
    And there is no account I can name to act on behalf of
    And nothing in this module reads or writes preferences for anyone but the acting identity

  # === THE REQUEST CONTRACT ==================================================

  @AC-12 @client @contract
  Scenario: Always see my whole grid, and only the channels that can reach me
    Given my whole notification grid is ready to read
    When I read my whole notification grid
    Then I see the whole of my grid, never a page of it
    And I see only the channels that can reach a client like me
    And nothing outside my preferences decides what is asked for on my behalf

  @AC-12 @client @contract
  Scenario: Find no filter or sort on my grid, because all of it is always shown
    Given my notification preferences are ready to read
    When I look for a way to filter or sort the grid
    Then the module offers me none, because the server offers none
    And the whole grid is always present, so there is nothing a filter would reveal

  # === POST-SAVE STATE: WHAT SURVIVES A SUCCESSFUL SAVE ======================
  #
  # A save either GROWS the opt-out set (a pair turned off) or SHRINKS it (a
  # topic, or a single pair, turned back on). The direction matters: round 2's
  # defect lived in the shrinking one — the draft emptied correctly, then
  # silently re-grew. So each post-save promise is stated once and proven in
  # BOTH directions, one When/Then pair per direction.

  @AC-3 @AC-4 @AC-5 @client @editor @post-save @shrink
  Scenario: My saved preferences survive the save settling
    Given my notification preferences are ready to edit
    When I turn one channel off, save, and let the save fully settle
    Then the pair I changed still reads as I saved it
    And I am no longer told I have unsaved changes
    And my whole preference grid is still present, not emptied
    When I turn every channel back on for a topic that was fully off, save, and let the save settle
    Then that topic still reaches me on every channel
    And my whole preference grid still reflects exactly what I saved, not a re-grown draft
    When I turn one channel back on for a topic, save, and let the save settle
    Then that pair still reads as enabled
    And the topic's other, untouched opt-out is still recorded

  @AC-3 @client @editor @post-save @shrink
  Scenario: A second save always carries my whole current set, never an empty one
    Given my notification preferences are ready to edit
    When I save one change, let it settle, then change a different pair and save again
    Then the second save carries my whole current set of turned-off channels
    And the second save never carries an empty set
    And none of the channels I had already turned off come back on
    When I save a change that turns channels back on, let it settle, then change a different pair and save again
    Then no channel I had just turned back on is turned off again

  @AC-5 @client @editor @post-save @shrink
  Scenario: Reverting after a save restores what I saved, not what I had before
    Given my notification preferences are ready to edit
    When I change a pair, save it, let the save settle, and then revert
    Then the grid reads exactly as I saved it
    And it does not read as it did before I made that change
    When I turn channels back on for a topic, save it, let the save settle, and then revert
    Then the grid reads exactly as I saved it, with that topic still fully on

  @AC-5 @client @editor @post-save @shrink
  Scenario: After a save, reverting changes nothing, because my grid already matches what was saved
    Given my notification preferences are ready to edit
    When I change a pair, save it, and am then told I have no unsaved changes
    Then what I would revert to is exactly what is held for me, not merely reported as clean
    When I turn every channel back on for a topic, save it, and am then told I have no unsaved changes
    Then what I would revert to is still exactly what is held for me, not merely reported as clean

  # === POST-SAVE STATE: THE EMAILED LINK, NOT ONLY THE SIGNED-IN CLIENT =======
  #
  # Every post-save scenario above runs as a signed-in client. A client
  # following an emailed link reaches the same grid, and both prior rounds'
  # defects were post-save defects, so an untested post-save link case is
  # exactly the kind of asymmetry that lets a third one hide. This PAIR is
  # deliberately kept as a pair, and deliberately not folded into the scenarios
  # above.

  @AC-8 @client @post-save
  Scenario: Saved preferences from an emailed link survive the save settling
    Given I am a client who followed an emailed notification-preferences link
    And I have changed a pair and saved it
    When the save has fully settled
    Then that pair still reads as I saved it
    And I am no longer told I have unsaved changes

  @AC-8 @client @post-save
  Scenario: A second save from an emailed link never wipes what was already saved
    Given I am a client who followed an emailed notification-preferences link
    And I have just saved a change to my preferences, and it has settled
    When I change a different pair and save again
    Then the second save carries my whole current opt-out set
    And I am still identified only by the link I followed, never by a signed-in account

  # === HARDENING: AN OPT-OUT THAT PREDATES THE LOCK ==========================
  #
  # A topic can become essential AFTER I have already turned one of its channels
  # off. The guard refuses NEW opt-outs on a locked topic; it must never quietly
  # drop one the server already holds. One When/Then pair per door that could
  # drop it — an ordinary save, the form renderer's write door, a bulk clear,
  # and a bulk clear through that same door.

  @AC-6 @AC-14 @client @editor @guard
  Scenario: An opt-out I made before a topic became essential is never quietly dropped
    Given my notification preferences are ready to edit
    And the server already holds an opt-out for a topic that has since become locked
    When I change a different pair and save
    Then the pre-existing opt-out on the locked topic is still recorded
    And my legitimate change is recorded alongside it
    When I change a different pair through the form renderer's write door and save
    Then the pre-existing opt-out on the locked topic is still recorded
    When I turn off every channel for a different topic and save
    Then the pre-existing opt-out on the locked topic is still recorded
    And my whole-topic change is recorded alongside it
    When I then clear every channel of a different, unlocked topic through the form renderer's write door and save
    Then my legitimate change on the unlocked topic is recorded alongside it

  # === HARDENING: A REJECTED SAVE CAN BE RETRIED ==============================

  @AC-7 @client @editor
  Scenario: A rejected save can be retried with the same change
    Given I have changed a pair without saving
    And my save was rejected once already
    When I save again without changing anything further
    Then a second save is attempted
    And it carries the same change as the first attempt

  # === HARDENING: SESSION TIMING AND CREDENTIAL CONTAINMENT ===================
  #
  # Gap-closure pass (2026-08-31, operator ruling (b) lifted). The late-session
  # REFRESH wipe premise (`review-notes.md` §C5) is now fixed: the top-up that
  # unblocks a session still resolving a client id is gated on the manager
  # still waiting for it, so it can never re-enter `loading` and discard an
  # already-open editor's unsaved draft. This scenario proves the top-up still
  # does its ORIGINAL job — the fix must not trade a wipe for a stuck editor.

  @AC-16 @client @editor @hardening
  Scenario: Open my preferences before I am signed in, and edit them once I am
    Given I open my notification preferences before my session has resolved who I am
    When my session later resolves my identity
    Then I can change my preferences without reopening them

  @AC-16 @client @editor @hardening
  Scenario: Keep my unsaved changes when a sign-in happens elsewhere while my link editor is open
    Given I am a client who followed an emailed notification-preferences link
    And my preferences are already open and I have changed a pair without saving
    When someone signs in on the same browser afterwards
    Then my unsaved change is still there
    And I am still told I have unsaved changes

  @AC-18 @client @security
  Scenario: My emailed link is never exposed anywhere else on the page
    Given I am a client who followed an emailed notification-preferences link
    When anything else on the page reads what this module publishes about me
    Then my link is never found anywhere in it
    And I can still read and save my preferences from that link

  # === HARDENING: THE FORM RENDERER'S OWN WRITE DOOR (AC-14, gap-closure) ====
  #
  # The generic playground form renderer drives every edit through ONE write
  # door — never a module-specific action. Its absence was why the page could
  # render the grid and change nothing. Proven here as its own capability; the
  # SAME locked-topic guard this door carries is proven on it inside the two
  # guard scenarios above.

  @AC-14 @client @editor
  Scenario: Change several channels quickly, and save exactly what I ended up setting
    Given my notification preferences are ready to edit
    When I change several pairs in quick succession
    Then only what I ended up setting is held for saving
    And saving right after that change saves what I actually set, never a value from before I changed it

  # === HARDENING: THE ALL-CHANNELS TICK, AND WHAT IT NEVER SENDS =============
  #
  # Per-topic bulk toggling carries one sentinel entry per topic in the model so
  # a bulk control can reflect at a glance whether every channel is on. The
  # sentinel is deliberately IN the model and deliberately NEVER on the wire.
  # These two scenarios prove: the control tells the truth after an ordinary
  # (non-bulk) change, not only after its own bulk action; and the sentinel
  # itself never reaches the server as a bogus opt-out row — driven directly,
  # and driven through the form renderer's write door.

  @AC-4 @client @editor
  Scenario: The all-channels tick for a topic tells the truth after I change one channel
    Given my notification preferences are ready to edit
    When I turn off just one channel of a topic that had every channel on
    Then that topic is no longer reported as having all its channels on
    And turning that one channel back on reports the topic as having all its channels on again

  @AC-4 @AC-3 @client @editor @projection
  Scenario: Turning off every channel for a topic stops exactly that topic's real channels, and nothing else
    Given my notification preferences are ready to edit
    When I turn off every channel for a topic and save
    Then every real channel of that topic stops reaching me
    And nothing but those real channels is ever recorded against me
    When I clear every channel of a topic through the all-channels tick and save
    Then every real channel of that topic still stops reaching me
    And the all-channels tick itself is never recorded as a channel of my own

  # === HARDENING: THE ALL-CHANNELS TICK THROUGH THE FORM RENDERER'S DOOR =====
  # (gap-closure, 2026-09-01, B2) ==============================================
  #
  # Every bulk scenario above drives the bulk action directly. The form renderer
  # never calls it — it drives every edit, bulk included, through the same
  # generic write door AC-14 proves for ordinary per-channel edits. Nothing
  # proved the bulk expansion through THAT door until now, and that gap is
  # exactly where a real defect (B1) once hid: a bulk clear followed by turning
  # one channel back on silently discarded the per-channel change.

  @AC-4 @client @editor @guard
  Scenario: A channel I turn back on after clearing a topic stays on, however quickly I do it
    Given my notification preferences are ready to edit
    When I clear every channel of a topic and turn one of its channels straight back on
    Then that one channel reaches me on
    And every other channel of that topic reaches me on none
    When I clear every channel of a topic, wait for it to settle, and then turn one of its channels back on
    Then that one channel still reaches me on
    And every other channel of that topic still reaches me on none

  @AC-4 @client @editor
  Scenario: Turn on every channel for a topic, and one I had turned off comes back on
    Given a topic already has one of its channels turned off for me
    When I turn on every channel for that topic
    Then every channel of that topic reaches me on, including the one that was off

  @AC-4 @client @editor
  Scenario: Turn off one channel, and no other channel moves
    Given my notification preferences are ready to edit
    When I turn off one channel for one topic
    Then no other channel of any topic changes

  @AC-4 @client @editor @guard
  Scenario: Turn on every channel for a topic but keep one off, and that one stays off
    Given a topic already has one of its channels turned off for me
    When I turn on every channel for that topic but, in that same instant, explicitly keep one channel off
    Then the channel I explicitly kept off stays off
    And every other channel of that topic reaches me on

  # === HARDENING: A TICK THAT STICKS, IN A CONTROLLED FORM ===================
  #
  # The consuming page renders this grid through a CONTROLLED form, so one
  # change produces TWO writes — mine, then the form restating the draft it was
  # still showing. On the landed page the later write won, so ticking a channel
  # deselected itself and left nothing to save. These four scenarios are that
  # defect's fence, named as capabilities by the 2026-09-10 feature-file review
  # (F1): the coverage was always there, only its name was missing.

  @AC-3 @client @editor
  Scenario: A channel I tick stays ticked, and Save is offered
    Given my notification preferences are ready to edit
    When I tick one channel for one topic
    Then that channel is on from the moment I tick it, not once some delay has passed
    And I am offered the save, because I am told I have unsaved changes

  @AC-3 @AC-4 @client @editor
  Scenario: A tick I make is never undone by the form redrawing itself
    Given my notification preferences are ready to edit
    When I tick a channel, and the form redraws itself from what it was showing before my change
    Then my tick still stands, on a single channel and on the all-channels tick alike

  @AC-4 @client @editor
  Scenario: The all-channels tick stays where I put it
    Given my notification preferences are ready to edit
    When I tick the all-channels control for a topic
    Then that control stays ticked and every channel of that topic is on
    And it stays that way even when the form restates the channels it held before my change

  @AC-5 @client @editor
  Scenario: Revert restores what I saved, even if the form clears itself first
    Given I have changed a pair without saving
    When the form empties itself and I then revert
    Then the empty form is never taken as my preferences
    And my grid reads exactly as I last saved it, with no unsaved changes left
