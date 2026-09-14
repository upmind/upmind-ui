// -----------------------------------------------------------------------------
/**
 * @module delegates/__tests__/delegates.int-helpers
 * @description Shared integration scaffolding for the delegates module's
 * `*.int.test.ts` files: seed a real authenticated client session as either
 * side of the recorded grant, expose the RECORDED wire bodies every handler
 * serves, and capture outbound requests so the A7 read-backs assert on the real
 * wire. Mirrors `client-email-history/__tests__/client-email-history.int-helpers.ts`,
 * the sibling module's equivalent (public test infrastructure, not this
 * module's implementation source).
 *
 * Every response body served here comes from a capture made by
 * `pnpm fixtures:generate delegates` against real staging, driving the real
 * client-portal grant end to end. No test in this module builds a wire body of
 * its own.
 *
 * ## What the A7 read-back can and cannot turn on here
 * The generator sanitises every recorded token, so the owner's and the invitee's
 * bearers both land on disk as the same masked literal. The identity read-back
 * therefore asserts the half that carries this module's risk: the **request URL
 * retarget** — that the account acted on is the one NAMED, never the session's
 * own (the FE-2824 failure shape) — plus that the seeded session's bearer is
 * attached and no acting-as header is smuggled alongside it.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  mapSessionUser,
  useActiveSession,
  useSessionStore
} from "../../session-store";
import { recordingsDir, server } from "./setup.integration";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/** The Upmind response envelope, as the recorded fixtures carry it. */
export type Envelope<T> = {
  status: string;
  data: T;
  total: number | null;
  error: { code: number; message: string } | null;
};

/** One delegate row exactly as the recorded wire carries it. */
export type WireDelegate = {
  id: string;
  owner_client_id: string;
  invite_email: string;
  is_full_delegate: boolean;
  active: boolean;
  public_name: string | null;
  image_url: string | null;
  num_delegated_cps: number;
  num_delegated_tickets: number;
};

/** One identity envelope as the recorded `/self` carries it. */
export type WireSelf = {
  actor: { id: string };
  delegated_ids: Record<string, string[]> | null;
};

/** One email row as the recorded correspondence carries it. */
export type WireEmail = {
  id: string;
  subject: string;
  data?: { body?: string };
};

/**
 * The recorded bodies, by capture — every file `delegates.fixtures.ts` wrote
 * while performing the real grant. The accept capture's filename carries the
 * hash that run was issued, so it is resolved through the route the recorded
 * invitation offers rather than pinned to a literal.
 */
