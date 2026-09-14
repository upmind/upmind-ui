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
# THREE CAPABILITIES ARE WRITTEN HERE AS ABSENCES, on purpose. A dropped
# capability that simply vanishes from the spec is the FE-2824 shape; a dropped
# capability asserted as absent can never be quietly re-added or quietly missed.
# They are: message-body search, post-creation rescheduling, and staff reach.
#
# TWO SCENARIOS ARE BLOCKED ON AN OPERATOR RULING and are tagged @pending-ruling:
# rescheduling (parity Q2) and the AC30 hole (parity Q3). They are written so the
# question is legible, and they must not be driven green by guessing the answer.

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
    When I try to raise a ticket without a subject or without a message
    Then nothing is sent to the server
    And the rules that decide what is missing are published by this module for the page that renders the form

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
  Scenario: Files that are too large or of the wrong kind are refused before upload
    When I attach a file larger than the permitted size, or of a kind my brand does not allow
    Then I am told it is refused
    And nothing is uploaded

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

  @AC-28 @manager @lifecycle
  Scenario: Move a ticket to a different desk
    Given one of my tickets is with the wrong desk
    When I move it to another desk
    Then the ticket is handled by that desk
    And I am reading the ticket's refreshed state, not the state before the move

  @AC-26 @manager @lifecycle @dropped @pending-ruling
  Scenario: I cannot reschedule a ticket that already exists
    Given one of my tickets is scheduled to be sent later
    When I look for a way to change that time
    Then this module offers me none
    And no request is ever made to reschedule an existing ticket
    # The legacy client offers no reschedule action either: it is reachable only
    # from the administrative controls. Written as an absence so the capability
    # can neither be quietly added nor quietly missed. Blocked on the operator
    # ruling recorded as Q2 — do not drive this green by assuming the answer.

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

  @AC-31 @lookups
  Scenario: Choose which desk should handle a new ticket
    When I am about to raise a ticket
    Then I am offered only the desks my brand opens to clients
    And each desk is named the way my brand names it
    And a sensible desk is chosen for me: the one that handles my product if there is one, otherwise my brand's default

  @AC-32 @lookups
  Scenario: Read a ticket's status as words, not as a code
    Given one of my tickets is awaiting a response
    When I read its status
    Then I am given the status by name
    And only ticket statuses are offered, not the statuses of other things

  @AC-33 @preferences
  Scenario: My support composer preferences survive a reload
    When I choose how a new line is entered and whether a shortcut sends my message
    Then those choices are saved against my account
    And my other saved support preferences are left exactly as they were

  # === THE HOLE ==============================================================

  @AC-30 @pending-ruling @hole
  Scenario: A numbered acceptance criterion that nobody can name
    Given this story's criteria run from the twenty-ninth to the thirty-first
    When I look for the thirtieth
    Then there is none to find
    And this scenario stays undriven until the operator states whether a
    criterion was lost or a number was skipped
    # Written as a scenario so the hole is visible in the coverage contract
    # itself. A numbered criterion that simply vanishes is the FE-2824 shape.
