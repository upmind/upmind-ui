// -----------------------------------------------------------------------------
/**
 * @fileoverview Delegates Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Drive the REAL client-portal delegate-access grant end to end against staging
 * and record every response it produces into this module's OWN co-located
 * `fixtures/` dir: the owner invites, the invitation lands in the INVITEE's own
 * email history, the invitee accepts with the hash parsed out of that email, and
 * the invitee's `/self` comes back carrying a POPULATED `delegated_ids`. Run on
 * demand:
 *
 *   pnpm fixtures:generate delegates
 *
 * ## Why the whole cycle, not a snapshot
 * FE-3036 needs a recorded `/self` whose `delegated_ids` is populated — no
 * fixture in this repo had one. That map exists only as the RESULT of an
 * accepted grant, so the only honest way to record it is to perform the grant.
 * This run therefore revokes the pair's standing grant, re-runs it, and captures
 * the invitee's `/self` on BOTH sides of the accept: same account, before and
 * after, so the populated map is demonstrably caused by the accept.
 *
 * ## No admin path
 * Every call below is a client-portal call made with a CLIENT bearer. The
 * admin-only `skip_invite` / `delegate_client_id` direct-attach path is
 * deliberately not exercised: the accept hash is not exposed on the delegate
 * record at client scope, so the invitation email is the only client-scope route
 * to it, and that hop is reproduced here rather than short-circuited.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL`, needs staging credentials,
 * and MUTATES staging state — so it is EXCLUDED from the `*.test.ts` /
 * `*.int.test.ts` suites by the `*.fixtures.ts` suffix (see the package vitest
 * configs). `save()` in `afterAll` writes every capture once.
 *
 * ## Recorded secrets
 * The captured invitation email body carries a real accept link. That hash is
 * SPENT by this run's own accept, so what lands on disk grants nothing. A
 * re-record mints a new hash into a new filename, so `afterAll` prunes the
 * superseded accept capture rather than letting dead hashes accumulate.
 *
 * ## Disclosed capture limitation
 * Today's grant is account-level, so the recorded `delegated_ids` carries the
 * `client` key ALONE. The `contracts_product` and `ticket` keys need per-product
 * / per-ticket grants, which ride FE-3041 (DG-2). They are NOT captured here and
 * no stand-in is invented for them.
 */

import { readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { ForcedErrorCode } from "@upmind-automation/test-fixtures/types";
import { GrantTypes } from "@upmind-automation/types";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintToken } from "../../auth/__tests__/auth.tokens";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (e.g. set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set it " +
          "in .env.recording). The API resolves the tenant from the Origin " +
          'header; without it every call returns 401 "Unrecognised domain name".'
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

/** Mirrors session-store's client identity query so the recorded `/self` envelope matches what the real service receives. */
const SELF_QUERY =
  "with_count=actor.child_client_configs&with=" +
  [
    "actor",
    "actor.account",
    "actor.brand",
    "actor.image",
    "actor.parent_client_config.parent_client",
    "actor.parent_client_config.parent_client.image",
    "accounts",
    "delegated_ids",
    "enabled_modules"
  ].join();

const INVITATION_SUBJECT = "New Customer Access Invitation";

const ACCEPT_LINK = /delegate_access\/accept\/([A-Za-z0-9]+)/;

/** A hash shaped like a real one that was never issued — the unknown-invite 404. */
const UNISSUED_HASH = "notarealinvitehash";

const ACCEPT_CAPTURE_PREFIX = "patch-delegate-access-accept-";

// -----------------------------------------------------------------------------

type Envelope<T> = { data: T; total: number | null };

type WireDelegate = {
  id: string;
  owner_client_id: string;
  invite_email: string;
  active: boolean;
};

type WireEmailRow = { id: string; subject: string };

/** A control call OUTSIDE the capture pipeline — it moves staging state, it is never recorded. */
async function control(
  method: string,
  path: string,
  token?: string
): Promise<unknown> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return response.json().catch(() => null);
}

async function mintClient(
  credentials: { username: string; password: string },
  label: string
): Promise<IToken> {
  const token = await mintToken({
    grant_type: GrantTypes.PASSWORD,
    username: credentials.username,
    password: credentials.password
  });
  if (!token) {
    throw new Error(
      `Could not mint the ${label} token — check tests/fixtures/credentials.ts ` +
        "against the recording brand."
    );
  }
  return token;
}

async function readEmailHistory(memberToken: string): Promise<WireEmailRow[]> {
  const body = (await control(
    "GET",
    "/api/self/email_history?order=-created_at&limit=25",
    memberToken
  )) as Envelope<WireEmailRow[]>;
  return body?.data ?? [];
}

/** Polls the invitee's own history until the invitation THIS run triggered arrives. */
async function waitForInvitationEmail(
  memberToken: string,
  known: Set<string>
): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const fresh = (await readEmailHistory(memberToken)).find(
      row => !known.has(row.id) && row.subject === INVITATION_SUBJECT
    );
    if (fresh) return fresh.id;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error(
    `No "${INVITATION_SUBJECT}" reached the invitee's email history within 60s ` +
      "of the invite. The accept hash has no other client-scope route, so the " +
      "capture stops here — do not substitute one."
  );
}

