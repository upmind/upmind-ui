// -----------------------------------------------------------------------------
/**
 * @module client-email/__tests__/client-email.int-helpers
 * @description Shared integration scaffolding for client-email's
 * `*.int.test.ts` files: seed a real authenticated client session, evict this
 * module's scope-registry entries between tests, expose the RECORDED wire
 * bodies every handler serves, and capture outbound requests so the A7
 * read-backs (URL retarget + auth identity transport) assert on the real wire.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-email` against real staging — no test builds
 * a wire body of its own.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { replayStep } from "@upmind-automation/test-fixtures/replay-server";
import { AccessRoleTypes } from "@upmind-automation/types";
import { queryClient } from "../../query/client";
import { getRegistry, remove } from "../../scope/scope.registry";
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
  messages: unknown;
  meta: unknown;
};

/** One email as the recorded wire carries it (see `fixtures/*.json`). */
export type WireEmail = {
  id: string;
  client_id: string;
  type: number;
  email: string;
  default: boolean;
  verified: boolean;
  bounced: boolean;
  bounced_at: string | null;
  can_delete: boolean;
};

/**
 * The recorded bodies, by capture. Each getter reads the co-located fixture
 * this module's generator wrote from staging — the single source of every
 * response these tests replay.
 */
export const recorded = {
  /** `GET clients/{id}/emails` — the account's real three-row corpus. */
  list: () =>
    getFixtureBody<Envelope<WireEmail[]>>("get-clients-id-emails", {
      recordingsDir
    }),
  /** `GET clients/{id}/emails?filter[verified|eq]=0` — the unverified subset. */
  unverified: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-clients-id-emails-filter-verified-eq-0",
      { recordingsDir }
    ),
  /** `GET clients/{id}/emails?filter[email|like]=%needle%` — the needle match. */
  needleMatch: () =>
    getFixtureBody<Envelope<WireEmail[]>>(
      "get-clients-id-emails-filter-email-like-alpha",
      { recordingsDir }
    )
};

// -----------------------------------------------------------------------------

/** The brand's own recordings — its boot reads included. */
const BRAND_RECORDINGS = join(
  import.meta.dirname,
  "../../brand/__tests__/fixtures"
);

/** The basket's own recordings — the claim a client sign-in makes. */
const BASKET_RECORDINGS = join(
  import.meta.dirname,
  "../../basket/__tests__/fixtures"
);

/** The system module's own recordings — the basket's reference data. */
const SYSTEM_RECORDINGS = join(
  import.meta.dirname,
  "../../system/__tests__/fixtures"
);

/**
 * The boot reads every signed-in test makes as a side effect of `initStore()`
 * — the brand's settings and config, the basket's reference data — answered
 * by the RECORDINGS of the modules that own them (`brand`, `system`), never by
 * a body written here (FE-3145, ADR 035). Re-applied on every seed — the
 * replay server's own `afterEach` resets handlers between tests.
 */
export function installBackgroundStubs(): void {
  replayStep(server, BRAND_RECORDINGS);
  replayStep(server, SYSTEM_RECORDINGS);
  replayStep(server, BASKET_RECORDINGS);
  replayStep(server, sessionStoreRecordingsDir);
  // Last, so it answers first: every token grant shares one url and differs
  // only by its body, so the grant a boot mints — the guest's — is named.
  installGuestTokenStub();
}
// -----------------------------------------------------------------------------

/** The module's own registry namespace — both composables register under it. */
export const SCOPE_NAMESPACE = "client-email";

