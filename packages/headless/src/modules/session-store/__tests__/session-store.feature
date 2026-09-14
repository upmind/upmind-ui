# session-store — the module's behavioural source of truth (capability altitude).
#
# NON-EXECUTABLE per ADR-020. No runner touches it and there is no steps file;
# the co-located unit and integration specs are what run.
#
# SCOPE OF THIS FILE. The module is older than this contract. What is written
# below is the capability set FE-3087's contract carries — design.md, parity.yaml
# and bdd.md's AC table, plus the obligations operator rulings R4, R8, R10 and
# B1 add on top (review-notes.md §11, §16, §17). AC-G26, AC-G27 and AC-G28 come
# from design.md "Edge Cases" — activation-branch promises the ticket's AC list
# does not name, each of which a plausible fix breaks silently. The module's pre-FE-3087
# surface — boot, cookie reconciliation, impersonation, token recovery — is
# proven by 34 standing cases that carry no AC id and is deliberately NOT
# restated here. That absence is a recorded boundary, not a coverage claim: a
# later pass that widens this file widens it from the module's own docs, not by
# reverse-reading the specs.
#
# THE ANCHOR IS ENFORCED. `session-store.traceability.test.ts` rides the
# module's unit suite and fails when a scenario below has no test naming its id,
# or a test names an id no scenario carries. Every id is appended to its proving
# test's title, which review-notes §18 authorises: the operator-filed mutant
# header matches its target case by substring, so a suffix cannot desynchronise
# it. Three scenario ids describe capability that predates FE-3087 and is proven
# by standing cases that carry no id and may not be edited (AC5); those are bound
# by name in the traceability test's own anchor map.
#
# ACTORS AND CELLS. SESSION_SCOPE_MATRIX populates all four keys — self, staff,
# client, guest — with no context for any of them, so there is no
# acting-on-behalf-of cell in this module (parity.yaml). Denial is therefore a
# RUNTIME property: an app instance declares which scopes it allows, and a
# barred scope can neither be activated nor read. Both halves are described
# below as behaviour.
#
# THE JOB, verbatim from the story: a signed-in user can choose to browse as a
# guest without losing their session, and a guest view they chose is not
# silently replaced when someone logs in elsewhere.

