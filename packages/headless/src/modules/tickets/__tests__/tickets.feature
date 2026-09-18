# tickets — the module's ONE feature file: its capability spec, the source
# `tickets.steps.ts` implements, and the playlist the scenario bar plays.
#
# CO-LOCATION IS THE REQUIREMENT: this file lives at
#   packages/headless/src/modules/tickets/__tests__/tickets.feature
# and it is the only spec this module's tests know. Authored by the planner seat
# in FE-3226's SDD run; it is the coverage contract for BOTH the developer and
# the prover, and neither may narrow it without a parity disposition.
#
# ONE SCENARIO PER CAPABILITY THE PARITY TABLE CARRIES — see
# docs/sdd/FE-3226/parity.yaml. Business language only, declarative only: no
# selector, no URL, no UI mechanic appears here. The wire-level read-backs that
# PROVE a scenario (request path, query bag, request body, absence of a request)
# live in the colocated integration specs that assert them; this file says WHAT
# must be true, never HOW it is checked.
#
# ACTORS. A client acts on their OWN support tickets. There is no staff cell and
# no on-behalf-of cell in this module: every staff capability the oracle reveals
# is a recorded drop (parity.yaml, out-of-cell rows), and the run constraint
# forbids `.as('staff')` and `.for('client', id)` outright. "Tickets delegated in
# to me" is NOT an on-behalf-of context — it rides the client's own list.
#
# FOUR CAPABILITIES ARE WRITTEN HERE AS ABSENCES, on purpose. A dropped
# capability that simply vanishes from the spec is the FE-2824 shape; a dropped
# capability asserted as absent can never be quietly re-added or quietly missed.
# They are: message-body search, post-creation rescheduling, moving a ticket to
# another desk, and staff reach.
#
# NO SCENARIO IS BLOCKED ON A RULING ANY MORE. Cycle 0 tagged two @pending-ruling:
# rescheduling (parity Q2) and the AC30 hole (parity Q3). The operator rulings of
# 2026-09-14 close both — see docs/sdd/FE-3226/review-notes.md "Cycle 1".
#   R5 DROPS post-creation rescheduling AND moving a ticket to another desk as
#      ADMIN-ONLY: this module is client x self and ships no admin functionality.
#      Both are now asserted absences. Create-time scheduling is UNAFFECTED, and so
#      are close, reopen and change-subject.
#   R6 rules AC30 a NUMBERING SKIP — no criterion was lost — so its scenario is
#      retired here and the disposition is carried in parity.yaml with its signoff.
# The @pending-ruling tag is retired. Do not re-add either dropped capability.
#
# THE SIX FORMERLY-UNPROVEN SCENARIOS ARE NOW PROVEN — capture landed 2026-09-15.
# This block previously read "SIX SCENARIOS ARE PROMISED BUT NOT YET PROVEN" and told
# the reader the traceability gate STAYS RED until the capture lands. BOTH CLAIMS ARE
# NOW FALSE. They are corrected here rather than deleted, so the history of the
# drop-that-never-happened stays legible.
# AC-7 (product-scoped list), AC-10 (delegated-in), AC-13 (product link/unlink),
# AC-20 (attachment download), AC-21 (attachment delete) and AC-23 (attachment upload)
# each now have a REAL RECORDED FIXTURE, captured live against api.staging.upmind.io and
# independently re-captured by a verifier: the product-scoped list returns 1 row, the
# delegated-in list 10 rows of 25 carrying is_delegated_object, the link/change/unlink
# cycle three 200s with their reads, the download real bytes, the delete a 200, and the
# upload a 200 whose row carries 26 keys. 47 fixtures are present.
#   THE TRACEABILITY GATE IS NOW GREEN, and it closed WITHOUT A SINGLE EDIT to
#   tickets.traceability.test.ts — unchanged since 20837673a. That is what makes the
#   green honest: the gate was never weakened, never skipped, never tagged around, and
#   nothing here was hand-authored. R10's "blocked on a richer staging account" framing
#   was refuted by R12 and stays withdrawn; R12's capture backlog is CLOSED.
# The earlier mis-read had a cause worth remembering, recorded so it is never repeated:
# GET api/self returns the client id on `actor_id`, NOT on `id` (`id` is undefined), so
# comparing a contract product's client_id against self.id silently yields "belongs to
# nobody" — which is how 993 contract products and 25 tickets were once written down as
# two tickets and no product.
#   THE AC-23 ENTRY-POINT HOLE IS NOW THREE-QUARTERS CLOSED, and the last quarter is
#   disclosed rather than papered over. This block previously read "`uploadAttachment`
#   and `uploadFile` appear in ZERO files under `__tests__/`". THAT CLAIM IS NOW FALSE,
#   and is corrected here rather than deleted, so the history stays legible.
#   tickets.upload-attachment.int.test.ts (landed e0442b92a) calls uploadAttachment
#   through the PUBLIC composable surface. MEASURED 2026-09-15: 3 passed / 1 FAILED.
#   PROVEN — the manager-arm multipart POST, the collection-arm multipart POST before any
#   ticket exists, and the 25 MiB / 26214399 size refusal with NO request sent.
#   STILL RED — "refuses a file of a kind the brand does not allow, with NO request sent".
#   The cause is a MISSING PRECONDITION, not a guard defect and NOT cross-file state
#   leakage: the test fails DETERMINISTICALLY IN ISOLATION (1 failed / 3 passed alone),
#   and ZERO of the 47 recorded fixtures carry allowed_upload_file_types, so the guard
#   correctly treats the recorded brand as UNRESTRICTED (empty/unset means no restriction
#   — the contract design.md and system-upload both state) and permits the file. The
#   assertion demands a refusal THE RECORDED BRAND CANNOT PRODUCE.
#   RULING R17(a) SETTLES IT (2026-09-15, tier 1). The earlier "Owed" line read
#   "tasks.md T46 (capture a brand config that genuinely restricts, through the module's
#   OWN generator)". THAT ROUTE IS NOT AVAILABLE and the line is WITHDRAWN here rather
#   than deleted, so the history stays legible. Probed live: GET api/brand/settings
#   returns 200 with NO upload keys at all — ALLOWED_UPLOAD_FILE_TYPES is not exposed on
#   this brand, and api/brand/config and api/brand both 404. A restricted-brand config
#   cannot be recorded without a brand-side configuration change — the same shape as the
#   staging contract_request catalogue gap.
#   WHAT THIS FILE NOW PROMISES INSTEAD, because it is true and provable: an ABSENT or
#   EMPTY allowed-types list means UNRESTRICTED, so a file of any kind is PERMITTED and
#   nothing is refused on type grounds. The SIZE refusal (25 MiB / 26214399) is provable,
#   stays, and is NOT weakened. The type-rejection branch stays CODED in the module and is
#   recorded here as UNPROVEN ON THIS BRAND — never deleted, never asserted as proven,
#   never tagged @todo. T45 (the thirteenth must-fail control) is gated behind the re-aim,
#   because a control is graded on flipping its OWN target assertion.
#   THE RE-AIM LANDED (prover, 2026-09-15). The two paragraphs above previously read
#   "STILL RED" and "MEASURED 2026-09-15: 3 passed / 1 FAILED" — THAT IS NOW FALSE and is
#   corrected here rather than deleted. tickets.upload-attachment.int.test.ts now reads
#   4 passed / 0 failed: the former "refuses a file of a kind the brand does not allow"
#   assertion is replaced by "permits a file of any kind when the brand names no
#   permitted kinds, and the upload proceeds" — the scenario this file promises above.
#   T45 (the thirteenth must-fail control) remains OWED: it needs a developer-authored
#   mutant against the guard's own line, which the prover seat may apply blind and
#   confirm RED, but may never hand-author from reading implementation source.
#
# R9 AND R11 CHANGED NOTHING IN THIS FILE, and that is a finding, not an oversight.
# R9 moves a criteria KEY SPELLING (status.code -> an undotted key, translated back to
# the dotted wire key at the tickets service's own edge — the wire is unchanged). R11
# corrects a SCOPE-BUILDER SPELLING (.as('self') -> .as(ScopeActorTypes.CLIENT), and
# deletes a type-erasing cast; .as(CLIENT) IS the client x self cell and is NOT
# .for('client', id), which stays forbidden). Both are wire-/type-level. This file is at
# CAPABILITY altitude: it says WHAT must be true and never HOW it is checked. A ruling
# that changed a scenario here would be a ruling that changed a CAPABILITY. Neither did.
#
# THE AC-1 VACUITY IS FIXED — this block previously read "ONE GREEN SCENARIO IS
# VACUOUS". That claim is NOW FALSE, and is corrected here rather than deleted.
# "List my open support tickets" (AC-1) once replayed a fixture whose body was
# {"data":[],"total":0}, so its row assertion compared [] to [] — true by construction,
# unable to go red on the data path. R12 made the remedy mandatory. It landed: the active
# list is now recorded AT the true active shape
# filter[status.code|neq]=ticket_closed&with_staged_imports=1, returning HTTP 200 with 10
# rows and total 16. The assertion can now genuinely go red on the data path, and the
# fixture body was RECORDED, never hand-authored.