export const recorded = {
  /** The owner's delegate list once the invitee has accepted. */
  acceptedList: () =>
    getFixtureBody<Envelope<WireDelegate[]>>(
      "get-clients-id-delegates-case-accepted",
      { recordingsDir }
    ),
  /** The owner's delegate list while the invitation is still outstanding. */
  pendingList: () =>
    getFixtureBody<Envelope<WireDelegate[]>>(
      "get-clients-id-delegates-case-pending",
      { recordingsDir }
    ),
  /** A client account that has granted access to nobody — a real `total: 0`. */
  emptyList: () =>
    getFixtureBody<Envelope<WireDelegate[]>>(
      "get-clients-id-delegates-case-no-delegates",
      { recordingsDir }
    ),
  /** The row the owner's invitation created, before anyone accepted it. */
  invited: () =>
    getFixtureBody<Envelope<WireDelegate>>("post-clients-id-delegates", {
      recordingsDir
    }),
  /** The row the invitee's acceptance returned, resolved by the route its own invitation offered. */
  accepted: () =>
    getFixtureBody<Envelope<WireDelegate>>(
      `patch-delegate-access-accept-${acceptRouteFromInvitation()}`,
      { recordingsDir }
    ),
  /** The invitee's own correspondence, carrying the invitation this grant sent. */
  correspondence: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-self-email-history-case-delegate-invitation",
      { recordingsDir }
    ),
  /** The invitation itself, body included — the only client-scope route to the acceptance link. */
  invitation: () =>
    getFixtureBody<Envelope<WireEmail>>("get-emails-id", { recordingsDir }),
  /** The invitee's identity AFTER accepting — the populated delegated access. */
  delegatedSelf: () =>
    getFixtureBody<Envelope<WireSelf>>("get-self-case-delegated", {
      recordingsDir
    }),
  /** The SAME invitee's identity BEFORE accepting anything. */
  undelegatedSelf: () =>
    getFixtureBody<Envelope<WireSelf>>("get-self-case-not-delegated", {
      recordingsDir
    }),
  /** The granting owner's own identity — it holds no delegated access itself. */
  grantorSelf: () =>
    getFixtureBody<Envelope<WireSelf>>("get-self-case-grantor", {
      recordingsDir
    }),
  /** A client reading an account it does not own. */
  notTheOwner: () =>
    getFixture("get-clients-id-delegates-case-not-the-owner", {
      recordingsDir
    }).response,
  /** A bearer the brand refuses. */
  rejectedBearer: () =>
    getFixture("get-clients-id-delegates-case-rejected-bearer", {
      recordingsDir
    }).response,
  /** Inviting a party who already holds access. */
  alreadyADelegate: () =>
    getFixture("post-clients-id-delegates-case-already-a-delegate", {
      recordingsDir
    }).response,
  /** Accepting by a route that was never issued. */
  unissuedRoute: () =>
    getFixture("patch-delegate-access-accept-notarealinvitehash", {
      recordingsDir
    }).response,
  /** Reading delegates while the service is unavailable. */
  readUnavailable: () =>
    getFixture("get-clients-id-delegates-case-service-unavailable", {
      recordingsDir
    }).response,
  /** Inviting while the service is unavailable. */
  inviteUnavailable: () =>
    getFixture("post-clients-id-delegates-case-service-unavailable", {
      recordingsDir
    }).response,
  /** Accepting while the service is unavailable. */
  acceptUnavailable: () =>
    getFixture(
      "patch-delegate-access-accept-notarealinvitehash-case-service-unavailable",
      { recordingsDir }
    ).response
};

/** The accept route an invitation body offers, as the recorded email carries it. */
export const ACCEPT_ROUTE = /delegate_access\/accept\/([A-Za-z0-9]+)/;

/**
 * The acceptance route the recorded invitation actually offered the invitee —
 * read out of the email body, the only client-scope place it appears.
 *
 * @throws If the recorded invitation carries no acceptance route.
 */
export function acceptRouteFromInvitation(): string {
  const body =
    getFixtureBody<Envelope<WireEmail>>("get-emails-id", { recordingsDir }).data
      .data?.body ?? "";
  const match = ACCEPT_ROUTE.exec(body);
  if (!match) {
    throw new Error(
      "The recorded invitation carries no acceptance route. Re-record with " +
        "`pnpm fixtures:generate delegates`."
    );
  }
  return match[1];
}

// -----------------------------------------------------------------------------

type Served = { body: unknown; status: number };

/**
 * Serves this module's three endpoints from the RECORDED bodies above. Each is
 * repointable per test (`serveList` / `serveInvite` / `serveAccept`) so a test
 * can select a different real capture without hand-building a response.
 */
export function installDelegateHandlers(): {
  serveList: (served: Served) => void;
  serveInvite: (served: Served) => void;
  serveAccept: (served: Served) => void;
  sentInvitation: () => Record<string, unknown> | undefined;
} {
  let list: Served = { body: recorded.acceptedList(), status: 200 };
  let invite: Served = { body: recorded.invited(), status: 200 };
  let accept: Served = { body: recorded.accepted(), status: 200 };
  let sent: Record<string, unknown> | undefined;

  server?.use(
    http.get("*/clients/:clientId/delegates", () =>
      HttpResponse.json(list.body as object, { status: list.status })
    ),
    http.post("*/clients/:clientId/delegates", async ({ request }) => {
      sent = (await request.json().catch(() => undefined)) as
        | Record<string, unknown>
        | undefined;
      return HttpResponse.json(invite.body as object, {
        status: invite.status
      });
    }),
    http.patch("*/delegate_access/accept/:hash", () =>
      HttpResponse.json(accept.body as object, { status: accept.status })
    )
  );

  return {
    serveList: (served: Served) => {
      list = served;
    },
    serveInvite: (served: Served) => {
      invite = served;
    },
    serveAccept: (served: Served) => {
      accept = served;
    },
    sentInvitation: () => sent
  };
}

