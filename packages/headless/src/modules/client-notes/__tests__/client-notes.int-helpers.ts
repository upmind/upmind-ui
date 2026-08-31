// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.int-helpers
 * @description Shared integration scaffolding for client-notes's
 * `*.int.test.ts` files: seed a real authenticated client session, evict this
 * module's scope-registry entries between tests, expose the RECORDED wire
 * bodies every handler serves, and capture outbound requests so the read-back
 * discipline (`verify-reality-check.companion.md`) asserts on the real wire —
 * the request URL retarget and the auth identity transport, never the
 * response payload alone.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-notes` against real staging — no test builds
 * a wire body of its own.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { queryClient } from "../../query/client";
import { getRegistry, remove } from "../../scope/scope.registry";
import {
  mapSessionUser,
  useActiveSession,
  useSessionStore
} from "../../session-store";
import { recordingsDir, server } from "./setup.integration";
import type { IToken } from "@upmind-automation/types";
import type { IVaultAsset } from "@upmind-automation/types";
import type { SetupServer } from "msw/node";

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

/**
 * The recorded bodies, by capture. Each getter reads the co-located fixture
 * this module's generator wrote from staging — the single source of every
 * response these tests replay.
 */
export const recorded = {
  /** `GET clients/{id}/vault?with=...&with_staged_imports=1` — C1/C12/C15. */
  list: () =>
    getFixtureBody<Envelope<IVaultAsset[]>>(
      "get-clients-id-vault-with-staged-imports-1",
      { recordingsDir }
    ),
  /** `GET clients/{id}/vault/{id}` — the manager's per-record read (M1). */
  one: () =>
    getFixtureBody<Envelope<IVaultAsset>>("get-clients-id-vault-id", {
      recordingsDir
    }),
  /** `GET .../vault?filter[encrypted|eq]=0` — notes only (C2/X2/AC-31). */
  filterEncryptedFalse: () =>
    getFixtureBody<Envelope<IVaultAsset[]>>(
      "get-clients-id-vault-filter-encrypted-eq-0",
      { recordingsDir }
    ),
  /** `GET .../vault?filter[encrypted|eq]=1` — secrets only (C2/X2/AC-31). */
  filterEncryptedTrue: () =>
    getFixtureBody<Envelope<IVaultAsset[]>>(
      "get-clients-id-vault-filter-encrypted-eq-1",
      { recordingsDir }
    ),
  /** `GET .../vault?filter[label|like]=%prover%` — C3. */
  filterLabelLike: () =>
    getFixtureBody<Envelope<IVaultAsset[]>>(
      "get-clients-id-vault-filter-label-like-prover",
      { recordingsDir }
    ),
  /** `GET .../vault?filter[pinned|eq]=1` — C4. */
  filterPinnedTrue: () =>
    getFixtureBody<Envelope<IVaultAsset[]>>(
      "get-clients-id-vault-filter-pinned-eq-1",
      { recordingsDir }
    ),
  /** `GET .../vault?filter[pinned|eq]=0` — C4. */
  filterPinnedFalse: () =>
    getFixtureBody<Envelope<IVaultAsset[]>>(
      "get-clients-id-vault-filter-pinned-eq-0",
      { recordingsDir }
    ),
  /** `GET .../vault?limit=2` page 1 — C6. */
  pageOne: () =>
    getFixtureBody<Envelope<IVaultAsset[]>>(
      "get-clients-id-vault-case-page-1",
      { recordingsDir }
    ),
  /** `GET .../vault?limit=2&offset=2` page 2 — C6. */
  pageTwo: () =>
    getFixtureBody<Envelope<IVaultAsset[]>>(
      "get-clients-id-vault-case-page-2",
      { recordingsDir }
    ),
  /** One `GET .../vault?order=<field>` capture per declared column (C7/X4/AC-30). */
  order: (field: "label" | "pinned" | "created_at", dir: "asc" | "desc") =>
    getFixture(
      `get-clients-id-vault-case-order-${dir}-${field.replace(/_/g, "-")}`,
      { recordingsDir }
    ),
  /** `POST clients/{id}/vault` — a created note (M3). */
  createdNote: () =>
    getFixtureBody<Envelope<IVaultAsset>>("post-clients-id-vault", {
      recordingsDir
    }),
  /** `POST clients/{id}/vault?case=secret` — a created secret (M4). */
  createdSecret: () =>
    getFixtureBody<Envelope<IVaultAsset>>("post-clients-id-vault-case-secret", {
      recordingsDir
    }),
  /** `PUT .../vault/{id}?case=pin` — `{pinned:true}` (C8). */
  pinned: () =>
    getFixtureBody<Envelope<IVaultAsset>>("put-clients-id-vault-id-case-pin", {
      recordingsDir
    }),
  /** `PUT .../vault/{id}?case=unpin` — `{pinned:false}` (C8). */
  unpinned: () =>
    getFixtureBody<Envelope<IVaultAsset>>(
      "put-clients-id-vault-id-case-unpin",
      { recordingsDir }
    ),
  /** `PUT .../vault/{id}?case=convert-to-secret` — a labelled note -> secret (C10 (ii)). */
  convertedToSecret: () =>
    getFixtureBody<Envelope<IVaultAsset>>(
      "put-clients-id-vault-id-case-convert-to-secret",
      { recordingsDir }
    ),
  /** `PUT .../vault/{id}?case=convert-to-note` — a secret -> note (C10 (i)). */
  convertedToNote: () =>
    getFixtureBody<Envelope<IVaultAsset>>(
      "put-clients-id-vault-id-case-convert-to-note",
      { recordingsDir }
    ),
  /** `PUT .../vault/{id}?case=edit` — the five-key body (M5). */
  edited: () =>
    getFixtureBody<Envelope<IVaultAsset>>("put-clients-id-vault-id-case-edit", {
      recordingsDir
    }),
  /** `DELETE .../vault/{id}` — the success (C9). */
  removed: () =>
    getFixtureBody<Envelope<null>>("delete-clients-id-vault-id", {
      recordingsDir
    }),
  /** `DELETE .../vault/{id}` against a non-existent id — the real 404 (C9). */
  removeRejected: () =>
    getFixture("delete-clients-id-vault-id-case-error", { recordingsDir }),
  /** `GET .../vault/{id}/decrypt`, first reveal (C11). */
  decryptFirst: () =>
    getFixtureBody<Envelope<{ note: string }>>(
      "get-clients-id-vault-id-decrypt-case-first-reveal",
      { recordingsDir }
    ),
  /** `GET .../vault/{id}/decrypt`, second reveal — proves it is never cached (C11). */
  decryptSecond: () =>
    getFixtureBody<Envelope<{ note: string }>>(
      "get-clients-id-vault-id-decrypt-case-second-reveal",
      { recordingsDir }
    ),
  /** `GET /api/config/brand/values?keys=security.ui.allow_vault` — C14's gate. */
  brandVaultFlag: () =>
    getFixtureBody<Envelope<Record<string, boolean>>>(
      "get-config-brand-values-keys-security-ui-allow-vault",
      { recordingsDir }
    ),
  /** `GET /api/org/modules` — brand-readiness bootstrap. */
  orgModules: () =>
    getFixtureBody<Envelope<unknown>>("get-org-modules", { recordingsDir }),
  /** `GET /api/brand/settings` — brand-readiness bootstrap. */
  brandSettings: () =>
    getFixtureBody<Envelope<{ country_id?: string }>>("get-brand-settings", {
      recordingsDir
    })
};

// -----------------------------------------------------------------------------

/** Answers the brand-readiness bootstrap `loadLookups`/`ensureBrandReady` waits on. */
export function installBackgroundStubs(): void {
  server?.use(
    http.get("*/org/modules", () => HttpResponse.json(recorded.orgModules())),
    http.get("*/brand/settings", () =>
      HttpResponse.json(recorded.brandSettings())
    ),
    http.get("*/config/brand/values", () =>
      HttpResponse.json(recorded.brandVaultFlag())
    )
  );
}

// -----------------------------------------------------------------------------

/** The module's own registry namespace — both composables register under it. */
export const SCOPE_NAMESPACE = "client-notes";

/** Every live scope key this module currently holds in the registry. */
export function clientNoteScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}`)
  );
}

