# client-email-history — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT: this is the SOLE copy the tests know about —
# the one client-email-history.traceability.test.ts reads, and the one the @AC
# link is enforced against, both ways. A planning bundle may hold its own copy,
# but no test may read one: those directories are gitignored, so a test that
# reaches for a bundle path passes locally and fails in CI.
#
# NON-EXECUTABLE per ADR-020 (".feature files are spec-only, not executable").
# No runner touches it and no steps file is produced — the colocated unit and
# integration specs are the tests that run, each anchored to a scenario by its
# @AC tag.
#
# One scenario per capability the parity table carries, across BOTH composables:
# the collection (useClientReceivedEmails) and the single received email
# (useClientReceivedEmail). The single read gets its own scenarios, never a
# footnote on the collection's — it is a separately exported, separately
# consumed capability with its own route (Research R1), and folding it away is
# the FE-2824 / 2026-08-05 amputation shape.
#
# Business language only — the wire-level read-backs that PROVE each scenario
# (request URL, filter keys, pagination offsets, session token, acting-as
# headers) live in the story's planning bundle (requirements.md, parity.yaml).
#
# Actors: a client reads their OWN email history. There is no staff cell and no
# guest cell in this module — and, unlike client-email, that is not a recorded
# drop: the oracle exposes NO client-targeted email-history endpoint at all, so
# there is nothing to drop (parity.yaml M3/M4/M5). There are no mutation
# scenarios because the oracle has no mutations anywhere (parity.yaml M6).