/**
 * Bootstrap calls unrelated to any AC (brand/org config) fire as a side effect
 * of `initStore()`; stub them harmlessly so they never surface as noise.
 * Re-applied on every seed — the replay server resets handlers between tests.
 */
export function installBackgroundStubs(): void {
  server?.use(
    http.get("*/org/modules", () =>
      HttpResponse.json({ status: "ok", data: [] })
    ),
    http.get("*/config/brand/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/config/organisation/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/brand/settings", () =>
      HttpResponse.json({ status: "ok", data: {} })
    )
  );
}

// -----------------------------------------------------------------------------

/** session-store's OWN guest capture — boot material only, never asserted on here. */
const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

function installGuestTokenStub(): void {
  const guestBody = getFixtureBody("post-oauth-access-token-guest", {
    recordingsDir: sessionStoreRecordingsDir
  });
  server?.use(
    http.post("*/oauth/access_token", () => HttpResponse.json(guestBody))
  );
}

/** Which side of the recorded grant a test signs in as. */
export type SeededActor = "owner" | "invitee" | "delegated-invitee";

const SEEDS: Record<
  SeededActor,
  { token: () => IToken; self: () => Envelope<WireSelf> }
> = {
  owner: {
    token: () =>
      getFixtureBody<IToken>("post-oauth-access-token-case-delegate-owner", {
        recordingsDir
      }),
    self: recorded.grantorSelf
  },
  invitee: {
    token: () =>
      getFixtureBody<IToken>("post-oauth-access-token-case-delegate-member", {
        recordingsDir
      }),
    self: recorded.undelegatedSelf
  },
  "delegated-invitee": {
    token: () =>
      getFixtureBody<IToken>("post-oauth-access-token-case-delegate-member", {
        recordingsDir
      }),
    self: recorded.delegatedSelf
  }
};

/** Seeds a real authenticated client session for one side of the recorded grant. */
export async function seedSession(actor: SeededActor): Promise<{
  clientId: string;
  accessToken: string;
}> {
  installBackgroundStubs();
  installGuestTokenStub();

  const token = SEEDS[actor].token();
  const self = SEEDS[actor].self();

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(token, true, mapSessionUser(self.data as never));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });

  return { clientId: self.data.actor.id, accessToken: token.access_token };
}

/** Drops any session the previous test signed in, settling back on the guest floor. */
export async function clearSession(): Promise<void> {
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
}

// -----------------------------------------------------------------------------

/** One observed outbound request. */
export type ObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/**
 * Passively observes every request whose URL touches a delegate endpoint.
 * Passive (an MSW `request:start` listener) rather than an override handler, so
 * it never races the fixture replay for the same route.
 */
export function observeDelegateRequests(): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (
      !request.url.includes("/delegates") &&
      !request.url.includes("/delegate_access/")
    )
      return;
    seen.push({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });
  };
  server?.events.on("request:start", listener);

  return {
    all: () => seen,
    first: () => seen[0],
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

/** Every header key the identity-transport read-back must NOT carry (A7). */
export function assertNoActingAsHeaders(headers: Record<string, string>): void {
  const keys = Object.keys(headers).map(key => key.toLowerCase());
  expect(keys).toEqual(
    expect.not.arrayContaining([
      "x-acting-as",
      "x-impersonate",
      "x-on-behalf-of",
      "x-staff-id",
      "x-admin-id",
      "impersonation"
    ])
  );
}

/**
 * The A7 identity read-back for one observed request: the call went out against
 * the account NAMED (never the session's own), carrying the seeded session's own
 * bearer and no acting-as header.
 *
 * @param observed - The captured outbound request.
 * @param namedClientId - The account the caller named.
 * @param accessToken - The seeded session's bearer.
 */
export function assertNamedAccountTransport(
  observed: ObservedRequest,
  namedClientId: string,
  accessToken: string
): void {
  expect(observed.url).toContain(`/clients/${namedClientId}/delegates`);
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}