/**
 * Drops accept captures from earlier runs. The hash is part of the path, so it
 * is part of the filename, and a fresh invite mints a new one — without this
 * every re-record leaves a dead handler behind.
 */
function pruneSupersededAcceptCaptures(keep: Set<string>): void {
  for (const entry of readdirSync(recordingsDir)) {
    if (!entry.startsWith(ACCEPT_CAPTURE_PREFIX)) continue;
    if (keep.has(entry)) continue;
    unlinkSync(join(recordingsDir, entry));
  }
}

// -----------------------------------------------------------------------------

describe("Delegates API Fixtures Generator", () => {
  let generator: Generator;
  let ownerToken: IToken;
  let memberToken: IToken;
  let ownerId: string;
  let memberId: string;
  let knownEmailIds: Set<string>;
  let invitationEmailId: string;
  let acceptHash: string;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "delegates"
    });

    ownerToken = await mintClient(
      API_CREDENTIALS.delegateOwner,
      "delegate owner"
    );
    memberToken = await mintClient(
      API_CREDENTIALS.delegateMember,
      "delegate member"
    );
    ownerId = ownerToken.actor_id as string;
    memberId = memberToken.actor_id as string;

    // The grant already stands on staging. Revoke it so this run performs a REAL
    // invite → accept cycle rather than re-reading an outcome it did not cause;
    // the accept capture below restores it.
    const existing = (await control(
      "GET",
      `/api/clients/${ownerId}/delegates`,
      ownerToken.access_token
    )) as Envelope<WireDelegate[]>;
    for (const row of existing?.data ?? []) {
      if (row.invite_email !== API_CREDENTIALS.delegateMember.username)
        continue;
      await control(
        "DELETE",
        `/api/clients/${ownerId}/delegates/${row.id}`,
        ownerToken.access_token
      );
    }

    knownEmailIds = new Set(
      (await readEmailHistory(memberToken.access_token)).map(row => row.id)
    );
  }, 60000);

  afterAll(() => {
    const accepts = new Set(
      [...generator.getCapturedFixtures().values()]
        .map(entry => entry.filename)
        .filter(name => name.startsWith(ACCEPT_CAPTURE_PREFIX))
    );
    generator.save();
    pruneSupersededAcceptCaptures(accepts);
  });

  it("captures POST /oauth/access_token for the delegate owner (200, client)", async () => {
    const { status } = await generator.post(
      "/oauth/access_token?case=delegate-owner",
      {
        grant_type: GrantTypes.PASSWORD,
        username: API_CREDENTIALS.delegateOwner.username,
        password: API_CREDENTIALS.delegateOwner.password
      },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    expect(status).toBe(200);
  });

  it("captures POST /oauth/access_token for the delegate member (200, client)", async () => {
    const { status } = await generator.post(
      "/oauth/access_token?case=delegate-member",
      {
        grant_type: GrantTypes.PASSWORD,
        username: API_CREDENTIALS.delegateMember.username,
        password: API_CREDENTIALS.delegateMember.password
      },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
    expect(status).toBe(200);
  });

  it("captures GET /api/self for the invitee BEFORE any grant (200, no delegated_ids)", async () => {
    generator.setBearerToken(memberToken.access_token);
    const { status } = await generator.get(
      `/api/self?case=not-delegated&${SELF_QUERY}`
    );
    generator.clearBearerToken();
    expect(status).toBe(200);
  });

  it("captures GET clients/{clientId}/delegates for an account granting none (200, empty)", async () => {
    generator.setBearerToken(memberToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${memberId}/delegates?case=no-delegates`
    );
    generator.clearBearerToken();
    expect(status).toBe(200);
  });

  it("captures POST clients/{clientId}/delegates — the owner invites (200, pending)", async () => {
    generator.setBearerToken(ownerToken.access_token);
    const { status, body } = await generator.post(
      `/api/clients/${ownerId}/delegates`,
      {
        delegate_email: API_CREDENTIALS.delegateMember.username,
        full_delegate: true
      }
    );
    generator.clearBearerToken();
    expect(status).toBe(200);
    expect((body as Envelope<WireDelegate>).data.active).toBe(false);
  });

  it("captures GET clients/{clientId}/delegates while the invite is pending (200)", async () => {
    generator.setBearerToken(ownerToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${ownerId}/delegates?case=pending`
    );
    generator.clearBearerToken();
    expect(status).toBe(200);
  });

  it("captures GET self/email_history — the invitation reaches the INVITEE (200)", async () => {
    invitationEmailId = await waitForInvitationEmail(
      memberToken.access_token,
      knownEmailIds
    );

    generator.setBearerToken(memberToken.access_token);
    const { status } = await generator.get(
      "/api/self/email_history?case=delegate-invitation&order=-created_at&limit=25"
    );
    generator.clearBearerToken();
    expect(status).toBe(200);
  }, 90000);

  it("captures GET emails/{id}?with=data — the accept hash lives in the email body (200)", async () => {
    generator.setBearerToken(memberToken.access_token);
    const { status, body } = await generator.get(
      `/api/emails/${invitationEmailId}?with=data`
    );
    generator.clearBearerToken();
    expect(status).toBe(200);

    const emailBody =
      (body as Envelope<{ data?: { body?: string } }>).data?.data?.body ?? "";
    const match = ACCEPT_LINK.exec(emailBody);
    if (!match) {
      throw new Error(
        "The invitation email carries no /delegate_access/accept/{hash} link. " +
          "That link is the ONLY client-scope route to the hash, so the capture " +
          "stops here rather than reaching for the admin attach path."
      );
    }
    acceptHash = match[1];
  });

  it("captures PATCH delegate_access/accept/{hash} — the invitee accepts (200, active)", async () => {
    generator.setBearerToken(memberToken.access_token);
    const { status, body } = await generator.patch(
      `/api/delegate_access/accept/${acceptHash}`
    );
    generator.clearBearerToken();
    expect(status).toBe(200);
    expect((body as Envelope<WireDelegate>).data.active).toBe(true);
  });

  it("captures GET clients/{clientId}/delegates once accepted (200, active)", async () => {
    generator.setBearerToken(ownerToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${ownerId}/delegates?case=accepted`
    );
    generator.clearBearerToken();
    expect(status).toBe(200);
  });

  it("captures GET /api/self for the invitee AFTER the grant (200, POPULATED delegated_ids)", async () => {
    generator.setBearerToken(memberToken.access_token);
    const { status, body } = await generator.get(
      `/api/self?case=delegated&${SELF_QUERY}`
    );
    generator.clearBearerToken();
    expect(status).toBe(200);

    const delegatedIds = (
      body as Envelope<{ delegated_ids?: Record<string, string[]> }>
    ).data?.delegated_ids;
    expect(delegatedIds?.client).toContain(ownerId);
  });

  it("captures GET /api/self for the granting owner (200, holds no delegated access itself)", async () => {
    generator.setBearerToken(ownerToken.access_token);
    const { status } = await generator.get(
      `/api/self?case=grantor&${SELF_QUERY}`
    );
    generator.clearBearerToken();
    expect(status).toBe(200);
  });

  it("captures POST clients/{clientId}/delegates for an existing delegate (409)", async () => {
    generator.setBearerToken(ownerToken.access_token);
    const { status } = await generator.post(
      `/api/clients/${ownerId}/delegates?case=already-a-delegate`,
      {
        delegate_email: API_CREDENTIALS.delegateMember.username,
        full_delegate: true
      }
    );
    generator.clearBearerToken();
    expect(status).toBe(409);
  });

  it("captures GET clients/{clientId}/delegates for another client's account (403)", async () => {
    generator.setBearerToken(memberToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${ownerId}/delegates?case=not-the-owner`
    );
    generator.clearBearerToken();
    expect(status).toBe(403);
  });

  it("captures GET clients/{clientId}/delegates with a rejected bearer (401)", async () => {
    generator.setBearerToken("fixturegen-invalid-token");
    const { status } = await generator.get(
      `/api/clients/${ownerId}/delegates?case=rejected-bearer`
    );
    generator.clearBearerToken();
    expect(status).toBe(401);
  });

  it("captures PATCH delegate_access/accept/{hash} for a hash never issued (404)", async () => {
    generator.setBearerToken(memberToken.access_token);
    const { status } = await generator.patch(
      `/api/delegate_access/accept/${UNISSUED_HASH}`
    );
    generator.clearBearerToken();
    expect(status).toBe(404);
  });

  // The brand never served a 5xx on any of the three endpoints while this run
  // drove them, so the unavailable-service coverage uses the generator's forced
  // control response over a REAL request rather than an invented body. Each
  // forced call below is chosen so the real request it still issues changes
  // nothing: the reads are reads, the invite is the refused duplicate, and the
  // acceptance names a route that was never issued.
  it("captures GET clients/{clientId}/delegates when the service is unavailable (503)", async () => {
    generator.setBearerToken(ownerToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${ownerId}/delegates?case=service-unavailable`,
      undefined,
      ForcedErrorCode.Service_Unavailable
    );
    generator.clearBearerToken();
    expect(status).toBe(503);
  });

  it("captures POST clients/{clientId}/delegates when the service is unavailable (503)", async () => {
    generator.setBearerToken(ownerToken.access_token);
    const { status } = await generator.post(
      `/api/clients/${ownerId}/delegates?case=service-unavailable`,
      {
        delegate_email: API_CREDENTIALS.delegateMember.username,
        full_delegate: true
      },
      undefined,
      ForcedErrorCode.Service_Unavailable
    );
    generator.clearBearerToken();
    expect(status).toBe(503);
  });

  it("captures PATCH delegate_access/accept/{hash} when the service is unavailable (503)", async () => {
    generator.setBearerToken(memberToken.access_token);
    const { status } = await generator.patch(
      `/api/delegate_access/accept/${UNISSUED_HASH}?case=service-unavailable`,
      undefined,
      undefined,
      ForcedErrorCode.Service_Unavailable
    );
    generator.clearBearerToken();
    expect(status).toBe(503);
  });
});
