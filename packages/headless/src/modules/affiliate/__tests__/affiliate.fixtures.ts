// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate — the module's OWN co-located fixture generator
 * (T01, design.md §8.9, ADR-025 §A1.3). Direct-API flavour, after
 * `tests/fixtures/generator.ts`'s `Generator`. Run with
 * `pnpm fixtures:generate affiliate` (`FIXTURE_MODE=record`).
 *
 * ## Job To Be Done
 * Record every REAL capture this unit's integration specs can honestly use,
 * from `packages/headless/.env.recording` (`VITE_API_URL`,
 * `RECORDING_BRAND_ORIGIN`) and the shared staging credentials of
 * `tests/fixtures/credentials.ts`.
 *
 * ## Current captured state (staging data, operator-provisioned)
 * The single-account `client` credential is enrolled (`affiliate_tier_id`
 * set, live-verified), carrying one affiliate link, three referrals, two
 * pending commissions, and one prior payout. Captured: links, referrals,
 * pending commissions, payouts, a throwaway link create → read → update →
 * delete, a repeat-enrol probe (idempotent re-POST on an already-enrolled
 * account), the brand's payout destinations, and the client's emails.
 * Account switching is removed from the module (R-NO-SWITCH,
 * 2026-09-30) — this generator records no `POST /api/accounts/select`.
 * Authoring history: `__tests__/CONTROLS.md`.
 *
 * ## Operator brief, 2026-09-30 (R-NO-SWITCH pass) — staging state changed
 * The brand's withdraw-request setting is now ON and the account's
 * available balance is £5.00, and the account's real payout destination is
 * PayPal with the default email `nathan.robinson+checkouttest@upmind.com`.
 * This generator now ALSO records: (a) a real withdraw SUCCESS (base
 * capture, no `case`) — raises ONE real support ticket, operator-accepted;
 * (b) the PayPal entry inside the existing destinations capture and the
 * matching email inside the existing emails capture (no new route, the
 * existing GETs now reflect the new state); (c) the account SAVE
 * (`PUT /api/accounts/{a}`) with the PayPal destination id + that email id —
 * an idempotent write (the account already carries that pair), so no
 * separate restore call is owed.
 *
 * ## What this generator does NOT attempt, and why (G3, operator brief)
 * design.md §8.9's "Owed recordings" table plans every capture on a
 * TWO-account `self` (Seed 2A/A2) whose second account is affiliate-enrolled.
 * No credential in `tests/fixtures/credentials.ts` satisfies that — `client`
 * (`checkouttest`) still carries exactly ONE account. So every capture that
 * needed a second account — the resolver's rules 2/3/switch — is out of
 * scope entirely under operator ruling R-NO-SWITCH (2026-09-30): account
 * switching is removed from the module, not merely unrecorded.
 *   - `staff` grant (`nathan.robinson+staffuser@upmind.com` / `<redacted>23`)
 *     returns `401` on this brand/origin — the wrong credential for this
 *     brand, independent of the account's affiliate state. `staff`,
 *     `GET admin/self` and the `refresh-client` grant stay unrecorded.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { createGenerator } from "@upmind-automation/test-fixtures/generator";
import { BrandConfigKeys } from "@upmind-automation/types";

const GATE_CONFIG_KEYS = [
  BrandConfigKeys.UPMIND_AFFILIATES_ENABLED,
  BrandConfigKeys.UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED
].join(",");

const AREA_CONFIG_KEYS = [
  BrandConfigKeys.AFFILIATES_DEFAULT_REDIRECT_LINK,
  BrandConfigKeys.AFFILIATES_WITHDRAW_REQUEST
].join(",");

// -----------------------------------------------------------------------------

const BASE_URL = process.env.VITE_API_URL;
const ORIGIN = process.env.RECORDING_BRAND_ORIGIN;
const RUN = process.env.FIXTURE_MODE === "record";

const SELF_PATH =
  "/api/self?with=actor,actor.account,actor.brand,actor.image," +
  "actor.parent_client_config.parent_client," +
  "actor.parent_client_config.parent_client.image,accounts," +
  "delegated_ids,enabled_modules&with_count=actor.child_client_configs";

const ACCOUNT_PATH = (accountId: string): string =>
  `/api/accounts/${accountId}/affiliate?with_staged_imports=1&with=account,account.brand,` +
  "account.clients,import.credentials,import.source,account.affiliate_payout_destination";