@module:client-email-history @variant:query @cell:client-self
Feature: A client reads their own email history

  Every email the system has sent to a client is recorded in that client's
  history. Two surfaces serve it: a COLLECTION the client browses, searches,
  sorts, narrows and pages through, and a SINGLE EMAIL they open to read in
  full. Both read that client's own history, under that client's own identity,
  and never another account's.

  Background:
    Given I am an authenticated client reading my own account
    And every request I make is addressed to my own email history as that client

  # === THE COLLECTION ========================================================

  @AC-1 @collection
  Scenario: See my own email history
    When I open my email history
    Then I see the reactive list of emails sent to me
    And no other client's history is ever loaded

  @AC-2 @collection
  Scenario: See what each email said and who it went to
    When I view my email history
    Then each email shows its subject, who it was sent to, and who it came from
    And each email shows the recipient's name, address and picture
    And each email shows when it was sent, when it bounced, and when it failed

  @AC-3 @collection
  Scenario Outline: See whether each email reached me
    Given an email in my history "<condition>"
    When I view my email history
    Then that email is shown as "<status>"

    Examples:
      | condition                   | status  |
      | failed to send              | failed  |
      | bounced                     | bounced |
      | was sent successfully       | sent    |
      | has not been sent yet       | sending |
      | both bounced and failed     | failed  |

  # Two scenarios, one concern split by what is being asked: the state of the
  # list itself, and whether the list is mine to read at all.

  @AC-4 @collection
  Scenario: Know whether my history is loading, empty, or errored, and wait for it
    When I open my email history
    Then I can see whether the history is loading, empty, or errored
    And I can wait for it to be ready before reading it
    And that wait always finishes — it never leaves me waiting forever

  @AC-5 @collection @guard
  Scenario: Know whether my email history is mine to read at all
    Given I am signed in as a client
    When I look at my email history
    Then it tells me the history is available to me
    And before I am signed in it tells me the history is not available, while still
      telling me it is loading
    And the moment my session goes away it tells me the history is no longer available
    And I never have to inspect the session myself to learn any of this

  @AC-6 @collection
  Scenario: Sort my history
    When I sort my history by subject, newest first
    Then my history comes back ordered by subject, newest first
    And when I clear the sort it returns to the default order, most recent first

  @AC-7 @collection
  Scenario: Search my history
    When I search my history for a word
    Then only emails matching that word are returned
    And when I also narrow by subject, both narrowings apply together
    And neither narrowing silently cancels the other

  @AC-8 @collection
  Scenario Outline: Narrow my history to what happened to each email
    When I narrow my history to "<selection>"
    Then only the "<selection>" emails are returned
    And switching to another selection re-reads my history straight away, without
      me having to open it again
    And no part of the previous selection is left behind

    Examples:
      | selection |
      | all       |
      | sent      |
      | bounced   |
      | failed    |

  @AC-9 @collection
  Scenario: Page through my history
    Given I have more emails than fit on one page
    When I open my email history
    Then I am given the first page, and told which page I am on and how many there are
    And asking for the next page gives me the next page
    And asking for the previous page brings me back
    And I am told when there is no further page to go to

  @AC-11 @collection
  Scenario: Refresh my history
    Given I have opened my email history
    When I refresh it
    Then my history is re-read from the server
    And invalidating my history makes the next read fetch it again
    And refreshing without a signed-in client is refused, and reads nothing

  @AC-12 @collection
  Scenario: Discarding a history collection releases it
    Given I have opened my email history
    When I destroy that collection
    Then it is released
    And opening my email history again gives me a fresh collection

  # === ONE RECEIVED EMAIL ====================================================
  # Its own scenarios, not the collection's footnote: this is a separately
  # exported capability with its own route (Research R1).

  @AC-13 @single-email
  Scenario: Read one of my emails in full
    Given an email in my history
    When I open that email
    Then I am shown that email, including its full body
    And an email whose body was never stored shows as having no body, not as broken

  @AC-14 @single-email
  Scenario: See that email's details and whether it reached me
    When I open one of my emails
    Then it shows the same subject, recipients, dates and delivery outcome the
      history list showed for it
    And whether it was sent, bounced or failed is stated the same way in both places

  @AC-15 @single-email
  Scenario: Know whether that email is loading, empty, or errored, and wait for it
    When I open one of my emails
    Then I can see whether it is loading, empty, or errored
    And I can wait for it to be ready before reading it
    And that wait always finishes — including when I turn out not to be signed in,
      where it finishes by telling me it is not ready

  @AC-16 @single-email @guard
  Scenario: Know whether that email is mine to read at all
    Given I am not signed in as a client
    When my email is used
    Then it tells me the email is not available to me
    And nothing is read from the server on my behalf
    And once I am signed in, it tells me the email is available and reads it

  @AC-17 @single-email
  Scenario: Refresh one email, and release it when done
    Given I have opened one of my emails
    When I refresh it
    Then it is re-read from the server
    And when I destroy it, it is released, and opening that email again gives me a
      fresh one

  # === WHOLE-MODULE GUARANTEES ==============================================

  @AC-18 @module @guard @negative-control
  Scenario: Nothing reads an email history without an authenticated client session
    Given there is no authenticated client session
    When either my email history or a single email is used
    Then no request is made against any email-history resource
    And any forced read is refused as not-authenticated
    And removing that protection from either surface turns this red

  @AC-19 @module @fe-2824 @negative-control
  Scenario: The history I read is the one my scope named — not whatever a global setting says
    Given every request resolves whose history it is reading from the scope I opened
    When that resolution is broken so it instead reads from a global setting
    Then every read in this module turns red
    And restoring the resolution returns them green
    And the proof shows which address was called and under whose identity it was
      called, never only what came back

  @AC-20 @module @public-surface @negative-control
  Scenario: The module offers both surfaces and every consumer keeps compiling
    Given consumers depend on my email history AND on reading one email
    When the module is built
    Then both are offered, with every name a consumer imports today
    And the way a consumer names a sort order is still offered
    And removing the single-email surface from what the module offers turns this red
    And every dependent module still compiles with no new error

  @AC-21 @module
  Scenario: Problems are reported to me, never announced by the module
    Given something goes wrong while I read my history or one of my emails
    When I inspect either surface
    Then I can read what went wrong
    And the module itself raises no message, toast or notification on my behalf
