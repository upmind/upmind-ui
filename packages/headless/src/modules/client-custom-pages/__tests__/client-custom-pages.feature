# client-custom-pages — the module's behavioural source of truth (capability altitude).
#
# CO-LOCATION IS THE REQUIREMENT: this file lives at
#   packages/headless/src/modules/client-custom-pages/__tests__/client-custom-pages.feature
# This is the SINGLE SOURCE OF TRUTH the module's own tests trace to. `docs/sdd/FE-3209/bdd.md`
# carries the scenario inventory this file implements, but `docs/sdd/` is gitignored, so no test
# may read a copy from there — only this co-located file is real at CI time.
#
# NON-EXECUTABLE per ADR-020 (".feature files are spec-only, not executable"). No runner touches
# it and no steps file is produced — the co-located unit and integration specs are the tests that
# run, each anchored to a scenario by its @AC tag.
#
# Two doors over ONE endpoint family, no machine, no mutation (design.md §1, §7):
#   - the COLLECTION (useClientCustomPages) — the brand's client-area custom pages, readable by a
#     signed-in client and by a visitor with no session alike
#   - the SINGLE PAGE (useClientCustomPage().withId(slug)) — one page resolved by its route slug
# There is no staff cell: the oracle's staff read goes through the admin path
# (api/admin/custom_pages), out of scope by the FE-3209 run constraint and recorded as a tracked
# drop (parity.yaml: staff x self, staff x on-behalf-of-client) — not described here as a
# capability this module has, because it does not.
#
# The collection's [CLIENT] context cell type-checks .for('client', id) but does NOT retarget
# the request — the outbound URL stays the brand's own custom-pages endpoint regardless of the id
# supplied (design.md D1; parity.yaml, client x on-behalf-of-client). No scenario below asserts a
# retarget, and none may be added that does.
#
# DELIBERATELY NOT HERE (bdd.md "Scenarios deliberately NOT written"): menu ordinal position and
# icon, a staff admin-path read, the iframe-vs-markdown body branch (system-client-area's own
# concern), and list sorting/paging (a platform-contract obligation with zero oracle exercise).
# None of these are module capabilities; adding a scenario for any of them re-opens a settled
# disposition.
#
# RECORDING DEPENDENCY (bdd.md "Recording dependency"): the recording brand now has TWO custom pages
# configured (2026-10-06 — `custom-page` show_on_menu:true, `custom-page-invisible` show_on_menu:false),
# so the by-slug 200 resolve (AC-3), the list-row short-circuit (AC-4) and the menu set — both the
# unnarrowed whole list and the narrowing to menu rows (AC-2) — are now provable against real recordings
# and are no longer @todo. The wire honours `filter[show_on_menu]=1` (probe returns only the shown page),
# so O25 is Direct-honoured. Scenarios that STILL need other data stay @todo: AC-6's render handoff is
# driven by system-client-area's useClientTemplate, not reachable from this module's public surface;
# AC-7's empty-translation fallback has no recorded row (both pages' `*_translated` members are populated)
# and is proven by the pure-unit mapper spec instead; AC-10's playground content is a labs-nuxt concern.
# A @todo scenario is never proven against a hand-authored fixture presented as recorded
# (verify-cosplay.companion.md).