/**
 * Evict every client-notes scope entry so each test starts from a fresh
 * instance against ITS OWN handlers. The registry entry and the TanStack
 * query cache are separate lifetimes — dropping the entry alone leaves a new
 * instance free to serve the PREVIOUS test's cached list, so the shared cache
 * is cleared too.
 */
export function resetClientNoteScopes(): void {
  for (const key of clientNoteScopeKeys()) remove(key);
  queryClient.clear();
  // The brand config query (`brand.services.ts`'s fetchBrandConfig) carries a
  // localStorage persister with `staleTime: "static"` — queryClient.clear()
  // wipes the in-memory cache but NOT the persisted localStorage entry, so a
  // later test in the same file would rehydrate an earlier test's brand flag
  // instead of refetching. Cleared here so every test starts from a genuinely
  // fresh brand-config fetch.
  if (typeof localStorage !== "undefined") localStorage.clear();
}

// -----------------------------------------------------------------------------

/** D2 input material: session-store's OWN captures (same actor), reused rather than re-recorded. */
export const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

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
  resetClientNoteScopes();
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
 * Seeds a real authenticated client session whose actor carries
 * `staged_import: true` — AC-15. No recorded capture reaches this state (the
 * shared staging client under capture is not a staged import); the token and
 * `/self` body are the SAME recorded material `seedClientSession` uses, with
 * `staged_import` flipped on the resolved actor. Field-override technique
 * (the client-phone precedent, `client-notes.int-helpers.ts` header) —
 * overriding one already-real field, never inventing a wire body.
 */