@module:tickets @variant:query @cell:client-self @FE-3226
Feature: A client runs their own support conversations

  A client raises support tickets, finds them again, reads each conversation in
  full, replies, corrects or withdraws what they wrote, manages the files on it,
  and steers the ticket's state until it is resolved. Two surfaces serve them: a
  COLLECTION they search, sort and page, and a per-ticket MANAGER holding that
  ticket, its whole message feed, and its lifecycle actions.

  Everything below is read under one framing: an authenticated client, acting on
  their own support tickets, under their own identity, never on another account's.

  Background:
    Given I am an authenticated client acting on my own support tickets
    And every request I make is addressed to my own tickets as that client

  # === THE PATH LAW — the FE-2824 watch-point ================================

  @AC-PATH @guard
  Scenario: I only ever reach my own tickets, as myself
    When I use any capability this module offers
    Then every request goes to the client-facing support surface
    And no request is ever addressed to the administrative support surface
    And I never act as a staff member, and never act on behalf of another client

  # === THE COLLECTION — finding a ticket =====================================

  @AC-1 @collection
  Scenario: List my open support tickets
    When I open my support tickets
    Then I see every ticket of mine that is not yet closed
    And tickets that arrived into my account from an import are included
    And each ticket carries its status, its desk, and who it belongs to

  @AC-2 @collection
  Scenario: List my closed support tickets
    When I open my closed support tickets
    Then I see only the tickets of mine that are closed
    And no open ticket appears among them

  @AC-3 @collection
  Scenario: Page through a long list of my tickets
    Given I have more tickets than fit on one page
    When I ask for the next page
    Then I see the following tickets, and none I have already seen
    And I am told how many tickets I have in total

  @AC-3 @collection @preferences
  Scenario: My chosen page size is remembered for next time
    Given I am looking at my support tickets
    When I change how many tickets I want to see at once
    Then my choice is saved against my account
    And my other saved support preferences are left as they were

  @AC-4 @collection
  Scenario: Sort my tickets, with the most recently active first by default
    Given I have not chosen an ordering
    When I open my support tickets
    Then the most recently updated ticket is first
    And I can instead order them by reference, by subject, or by when they were raised, in either direction

  @AC-5 @collection
  Scenario: Narrow my tickets by reference, subject, or when they were raised
    When I narrow my tickets to one exact reference
    Then I see only the ticket carrying that reference
    And narrowing by subject matches the whole subject, not part of it
    And clearing a narrowing removes it rather than searching for nothing

  @AC-6 @collection @search
  Scenario: Search my tickets as I enter a term
    Given I am looking at my support tickets
    When I search for a term of at least three characters
    Then I see only the tickets matching that term, from the first page
    And a term of only two characters searches nothing at all
    And a term revised several times in quick succession searches once, for the term I settled on

  # [R13(a), 2026-09-15, tier 1 — the ruling that SETTLES this scenario; the finding was
  # first recorded under R12 and is RATIFIED AS A CONDITIONAL by R13(a)] THE DROP IS
  # PROVISIONAL, NOT FINAL — read before trusting this scenario.
  # The @dropped tag is consistent with parity.yaml's signed NOT-SUPPORTED disposition
  # for message-body-search, so it is NOT removed here: R13(a) rules the drop STANDS for
  # now, because the operator's standing intent is match-legacy and nothing yet
  # contradicts it. It is not re-scoped on suspicion. But that disposition rests on a
  # CLIENT-CODE reading, not a server receipt: the one recorded probe returns two rows
  # that BOTH match on subject, so reference coverage is unproven and body coverage is
  # NOT ruled out. R13(a) makes tasks.md T37's two probes BINDING, not optional — a
  # reference-fragment probe and a body-only probe — and they bind BOTH ways:
  #   body-only probe returns 0 ROWS  -> premise CONFIRMED; parity.yaml's
  #     premise_unproven is cleared and the drop becomes final on a server receipt.
  #   body-only probe returns ROWS    -> premise REFUTED; THE SIGNED DROP IS VOID (the
  #     token op:FE-3226#AC6-ruling-2026-09-14 does not cover a disproven premise).
  #     Remove @dropped from this scenario, re-scope AC-6 to whatever query= actually
  #     covers, and T39 RE-ESCALATES to the operator before anything is re-signed.
  # Until T37 runs this is a RECORDED CONDITIONAL, not an unresolved contradiction — do
  # not assert the claim in the meantime, and do not re-open the spec set to re-litigate
  # it. NOTE the gate's limit: @dropped excludes this scenario from
  # tickets.traceability.test.ts, and the gate is AC-granular anyway, so nothing
  # mechanical can catch this claim — only the probe can.
  @AC-6 @collection @search @dropped
  Scenario: Searching does not reach inside message bodies
    Given one of my tickets contains a word only in the body of a message
    When I search for that word
    Then that ticket is not found by the search
    And the search never asks the server to look inside message bodies

  @AC-7 @collection
  Scenario: See the tickets raised about one of my products
    Given I am looking at one of my products
    When I open the support tickets about that product
    Then I see only the tickets raised against that product
    And I cannot accidentally widen the list back to all my tickets

  @AC-8 @collection
  Scenario: See a short list of my most recent tickets
    When I ask for my most recent support tickets for an overview
    Then I see the few most recently updated, newest first
    And each carries only what an overview needs, not the full ticket record

  @AC-9 @collection @create
  Scenario: Raise a new support ticket
    Given more than one support desk is open to me
    When I raise a ticket with a subject, a message, and a chosen desk
    Then the ticket is created against my account
    And it appears in my support tickets without my asking again

  @AC-9 @collection @create
  Scenario: Attach a product to the ticket I am raising
    When I raise a ticket about one of my products
    Then the new ticket is linked to that product
    And the desk that handles that product is chosen for me unless I choose another

  @AC-9 @AC-26 @collection @create
  Scenario: Raise a ticket to be sent later
    Given my brand allows me to schedule a ticket
    When I raise a ticket and choose a time for it to be sent
    Then the ticket is created carrying that send-later time
    And it is held as scheduled rather than opened immediately

  @AC-9 @collection @create @absorbed
  Scenario: I am told what a new ticket needs before it is sent
    When I try to raise a ticket without a subject, or with neither a message nor a file
    Then nothing is sent to the server
    And the rules that decide what is missing are published by this module for the page that renders the form

  # [R17(b), 2026-09-15, tier 1] The server requires a message body ONLY when no file is
  # attached — verbatim, 422: "The body field is required when files is not present."
  # The scenario above previously read "without a subject or without a message", which
  # promised a refusal the server does not make. It is corrected rather than deleted. A
  # client guard stricter than the server narrows a capability the server grants — the
  # FE-2824 silhouette — so this file promises the acceptance explicitly.
  @AC-9 @collection @create @guard
  Scenario: A ticket carrying a file but no message is accepted
    When I raise a ticket carrying a subject and an attached file but no message
    Then it is not refused for having no message
    And the ticket is created against my account

  @AC-10 @collection @delegated
  Scenario: Tickets shared with me sit alongside my own
    Given another account has delegated one of their tickets to me
    When I open my support tickets
    Then I see that ticket alongside my own
    And I can tell which tickets are mine and which were delegated to me
    And my list is never narrowed to only my own tickets

  # === THE MANAGER — one ticket ==============================================

  @AC-11 @manager
  Scenario: Open one of my tickets
    When I open one of my support tickets
    Then I have that ticket with everything the detail view reads: its desk, its status, the product it is about, who is handling it, and who it is shared with

  @AC-12 @manager
  Scenario: Know the state of the ticket I am reading
    When I open a ticket
    Then I know whether it is closed, whether it is locked, whether it is scheduled, and whether it arrived by import
    And a scheduled ticket shows me when it is due rather than when it was last touched

  @AC-13 @manager @product
  Scenario: Link, change, and unlink the product a ticket is about
    Given I am reading one of my tickets
    When I attach one of my products to it
    Then the ticket is about that product
    And choosing a different product replaces it rather than adding a second
    And unlinking clears the product from the ticket entirely

  # === THE MANAGER — the conversation ========================================

  @AC-14 @manager @feed
  Scenario: Read the conversation on a ticket
    When I open a ticket
    Then I see its messages newest first, each with the files attached to it
    And I never see an agent's internal log rows among them

  @AC-15 @manager @feed
  Scenario: Read further back in a long conversation
    Given a ticket has more messages than I have been shown
    When I ask for older messages
    Then I see the messages immediately before the oldest one I hold
    And I am never shown a message twice, even if new ones arrive while I read
    And when I reach the start of the conversation I am told there is no more

  @AC-15 @manager @feed
  Scenario: See only the messages that carry files
    Given some messages on a ticket carry files and others do not
    When I ask to see only the messages with files
    Then I see every message on the ticket that carries a file
    And messages with files that I had not yet scrolled back to are included

  @AC-16 @manager @feed
  Scenario: Re-read one message on its own
    Given I am reading a ticket's conversation
    When I ask for one message again
    Then I have that message with its files, refreshed
    And it takes its own place in the conversation rather than being added again

  @AC-22 @manager @feed
  Scenario: See what happened to the ticket, in the conversation
    Given a ticket has been opened, replied to, and closed
    When I read its conversation
    Then the things that happened to it appear among the messages, in the order they happened
    And only the events that concern this ticket appear

  # === THE MANAGER — writing =================================================

  @AC-17 @manager @write
  Scenario: Reply to a ticket
    Given I am reading one of my tickets
    When I send a reply
    Then my reply joins the conversation
    And the ticket's own state is refreshed, because replying can change it

  @AC-17 @manager @write
  Scenario: Reply to a ticket that has files attached
    Given I have attached files to my reply
    When I send the reply
    Then the reply carries those files
    And each file was uploaded before the reply was sent, not with it

  @AC-17 @manager @write @conflict
  Scenario: Reply when an agent has replied first
    Given an agent replied after the last message I was shown
    When I send my reply
    Then I am cautioned rather than shown an error
    And the newer messages are brought in so I can read them before trying again

  @AC-18 @manager @write
  Scenario: Correct a message I wrote
    Given one of the messages on the ticket is mine to manage
    When I correct its wording
    Then the corrected message replaces the original in the conversation

  @AC-18 @manager @write @guard
  Scenario: I cannot correct a message that is not mine
    Given a message on the ticket is not mine to manage
    When I try to correct it
    Then nothing is sent to the server
    And the message is unchanged

  @AC-19 @manager @write
  Scenario: Withdraw a message I wrote
    Given one of the messages on the ticket is mine to manage
    When I withdraw it and say why
    Then the message is recorded as withdrawn
    And it still occupies its place in the conversation rather than vanishing

  @AC-19 @manager @write @guard
  Scenario: I cannot withdraw a message that is not mine
    Given a message on the ticket is not mine to manage
    When I try to withdraw it
    Then nothing is sent to the server

  @AC-20 @manager @files
  Scenario: Download a file from the conversation
    Given a message on the ticket carries a file
    When I download that file
    Then I receive the file's own contents, unaltered

  @AC-21 @manager @files
  Scenario: Remove a file I attached
    Given a message of mine carries a file
    When I remove that file
    Then the message no longer carries it
    And the other files on that message are untouched

  @AC-23 @manager @files
  Scenario: Attach a file to what I am about to send
    When I attach a file to a new ticket or a reply
    Then the file is uploaded first and referenced by what I send

  @AC-23 @manager @files @guard
  Scenario: A file larger than the permitted size is refused before upload
    When I attach a file larger than the size my brand permits
    Then I am told it is refused
    And nothing is uploaded

  # [R17(a), 2026-09-15, tier 1] This scenario replaces the "or of a kind my brand does
  # not allow" half of the scenario above, which promised a refusal THE RECORDED BRAND
  # CANNOT PRODUCE. It is re-aimed, not dropped: what follows is what the brand on record
  # actually does. The restricted-brand journey is NOT promised by this file — see the
  # header block for why it cannot be recorded, and the module docs for the standing
  # unproven-on-this-brand disclosure.
  @AC-23 @manager @files @guard
  Scenario: A brand that names no permitted kinds permits every kind
    Given my brand publishes no list of permitted file kinds
    When I attach a file of any kind
    Then it is not refused on the grounds of its kind
    And it is uploaded like any other file

  @AC-23 @manager @files
  Scenario: An expired session does not lose my upload
    Given my session expires as I upload a file
    When the upload is rejected for that reason
    Then my session is renewed and the upload is tried once more
    And I do not have to choose the file again

  # === THE MANAGER — steering the ticket =====================================

  @AC-24 @manager @lifecycle
  Scenario: Close a ticket I no longer need help with
    Given one of my tickets is open
    When I close it
    Then the ticket is closed

  @AC-24 @manager @lifecycle @guard
  Scenario: I cannot close a locked ticket
    Given one of my tickets is locked
    When I try to close it
    Then nothing is sent to the server
    And the ticket stays as it was

  @AC-25 @manager @lifecycle
  Scenario: Reopen a ticket that was closed
    Given one of my tickets is closed
    When I reopen it
    Then the ticket is open again
    And reopening is only offered to me on a closed ticket

  @AC-27 @manager @lifecycle
  Scenario: Rename a ticket's subject
    Given one of my tickets is open
    When I change its subject
    Then the ticket carries the new subject

  @AC-27 @manager @lifecycle @guard
  Scenario: I cannot rename a locked ticket
    Given one of my tickets is locked
    When I try to change its subject
    Then nothing is sent to the server

  @AC-28 @manager @lifecycle @dropped
  Scenario: I cannot move a ticket to a different desk
    Given one of my tickets is with the wrong desk
    When I look for a way to hand it to another desk
    Then this module offers me none
    And no request is ever made to change which desk handles a ticket
    # Legacy renders no client entry point for this either: the desk change is
    # reachable only from the administrative controls. Dropped by operator ruling
    # R5 as admin-only, and this module is client x self. Written as an absence so
    # the capability can neither be quietly added nor quietly missed. Changing a
    # ticket's SUBJECT is unaffected and is asserted above.

  @AC-26 @manager @lifecycle @dropped
  Scenario: I cannot reschedule a ticket that already exists
    Given one of my tickets is scheduled to be sent later
    When I look for a way to change that time
    Then this module offers me none
    And no request is ever made to reschedule an existing ticket
    # The legacy client offers no reschedule action either: it is reachable only
    # from the administrative controls. Dropped by operator ruling R5 as
    # admin-only, and this module is client x self. Written as an absence so the
    # capability can neither be quietly added nor quietly missed. Setting a
    # send-later time WHEN RAISING a ticket is unaffected and is asserted above.

  @AC-29 @manager @poll
  Scenario: New activity on an open ticket reaches me without my asking
    Given I am reading one of my open tickets
    When time passes while I am watching it
    Then the ticket is refreshed for me periodically

  @AC-29 @manager @poll
  Scenario: A resolved ticket is not watched
    Given I am reading one of my closed tickets
    When time passes
    Then the ticket is never refreshed on its own

  @AC-29 @manager @poll
  Scenario: A ticket I am not looking at is not watched
    Given I am reading one of my open tickets
    When I switch away to something else
    Then the ticket stops being refreshed
    And it starts again when I come back to it

  @AC-29 @manager @poll @teardown
  Scenario: Leaving a ticket stops watching it for good
    Given I am reading one of my open tickets
    When I leave the ticket
    Then nothing continues to refresh it
    And no further requests are made on its behalf

  # === THE LOOKUPS AND PREFERENCES ===========================================

  @AC-31 @collection @lookups
  Scenario: Choose which desk should handle a new ticket
    When I am about to raise a ticket
    Then I am offered only the desks my brand opens to clients
    And each desk is named the way my brand names it
    And a sensible desk is chosen for me: the one that handles my product if there is one, otherwise my brand's default

  @AC-32 @collection @lookups
  Scenario: Read a ticket's status as words, not as a code
    Given one of my tickets is awaiting a response
    When I read its status
    Then I am given the status by name
    And only ticket statuses are offered, not the statuses of other things

  @AC-33 @collection @preferences
  Scenario: My support composer preferences survive a reload
    When I choose how a new line is entered and whether a shortcut sends my message
    Then those choices are saved against my account
    And my other saved support preferences are left exactly as they were

  # === THE HOLE THAT WAS NOT A HOLE ==========================================
  #
  # Cycle 0 carried an undriven @AC-30 scenario here, because this story's
  # criteria run from the twenty-ninth straight to the thirty-first and nobody
  # could name the thirtieth. Operator ruling R6 (2026-09-14) settles it: the
  # number was SKIPPED when the issue was authored and NO criterion was lost.
  # The scenario is retired rather than left undriven, and the disposition is
  # carried as a signed numbering artefact in docs/sdd/FE-3226/parity.yaml so the
  # hole stays machine-visible and closed. AC31-AC33 are NOT renumbered.
