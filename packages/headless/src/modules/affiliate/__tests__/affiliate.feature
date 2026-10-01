# -----------------------------------------------------------------------------
# affiliate.feature — module business-logic source of truth (code-test-bdd).
# Non-executable. Traced by affiliate.traceability.test.ts via the @AC-n tags.
# Cells: client x self, guest x self (design.md §5.2, parity.yaml). Every
# other cell is empty by construction — the matrix carries no context enum
# and every client composable refuses any resolved actor other than CLIENT
# at runtime (D-16, D-21).
#
# All nine composables are on the exported surface (index.ts) and every
# capability below names real, buildable behaviour. Scenario titles are the
# bdd.md "Scenario" column values verbatim where bdd.md gives one, per T06
# ("one title for each scenario name of bdd.md's per-spec lists").
#
# @todo REASONS. The operator-provisioned staging data on the single-
# account `client` credential means "NO-TWO-ACCOUNT" is NOT the blocker for
# every scenario below; it is named per-scenario, only where a real capture
# does not exist. Two distinct causes remain, never a code gap (composables
# landed, T17/T18/T21-T23/T25):
#   (a) NO-TWO-ACCOUNT — design.md §8.9's Seed 2A/A2 still needs a client
#       session with TWO affiliate accounts. No credential in
#       tests/fixtures/credentials.ts has one — `client` still carries
#       exactly one account. Barred: enrolling/creating an account on any
#       OTHER shared staging credential (R-NO-SWITCH-adjacent scope).
#       STILL BLOCKS: the paging/divergence scenarios that need 2+ real rows
#       (AC9, AC36 DV3/DV4 — this account has exactly one real link).
#   (a2) R-ENROL CAPTURE LOSS (`otherClient`) — CLOSED by R-ENROL-2. JTBD
#       STATUS: enrol/opt-in is NOW DELIVERED for AC4's happy path and AC5's
#       not-enrolled-404 row. Under review-notes.md's R-ENROL one-time grant,
#       `otherClient` WAS enrolled on 2026-10-01 to prove exactly this gap.
#       The capture attempt's own one-time guard checked the wrong filename
#       (missing the generator's `-with-staged-imports-1` suffix), so it
#       never matched; a second, accidental run re-fired the whole sequence
#       against the now-already-enrolled account, overwriting the
#       not-enrolled-404 capture with a 200 and the enrol-POST capture with a
#       real 409. Both corrupted files were deleted, not hand-repaired.
#       `otherClient` is now PERMANENTLY enrolled, and R-ENROL bars enrolling
#       any other client to retry on that credential. Operator ruling
#       R-ENROL-2 (review-notes.md, 2026-10-01) granted a SECOND, distinct
#       one-time enrol on a different staging client, with the generator's
#       guard corrected to check the exact filenames this time (including the
#       `-with-staged-imports-1` suffix). The real not-enrolled 404, the real
#       enrol-POST success, and the real enrolled re-read are now recorded
#       (`affiliate.fixtures.ts`'s own R-ENROL-2 block) and drive AC4's happy
#       path and AC5's not-enrolled row through the real module
#       (`affiliate.enrol.int.test.ts`, `affiliate.account-conditions.int.test.ts`).
#   (b) NO-STAFF-LOGIN — the `staff` credential 401s on this brand/origin.
#       `staff`, `GET admin/self` and the `refresh-client` grant stay
#       unrecorded.
# Operator ruling R-NO-SWITCH (2026-09-30) removes account switching
# entirely — AC26-AC33 and every switch-only scenario, control and gotcha
# are out of scope, not a capture gap (see the resolver section below).
# Operator brief 2026-09-30 also updated staging state and RESOLVES two
# former gaps: the brand's withdraw setting is now ON with a £5.00 available
# balance (AC19's success scenario is proven, no longer `@todo`), and the
# brand now carries a PayPal destination with a default email (AC22/AC23's
# PayPal detection, email lookup and save are proven; NO-PAYPAL-DESTINATION
# is closed).
# A scenario whose real capture now exists (links/referrals/commissions/
# payouts BASE reads, link create/edit/delete) is still `@todo` below ONLY
# where its full scope (filter/sort/paginate, or a write proof) is not yet
# authored — see the module hand-off for exactly what IS proven
# (`affiliate.links-list.int.test.ts`, `affiliate.mappers.test.ts`,
# `affiliate.utils.test.ts`) versus what remains a named gap. The withdraw
# REJECTION is NOT a recorded capture — this account no longer refuses an
# empty message server-side, so AC19's failure branch is proven by a
# declared `serveFailure(422)` control instead (`affiliate.withdraw.int.test.ts`'s
# own header). Nothing here is worked around with a hand-authored capture.
#
# Fixed defects (kept only where they change a scenario's CURRENT status —
# full authoring history: `__tests__/CONTROLS.md`):
# the four collections and both managers resolve the active account against
# replay the same way `useClientAffiliate` does; the guest visit has its own
# recorded base capture (`affiliate.link-visit.int.test.ts`), independent of
# the links listing's `visit_count` literal; the resolver's `stuck-none`
# regression and the link create/edit 422 field-message mapping (named
# finding F-3) are both fixed.
#
# Verification: `__tests__/CONTROLS.md` carries the per-control blind
# apply/run/revert result of every `*.must-fail.patch` file in this module —
# the exact assertion each one flips, or the named reason it cannot run yet.
# It is the one home for this file's per-scenario proof history; a prior
# revision of this header claimed a `docs/sdd/FE-3227/controls-ledger.md`
# that was never authored — that citation was wrong, fixed here.
# -----------------------------------------------------------------------------
Feature: The client self-service affiliate data layer and the guest link visit

  As a client
  I want to enrol in the affiliate programme, see my account and balance, and
  request a withdrawal
  So that I can participate in and benefit from the affiliate programme

  As a visitor
  I want a referral link I follow to be attributed to me
  So that the referring affiliate is credited

  # ---------------------------------------------------------------------------
  # useAffiliateActiveAccount — the resolver
  #
  # Operator ruling R-NO-SWITCH (2026-09-30) removes account switching
  # entirely: no switchAccount, no POST api/accounts/select, no stored
  # choice, no prune, no cross-tab sync, no needs-choice/resolving/failed
  # states. AC26-AC33 and every switch-only scenario are removed from scope
  # with it (review-notes.md), not carried forward as @todo. The resolver
  # keeps a small account source (the `/self` account_id when present, else
  # the client's only account), the CLIENT actor guard, and the server-inert
  # behaviour below — that surviving capability is unnumbered pending a
  # future design pass; this prover pass neither invents a new AC for it nor
  # deletes its proving test (`affiliate.account-selection.int.test.ts`).
  # ---------------------------------------------------------------------------

  @account-source @client
  # Proof: affiliate.account-source.int.test.ts. This unit's one real
  # account makes the self record's own account id and the client's first
  # (and only) listed account the SAME id — see that spec's own header.
  Scenario: The resolver addresses the client's own account from the session
    Given a client whose session carries their own affiliate account
    When the client opens the affiliate area
    Then the resolver publishes that account, matching the session's own record

  @account-source @client @todo
  # NO-TWO-ACCOUNT / NO-DIVERGING-SELF — discriminating "reads the self
  # record's account id" from "hardcodes the client's first listed account"
  # needs the two to disagree (a second real account, or a confirmed wire
  # path this seat's Read-block cannot establish from the contract alone).
  # affiliate.account-source.int.test.ts's own header names this precisely.
  Scenario: The resolver prefers the self record's own account id over the client's first listed account
    Given a client whose session self record names an account id that differs from their first listed account
    When the client opens the affiliate area
    Then the resolver publishes the self record's own account, not the first listed account

  @AC34 @client
  Scenario: With no account, the client composables send nothing, and the visit still goes
    Given a client session with zero affiliate accounts
    When the client opens the affiliate area
    Then no account is offered and every client composable is unavailable with zero requests

  @server
  Scenario: The resolver reports ready at once on the server, publishing no account and sending no request
    Given the module runs on the server, with no browser window
    When any consumer calls the resolver
    Then it reports ready at once and publishes no account, sending no request

  # ---------------------------------------------------------------------------
  # useClientAffiliate — the account, balance and enrolment (AC1-AC6, AC18, AC19, AC25)
  # ---------------------------------------------------------------------------

  @AC1 @client
  # A fixture-generator fix (the `keys` parameter now carries the real
  # `BrandConfigKeys` enum VALUES, not the TS member NAMES) re-recorded this
  # brand's real gate settings as BOTH keys on. Named for what it proves, not
  # the full AND gate: a mutant that returns true on either key alone would
  # still pass here. The one-on/one-off combination has no staging brand to
  # record from and stays unproven — named, not silently claimed.
  Scenario: A brand with both gate keys on opens the programme
    Given a client with an active affiliate account
    When the client opens the affiliate area
    Then the client sees whether the affiliate programme is enabled

  @AC2 @client
  # Proof: affiliate.account-read.int.test.ts (read half); affiliate.error-reload
  # (absent-account half, AC25's own case). DV6 refetch-over-loaded-data is a
  # named authoring gap. History: __tests__/CONTROLS.md.
  Scenario: The affiliate account reads with its relations, and an absent account means not enrolled
    Given a client with an active account who has never enrolled in the affiliate programme
    When the client opens the affiliate area
    Then the client sees that they are not enrolled, with no error shown

  @AC4 @client
  # JTBD STATUS: DELIVERED (R-ENROL-2, review-notes.md 2026-10-01). R-ENROL's
  # capture loss on `otherClient` (header block (a2)) is superseded, not
  # retried: a second, distinct staging client was granted a one-time enrol,
  # the generator's guard was corrected to check the exact target filenames
  # (including the `-with-staged-imports-1` suffix the earlier guard missed),
  # and the real not-enrolled 404, the real enrol-POST success and the real
  # enrolled re-read are now recorded (`affiliate.fixtures.ts`'s own R-ENROL-2
  # block). Proof: affiliate.enrol.int.test.ts's "A client enrols in the
  # affiliate programme" — drives the real `useClientAffiliate` through
  # `serveSequence` (not-enrolled → after-enrol) with no reload, no new
  # composable instance.
  Scenario: A client enrols in the affiliate programme
    Given a client with an active account who is not yet enrolled
    When the client enrols
    Then the client becomes enrolled and their account, balance and settings are loaded again

  @AC4 @client
  # Proof: affiliate.enrol.int.test.ts (isEnrolled guard blocks the repeat
  # POST; also drives the real 409 refusal path, which has no Gherkin
  # scenario of its own). History: __tests__/CONTROLS.md.
  Scenario: An already-enrolled client's repeat enrolment is a no-op
    Given a client who is already enrolled in the affiliate programme
    When the client enrols again
    Then no enrolment request is sent

  @AC3 @client
  # Proof: affiliate.balance.int.test.ts (balance £5.00, pending £0.00,
  # withdrawn £5.00 — the recorded capture's balance.ALL/pending_balance.ALL/
  # withdrawn_balance.ALL amount_formatted fields, operator brief). History:
  # __tests__/CONTROLS.md.
  Scenario: Two consumers share one balance read
    Given an enrolled client with an affiliate balance
    When the client opens the affiliate area
    Then the client sees the available, pending and withdrawn balance amounts

  @AC5 @client
  # JTBD STATUS: DELIVERED for the not-enrolled cell (R-ENROL-2,
  # review-notes.md 2026-10-01). Proof: affiliate.account-conditions.int.test.ts,
  # driving `useClientAffiliate` through the real recorded not-enrolled 404
  # capture itself (not a substitute account-404 override), and pinning that
  # the outbound read addresses the seeded session's own account id.
  Scenario: A client who has never enrolled reads as not enrolled, not disabled and not staged
    Given a client with an active account who has never enrolled in the affiliate programme
    When the client opens the affiliate area
    Then isEnrolled, isDisabled and isStaged all read false and no error is shown

  @AC5 @client @todo
  # The enrolled row is proven by affiliate.account-conditions.int.test.ts's
  # `otherClient` case. Still `@todo`: the DISABLED and STAGED rows, a
  # SEPARATE, unrelated NO-TWO-ACCOUNT gap — the full truth table needs
  # distinct disabled and staged accounts (design.md G3) staging does not
  # hold for either credential this unit can build a session from.
  Scenario: The enrolled, disabled and staged conditions follow the account
    Given an enrolled client's account in one of three recorded conditions
    When the client opens the affiliate area
    Then isEnrolled, isDisabled and isStaged each follow that account's real condition

  @AC6 @client
  # Proof: affiliate.stats.int.test.ts (real enrolled account + balance
  # captures). History: __tests__/CONTROLS.md.
  Scenario: The overview stats read from the account and the balance
    Given an enrolled client with an account and a balance
    When the client opens the affiliate area
    Then the client sees their affiliate-since date, link visit count, referral count and the three balances

  @AC18 @client
  # NO-WITHDRAW-CONFIG-KEY is CLOSED: `affiliate.fixtures.ts`'s config-key fix
  # (the `keys` parameter now carries the real `BrandConfigKeys` enum VALUES)
  # re-recorded the area capture with the withdraw-request key genuinely ON,
  # matching the operator's 2026-09-30 brief. Both terms of the AND
  # (`hasPayableCommissions`, the withdraw-request setting) are now real and
  # true, and the composable's own dotted-key response parse reads them
  # correctly — this scenario is GREEN against the real recorded data.
  # See affiliate.withdraw-gate.int.test.ts's own header and
  # __tests__/CONTROLS.md.
  Scenario: A client with a payable balance and the brand's withdraw-request config key on can request a withdrawal
    Given an enrolled client with payable commissions and withdrawal requests turned on for the brand
    When the client opens the affiliate area
    Then the client sees that they can request a withdrawal

  @AC18 @AC25 @client
  # Proof: affiliate.withdraw-gate.int.test.ts, added pass 11 (task (c)) — a
  # match-scoped area-key failure, so the gate key set and the balance read
  # fall through to their own base captures unaffected. Green at baseline.
  # `affiliate.withdraw-gate.area-independent.must-fail.patch` exists (added
  # pass 14) and blind-runs RED against this assertion, reverted GREEN —
  # proven, not escalated (__tests__/CONTROLS.md, Ledger row 55).
  Scenario: A client with a payable balance cannot withdraw when the area settings read fails, even though the balance is still payable
    Given an enrolled client with payable commissions whose brand area settings cannot be read
    When the client opens the affiliate area
    Then the client sees that they cannot request a withdrawal, and their payable balance is unaffected

  @AC19 @client
  # Proof: affiliate.withdraw.int.test.ts — the operator's 2026-09-30 staging
  # change (a £5.00 available balance) made this achievable this pass. A real
  # message succeeds on this account's real current state and raises a real
  # support ticket (recorded fresh, `affiliate.fixtures.ts`, one ticket this
  # pass per the operator's budget) — no longer `@todo`. History:
  # __tests__/CONTROLS.md.
  Scenario: A client requests a manual withdrawal and a support ticket is raised
    Given an enrolled client who can request a withdrawal
    When the client submits a withdrawal request with a message
    Then a support ticket is raised and its id is returned to the client

  @AC19 @client
  # Proof: affiliate.withdraw.int.test.ts — a declared `serveFailure(422)`
  # control (design.md §8.2 Failure surface), not a recorded capture: this
  # account no longer refuses an empty message server-side, and recording
  # that for real would raise a second real ticket over budget. The control
  # envelope carries no per-field shape (`data: null`), so this scenario
  # claims only what it proves: the error is set, never a named field.
  Scenario: A refused withdrawal resolves undefined and sets the error (AC19 Failure surface, declared control)
    Given an enrolled client whose withdrawal request is refused
    When the client submits a withdrawal request
    Then the client sees no ticket id, and the error is set

  @AC25 @client
  Scenario: A failed read reports its error, and a reload asks again
    Given a client with an active account whose affiliate account read fails
    When the client opens the affiliate area
    Then the client sees the error, and asking again sends the read a second time

  @AC25 @client
  # Proof: affiliate.error-reload.int.test.ts — a 500 control response on the
  # balance route (design.md §8.2 Failure surface, "account and balance
  # reads"), the same mechanism the sibling account-read-failure scenario
  # above uses. No real capture is needed; this is achievable, not a gap.
  Scenario: A failed balance read reports its error, and a reload asks again
    Given a client with an active account whose affiliate balance read fails
    When the client opens the affiliate area
    Then the client sees the error, and asking again sends the balance read a second time

  @AC25 @client
  Scenario: An absent affiliate account is not an error
    Given a client with an active account who has never enrolled in the affiliate programme
    When the client opens the affiliate area
    Then the client sees that they are not enrolled, with no error shown

  @AC25 @client @todo
  # NO-BALANCE-404-CAPTURE (G3) — needs a real balance 404 on an enrolled
  # account with a not-enrolled balance side; this unit's one real account is
  # enrolled on both the account and the balance route, so no state exists
  # to record a genuine balance-only-404 combination from.
  # affiliate.error-reload.int.test.ts's own header names this precisely.
  Scenario: An enrolled client's balance is empty when the balance read 404s
    Given an enrolled client whose affiliate balance has never been recorded
    When the client opens the affiliate area
    Then the client sees that they are enrolled, with no error shown, and each balance is empty

  @AC25 @client
  # Proof: affiliate.error-reload.int.test.ts's area-bound case — a
  # match-scoped 500 on the AREA key set only (design.md §8.1's `area` key
  # set), so the GATE key set and the account/balance reads fall through to
  # their own base captures, unaffected (bdd.md AC25 "Area settings bound").
  Scenario: A client's programme status and account are unaffected when the area settings read fails
    Given an enrolled client whose brand area settings cannot be read
    When the client opens the affiliate area
    Then the client still sees their programme status, account and balance, cannot request a withdrawal, and sees no error

  @AC25 @client
  # Proof: affiliate.error-reload.int.test.ts's gate-bound case — a
  # match-scoped 500 on the GATE key set only (design.md §8.1's `gate` key
  # set), so the AREA key set replays its own base capture, unaffected
  # (bdd.md AC25 "Gate settings bound").
  Scenario: A client sees the programme as unavailable when the gate settings read fails
    Given an enrolled client whose brand gate settings cannot be read
    When the client opens the affiliate area
    Then the client sees the programme as unavailable, with no error shown, and their area settings are unaffected

  # ---------------------------------------------------------------------------
  # Links, referrals, commissions, payouts, the two managers (AC7-AC23)
  # ---------------------------------------------------------------------------

  @AC7 @AC8 @AC9 @AC12 @AC13 @client @todo
  # The list read + failure half is proven against real data
  # (affiliate.links-list.int.test.ts). Filter/sort (AC8) is now proven too —
  # a name-filter write and a sort write, each asserted on the outbound
  # request (affiliate.links-criteria.int.test.ts). Paginate (AC9)'s WRITE
  # half is PARTLY proven — an explicit, non-default LIMIT write is asserted
  # on the outbound request (affiliate.links-criteria.int.test.ts); the OFFSET
  # half stays a named gap, not proven: this account has exactly one real
  # link, so there is no in-bounds non-zero offset to write, and `offset: 0`
  # is the schema's own default, which a dropped-offset mutant would not
  # redden. The paging EDGE (a written page boundary returning a DIFFERENT
  # row) and referral-origin's dotted-key divergence (AC36 DV3/DV4) stay
  # blocked for the same one-row reason. The scenario stays @todo because it
  # promises the WHOLE bundle (list, filter, sort, paginate), not the slice
  # proven so far.
  Scenario: A client lists, filters, sorts and paginates their referral links
    Given an enrolled client with referral links
    When the client lists their referral links
    Then the client can filter, sort and paginate the list and see each link's referral URL

  @AC10 @AC11 @client
  # JTBD STATUS: DELIVERED (pseudo-Nathan review, cardinal call 3). The real
  # create → read → edit → delete cycle IS captured (throwaway link, cleaned
  # up — affiliate.fixtures.ts), including the real 422 rejections (empty
  # redirect_url on both POST and PUT, and a delete of an unknown id), each
  # proven on its own in affiliate.link-create/-edit/-delete.int.test.ts.
  # Proof of the ONE continuous cycle this scenario promises (create → edit →
  # delete of the SAME link, not three independent ids): affiliate.link-cycle.int.test.ts,
  # which carries the create response's own id forward into the edit open and
  # the delete call. No longer `@todo`.
  Scenario: A client creates, edits and deletes a referral link
    Given an enrolled client
    When the client creates, edits or deletes a referral link
    Then the change is saved and reflected in the client's list of links

  @AC10 @client
  # Proof: affiliate.link-create-seed.int.test.ts. The create editor is dirty
  # on open (bdd.md AC10). Control: useAffiliateLinkManager.create-clean-on-open.
  Scenario: A new-link editor is already counted as changed when it opens, before the client types anything
    Given an enrolled client
    When the client opens the editor for a new link
    Then the editor reports unsaved changes at once

  @AC10 @client @todo
  # NO-DEFAULT-REDIRECT-VISIBLE (R-DATA-3). The operator set the brand's
  # "Default link redirect". Read-only GETs of the key (with and without
  # brand_id, with the brand id of /self and of the account, under the origin
  # of the brand that owns the link, and the organisation level) all return
  # no `default_redirect` value, so no recording holds it and ADR-035 bars
  # serving one. Control: affiliate.link-create.seed-early stays unproven.
  # Evidence: docs/sdd/FE-3227/evidence/capture-r-data-3-reprobe.md.
  Scenario: A new link starts from the brand's default redirect
    Given an enrolled client whose brand sets a default link redirect
    When the client opens the editor for a new link
    Then the new link's redirect is the brand's default redirect

  @AC14 @AC15 @client @todo
  # The base referrals read IS captured (3 real rows), with a read+failure
  # spec (affiliate.referrals-list.int.test.ts). Filter/sort is now proven
  # too — a dotted `affiliate_link.name` filter write and a sort write, each
  # asserted on the outbound request (affiliate.referrals-criteria.int.test.ts).
  # Paginate's WRITE half is now proven too — an explicit, non-default
  # limit AND offset write (both in bounds against the 3 real rows), asserted
  # on the outbound request (affiliate.referrals-criteria.int.test.ts).
  # Only the paging EDGE stays blocked: 3 rows against a default page size of
  # 5 give no real page boundary. The scenario stays @todo for that reason alone.
  Scenario: A client lists, filters, sorts and paginates their referrals
    Given an enrolled client with referrals
    When the client lists their referrals
    Then the client can filter, sort and paginate the list

  @AC16 @AC17 @client @todo
  # The base pending-commissions read IS captured (2 real rows), with a
  # read+failure spec (affiliate.commissions-list.int.test.ts), on top of
  # affiliate.utils.test.ts's two-status/keep_until derivation proof. Filter/
  # sort is now proven too — a `created_at` "after" filter write and an
  # `amount` sort write (proving the `-` direction prefix), each asserted on
  # the outbound request (affiliate.commissions-criteria.int.test.ts).
  # Paginate's WRITE half is now proven too — an explicit, non-default
  # limit AND offset write (both in bounds against the 2 real rows), asserted
  # on the outbound request (affiliate.commissions-criteria.int.test.ts).
  # The full "five statuses, two orders" sweep and the paging EDGE stay
  # separate, named gaps (no derivation formula available from the contract —
  # see that file's header; and 2 rows against a default page size give no
  # real page boundary).
  Scenario: A client lists, filters, sorts and paginates their commission history
    Given an enrolled client with commissions
    When the client lists their commission history
    Then the client can filter, sort and paginate the list

  @AC20 @AC21 @client @todo
  # The base payouts read IS captured (1 real row, matching the operator
  # brief's one withdrawn payout), with a read+failure spec
  # (affiliate.payouts-list.int.test.ts), on top of affiliate.mappers.test.ts's
  # field-map proof (including named finding F-1, paymentLog). Filter/sort is
  # now proven too — a `created_at` "before" filter write and an `amount`
  # sort write, each asserted on the outbound request
  # (affiliate.payouts-criteria.int.test.ts). Paginate (AC21)'s WRITE half is
  # PARTLY proven — an explicit, non-default LIMIT write is asserted on the
  # outbound request (affiliate.payouts-criteria.int.test.ts); the OFFSET
  # half stays a named gap, not proven: this account has exactly 1 real row,
  # so there is no in-bounds non-zero offset to write, and `offset: 0` is the
  # schema's own default, which a dropped-offset mutant would not redden.
  # The paging EDGE stays blocked for the same one-row reason.
  Scenario: A client lists, filters, sorts and paginates their payout history
    Given an enrolled client with payouts
    When the client lists their payout history
    Then the client can filter, sort and paginate the list

  @AC22 @client
  # Proof: affiliate.destinations.int.test.ts (the account's real destination
  # is detected as PayPal) + affiliate.destination-save.int.test.ts's own
  # seed case, which also asserts the untouched open is not counted as changed.
  # Operator brief 2026-09-30 recorded a real PayPal destination and default
  # email fresh, closing NO-PAYPAL-DESTINATION. History: __tests__/CONTROLS.md.
  Scenario: The manager seeds the model with the account's real PayPal destination and email
    Given an enrolled client whose account already carries a PayPal destination and email
    When the client opens the payout destination editor
    Then the model is seeded with the account's real PayPal destination and email
    And the editor reports no unsaved changes

  @AC23 @client
  # Proof: affiliate.destination-save.int.test.ts's own save case and the
  # save-order case of useAffiliatePayoutDestinationManager.machine.int.test.ts.
  # Both type through the consumer input path. A request observer sees the PUT
  # and the account read that follows it, and the test pins the editor's model
  # to the ids in that read's body. The replay answers with the recorded account
  # capture, whose ids differ from the typed ones, so a save with no re-seed
  # stays red. Control: affiliate.destination-save.no-reseed. Named gap: no
  # account read after a non-PayPal save is recorded (the generator reverts the
  # save), so the re-read cannot carry the saved id: this proves the editor
  # follows the re-read, not that the saved value persists.
  Scenario: A client saves a different payout destination, and the editor takes its model from the account read that follows the save
    Given an enrolled client editing their payout destination
    When the client saves a different payout destination and, for PayPal, a PayPal email
    Then the save carries the typed destination and the editor takes its model from the account read that follows

  @AC23 @client
  # Proof: affiliate.destination-save.int.test.ts. The editor is counted as
  # changed after the typing and not counted once the account read that follows
  # the save has re-seeded it (bdd.md AC23). A preselect open stays dirty by
  # design, and no recording holds a PayPal destination with no email, so that
  # open is not asserted. Control: affiliate.destination-save.no-reseed.
  Scenario: A client who has saved their payout destination is no longer counted as having unsaved changes
    Given an enrolled client who has saved a different payout destination
    When the account read that follows the save has settled
    Then the editor reports no unsaved changes

  @AC22 @client @todo
  # NO-NULL-DESTINATION-STATE (CONTROLS.md row 50). Unproven, so not claimed.
  # affiliate.payout-null-destination.int.test.ts characterises the open over
  # the R-ENROL-2 client's own recorded self, account and emails (destination
  # null), but it stays GREEN under
  # useAffiliatePayoutDestinationManager.null-not-default: the brand default on
  # staging is Wallet, so the inherit rule changes nothing observable. The rule
  # shows only over a brand whose default is PayPal, which staging does not hold
  # and a recording may not flip (ADR-035). No control flips the spec, so the
  # scenario stays @todo.
  Scenario: A client with no saved payout destination is offered the brand's default destination and asked for no PayPal email
    Given an enrolled client whose payout destination was never set
    When the client opens the payout destination editor
    Then the brand's default destination is the one offered, and no PayPal email is asked for

  @account-member-guard @client
  # Unnumbered — this capability sits outside the AC26-AC33 account-switch
  # scope R-NO-SWITCH removed (review-notes.md 2026-09-30), but the pinned-id
  # membership guard itself survives that removal: design.md §8.4 "If the
  # pinned id leaves `activeUser.accounts`, the service sends no request and
  # returns the membership failure" describes a guard against the account the
  # editor opened for disappearing from the client's own account list, a
  # condition account state can produce with no switch feature at all. This
  # prover pass neither invents a new numbered AC for it nor leaves it
  # unproven. Proof: affiliate.account-member-guard.int.test.ts — both
  # managers, driven through a live removal of the pinned account from the
  # session's own `accounts` list, never a hand-rolled membership shortcut.
  Scenario: A manager whose pinned account has left the client's own account list shows a real, translated not-a-member error
    Given a client has opened a manager for an account that has since left their own account list
    When the client tries to save
    Then the manager shows a real, translated error naming that they are no longer a member of that account, and sends no request

  @AC13 @client
  # Proof: affiliate.referral-origin.int.test.ts, driven by the real enrolled
  # account recording of the second staging client, which carries no brand
  # relation. Control: affiliate.referral-origin.no-brand-fallback.
  Scenario: A client whose account carries no brand relation gets the brand of their own self record, read by the module
    Given an enrolled client whose account response carries no brand relation
    When the client opens the affiliate area
    Then the client's own brand is the brand the affiliate area uses

  @account-clear @client
  # Proof: affiliate.account-clear.int.test.ts. Control:
  # affiliate.active-account.keep-key-on-clear. Unnumbered: the clear edge
  # survives R-NO-SWITCH, because an account can leave the client's own list
  # with no switch feature at all (design.md §8.4).
  Scenario: A loaded listing publishes zero rows, goes unavailable and sends nothing once its account leaves the client's own account list
    Given an enrolled client who has loaded their referral links
    When the client's account leaves their own account list
    Then the listing shows no rows, is unavailable, and sends no request

  @form-timeout @client
  # Proof: affiliate.form-timeout.int.test.ts, one managed editor each for the
  # link and the payout destination. Controls: the two ready-timeout-prefix
  # patches in CONTROLS.md.
  Scenario: both managers' readiness waits reject with their real translated form-timeout text once their lookups never return
    Given a client opens an editor whose lookups never answer
    When the client waits for the editor to be ready
    Then the wait ends with a translated form-timeout error instead of hanging

  @form-timeout @client
  # Proof: affiliate.form-timeout-submit.int.test.ts on a fake clock, one
  # managed editor each. Controls: the two submit-timeout-prefix patches in
  # CONTROLS.md.
  Scenario: the link manager's save rejects with its real translated form-timeout text once the write never answers
    Given a client has a link editor whose save request never answers
    When the client saves the link
    Then the save ends with a translated form-timeout error instead of hanging

  @form-timeout @client
  Scenario: the payout manager's save rejects with its real translated form-timeout text once the write never answers
    Given a client has a payout destination editor whose save request never answers
    When the client saves the payout destination
    Then the save ends with a translated form-timeout error instead of hanging

  # ---------------------------------------------------------------------------
  # useAffiliateLinkVisit — the guest link visit (AC24)
  # ---------------------------------------------------------------------------

  @AC24 @guest
  Scenario: The guest visit still sends its POST with no Authorization header, with no account resolved
    Given a visitor with no client account resolved
    When the visitor follows a referral link
    Then the visit is sent with no Authorization header

  @AC24 @guest
  # Proof: affiliate.link-visit.int.test.ts (real guest visit; redirect
  # target + cookie-jar write asserted; the cookie's own domain/path/max-age
  # attributes are a named gap, that spec's own header). History:
  # __tests__/CONTROLS.md.
  Scenario: A visitor follows a referral link and is attributed to the referring affiliate
    Given a visitor with no prior referral attribution
    When the visitor follows a referral link
    Then the visitor is attributed to the referring affiliate and is sent on to the link's destination

  @AC24 @guest
  # Proof: affiliate.link-visit.int.test.ts (real guest visit of an unknown
  # link hash; the real response carries no `referral_cookie` field — the
  # NO-EMPTY-COOKIE-CAPTURE gap is closed by
  # post-affiliate-link-visit-case-unknown-hash). History: __tests__/CONTROLS.md.
  Scenario: A visitor's attribution is removed when the destination carries none
    Given a visitor with an existing referral attribution
    When the visitor follows a link whose destination sets no new attribution
    Then the visitor's referral attribution is removed

  @AC24 @guest
  # Proof: affiliate.link-visit.int.test.ts (network-failure control,
  # serveFailure status "network"). History: __tests__/CONTROLS.md.
  Scenario: A visitor is still sent on when the referral attribution cannot be recorded
    Given a visitor following a referral link
    When recording the visit fails
    Then the visitor is still sent on to the referral origin

  # ---------------------------------------------------------------------------
  # Access denial — every actor other than the resolved self gets nothing
  # ---------------------------------------------------------------------------

  @AC35 @staff
  Scenario: Over a client session, STAFF gets isAvailable false and sends zero module-path requests
    Given a staff member signed in on a browser with an active client session
    When staff try to act as the client affiliate composables
    Then they can neither read nor change anything and no affiliate request is sent

  @AC35 @guest
  Scenario: Over a client session, GUEST gets isAvailable false and sends zero module-path requests
    Given no client is signed in
    When a guest tries to act as the client affiliate composables
    Then they can neither read nor change anything and no affiliate request is sent

  @AC35 @client
  Scenario: None of the observed paths of a CLIENT session contains 'admin'
    Given a client with an active affiliate account
    When the client's composables send their requests
    Then none of the observed paths contains an administrator segment

  # ---------------------------------------------------------------------------
  # Cross-cutting proof — no account/actor/session data needed (AC38, AC39)
  # ---------------------------------------------------------------------------

  @AC38 @client
  Scenario: Each capture is a scrubbed staging recording
    Given the module's own recorded fixture pool
    When the recordings are inspected
    Then each one is a real, version-3, scrubbed staging capture, and none holds a live Bearer token

  @AC39 @client
  Scenario: Each criteria control label resolves
    Given the four listings, the link form, the payout form and the withdrawal form
    When their uischema i18n keys are read from the landed labels file
    Then each key, and each sort option key, resolves to a real label

  # ---------------------------------------------------------------------------
  # Not yet provable — every remaining scenario is blocked on the same two
  # capture gaps named at the top of this file (NO-TWO-ACCOUNT,
  # NO-STAFF-LOGIN), never on the composables, which are landed. AC26-AC33
  # are removed from scope entirely by R-NO-SWITCH (review-notes.md) — they
  # are not carried here as a gap. Remaining resolver behaviour beyond rule 1
  # and the zero-account edge (AC36-AC37) keys off Seed 2A/A2 or the
  # staff/guest token seeds this unit cannot record; it is not separately
  # re-stated here because bdd.md already gives its per-scenario breakdown
  # and this file's job is the capability list, not a restatement of bdd.md's
  # row count.
  # ---------------------------------------------------------------------------

  @AC36 @client @todo
  # NO-TWO-ACCOUNT — the recorded divergences (paging edges, date literals)
  # need the links/referrals base captures this unit could not record.
  Scenario: Each recorded divergence behaves as recorded
    Given the recorded divergences from the oracle
    When the module is driven through each one
    Then each divergence behaves exactly as design.md §8.7 records it

  @AC37 @client @todo
  # NO-TWO-ACCOUNT — the mock contract rows that send a request each need an
  # enrolled account's data.
  Scenario: Each mock contract member reaches the wire under its module name
    Given the portal mock contract map
    When each member that sends a request is driven by its module name
    Then its outbound request matches the mapped module member