@module:session-store @cell:guest-self @cell:client-self @cell:staff-self
Feature: Guest is a session like any other

  The store holds every session a device has: the staff who signed in, the
  clients who signed in, and the guests. One of them is active at a time, and
  the store remembers WHICH — including when the active one is a guest. That
  memory is the whole story: a guest the user chose is a decision the store
  keeps, and a guest it merely fell back to is not.

  Background:
    Given the session store holds this device's sessions
    And exactly one of them is active at a time

  # === CHOOSING GUEST ========================================================

  @AC-G1 @AC-G2 @AC-G24 @guest @client
  Scenario: A guest I chose stays chosen — across everything the store does, and across a restart
    Given I am browsing with no session I picked
    When I choose to browse as a guest
    Then the store records that guest session as the active one
    Given I am signed in as a client and I have chosen to browse as a guest
    When anything else about my sessions changes
    Then I am still browsing as the guest I chose
    And my client session is still held
    Given I have chosen to browse as a guest
    When the store starts again
    Then I am browsing as the same guest I chose, under the same name
    And no replacement guest session is asked of the server

  @AC-G3 @AC-G4 @AC-G20 @guest @client @staff
  Scenario: I choose guest while signed in, and it costs me neither my client nor my staff session
    Given I am signed in as a client and this device holds no guest session
    When I choose to browse as a guest
    Then a guest session is created at that moment and becomes the active one
    And none was created merely because I signed in earlier
    Given I am signed in as a client and as a member of staff
    When I choose to browse as a guest
    Then both sessions are still held
    And returning to either of them needs nothing asked of the server
    Given I am signed in as a client
    When I take up the offer to browse as a guest
    Then I am browsing as a guest
    And my client session is still listed and I can return to it

  @AC-G5 @guest
  Scenario: A guest nobody chose is still the floor
    Given this device holds no session anyone signed into
    When the store settles
    Then I am browsing as a guest
    And the store records no choice, because none was made

  @AC-G8 @guest
  Scenario: A guest I chose reads differently from a guest I was given
    Given I am browsing as a guest nobody chose
    When I choose to browse as a guest
    Then the store now names that guest session as the active one
    And the guest session it serves me is the one it names

  @AC-G27 @AC-G28 @guest
  Scenario: Choosing guest again puts me back on the guest this device already holds
    Given I am browsing as a guest nobody chose
    When I choose to browse as a guest
    Then the guest I chose is the one this device already held
    And no further guest session is asked of the server
    Given I have chosen to browse as a guest
    When I choose to browse as a guest again
    Then I am still browsing as that same guest
    And no further guest session is asked of the server

  @AC-G26 @guest @client
  Scenario: Signing in here takes me off the guest I chose
    Given I have chosen to browse as a guest
    When I sign in as a client on this tab
    Then I am browsing as that client
    And the guest I chose is still held for me to return to

  # === A CHOICE OTHER TABS CANNOT TAKE BACK ==================================

  @AC-G6 @guest @client
  Scenario: Someone signing in elsewhere does not take back the guest I chose
    Given I have chosen to browse as a guest
    When a client signs in on another tab
    Then I am still browsing as the guest I chose
    And that client's session joins the ones this device holds

  @AC-G7 @guest @client
  Scenario: A guest I chose keeps its identity when its own session is renewed
    Given I have chosen to browse as a guest
    When that guest session is renewed
    Then I am browsing as the same guest, not a new one
    And a client signing in elsewhere afterwards still does not take it back

  @AC-G23 @guest @client
  Scenario: A guest nobody chose still gives way when someone signs in elsewhere
    Given I am browsing as a guest nobody chose, and its session has been renewed
    When a client signs in on another tab
    Then I am browsing as that client

  # === MORE THAN ONE GUEST ===================================================

  @AC-G25 @guest
  Scenario: Asking for another guest gives me a new one and keeps the old
    Given I am browsing as a guest
    When I ask for another guest session
    Then I am browsing as a newly created guest, not the one I had
    And the one I had is still held and I can return to it

  @AC-G29 @guest
  Scenario: A new guest session is created without asking me for credentials
    Given I am browsing as a guest
    When I ask for another guest session
    Then it is created and I am browsing as it, with nothing asked of me to prove who I am

  @AC-G35 @guest @client
  Scenario: A session I pick while a new guest is still arriving is the one I keep
    Given I am browsing as a guest and this device also holds a client I signed in as
    When I ask for another guest and pick that client before the new guest arrives
    Then I am browsing as the client I picked
    And the new guest is held for me to return to

  @AC-G30 @client
  Scenario: Asking to sign in as another client still asks me for credentials
    Given I am signed in as a client
    When I ask to sign in as another client
    Then I am asked to prove who I am
    And no second client session exists until I have

  @AC-G15 @AC-G16 @AC-G32 @guest
  Scenario: Removing one guest leaves the others standing, whichever tab removes it
    Given this device holds two guest sessions and I am browsing as one of them
    When the one I am browsing as signs out
    Then the other guest is still held
    And it is still held after the next change to my sessions
    Given this device holds more than one guest session
    When I remove one of them
    Then only that one is gone
    And the guest I am browsing as is unaffected if it was not the one removed
    When another tab removes the guest it created
    Then only that one is gone here too
    And I am still browsing as the guest I chose

  @AC-G10 @guest
  Scenario: A guest another tab created joins the ones this device holds
    Given I have chosen to browse as a guest
    When another tab creates a guest of its own
    Then this device holds both guests
    And I am still browsing as the one I chose

  @AC-G11 @guest
  Scenario: I can move between the guests this device holds
    Given this device holds more than one guest session
    When I choose one of them by name
    Then I am browsing as that guest, not as the other
    And nothing is asked of the server to get there

  @AC-G12 @guest
  Scenario: I am browsing as the guest this device is serving
    Given this device holds more than one guest session
    When I move to the guest I did not start on
    Then the guest session the store serves is that one

  @AC-G13 @guest
  Scenario: Asking for a guest this device does not hold changes nothing
    Given this device holds guest sessions
    When I ask to browse as a guest that is not one of them
    Then I am left where I was
    And no such guest is invented

  @AC-G14 @guest @client
  Scenario: Every guest this device holds can be listed alongside the rest
    Given this device holds guests and a signed-in client
    When I read the sessions this device holds
    Then every guest is among them, listed the way the client is

  # === WHEN THINGS GO WRONG ==================================================

  @AC-G21 @guest
  Scenario: Choosing guest works on a device that cannot generate a secure id
    Given this device offers no secure way to generate an identifier
    When I choose to browse as a guest
    Then the guest session is still created and named
    And I am browsing as it

  @AC-G22 @guest @client
  Scenario: A guest session that cannot be created leaves me where I was
    Given I am signed in as a client
    When I choose to browse as a guest and the guest session cannot be created
    Then I am still signed in as that client
    And the attempt settles rather than hanging

  @AC-G9 @guest
  Scenario: A guest session this device kept from before still opens
    Given this device kept a guest session from before the store changed shape
    When the store settles
    Then I am browsing as that guest
    And no replacement guest session is created

  # === WHO IS ALLOWED ========================================================

  @AC-D1 @guest
  Scenario: An app that bars guests never puts me on one
    Given this app does not allow browsing as a guest
    When I ask to browse as a guest
    Then nothing happens and no guest session is created
    And any guest session this device already holds is not offered to me

  @AC-D2 @staff
  Scenario: An app that bars staff never puts me on a staff session
    Given this app does not allow acting as a member of staff
    When a staff session is asked for
    Then I am left on the session I had

  @AC-G17 @guest
  Scenario: Every sign-in screen offers me the same guests this device holds
    Given this app does not allow browsing as a guest, and this device holds one
    When a guest-scoped sign-in surface settles
    Then it finds no guest session to act on
    And it finds one when the app does allow guests

  # === EACH ACTOR ON ITS OWN SESSION =========================================

  @AC-C1 @AC-T1 @AC-S1 @client @staff @self
  Scenario: Acting as myself means acting as whoever this device is active as
    Given I am signed in as a client
    When I act on my session
    Then I act on my own, never on another client's
    Given I am signed in as a member of staff
    When I act on my session
    Then I act on my own staff session
    Given I am browsing as one of the sessions this device holds
    When I act as myself
    Then I act as that session, whichever actor it belongs to
    And choosing a different session changes who "myself" means

  @AC-G31 @self @guest
  Scenario: Acting as myself on a device holding only a guest acts as that guest
    Given this device holds a guest session and no one has signed in
    When I act as myself rather than naming an actor
    Then I act with that guest's session, not as no one at all

  @AC-S2 @self
  Scenario: Choosing the actor I am already acting as changes nothing
    Given I am browsing as one of several sessions the same actor holds
    When I ask to act as that actor without naming a session
    Then I am still browsing as the session I was on, not the actor's first

  # === THE CONSUMER SURFACE ==================================================

  @AC-G18 @guest @client
  Scenario: The session switcher offers one row per guest this device holds
    Given this device holds more than one guest and a signed-in client
    When I open the list of sessions I can switch to
    Then there is a row for each guest, the way there is a row for the client

  @AC-G19 @guest
  Scenario: Picking a guest row switches me to that guest
    Given the session switcher lists more than one guest
    When I pick the second of them
    Then I am browsing as that guest, not as the first

  @AC-G36 @guest @client
  Scenario: Browsing a brand does not hide the guests this device holds
    Given I am signed in as a client of this brand and this device holds two guests
    When I read the sessions I can switch to while browsing that brand
    Then both guests are offered to me
    And picking one of them takes me to that guest

  @AC-G33 @guest @client
  Scenario: Changing brand never hands me to a guest I did not choose
    Given I am signed in as a client of one brand, and a guest nobody chose is also held
    When I move to a brand none of my signed-in sessions belongs to
    Then I am still signed in as that client, not handed to the guest

  @AC-G34 @guest @client
  Scenario: Losing my last session on a brand takes me off that brand
    Given I am signed in as the only session belonging to this brand, and a guest is also held
    When that session signs out
    Then I am taken off that brand
    And the guest that remains does not count as belonging to it

  # ===========================================================================
  # DELEGATED ACCESS (FE-3036)
  #
  # Reading what ANOTHER client has shared with this one. The granting side —
  # invite, accept, revoke — is NOT here: it belongs to the `delegates` module
  # and its own feature. This section covers only what the session reports about
  # access it already holds.
  #
  # BLOCKED scenarios below are tagged `@todo` and are blocked on ONE thing: a
  # recorded `/self` carrying a populated `delegated_ids` for the relevant key.
  # The `client` key now HAS such a recording (`delegates` module fixtures,
  # captured through the real invite/accept cycle). The `contracts_product` and
  # `ticket` keys still do not — those grants need the owner to hold a product
  # or ticket to delegate, which rides FE-3041 (DG-2).
  #
  # They are NOT to be closed by hand-authoring a payload. Test data comes from
  # recordings.
  # ===========================================================================

  # === THE MAP ON THE SESSION ================================================

  @AC-DG1 @layer-integration
  Scenario: A client with no delegated access reads an empty map
    Given I am signed in as a client who has been granted no delegated access
    When I read my delegated ids
    Then the delegated ids are an empty map

  @AC-DG1 @layer-integration @todo
  Scenario: A client granted access to another client reads that id under the client key
    Given I am signed in as a client who has been granted access to another client
    When I read my delegated ids
    Then the other client's id appears under the client key

  @AC-DG1 @layer-integration @todo
  Scenario: A client granted a delegated product reads that id under the contract-product key
    Given I am signed in as a client who has been granted access to one contract product
    When I read my delegated ids
    Then the product's id appears under the contract-product key

  # === PER-RECORD: WAS THIS DELEGATED TO ME ==================================

  @AC-DG2 @layer-integration @todo
  Scenario: A record the server flagged as delegated is reported as delegated
    Given an invoice the server has flagged as reaching me by delegation
    When I ask whether that invoice was delegated to me
    Then the invoice is reported as delegated

  @AC-DG2 @layer-unit @todo
  Scenario: An invoice belonging to a child account is not reported as delegated
    Given an invoice whose delegation flag is set
    And the invoice belongs to a child account of mine
    When I ask whether that invoice was delegated to me
    Then the invoice is reported as not delegated

  @AC-DG2 @layer-unit @todo
  Scenario: A delegated contract product belonging to a child account is still delegated
    Given a contract product whose delegation flag is set
    And the contract product belongs to a child account of mine
    When I ask whether that contract product was delegated to me
    Then the contract product is reported as delegated

  # === PER-RECORD: WHOSE IS IT ===============================================

  @AC-DG3 @layer-integration @todo
  Scenario: The owning client of a delegated record is resolved from the record
    Given an invoice that reached me by delegation
    When I ask who owns that invoice
    Then I receive the owning client's display name, username and avatar

  @AC-DG3 @layer-unit @todo
  Scenario: A record with no owning client attached resolves to no owner
    Given a delegated contract product with no owning client attached
    When I ask who owns that contract product
    Then no owner is reported

  # === REFRESH ===============================================================

  @AC-DG4 @layer-integration
  Scenario: Refreshing the session re-reads the identity profile rather than the day-old cache
    Given I am signed in as a client whose identity profile has been read once
    When I refresh my session
    Then a second identity-profile request is made as that same client

  @AC-DG4 @layer-integration @todo
  Scenario: Refreshing after a new grant surfaces the newly delegated id
    Given I am signed in as a client who has just been granted access to another client
    When I refresh my session
    Then the newly granted client id appears under the client key

  # === THE OTHER ACTORS ======================================================

  @AC-DG5 @layer-integration
  Scenario: A staff session neither asks for nor exposes delegated access
    Given I am signed in as a member of staff
    When the staff session reads its identity profile
    Then the identity-profile request does not ask for delegated access
    And the staff session's delegated ids are an empty map

  @AC-DG6 @layer-integration
  Scenario: A guest boots unaffected by the delegate surface
    Given I have not signed in
    When the store settles on the guest floor
    Then the guest has no session user
    And the guest's delegated ids are an empty map

  # === DO I HOLD DELEGATED ACCESS AT ALL =====================================

  @AC-DG7 @layer-integration
  Scenario: A client whose identity carries no delegated ids does not hold delegated access
    Given I am signed in as a client whose identity response carries no delegated ids
    When I read whether I hold delegated access
    Then the delegated-access flag reads false

  @AC-DG7 @layer-integration @todo
  Scenario: A client holding delegated contract products or delegated clients holds delegated access
    Given I am signed in as a client who has been granted access to a contract product or to another client
    When I read whether I hold delegated access
    Then the delegated-access flag reads true

  @AC-DG8 @layer-integration @todo
  Scenario: A client holding only a delegated ticket does not hold delegated access
    Given I am signed in as a client who has been granted access to a ticket only
    When I read whether I hold delegated access
    Then the delegated-access flag reads false

  @AC-DG9 @layer-integration @todo
  Scenario: A session stored before delegated access existed reads false rather than failing
    Given I am signed in as a client whose stored session profile predates the delegated-ids field
    When I read whether I hold delegated access
    Then the delegated-access flag reads false
    And no read of the flag fails