@module:client-custom-pages @variant:query @cell:client-self @cell:guest-self
Feature: A client or a visitor reads the brand's client-area custom pages

  A brand publishes a set of custom pages into its client area. A signed-in client, and a
  visitor who has not signed in yet, can both read that set. A client can also open one page by
  its own slug, whether or not that page was already in the set they loaded.

  # === THE COLLECTION ========================================================

  # Proven today against the recorded EMPTY list (client-custom-pages.collection.int.test.ts):
  # the read shape (client path, not the admin/staff path) does not need a configured page to
  # verify. Untagged 2026-09-10 — see prover N10.
  @AC-1 @client @collection
  Scenario: A client reads the brand's own client-area custom pages, not the staff listing
    Given I am a signed-in client
    When I open my brand's custom pages
    Then I see the brand's client-area custom pages
    And nothing about that read needs staff-level access

  # Proven on the recorded two-page list (client-custom-pages.collection.int.test.ts, AC-2).
  @AC-2 @client @collection
  Scenario: I see every one of my brand's custom pages, not only the ones shown in the menu
    Given my brand has custom pages that are shown in the menu and custom pages that are not
    When I open my brand's custom pages without narrowing them
    Then I see every one of those pages, including the ones hidden from the menu

  # Proven on the recorded two-page list (client-custom-pages.collection.int.test.ts, AC-2).
  @AC-2 @client @collection
  Scenario: I narrow my brand's custom pages down to the ones the menu shows
    Given my brand has custom pages that are shown in the menu and custom pages that are not
    When I narrow the pages to the ones the menu shows
    Then I see only the pages marked to show in the menu

  # Proven on the recorded single-page list (client-custom-pages.single-read.int.test.ts, AC-4).
  @AC-4 @client @collection
  Scenario: A page I have already listed opens without asking the server again
    Given I have already loaded my brand's custom pages
    When I open a page that is already in that list
    Then it opens from what I already have
    And no further request goes to the server for it

  # === THE SINGLE PAGE ========================================================

  # Proven on the recorded 200 by-slug resolve (client-custom-pages.single-read.int.test.ts, AC-3).
  @AC-3 @client @single-page
  Scenario: I open a page that is not in my loaded list by its own slug
    Given a custom page exists that is not part of my already-loaded list
    When I open that page by its slug
    Then I am shown that exact page

  @AC-5 @client @single-page
  Scenario: Opening a page whose slug does not exist tells me plainly that it is not there
    Given no custom page exists at the slug I ask for
    When I open a page by that slug
    Then I am told that page does not exist, distinctly from any other kind of failure
    And the client area keeps working instead of breaking

  # blocked-on-recording: see header "Recording dependency".
  @AC-6 @client @single-page @todo
  Scenario: A page I resolve is shown through the client area's existing page-rendering surface
    Given I have resolved one of my brand's custom pages
    When that page is displayed
    Then it is rendered by the client area's existing page-rendering surface
    And no separate rendering path is introduced for it

  # === LABELS AND TITLES ======================================================

  # blocked-on-recording: see header "Recording dependency".
  @AC-7 @client @module @todo
  Scenario: A page with no translated label or title still shows me one
    Given one of my brand's custom pages has no translated menu label and no translated title
    When I view that page in the menu and open it
    Then I still see its menu label and its title, in the language it was originally entered

  # === GUEST ACCESS ===========================================================

  # Proven today against the recorded EMPTY list: the token-transport half (no Authorization
  # header, session or not) needs no configured page. Untagged 2026-09-10 — see prover N10.
  @AC-9 @guest @collection
  Scenario: I can see the brand's custom pages before I have signed in
    Given I am a visitor with no session
    When I open the brand's custom pages
    Then I see the brand's custom pages exactly as a signed-in client would
    And nothing about signing in is needed to see them

  # === COLLECTION LIFECYCLE ===================================================

  # Proven today against the recorded EMPTY list: a second request firing is observable without
  # a configured page. Untagged 2026-09-10 — see prover N10.
  @AC-8 @client @collection
  Scenario: I force a fresh read of the brand's custom pages
    Given I have already loaded the brand's custom pages
    When I ask for a fresh copy of them
    Then they are read again rather than served from what I already had
    And a page changed since my last read is reflected

  # Proven today against the recorded EMPTY list: a fresh mint being a different registry
  # instance is observable without a configured page. Untagged 2026-09-10 — see prover N10.
  @AC-8 @client @collection
  Scenario: Tearing down my view of the brand's custom pages releases it
    Given I have opened the brand's custom pages
    When I tear that view down
    Then opening the brand's custom pages again starts a fresh read rather than reusing what was released

  # Proven today against the recorded EMPTY list: isReloading vs isLoading is a state-flag
  # distinction, provable with no configured page. Untagged 2026-09-10 — see prover N10.
  @AC-8 @client @collection
  Scenario: A background re-read of my custom pages is distinguishable from a first load
    Given I have already loaded the brand's custom pages
    When they are re-read in the background
    Then I can tell that this is a re-read rather than the first time they loaded

  # === THE PLAYGROUND =========================================================

  # blocked-on-recording: see header "Recording dependency" — the known-slug resolve step needs a
  # configured page; the unknown-slug step alone cannot exercise the whole scenario.
  @AC-10 @integrator @playground @todo
  Scenario: The client-custom-pages playground page drives every capability on its own
    Given the client-custom-pages playground page is open
    When I list the brand's custom pages on the page
    Then I see them without the portal app running
    When I narrow them to the menu on the page
    Then only the menu pages are shown
    When I resolve a known slug on the page
    Then that page is shown
    When I resolve an unknown slug on the page
    Then the page tells me it does not exist