export async function seedStagedImportClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetClientNoteScopes();
  installBackgroundStubs();
  installGuestTokenStub();

  const { clientToken, selfBody } = recordedClientCredentials();
  const staged = {
    ...selfBody,
    data: {
      ...selfBody.data,
      actor: { ...selfBody.data.actor, staged_import: true }
    }
  };

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(staged.data as never));

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
  });

  return {
    clientId: staged.data.actor.id,
    accessToken: clientToken.access_token
  };
}

/**
 * Seeds a session that AUTHENTICATES but resolves NO client id — the second
 * limb of the addressability predicate (AC-17's readiness bound).
 */
export async function seedAuthenticatedSessionWithoutClientId(): Promise<void> {
  resetClientNoteScopes();
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

/** Logs out any active client session, settling on the guest floor. */
export async function logoutClientSession(): Promise<void> {
  try {
    useSessionStore().useActions().logout();
  } catch {
    // No active session to log out of.
  }
  resetClientNoteScopes();
  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
}

// -----------------------------------------------------------------------------

/** One observed outbound request. */
export type ObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
};

/**
 * Passively observes every request whose URL contains `/vault`. Passive (an
 * MSW `request:start` listener) rather than an override handler, so it never
 * races the fixture replay for the same route.
 */
export function observeVaultRequests(): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  last: () => ObservedRequest;
  matching: (fragment: string) => ObservedRequest[];
  count: () => number;
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/vault")) return;
    const clone = request.clone();
    seen.push({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      body: undefined
    });
    void clone
      .text()
      .then(text => {
        if (!text) return;
        try {
          seen[seen.length - 1].body = JSON.parse(text);
        } catch {
          seen[seen.length - 1].body = text;
        }
      })
      .catch(() => undefined);
  };
  server?.events.on("request:start", listener);

  return {
    all: () => seen,
    first: () => seen[0],
    last: () => seen[seen.length - 1],
    matching: (fragment: string) =>
      seen.filter(entry => entry.url.includes(fragment)),
    count: () => seen.length,
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

/**
 * Waits until `observed.count()` stops changing for `quietMs`, rather than a
 * fixed sleep — a write's cache invalidation can trigger a background
 * refetch on a delay this suite does not control, and a fixed sleep either
 * races it (false "settled") or overshoots on the fast path. Detects true
 * settlement regardless of how long that refetch takes, up to `timeoutMs`.
 */
export async function waitForRequestQuiescence(
  observed: { count: () => number },
  {
    quietMs = 300,
    timeoutMs = 5000,
    interval = 25
  }: { quietMs?: number; timeoutMs?: number; interval?: number } = {}
): Promise<void> {
  const start = Date.now();
  let lastCount = observed.count();
  let lastChangeAt = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, interval));
    const count = observed.count();
    if (count !== lastCount) {
      lastCount = count;
      lastChangeAt = Date.now();
    } else if (Date.now() - lastChangeAt >= quietMs) {
      return;
    }
  }
  throw new Error(
    `waitForRequestQuiescence: request count still changing after ${timeoutMs}ms`
  );
}

/**
 * Waits for a scoped `useClientNotes()`/`useClientNoteManager()` handle's
 * `isAvailable` to settle true — `isAvailable` composes the brand's own
 * async config fetch (`useBrand().ensureConfig`), which resolves a tick or
 * more after the handle is minted. `useActions().isReady()` is the module's
 * own readiness contract (AC-17) and is exercised directly by that spec; this
 * helper is the boot synchronisation every OTHER spec needs before it can
 * assert on a fired request.
 */
export async function waitForAvailable(handle: {
  useMeta: () => {
    isAvailable: { value: boolean };
    isLoading?: { value: boolean };
  };
}): Promise<void> {
  await vi.waitFor(
    () => {
      const meta = handle.useMeta();
      expect(meta.isAvailable.value).toBe(true);
      if (meta.isLoading) expect(meta.isLoading.value).toBe(false);
    },
    { timeout: 5000, interval: 25 }
  );
}

// -----------------------------------------------------------------------------

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
 * The full identity read-back for one observed request
 * (`verify-reality-check.companion.md`): the URL is the SCOPE-resolved
 * client's own resource, the token is that client session's, and no
 * acting-as header is present. This module's only live cell is `client x
 * self`, so this is the narrower, still-mandatory pair `requirements.md` §4
 * names — not a `.for('client', id)` retarget (S1 is dropped).
 */
export function assertClientIdentityTransport(
  observed: ObservedRequest,
  clientId: string,
  accessToken: string
): void {
  expect(observed.url).toContain(`/clients/${clientId}/vault`);
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}

/** Registers a `clients/{clientId}/vault` GET handler serving `envelope`. */
export function installVaultListHandler(
  mswServer: SetupServer | undefined,
  clientId: string,
  envelope: Envelope<IVaultAsset[]>
): { reads: () => number } {
  let reads = 0;
  mswServer?.use(
    http.get(`*/clients/${clientId}/vault`, () => {
      reads += 1;
      return HttpResponse.json(envelope, { status: 200 });
    })
  );
  return { reads: () => reads };
}
