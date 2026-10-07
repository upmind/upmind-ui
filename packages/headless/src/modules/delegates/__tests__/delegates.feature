# The delegates module's business-logic contract (ADR-020). Non-executable:
# the scenarios below are the capability list the module's integration tests
# anchor to by `@AC-DL*` id, enforced by `delegates.traceability.test.ts`.
#
# Scope note: this module is the client-portal slice FE-3036 needs — invite,
# list, accept. The administrative direct-attach path (granting access without
# ever sending an invitation) is not a client capability and is deliberately
# absent. Per-product and per-ticket grants, and the staff arm, ride FE-3041
# (DG-2) and are carried below as `@todo`.

@delegates @FE-3036
Feature: Delegate access
  As an account owner
  I want to let another person act on my account
  So that someone I trust can deal with my products and billing for me

  @AC-DL1 @client @self
  Scenario: An owner sees who holds access to their own account
    Given an owner has granted another party access to their account
    When the owner reads the delegates on their own account
    Then that party is listed as holding accepted access

  @AC-DL2 @client @self
  Scenario: An owner who has granted nothing is told so, rather than shown an error
    Given an owner who has granted access to nobody
    When the owner reads the delegates on their own account
    Then the account is reported as having no delegates

  @AC-DL3 @client @self
  Scenario: An owner invites another party by email address
    Given an owner who wants to share their account
    When the owner invites a party by email address
    Then a grant is recorded for that address, awaiting the invitee's acceptance

  @AC-DL4 @client @self
  Scenario: An owner sees an invitation that has not been taken up yet
    Given an owner who has invited a party that has not accepted
    When the owner reads the delegates on their own account
    Then that party is listed as still awaiting acceptance

  @AC-DL5 @client
  Scenario: The account read is the account named, never the reader's own
    Given a signed-in client naming an account other than their own
    When they read the delegates of the account they named
    Then the named account is the one read

  @AC-DL6 @client @self
  Scenario: Re-inviting a party who already holds access is refused
    Given a party who already holds accepted access to the account
    When the owner invites that same party again
    Then the invitation is refused and no second grant is recorded

  @AC-DL7 @client
  Scenario: The invitation reaches the invitee's own correspondence
    Given an owner has invited a party who holds an account of their own
    When the invitee reads their own correspondence
    Then they find the invitation, and it offers them the route to accept

  @AC-DL8 @client
  Scenario: The route to accept is offered only in the invitation
    Given an owner who has invited a party
    When the owner reads the delegates on their own account
    Then the route to accept appears nowhere on what the owner can see

  @AC-DL9 @client
  Scenario: An invitee accepts the invitation they were sent
    Given an invitee holding an invitation they have not accepted
    When the invitee accepts it by the route their invitation offered
    Then the grant on the owner's account becomes active

  @AC-DL10 @client
  Scenario: Accepting by a route that was never offered is refused
    Given an invitee presenting a route to accept that was never issued
    When the invitee tries to accept by it
    Then the acceptance is refused and no access is granted

  @AC-DL11 @client @self
  Scenario: An invitee who has accepted carries that access on their own identity
    Given an invitee who has accepted an invitation to an owner's account
    When the invitee's own identity is read
    Then it carries delegated access to that owner's account

  @AC-DL12 @client @self
  Scenario: An invitee who has accepted nothing carries no delegated access
    Given an invitee who has accepted no invitation
    When their own identity is read
    Then it carries no delegated access at all

  @AC-DL13 @client
  Scenario: A client reading another client's delegates is turned away
    Given a signed-in client who does not own the account
    When they read that account's delegates
    Then the read is refused and no delegate is disclosed

  @AC-DL14 @guest
  Scenario: A caller the brand does not recognise is turned away
    Given a caller whose session the brand refuses
    When they read an account's delegates
    Then the read is refused and no delegate is disclosed

  @AC-DL18 @client
  Scenario: A read the service cannot answer fails loudly, never as "nobody has access"
    Given an owner reading their own delegates while the service is unavailable
    When the owner reads the delegates on their account
    Then the failure is surfaced, not reported as an account with no delegates

  @AC-DL19 @client
  Scenario: An invitation the service cannot answer fails loudly, never as "sent"
    Given an owner inviting a party while the service is unavailable
    When the owner invites that party
    Then the failure is surfaced, not reported as an invitation awaiting acceptance

  @AC-DL20 @client
  Scenario: An acceptance the service cannot answer fails loudly, never as "accepted"
    Given an invitee accepting while the service is unavailable
    When the invitee accepts their invitation
    Then the failure is surfaced, not reported as access granted

  @AC-DL15 @client @todo
  # BLOCKER: Owned by FE-3041 (full delegates module) — not built in this module.
  Scenario: An owner shares a single product rather than the whole account
    Given an owner who holds a product they want to share
    When the owner invites a party to that product alone
    Then the invitee gains access to that product and to nothing else

  @AC-DL16 @client @todo
  # BLOCKER: Owned by FE-3041 (full delegates module) — not built in this module.
  Scenario: An owner shares a single support ticket rather than the whole account
    Given an owner who holds a support ticket they want to share
    When the owner invites a party to that ticket alone
    Then the invitee gains access to that ticket and to nothing else