async function passwordLogin(
  username: string,
  password: string,
  label: string
): Promise<string> {
  const response = await fetch(`${BASE_URL}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      ...(ORIGIN ? { Origin: ORIGIN } : {})
    },
    body: new URLSearchParams({
      grant_type: "password",
      username,
      password
    }).toString()
  });
  const login = (await response.json()) as { access_token?: string };
  if (!login.access_token) {
    throw new Error(
      `[affiliate.fixtures] ${label} login failed on ${BASE_URL} — status ${response.status}. ` +
        "G3: escalate to the operator, do not hand-author a capture."
    );
  }
  return login.access_token;
}

async function rawGet(token: string, path: string): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(ORIGIN ? { Origin: ORIGIN } : {})
    }
  });
  return response.json();
}

describe.runIf(RUN)("affiliate fixtures (record mode)", () => {
  it("captures the achievable, read-only, single-account subset", async () => {
    if (!BASE_URL) {
      throw new Error(
        "[affiliate.fixtures] VITE_API_URL is not set — packages/headless/.env.recording is required."
      );
    }

    const generator = createGenerator(BASE_URL, {
      recordingsDir: new URL("./fixtures", import.meta.url).pathname,
      origin: ORIGIN,
      source: "case",
      name: "affiliate"
    });

    // --- client login. NOT saved as a fixture — bdd.md's "Owed recordings"
    // names no plain client-grant capture; Seed 2A/A2 build a session from
    // the `self` capture through the session store, they never replay this
    // login. A bare fetch keeps it out of the generator's save buffer.
    const loginResponse = await fetch(`${BASE_URL}/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        ...(ORIGIN ? { Origin: ORIGIN } : {})
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: API_CREDENTIALS.client.username,
        password: API_CREDENTIALS.client.password
      }).toString()
    });
    const login = (await loginResponse.json()) as { access_token?: string };
    if (!login.access_token) {
      throw new Error(
        `[affiliate.fixtures] The client login of tests/fixtures/credentials.ts failed on ` +
          `${BASE_URL} — status ${loginResponse.status}. G3: escalate to the operator, do not ` +
          "hand-author a self/account capture."
      );
    }
    generator.setBearerToken(login.access_token);

    // --- self (base). Recorded AS IS — one account, not two. A spec that
    // needs Seed 2A/A2 (two accounts) cannot build from this capture.
    const selfResponse = await generator.get(
      "/api/self?with=actor,actor.account,actor.brand,actor.image," +
        "actor.parent_client_config.parent_client," +
        "actor.parent_client_config.parent_client.image,accounts," +
        "delegated_ids,enabled_modules&with_count=actor.child_client_configs"
    );
    const selfBody = selfResponse.body as {
      data?: { accounts?: { id?: string }[] };
    };
    const accountId = selfBody.data?.accounts?.[0]?.id;
    if (!accountId) {
      throw new Error(
        "[affiliate.fixtures] The self capture of the client credential carries no account id. " +
          "G3: escalate to the operator."
      );
    }

    // --- account switching is removed from this module (operator ruling
    // R-NO-SWITCH, 2026-09-30): no `POST /api/accounts/select` call
    // exists on any code path any more, so this generator no longer
    // records it (it previously did, to feed the resolver's own
    // now-deleted switch/select mechanics).

    // --- the account and balance reads (base captures, real status
    // recorded, never assumed — the account is enrolled).
    const accountResponse = await generator.get(
      `/api/accounts/${accountId}/affiliate?with_staged_imports=1&with=account,account.brand,` +
        "account.clients,import.credentials,import.source,account.affiliate_payout_destination"
    );
    await generator.get(
      `/api/accounts/${accountId}/affiliate/balance?with_staged_imports=1`
    );

    const accountBody = accountResponse.body as {
      data?: { account?: { brand_id?: string } };
    };
    const brandId = accountBody.data?.account?.brand_id;
    const selfActorBody = selfResponse.body as {
      data?: { actor?: { id?: string } };
    };
    const clientId = selfActorBody.data?.actor?.id;

    // --- the achievable enrolled-single-account subset.

    // A repeat enrol on an already-enrolled account. Idempotent per
    // design.md §8.2's stated Failure surface — the generator records
    // whatever staging actually answers, 2xx or an error, never assumed.
    await generator.post(
      `/api/accounts/${accountId}/affiliate?case=rejected`,
      undefined
    );

    // Links: the real recorded link (design.md §8.1).
    await generator.get(
      `/api/accounts/${accountId}/affiliate/links?with_staged_imports=1`
    );

    // A throwaway link: create, read it back, update it, then delete it
    // (operator brief — create-then-delete its own link).
    const brandDomain = (
      accountBody.data as { account?: { brand?: { domain?: string } } }
    )?.account?.brand?.domain;
    const throwawayRedirectUrl = brandDomain
      ? `http://${brandDomain}/fe-3227-fixture`
      : undefined;
    if (!throwawayRedirectUrl) {
      throw new Error(
        "[affiliate.fixtures] The account capture carries no account.brand.domain — cannot " +
          "build a valid redirect_url for the throwaway link (this brand rejects an off-domain " +
          "redirect_url, live-verified). G3: escalate to the operator."
      );
    }

    const createResponse = await generator.post(
      `/api/accounts/${accountId}/affiliate/links`,
      {
        name: "FE-3227 fixture throwaway link",
        redirect_url: throwawayRedirectUrl
      }
    );
    const createdLink = createResponse.body as { data?: { id?: string } };
    const throwawayLinkId = createdLink.data?.id;

    // The real 422 to an empty redirect_url, on both the create and the
    // edit route (design.md §8.9 "Owed recordings").
    await generator.post(
      `/api/accounts/${accountId}/affiliate/links?case=rejected`,
      { name: "", redirect_url: "" }
    );

    if (throwawayLinkId) {
      await generator.get(
        `/api/accounts/${accountId}/affiliate/links/${throwawayLinkId}`
      );
      await generator.put(
        `/api/accounts/${accountId}/affiliate/links/${throwawayLinkId}?case=rejected`,
        { name: "", redirect_url: "" }
      );
      await generator.put(
        `/api/accounts/${accountId}/affiliate/links/${throwawayLinkId}`,
        {
          name: "FE-3227 fixture throwaway link (edited)",
          redirect_url: `${throwawayRedirectUrl}-edited`
        }
      );
      await generator.delete(
        `/api/accounts/${accountId}/affiliate/links/${throwawayLinkId}`
      );
    }

    // The real answer to a delete of an unknown link id.
    await generator.delete(
      `/api/accounts/${accountId}/affiliate/links/00000000-0000-0000-0000-000000000000?case=rejected`
    );

    // Referrals, pending commissions, payouts.
    await generator.get(
      `/api/accounts/${accountId}/affiliate/referrals?with=affiliate_account,affiliate_link,client,client.image`
    );
    await generator.get(
      `/api/accounts/${accountId}/affiliate/pending_commissions?with_staged_imports=1&with=invoice,invoice.client`
    );
    await generator.get(
      `/api/accounts/${accountId}/affiliate/payouts?with_staged_imports=1&with=affiliate_payout_destination,payment_log`
    );

    // The withdraw rejection is NOT captured live: this real brand/account
    // now accepts an empty message (200, a real ticket) rather than
    // refusing it — a live probe this pass confirmed that, and a second
    // real POST here would raise a second real ticket, over the
    // operator's one-ticket budget (2026-09-30 brief). The AC19 failure
    // branch is proven by a declared `serveFailure(422)` control instead
    // (`affiliate.withdraw.int.test.ts`, same pattern as
    // `affiliate.destination-save.int.test.ts`), never a recorded body.

    // The withdraw SUCCESS itself is NOT captured in this block — pseudo-
    // Nathan review pass-7, blocker 3: a ticket-raising POST must live in
    // its OWN isolated `it()` with its OWN `Generator`, skipped once the
    // base capture already exists, exactly like the link-visit block below
    // (never re-run by a re-run of this main block, and never able to
    // drain the £5.00 balance on a routine re-record). See "captures the
    // real withdraw success" below.

    // Payout destinations and PayPal emails. `generator.get()`'s returned
    // `.body` is the SANITIZED copy (ids/emails masked for storage) — never
    // usable to build a subsequent real request. So the real ids for the
    // save below come from a SEPARATE raw `fetch()` with the same bearer
    // token, exactly the pattern the login section above already uses to
    // keep an unsanitised value out of the generator's capture buffer.
    let paypalDestinationId: string | undefined;
    let paypalEmailId: string | undefined;
    let nonPaypalDestinationId: string | undefined;
    if (brandId) {
      await generator.get(
        `/api/brands/${brandId}/affiliate_payout_destination?limit=10&offset=0&order=-created_at`
      );
      const rawDestinationsResponse = await fetch(
        `${BASE_URL}/api/brands/${brandId}/affiliate_payout_destination?limit=10&offset=0&order=-created_at`,
        {
          headers: {
            Authorization: `Bearer ${login.access_token}`,
            Accept: "application/json",
            ...(ORIGIN ? { Origin: ORIGIN } : {})
          }
        }
      );
      const rawDestinationsBody = (await rawDestinationsResponse.json()) as {
        data?: { id?: string; code?: string }[];
      };
      paypalDestinationId = rawDestinationsBody.data?.find(
        d => d.code === "paypal"
      )?.id;
      nonPaypalDestinationId = rawDestinationsBody.data?.find(
        d => d.code !== "paypal"
      )?.id;
    }
    if (clientId) {
      await generator.get(
        `/api/clients/${clientId}/emails?limit=0&offset=0&order=-default,-id&with_staged_imports=1`
      );
      const rawEmailsResponse = await fetch(
        `${BASE_URL}/api/clients/${clientId}/emails?limit=0&offset=0&order=-default,-id&with_staged_imports=1`,
        {
          headers: {
            Authorization: `Bearer ${login.access_token}`,
            Accept: "application/json",
            ...(ORIGIN ? { Origin: ORIGIN } : {})
          }
        }
      );
      const rawEmailsBody = (await rawEmailsResponse.json()) as {
        data?: { id?: string; email?: string }[];
      };
      paypalEmailId = rawEmailsBody.data?.find(
        e => e.email === "nathan.robinson+checkouttest@upmind.com"
      )?.id;
    }

    // The NON-PAYPAL save (PUT /api/accounts/{a}?case=non-paypal-save) —
    // pseudo-Nathan review pass-7, blocker 1: the AC23 save spec must PUT
    // a genuinely different destination and read back a REAL recorded
    // response for THAT exact save, never the PayPal-pair capture
    // answering by coincidence of an unmatched-body replay. Recorded
    // BEFORE the PayPal restore below, and verified to actually persist
    // (a different `affiliate_payout_destination_id` on the response)
    // before the generator proceeds — never assumed idempotent.
    if (nonPaypalDestinationId) {
      const nonPaypalSaveResponse = await generator.put(
        `/api/accounts/${accountId}?case=non-paypal-save`,
        {
          affiliate_payout_destination_id: nonPaypalDestinationId,
          affiliate_payout_paypal_email_id: null
        }
      );
      const nonPaypalSaveBody = nonPaypalSaveResponse.body as {
        data?: { affiliate_payout_destination_id?: string };
      };
      if (
        nonPaypalSaveBody.data?.affiliate_payout_destination_id !==
        nonPaypalDestinationId
      ) {
        throw new Error(
          "[affiliate.fixtures] the non-PayPal save did not persist the new destination id on " +
            "the response — refusing to record a save capture that does not prove a real change. " +
            "G3: escalate to the operator."
        );
      }
    } else {
      throw new Error(
        "[affiliate.fixtures] NO-NON-PAYPAL-DESTINATION: the brand's destinations carry no " +
          "second (non-PayPal) entry to save as a genuinely different destination. G3: escalate " +
          "to the operator, do not hand-author the id."
      );
    }

    // The PAYPAL RESTORE (PUT /api/accounts/{a}) — operator brief
    // 2026-09-30: "PUT the account back to PayPal + that email after any
    // save capture." Runs immediately after the non-PayPal save above, so
    // the account ends this generator run exactly where it started: PayPal
    // with the default email nathan.robinson+checkouttest@upmind.com.
    if (paypalDestinationId && paypalEmailId) {
      await generator.put(`/api/accounts/${accountId}`, {
        affiliate_payout_destination_id: paypalDestinationId,
        affiliate_payout_paypal_email_id: paypalEmailId
      });
    } else {
      throw new Error(
        "[affiliate.fixtures] NO-PAYPAL-DESTINATION or NO-PAYPAL-EMAIL: the brand's destinations " +
          "or the client's emails carry no PayPal entry / matching email despite the operator " +
          "brief of 2026-09-30. G3: escalate to the operator, do not hand-author the ids."
      );
    }

    // --- the gate settings read (design.md §8.1, no `brand_id` — AC1).
    // The `keys` param carries the REAL BrandConfigKeys wire VALUES, never
    // the TypeScript enum member NAMES — the prior pass sent the literal
    // names ("UPMIND_AFFILIATES_ENABLED") and staging answered `data: []`
    // every time, which is why AC1's "on" cells and AC18's withdraw gate
    // had no true-positive capture to assert against.
    await generator.get(`/api/config/brand/values?keys=${GATE_CONFIG_KEYS}`);
    // The area settings read (design.md §8.1, AC10/AC18) is spec'd to carry
    // `brand_id` (session brandId, else useBrand().brandId), omitted only
    // for the UUID.ORG edge. The prover seat's Read-block bars confirming
    // from source which of the two this real build currently sends, so
    // BOTH real variants are captured — the MSW matcher (identity params,
    // `tests/fixtures/msw-handlers.ts`) then answers whichever shape the
    // real request actually carries, never assuming one over the other.
    await generator.get(`/api/config/brand/values?keys=${AREA_CONFIG_KEYS}`);
    if (brandId) {
      await generator.get(
        `/api/config/brand/values?keys=${AREA_CONFIG_KEYS}&brand_id=${brandId}`
      );
    }

    // --- the three useBrand() singleton reads the replay pool must answer
    // (design.md §8.1 — the module reads no value from them, but an
    // unmatched request throws loudly in replay mode).
    await generator.get("/api/brand/settings");
    await generator.get("/api/org/modules");
    await generator.get("/api/config/organisation/values");

    generator.clearBearerToken();

    // --- the guest grant. No credential needed.
    await generator.post("/oauth/access_token", { grant_type: "guest" });

    generator.save();

    expect(generator.getCapturedFixtures().size).toBeGreaterThan(0);
  }, 30000);

  // --- pseudo-Nathan review pass-7, blocker 3: the withdraw SUCCESS raises
  // ONE real support ticket (operator-accepted, 2026-09-30 brief) and would
  // drain the real £5.00 available balance on a second run. So it lives in
  // its OWN isolated `it()` with its OWN `Generator`, and is SKIPPED outright
  // once the base capture already exists on disk — a routine re-record of
  // this unit (e.g. to refresh an unrelated capture) never re-raises a
  // ticket and never re-drains the balance.
  it("captures the real withdraw success (raises ONE support ticket, skipped once already captured)", async () => {
    if (!BASE_URL) {
      throw new Error(
        "[affiliate.fixtures] VITE_API_URL is not set — packages/headless/.env.recording is required."
      );
    }

    const recordingsDir = new URL("./fixtures", import.meta.url).pathname;
    const withdrawFixturePath = `${recordingsDir}/post-accounts-id-affiliate-withdraw.json`;

    if (existsSync(withdrawFixturePath)) {
      console.log(
        "[affiliate.fixtures] withdraw success already captured — 0 tickets raised this run. " +
          "Delete post-accounts-id-affiliate-withdraw.json to force a fresh capture (raises a new ticket)."
      );
      expect(existsSync(withdrawFixturePath)).toBe(true);
      return;
    }

    const accountFixture = JSON.parse(
      readFileSync(
        `${recordingsDir}/get-accounts-id-affiliate-with-staged-imports-1.json`,
        "utf-8"
      )
    ) as { response: { body: { data?: { account_id?: string } } } };
    const accountId = accountFixture.response.body.data?.account_id;
    if (!accountId) {
      throw new Error(
        "[affiliate.fixtures] The recorded account capture carries no account_id. G3: escalate to the operator."
      );
    }

    const loginResponse = await fetch(`${BASE_URL}/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        ...(ORIGIN ? { Origin: ORIGIN } : {})
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: API_CREDENTIALS.client.username,
        password: API_CREDENTIALS.client.password
      }).toString()
    });
    const login = (await loginResponse.json()) as { access_token?: string };
    if (!login.access_token) {
      throw new Error(
        `[affiliate.fixtures] The client login failed on ${BASE_URL} — status ${loginResponse.status}. ` +
          "G3: escalate to the operator, do not hand-author a withdraw capture."
      );
    }

    const generator = createGenerator(BASE_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "affiliate"
    });
    generator.setBearerToken(login.access_token);

    // Operator brief 2026-09-30: the brand's withdraw setting is ON and the
    // available balance is £5.00. A real message now succeeds and raises
    // ONE real support ticket — accepted, tracked here, never repeated by
    // this guard on a later run.
    await generator.post(`/api/accounts/${accountId}/affiliate/withdraw`, {
      message: "Please process my withdrawal"
    });

    generator.save();

    console.log(
      "[affiliate.fixtures] withdraw success captured — 1 real support ticket raised this run."
    );
    expect(generator.getCapturedFixtures().size).toBe(1);
  }, 30000);

  // --- R-ENROL-2 (review-notes.md, 2026-10-01) — a SECOND, distinct one-time
  // grant, on a DIFFERENT staging client (nathan.robinson+iBfSQzWefk@upmind.com)
  // after R-ENROL's own captures were lost to the guard bug below. The
  // password is supplied out-of-band and read ONLY from an env var — it is
  // never hand-written into this or any other committed file (operator
  // brief). Guarded on the THREE exact target filenames this sequence must
  // produce (including the `-with-staged-imports-1` suffix the generator
  // always appends to this route's own identity — the EXACT bug that lost
  // R-ENROL's captures) — if all three already exist, this is a hard no-op,
  // so an accidental second run can never re-fire the enrol POST.
  it("captures the not-enrolled 404, the enrol POST, and the enrolled re-read for a second client (R-ENROL-2, one-time, guarded)", async () => {
    if (!BASE_URL) {
      throw new Error(
        "[affiliate.fixtures] VITE_API_URL is not set — packages/headless/.env.recording is required."
      );
    }

    const recordingsDir = new URL("./fixtures", import.meta.url).pathname;
    const NOT_ENROLLED_PATH = `${recordingsDir}/get-accounts-id-affiliate-case-not-enrolled-with-staged-imports-1.json`;
    const ENROL_PATH = `${recordingsDir}/post-accounts-id-affiliate.json`;
    const AFTER_ENROL_PATH = `${recordingsDir}/get-accounts-id-affiliate-case-after-enrol-with-staged-imports-1.json`;

    if (
      existsSync(NOT_ENROLLED_PATH) ||
      existsSync(ENROL_PATH) ||
      existsSync(AFTER_ENROL_PATH)
    ) {
      console.log(
        "[affiliate.fixtures] R-ENROL-2 guard: at least one of the three target files already " +
          "exists — this is a hard no-op (review pass 19, cardinal call 4: an AND guard re-fires " +
          "the enrol POST against an already-enrolled client if only part of the capture set is " +
          "lost). 0 requests sent this run."
      );
      expect(
        existsSync(NOT_ENROLLED_PATH) ||
          existsSync(ENROL_PATH) ||
          existsSync(AFTER_ENROL_PATH)
      ).toBe(true);
      return;
    }

    const password = process.env.FE3227_ENROL2_PASSWORD;
    if (!password) {
      throw new Error(
        "[affiliate.fixtures] FE3227_ENROL2_PASSWORD is not set — R-ENROL-2's one-time grant " +
          "supplies the password out-of-band; it is never hand-written into a committed file."
      );
    }

    const loginResponse = await fetch(`${BASE_URL}/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        ...(ORIGIN ? { Origin: ORIGIN } : {})
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: "nathan.robinson+iBfSQzWefk@upmind.com",
        password
      }).toString()
    });
    const login = (await loginResponse.json()) as { access_token?: string };
    if (!login.access_token) {
      throw new Error(
        `[affiliate.fixtures] R-ENROL-2 login failed on ${BASE_URL} — status ${loginResponse.status}. ` +
          "G3: escalate to the operator, do not hand-author a capture."
      );
    }

    const rawSelfResponse = await fetch(`${BASE_URL}/api/self?with=accounts`, {
      headers: {
        Authorization: `Bearer ${login.access_token}`,
        Accept: "application/json",
        ...(ORIGIN ? { Origin: ORIGIN } : {})
      }
    });
    const rawSelfBody = (await rawSelfResponse.json()) as {
      data?: { accounts?: { id?: string }[] };
    };
    const accountId = rawSelfBody.data?.accounts?.[0]?.id;
    if (!accountId) {
      throw new Error(
        "[affiliate.fixtures] R-ENROL-2: the self read of the second client carries no account id. " +
          "G3: escalate to the operator."
      );
    }

    const generator = createGenerator(BASE_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "affiliate"
    });
    generator.setBearerToken(login.access_token);

    const accountPath =
      `/api/accounts/${accountId}/affiliate?with_staged_imports=1&with=account,account.brand,` +
      "account.clients,import.credentials,import.source,account.affiliate_payout_destination";

    // The real not-enrolled 404.
    await generator.get(`${accountPath}&case=not-enrolled`);
    // The real enrol POST success (base capture — no `case`, so it answers
    // every real enrol request by default, per the replay pool's identity
    // matcher — tests/fixtures/msw-handlers.ts).
    await generator.post(`/api/accounts/${accountId}/affiliate`, undefined);
    // The real enrolled re-read.
    await generator.get(`${accountPath}&case=after-enrol`);

    generator.save();

    console.log(
      "[affiliate.fixtures] R-ENROL-2 captured — 3 requests sent this run, never to repeat."
    );
    expect(generator.getCapturedFixtures().size).toBe(3);
  }, 30000);

  // --- R-DATA-3 (review-notes.md, 2026-10-01) — READ-ONLY GETs only. The
  // operator set the brand's affiliate "Default link redirect"
  // (`affiliate_systems.settings.default_redirect`). The area settings read is
  // re-recorded in BOTH identity variants (with and without `brand_id`) under
  // the same filenames, so the existing replay identities now carry the value.
  // No write, no enrol, no withdraw. The value is checked BEFORE `save()`, so
  // a read that does not show the operator's value never overwrites a capture.
  it("R-DATA-3: re-records the brand area settings with default_redirect set (read-only GETs)", async () => {
    if (!BASE_URL) {
      throw new Error(
        "[affiliate.fixtures] VITE_API_URL is not set — packages/headless/.env.recording is required."
      );
    }

    const authHeaders = (token: string): Record<string, string> => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(ORIGIN ? { Origin: ORIGIN } : {})
    });

    const loginResponse = await fetch(`${BASE_URL}/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        ...(ORIGIN ? { Origin: ORIGIN } : {})
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: API_CREDENTIALS.client.username,
        password: API_CREDENTIALS.client.password
      }).toString()
    });
    const login = (await loginResponse.json()) as { access_token?: string };
    if (!login.access_token) {
      throw new Error(
        `[affiliate.fixtures] R-DATA-3 client login failed on ${BASE_URL} — status ${loginResponse.status}. ` +
          "G3: escalate to the operator, do not hand-author a capture."
      );
    }

    const rawSelf = (await (
      await fetch(`${BASE_URL}/api/self?with=accounts`, {
        headers: authHeaders(login.access_token)
      })
    ).json()) as { data?: { accounts?: { id?: string }[] } };
    const accountId = rawSelf.data?.accounts?.[0]?.id;
    if (!accountId) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-3: the self read carries no account id. G3: escalate to the operator."
      );
    }
    const rawAccount = (await (
      await fetch(
        `${BASE_URL}/api/accounts/${accountId}/affiliate?with=account`,
        {
          headers: authHeaders(login.access_token)
        }
      )
    ).json()) as { data?: { account?: { brand_id?: string } } };
    const brandId = rawAccount.data?.account?.brand_id;
    if (!brandId) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-3: the account read carries no brand id. G3: escalate to the operator."
      );
    }

    const generator = createGenerator(BASE_URL, {
      recordingsDir: new URL("./fixtures", import.meta.url).pathname,
      origin: ORIGIN,
      source: "case",
      name: "affiliate"
    });
    generator.setBearerToken(login.access_token);

    const withoutBrand = await generator.get(
      `/api/config/brand/values?keys=${AREA_CONFIG_KEYS}`
    );
    const withBrand = await generator.get(
      `/api/config/brand/values?keys=${AREA_CONFIG_KEYS}&brand_id=${brandId}`
    );

    const readValue = (response: { body: unknown }): unknown =>
      (response.body as { data?: Record<string, unknown> }).data?.[
        BrandConfigKeys.AFFILIATES_DEFAULT_REDIRECT_LINK
      ];
    if (
      [withoutBrand, withBrand].some(
        response =>
          typeof readValue(response) !== "string" || readValue(response) === ""
      )
    ) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-3: the area settings read carries no default_redirect value. " +
          `Without brand_id: status ${withoutBrand.status}, data ${JSON.stringify((withoutBrand.body as { data?: unknown }).data)}. ` +
          `With brand_id: status ${withBrand.status}, data ${JSON.stringify((withBrand.body as { data?: unknown }).data)}. ` +
          "Nothing was saved."
      );
    }

    generator.save();

    expect(generator.getCapturedFixtures().size).toBe(2);
  }, 30000);

  // --- R-DATA-3, second half — READ-ONLY GETs of the R-ENROL-2 client
  // (`nathan.robinson+iBfSQzWefk@upmind.com`), whose payout destination stays
  // empty (it inherits the brand default). Password from the env var only.
  // Records that client's self, account and emails under one `case`, so a spec
  // that serves its account also seeds its session from its own self capture.
  it("R-DATA-3: records the R-ENROL-2 client's self and account with the empty payout destination (read-only GETs)", async () => {
    if (!BASE_URL) {
      throw new Error(
        "[affiliate.fixtures] VITE_API_URL is not set — packages/headless/.env.recording is required."
      );
    }
    const password = process.env.FE3227_ENROL2_PASSWORD;
    if (!password) {
      throw new Error(
        "[affiliate.fixtures] FE3227_ENROL2_PASSWORD is not set — R-DATA-3 supplies the R-ENROL-2 " +
          "client's password out-of-band; it is never hand-written into a committed file."
      );
    }

    const loginResponse = await fetch(`${BASE_URL}/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        ...(ORIGIN ? { Origin: ORIGIN } : {})
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: "nathan.robinson+iBfSQzWefk@upmind.com",
        password
      }).toString()
    });
    const login = (await loginResponse.json()) as { access_token?: string };
    if (!login.access_token) {
      throw new Error(
        `[affiliate.fixtures] R-DATA-3 login of the R-ENROL-2 client failed on ${BASE_URL} — status ` +
          `${loginResponse.status}. G3: escalate to the operator, do not hand-author a capture.`
      );
    }

    const generator = createGenerator(BASE_URL, {
      recordingsDir: new URL("./fixtures", import.meta.url).pathname,
      origin: ORIGIN,
      source: "case",
      name: "affiliate"
    });
    generator.setBearerToken(login.access_token);

    const selfResponse = await generator.get(
      "/api/self?with=actor,actor.account,actor.brand,actor.image," +
        "actor.parent_client_config.parent_client," +
        "actor.parent_client_config.parent_client.image,accounts," +
        "delegated_ids,enabled_modules&with_count=actor.child_client_configs&case=reenrol2-empty-destination"
    );
    const accountId = (
      selfResponse.body as { data?: { accounts?: { id?: string }[] } }
    ).data?.accounts?.[0]?.id;
    if (!accountId) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-3: the self read of the R-ENROL-2 client carries no account id. G3: escalate to the operator."
      );
    }

    const accountResponse = await generator.get(
      `/api/accounts/${accountId}/affiliate?with_staged_imports=1&with=account,account.brand,` +
        "account.clients,import.credentials,import.source,account.affiliate_payout_destination" +
        "&case=reenrol2-empty-destination"
    );
    const destinationId = (
      accountResponse.body as {
        data?: {
          account?: { affiliate_payout_destination_id?: string | null };
        };
      }
    ).data?.account?.affiliate_payout_destination_id;
    if (destinationId !== null) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-3: the R-ENROL-2 client's account no longer has an empty payout " +
          `destination (affiliate_payout_destination_id ${JSON.stringify(destinationId)}). Nothing was saved.`
      );
    }

    const clientId = (selfResponse.body as { data?: { actor_id?: string } })
      .data?.actor_id;
    if (!clientId) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-3: the self read of the R-ENROL-2 client carries no actor id. G3: escalate to the operator."
      );
    }
    await generator.get(
      `/api/clients/${clientId}/emails?limit=0&offset=0&order=-default,-id&with_staged_imports=1&case=reenrol2-empty-destination`
    );

    generator.save();

    expect(generator.getCapturedFixtures().size).toBe(3);
  }, 30000);

  // --- R-DATA-4 (review-notes.md, 2026-10-02) — READ-ONLY GETs only. The
  // operator disabled the affiliate account of staging client
  // `nathan.robinson+usYWgwGpcZ@upmind.com`. Records its self, account and
  // balance under one `case`. Password from the env var only. The account's
  // `disabled` flag is checked BEFORE `save()`, so a read that does not show
  // the disabled state never writes a capture.
  it("R-DATA-4: records the disabled client's self, account and balance (read-only GETs)", async () => {
    if (!BASE_URL) {
      throw new Error(
        "[affiliate.fixtures] VITE_API_URL is not set — packages/headless/.env.recording is required."
      );
    }
    const password = process.env.FE3227_DISABLED_PASSWORD;
    if (!password) {
      throw new Error(
        "[affiliate.fixtures] FE3227_DISABLED_PASSWORD is not set — R-DATA-4 supplies the disabled " +
          "client's password out-of-band; it is never hand-written into a committed file."
      );
    }
    const token = await passwordLogin(
      "nathan.robinson+usYWgwGpcZ@upmind.com",
      password,
      "R-DATA-4"
    );
    const rawSelf = await rawGet(token, "/api/self?with=accounts");
    const accountId = (rawSelf as { data?: { accounts?: { id?: string }[] } })
      .data?.accounts?.[0]?.id;
    if (!accountId) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-4: the self read of the disabled client carries no account id. G3: escalate to the operator."
      );
    }

    const generator = createGenerator(BASE_URL, {
      recordingsDir: new URL("./fixtures", import.meta.url).pathname,
      origin: ORIGIN,
      source: "case",
      name: "affiliate"
    });
    generator.setBearerToken(token);

    await generator.get(`${SELF_PATH}&case=disabled`);
    const accountResponse = await generator.get(
      `${ACCOUNT_PATH(accountId)}&case=disabled`
    );
    await generator.get(
      `/api/accounts/${accountId}/affiliate/balance?with_staged_imports=1&case=disabled`
    );

    const disabled = (accountResponse.body as { data?: { disabled?: unknown } })
      .data?.disabled;
    if (accountResponse.status !== 200 || disabled !== true) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-4: the account read does not show a disabled affiliate account " +
          `(status ${accountResponse.status}, disabled ${JSON.stringify(disabled)}). Nothing was saved.`
      );
    }

    generator.save();

    expect(generator.getCapturedFixtures().size).toBe(3);
  }, 30000);

  // --- R-DATA-6 (review-notes.md, 2026-10-02) — READ-ONLY GETs only. The
  // operator set PayPal as the brand's DEFAULT payout destination
  // (temporary). Records the R-ENROL-2 client's self, account (destination
  // empty), emails and the brand's destinations under one `case`. The default
  // flag and the empty destination are checked BEFORE `save()`, so a re-run
  // after the operator restores Wallet writes nothing.
  it("R-DATA-6: records the R-ENROL-2 client's self, account, emails and the brand destinations while the brand default is PayPal (read-only GETs)", async () => {
    if (!BASE_URL) {
      throw new Error(
        "[affiliate.fixtures] VITE_API_URL is not set — packages/headless/.env.recording is required."
      );
    }
    const password = process.env.FE3227_ENROL2_PASSWORD;
    if (!password) {
      throw new Error(
        "[affiliate.fixtures] FE3227_ENROL2_PASSWORD is not set — R-DATA-6 supplies the R-ENROL-2 " +
          "client's password out-of-band; it is never hand-written into a committed file."
      );
    }
    const token = await passwordLogin(
      "nathan.robinson+iBfSQzWefk@upmind.com",
      password,
      "R-DATA-6"
    );
    const rawSelf = (await rawGet(token, "/api/self?with=accounts")) as {
      data?: { actor_id?: string; accounts?: { id?: string }[] };
    };
    const accountId = rawSelf.data?.accounts?.[0]?.id;
    const clientId = rawSelf.data?.actor_id;
    if (!accountId || !clientId) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-6: the self read carries no account id or actor id. G3: escalate to the operator."
      );
    }
    const rawAccount = (await rawGet(
      token,
      `/api/accounts/${accountId}/affiliate?with=account`
    )) as { data?: { account?: { brand_id?: string } } };
    const brandId = rawAccount.data?.account?.brand_id;
    if (!brandId) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-6: the account read carries no brand id. G3: escalate to the operator."
      );
    }

    const generator = createGenerator(BASE_URL, {
      recordingsDir: new URL("./fixtures", import.meta.url).pathname,
      origin: ORIGIN,
      source: "case",
      name: "affiliate"
    });
    generator.setBearerToken(token);

    await generator.get(`${SELF_PATH}&case=paypal-default`);
    const accountResponse = await generator.get(
      `${ACCOUNT_PATH(accountId)}&case=paypal-default`
    );
    const emailsResponse = await generator.get(
      `/api/clients/${clientId}/emails?limit=0&offset=0&order=-default,-id&with_staged_imports=1&case=paypal-default`
    );
    const destinationsResponse = await generator.get(
      `/api/brands/${brandId}/affiliate_payout_destination?limit=10&offset=0&order=-created_at&case=paypal-default`
    );

    const defaultCode = (
      destinationsResponse.body as {
        data?: { code?: string; default?: boolean }[];
      }
    ).data?.find(destination => destination.default)?.code;
    const destinationId = (
      accountResponse.body as {
        data?: {
          account?: { affiliate_payout_destination_id?: string | null };
        };
      }
    ).data?.account?.affiliate_payout_destination_id;
    const defaultEmail = (
      emailsResponse.body as { data?: { default?: boolean }[] }
    ).data?.some(email => email.default);
    if (
      defaultCode !== "paypal" ||
      destinationId !== null ||
      defaultEmail !== true
    ) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-6: the state is not PayPal default + empty destination + a default email " +
          `(default destination ${JSON.stringify(defaultCode)}, account destination id ${JSON.stringify(destinationId)}, ` +
          `default email ${JSON.stringify(defaultEmail)}). Nothing was saved.`
      );
    }

    generator.save();

    expect(generator.getCapturedFixtures().size).toBe(4);
  }, 30000);

  // --- R-DATA-8 (review-notes.md, 2026-10-02) — adds ONE email to the
  // R-ENROL-2 client, records the add response and the refreshed list, then
  // DELETES that email in the same run. Guards, in order: (1) any recorded
  // add-email capture on disk makes this a hard no-op (a prefix match, never
  // a hand-built filename); (2) a live pre-flight read must show exactly one
  // email, else nothing is added; (3) the captures are saved BEFORE the
  // delete, which runs in `finally`; (4) the delete is verified by a live
  // read, and a leftover throws with its id. The delete and the two live
  // reads go through raw `fetch`, so only the add and the refreshed list are
  // recorded.
  it("R-DATA-8: adds one email to the R-ENROL-2 client, records the add and the refreshed list, then deletes it (one-time, guarded)", async () => {
    if (!BASE_URL) {
      throw new Error(
        "[affiliate.fixtures] VITE_API_URL is not set — packages/headless/.env.recording is required."
      );
    }
    const recordingsDir = new URL("./fixtures", import.meta.url).pathname;
    const alreadyRecorded = readdirSync(recordingsDir).some(file =>
      file.startsWith("post-clients-id-emails-case-add-email")
    );
    if (alreadyRecorded) {
      console.log(
        "[affiliate.fixtures] R-DATA-8 guard: an add-email capture already exists — hard no-op, 0 requests sent this run."
      );
      expect(alreadyRecorded).toBe(true);
      return;
    }

    const password = process.env.FE3227_ENROL2_PASSWORD;
    if (!password) {
      throw new Error(
        "[affiliate.fixtures] FE3227_ENROL2_PASSWORD is not set — R-DATA-8 supplies the R-ENROL-2 " +
          "client's password out-of-band; it is never hand-written into a committed file."
      );
    }
    const token = await passwordLogin(
      "nathan.robinson+iBfSQzWefk@upmind.com",
      password,
      "R-DATA-8"
    );
    const clientId = (
      (await rawGet(token, "/api/self?with=accounts")) as {
        data?: { actor_id?: string };
      }
    ).data?.actor_id;
    if (!clientId) {
      throw new Error(
        "[affiliate.fixtures] R-DATA-8: the self read carries no actor id. G3: escalate to the operator."
      );
    }
    const emailsPath = `/api/clients/${clientId}/emails?limit=0&offset=0&order=-default,-id&with_staged_imports=1`;
    const listIds = async (): Promise<string[]> =>
      (
        (await rawGet(token, emailsPath)) as { data?: { id: string }[] }
      ).data?.map(email => email.id) ?? [];

    const before = await listIds();
    if (before.length !== 1) {
      throw new Error(
        `[affiliate.fixtures] R-DATA-8 pre-flight: the client holds ${before.length} emails, expected exactly 1. ` +
          "Nothing was added. A leftover email from an earlier run needs the operator."
      );
    }

    const generator = createGenerator(BASE_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "affiliate"
    });
    generator.setBearerToken(token);

    const addResponse = await generator.post(
      `/api/clients/${clientId}/emails?case=add-email`,
      { email: "nathan.robinson+fe3227-r-data-8@upmind.com" }
    );
    if (addResponse.status !== 200) {
      throw new Error(
        `[affiliate.fixtures] R-DATA-8: the add returned status ${addResponse.status}. Nothing was saved.`
      );
    }

    let addedId: string | undefined;
    let captureError: unknown;
    try {
      addedId = (await listIds()).find(id => !before.includes(id));
      await generator.get(`${emailsPath}&case=after-add`);
      generator.save();
    } catch (error) {
      captureError = error;
    }
    if (!addedId) {
      throw (
        captureError ??
        new Error(
          "[affiliate.fixtures] R-DATA-8: the add succeeded but the new email id was not found in the live list. The operator must check the client's emails."
        )
      );
    }

    const deleteResponse = await fetch(
      `${BASE_URL}/api/clients/${clientId}/emails/${addedId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(ORIGIN ? { Origin: ORIGIN } : {})
        }
      }
    );
    const after = await listIds();
    console.log(
      `[affiliate.fixtures] R-DATA-8 delete status ${deleteResponse.status}; emails after delete: ${after.length}.`
    );
    if (after.length !== 1) {
      throw new Error(
        `[affiliate.fixtures] R-DATA-8: the added email ${addedId} is still on the client after the delete ` +
          `(delete status ${deleteResponse.status}, ${after.length} emails). The operator must remove it.`
      );
    }
    if (captureError) throw captureError;
    expect(generator.getCapturedFixtures().size).toBe(2);
  }, 30000);

  // --- FE-3145 strict-replay follow-up (develop merge 29eb45f69b). The shared
  // replay (ADR-035) no longer falls back to a base list capture for an
  // unmatched query string — each filtered list request the four
  // `*-criteria.int.test.ts` specs assert now needs its OWN verbatim
  // recording, matched by identity (tests/fixtures/fixture-handlers.ts). These
  // are READ-ONLY GETs of the `client` credential's enrolled single account —
  // the EXACT filter query string each criteria spec's row-asserting case
  // sends, no more. No write, enrol or withdraw. Each response status is
  // checked BEFORE `save()`, so a non-200 never overwrites or adds a capture.
  it("captures the exact filter query strings the criteria specs send (read-only GETs)", async () => {
    if (!BASE_URL) {
      throw new Error(
        "[affiliate.fixtures] VITE_API_URL is not set — packages/headless/.env.recording is required."
      );
    }

    const token = await passwordLogin(
      API_CREDENTIALS.client.username,
      API_CREDENTIALS.client.password,
      "criteria-filters"
    );
    const rawSelf = (await rawGet(token, "/api/self?with=accounts")) as {
      data?: { accounts?: { id?: string }[] };
    };
    const accountId = rawSelf.data?.accounts?.[0]?.id;
    if (!accountId) {
      throw new Error(
        "[affiliate.fixtures] criteria-filters: the self read carries no account id. G3: escalate to the operator."
      );
    }

    const generator = createGenerator(BASE_URL, {
      recordingsDir: new URL("./fixtures", import.meta.url).pathname,
      origin: ORIGIN,
      source: "case",
      name: "affiliate"
    });
    generator.setBearerToken(token);

    const base = `/api/accounts/${accountId}/affiliate`;
    const commissions = await generator.get(
      `${base}/pending_commissions?with_staged_imports=1&with=invoice,invoice.client&filter[created_at|after]=-1_months`
    );
    const links = await generator.get(
      `${base}/links?with_staged_imports=1&filter[name|eq]=Affiliate Starter Hosting`
    );
    const payouts = await generator.get(
      `${base}/payouts?with_staged_imports=1&with=affiliate_payout_destination,payment_log&filter[created_at|before]=1_days`
    );
    const referrals = await generator.get(
      `${base}/referrals?with=affiliate_account,affiliate_link,client,client.image&filter[affiliate_link.name|eq]=Affiliate Starter Hosting`
    );

    for (const [label, response] of [
      ["commissions created_at|after", commissions],
      ["links name|eq", links],
      ["payouts created_at|before", payouts],
      ["referrals affiliate_link.name|eq", referrals]
    ] as const) {
      if (response.status !== 200) {
        throw new Error(
          `[affiliate.fixtures] criteria-filters: the ${label} filter read returned ${response.status}. ` +
            "Nothing was saved. G3: escalate to the operator, do not hand-author a filtered capture."
        );
      }
    }

    generator.save();

    expect(generator.getCapturedFixtures().size).toBe(4);
  }, 30000);

  // --- R-ENROL (review-notes.md, 2026-09-30) — SPENT, permanently disabled.
  // `otherClient` (tests/fixtures/credentials.ts) was enrolled in the
  // affiliate programme on 2026-10-01 under this ruling's one-time grant.
  //
  // ## Incident, disclosed — the not-enrolled-404 and enrol-success-200
  // captures were LOST, not merely unattempted. This block's original
  // one-time guard checked the WRONG filename (missing the
  // `-with-staged-imports-1` suffix the generator always appends), so it
  // never matched, and a second, accidental run re-fired the whole sequence
  // against the now-already-enrolled account. That overwrote the
  // not-enrolled-404 capture with a 200 (now-enrolled) body, and the
  // enrol-POST capture with a real 409 ("Affiliate account already exists").
  // Both corrupted files were deleted outright, never hand-repaired — a
  // fabricated 404 or 200 would be worse than the honest gap. Neither
  // capture can ever be re-taken from `otherClient` (now permanently
  // enrolled), and R-ENROL bars enrolling any other client to retry. AC4's
  // happy-path scenario and the not-enrolled-404 half of AC5's table stay a
  // named, real capture gap (CONTROLS.md, this module's hand-off).
  //
  // What DID survive intact: `get-self-case-otherclient.json` and
  // `get-accounts-id-affiliate-case-enrolled-otherclient-with-staged-imports-1.json`
  // — a second, genuinely real enrolled-account read, redundant with the
  // `client` credential's own enrolled capture but not dishonest.
  //
  // This `it()` body is now a permanent, hard no-op — it must never send
  // another request against `otherClient`, so no future run (accidental or
  // otherwise) can compound the mistake above.
  it("R-ENROL is spent — otherClient is permanently enrolled, no further capture is attempted", () => {
    console.log(
      "[affiliate.fixtures] R-ENROL: otherClient was enrolled 2026-10-01 under review-notes.md's " +
        "one-time grant. The not-enrolled-404 and enrol-success-200 captures were lost to a guard " +
        "bug on an accidental second run and are unrecoverable — see this block's own comment. " +
        "No further request is sent against otherClient; no other client may be enrolled."
    );
    expect(true).toBe(true);
  });

  // --- design.md §8.9 "Owed recordings" plans "base: a guest visit of a
  // recorded link hash that sets referral_cookie" (AC24) — needs a single
  // real account and its one real link, not a second account. A guest visit
  // of the real link hash `f55dc9bd547b9c9dc54ab91ce979ceee69ebb677`
  // increments that link's real `visit_count` on staging — the operator
  // brief accepts this. A SEPARATE `it()` with its OWN `Generator` instance,
  // so `.save()` writes only this one new fixture file and never touches (or
  // re-triggers) any capture of the main test above — in particular, the
  // frozen links-list `visit_count` literal stays frozen.
  it("captures the base guest visit of the real recorded link hash", async () => {
    if (!BASE_URL) {
      throw new Error(
        "[affiliate.fixtures] VITE_API_URL is not set — packages/headless/.env.recording is required."
      );
    }

    const recordingsDir = new URL("./fixtures", import.meta.url).pathname;

    // The brand domain is read from THIS unit's own, already-recorded
    // account capture (never re-derived, never guessed) — the same real
    // domain the throwaway-link redirect_url above is built from.
    const accountFixture = JSON.parse(
      readFileSync(
        `${recordingsDir}/get-accounts-id-affiliate-with-staged-imports-1.json`,
        "utf-8"
      )
    ) as {
      response: {
        body: { data?: { account?: { brand?: { domain?: string } } } };
      };
    };
    const brandDomain =
      accountFixture.response.body.data?.account?.brand?.domain;
    if (!brandDomain) {
      throw new Error(
        "[affiliate.fixtures] The recorded account capture carries no account.brand.domain — cannot build a real /aff/ visit URL. G3: escalate to the operator."
      );
    }

    const generator = createGenerator(BASE_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "affiliate"
    });

    const REAL_LINK_HASH = "f55dc9bd547b9c9dc54ab91ce979ceee69ebb677";
    await generator.post("/api/affiliate_link/visit", {
      visit_url: `http://${brandDomain}/aff/${REAL_LINK_HASH}`,
      referrer_url: "",
      user_agent: "Mozilla/5.0 (FE-3227 fixture generator)"
    });

    generator.save();

    expect(generator.getCapturedFixtures().size).toBe(1);
  }, 30000);

  // --- pseudo-Nathan review pass 9, blocker 3: NO-EMPTY-COOKIE-CAPTURE named
  // no request this pass's own tools controlled could force an
  // absent/empty `referral_cookie`. A guest visit of a link hash that
  // belongs to no real link is exactly such a request — read-only, no
  // credential, no staff write, no admin path. A SEPARATE `it()` with its
  // OWN `Generator` instance, so `.save()` writes only this one new fixture
  // file and never touches the base visit capture above.
  it("captures a guest visit of an unknown link hash — the delete-path trigger state", async () => {
    if (!BASE_URL) {
      throw new Error(
        "[affiliate.fixtures] VITE_API_URL is not set — packages/headless/.env.recording is required."
      );
    }

    const recordingsDir = new URL("./fixtures", import.meta.url).pathname;

    const accountFixture = JSON.parse(
      readFileSync(
        `${recordingsDir}/get-accounts-id-affiliate-with-staged-imports-1.json`,
        "utf-8"
      )
    ) as {
      response: {
        body: { data?: { account?: { brand?: { domain?: string } } } };
      };
    };
    const brandDomain =
      accountFixture.response.body.data?.account?.brand?.domain;
    if (!brandDomain) {
      throw new Error(
        "[affiliate.fixtures] The recorded account capture carries no account.brand.domain — cannot build a real /aff/ visit URL. G3: escalate to the operator."
      );
    }

    const generator = createGenerator(BASE_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "affiliate"
    });

    const UNKNOWN_LINK_HASH = "0000000000000000000000000000000000000000";
    await generator.post("/api/affiliate_link/visit?case=unknown-hash", {
      visit_url: `http://${brandDomain}/aff/${UNKNOWN_LINK_HASH}`,
      referrer_url: "",
      user_agent: "Mozilla/5.0 (FE-3227 fixture generator, empty-cookie probe)"
    });

    generator.save();

    expect(generator.getCapturedFixtures().size).toBe(1);
  }, 30000);
});

// Vitest requires at least one test per file even when FIXTURE_MODE isn't
// "record" — this file is selected only by vitest.fixtures.config.ts's
// `include`, which only runs under `pnpm fixtures:generate affiliate`.
describe.runIf(!RUN)("affiliate fixtures (not in record mode)", () => {
  it.skip("only runs under FIXTURE_MODE=record via pnpm fixtures:generate affiliate", () => {});
});