/** Every live scope key this module currently holds in the registry. */
export function clientEmailScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}:`)
  );
}

/**
 * Evict every client-email scope entry so each test starts from a fresh
 * instance against ITS OWN handlers. The registry entry and the TanStack query
 * cache are separate lifetimes — dropping the entry alone leaves a new
 * instance free to serve the PREVIOUS test's cached list, so the shared cache
 * is cleared too.
 */
export function resetClientEmailScopes(): void {
  for (const key of clientEmailScopeKeys()) remove(key);
  queryClient.clear();
}

// -----------------------------------------------------------------------------

/**
 * D2 input material: the OAuth token + `/self` bodies are session-store's OWN
 * captures (same actor), never asserted on here — used only to seed a real
 * client session, exactly as `account.int.test.ts` reuses them.
 */
export const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

/** Answers `initStore()`'s guest-token bootstrap with session-store's capture. */
function installGuestTokenStub(): void {
  const guestFixture = getFixture("post-oauth-access-token-guest", {
    recordingsDir: sessionStoreRecordingsDir
  });
  server?.use(
    http.post("*/oauth/access_token", () =>
      HttpResponse.json(guestFixture.response.body as object, {
        status: guestFixture.response.status
      })
    )
  );
}

/** The recorded client token + `/self` body every seed below starts from. */
function recordedClientCredentials(): {
  clientToken: IToken;
  selfBody: { data: { actor: { id: string } } };
} {
  return {
    clientToken: getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir: sessionStoreRecordingsDir
    }),
    selfBody: getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
      recordingsDir: sessionStoreRecordingsDir
    })
  };
}

/** Seeds a real authenticated client session; returns its resolved client id. */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetClientEmailScopes();
  installBackgroundStubs();

  const { clientToken, selfBody } = recordedClientCredentials();
  installGuestTokenStub();

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(selfBody.data as never));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });

  return {
    clientId: selfBody.data.actor.id,
    accessToken: clientToken.access_token
  };
}

/**
 * Seeds a session that AUTHENTICATES but resolves NO client id — the second
 * limb of the addressability predicate, and the only state that tells
 * `isAvailable` apart from a plain `isAuthenticated` alias.
 *
 * No recorded capture reaches it: the client capture always carries an actor
 * id, and the only non-client `/self` capture in the tree is a 403 body, not a
 * session. So the token and the `/self` body are the recorded ones and the
 * single constructed departure is the absent actor id — the boundary itself,
 * declared here rather than dressed up as a recording.
 */
export async function seedAuthenticatedSessionWithoutClientId(): Promise<void> {
  resetClientEmailScopes();
  installBackgroundStubs();
  installGuestTokenStub();

  const { clientToken, selfBody } = recordedClientCredentials();

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(
      clientToken,
      true,
      mapSessionUser({
        ...selfBody.data,
        actor_id: undefined,
        actor: { ...selfBody.data.actor, id: undefined }
      } as never)
    );

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
  });
}

/**
 * Lands the RECORDED client id on the session
 * `seedAuthenticatedSessionWithoutClientId` left unresolved — the second limb
 * of the addressability predicate resolving while a collection is already
 * open. Resets no scope and clears no cache: the instance under test has to
 * survive the transition for the transition to be observable at all.
 */
export async function resolveClientIdOnActiveSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  const { clientToken, selfBody } = recordedClientCredentials();

  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(selfBody.data as never));

  await vi.waitFor(() =>
    expect(useActiveSession().useContext().activeUser.value?.id).toBe(
      selfBody.data.actor.id
    )
  );

  return {
    clientId: selfBody.data.actor.id,
    accessToken: clientToken.access_token
  };
}

/**
 * Seeds the guest floor a `@signed-out` scenario boots against: the module's own
 * boot recordings are armed and the store settles on a guest session with NO
 * client signed in, so the collection resolves `isAvailable:false` and any email
 * request it makes anyway is an unmatched request the replay wall surfaces.
 */
export async function seedGuestSession(): Promise<void> {
  resetClientEmailScopes();
  installBackgroundStubs();

  await useSessionStore().initStore();
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetClientEmailScopes();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}

/** Logs out any active client session, settling on the guest floor. */
export async function logoutClientSession(): Promise<void> {
  // Intentionally discarded: logout may fail if no session exists.
  await Promise.resolve(useSessionStore().useActions().logout()).catch(
    () => undefined
  );
  resetClientEmailScopes();
  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
  // A logout re-mints the guest in the background. Awaited here, while this
  // test's recordings still answer it: left in flight, it lands after the
  // server closes and leaves the process for the real API.
  await vi.waitFor(() => {
    expect(
      useSessionStore().useActions().get(AccessRoleTypes.GUEST)
    ).toBeTruthy();
  });
}

// -----------------------------------------------------------------------------

/** One observed outbound request. */
export type ObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/** An observed request plus the outbound JSON payload a mutation carried. */
type ObservedWithBody = ObservedRequest & { body?: unknown };

/**
 * Passively observes every request whose URL contains `/emails`. Passive (an
 * MSW `request:start` listener) rather than an override handler, so it never
 * races the fixture replay for the same route — the read-only observer that
 * carries the A7 wire read-backs (url, token, headers) and, for a mutation, the
 * outbound BODY, read off a clone so the request the module still consumes is
 * untouched (FE-3145).
 */
export function observeEmailRequests(): {
  all: () => ObservedWithBody[];
  first: () => ObservedWithBody;
  matching: (fragment: string) => ObservedWithBody[];
  stop: () => void;
} {
  const seen: ObservedWithBody[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/emails")) return;
    const entry: ObservedWithBody = {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    };
    seen.push(entry);
    void request
      .clone()
      .text()
      .then(text => {
        if (text) entry.body = JSON.parse(text);
      })
      .catch(() => undefined);
  };
  server?.events.on("request:start", listener);

  return {
    all: () => seen,
    first: () => seen[0],
    matching: (fragment: string) =>
      seen.filter(entry => entry.url.includes(fragment)),
    stop: () => server?.events.removeListener("request:start", listener)
  };
}
