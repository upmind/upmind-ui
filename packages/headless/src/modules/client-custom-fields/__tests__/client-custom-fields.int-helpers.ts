// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/__tests__/client-custom-fields.int-helpers
 * @description Shared integration scaffolding for client-custom-fields'
 * `*.int.test.ts` files: seed a real authenticated client session, evict this
 * module's scope-registry entries between tests, expose the RECORDED wire
 * bodies every handler serves, and capture outbound requests.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-custom-fields` against real staging — no
 * test builds a wire body of its own.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { narrowByLike, windowOf } from "../../../__tests__/criteria-int-kit";
import { queryClient } from "../../query/client";
import { getRegistry, remove } from "../../scope/scope.registry";
import {
  mapSessionUser,
  useActiveSession,
  useSessionStore
} from "../../session-store";
import { recordingsDir, server } from "./setup.integration";
import type { IToken } from "@upmind-automation/types";
import type { SetupServer } from "msw/node";

// -----------------------------------------------------------------------------

/** The Upmind response envelope, as the recorded fixtures carry it. */
export type Envelope<T> = {
  status: string;
  data: T;
  total: number | null;
  error: { code: number; message: string; data?: unknown } | null;
  messages: unknown;
  meta: unknown;
};

/** One custom field definition as the recorded wire carries it. */
export type WireField = {
  id: string;
  code: string;
  name: string;
  type: number;
  type_code: string;
  order: number;
  hidden: boolean;
  client_readonly: boolean;
  required: boolean;
  editable?: boolean;
  user_only: boolean;
  show_on_order_form: boolean;
  show_on_invoice: boolean;
  brand_id: string;
  values: unknown;
  display_contexts?: unknown;
};

/** One custom field value as the recorded wire carries it. */
export type WireFieldValue = {
  id: string;
  field_id: string;
  object_type: string;
  value: unknown;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  field?: WireField;
};

/**
 * The recorded bodies, by capture. Each getter reads the co-located fixture
 * this module's generator wrote from staging.
 */
export const recorded = {
  /** `GET custom_fields?filter[object_type]=client&brand_id=...` — the real 2-row catalogue. */
  definitions: () =>
    getFixtureBody<Envelope<WireField[]>>(
      "get-custom-fields-brand-id-filter-object-type-client-sort-order-asc",
      { recordingsDir }
    ),
  /** `GET clients/{id}?with=custom_fields,custom_fields.field` — a real embedded value. */
  withValues: () =>
    getFixtureBody<Envelope<{ id: string; custom_fields: WireFieldValue[] }>>(
      "get-clients-id-case-with-values",
      { recordingsDir }
    ),
  /** `PUT clients/{id}` `{custom_fields:{age:"42"}}` — the real set response. */
  setCustomField: () =>
    getFixtureBody<Envelope<{ id: string; custom_fields: WireFieldValue[] }>>(
      "put-clients-id-case-set-custom-field",
      { recordingsDir }
    ),
  /** `PUT clients/{id}` `{custom_fields:{age:null}}` — the real clear response (value:null, not omitted). */
  clearCustomField: () =>
    getFixtureBody<Envelope<{ id: string; custom_fields: WireFieldValue[] }>>(
      "put-clients-id-case-clear-custom-field",
      { recordingsDir }
    ),
  /** `POST clients/fields/{id}/image` — the real successful upload. */
  imageUpload: () =>
    getFixtureBody<Envelope<WireFieldValue>>("post-clients-fields-id-image", {
      recordingsDir
    }),
  /** `POST clients/fields/{id}/image` a non-image file — the real 422. */
  imageUploadRejected: () =>
    getFixture("post-clients-fields-id-image-case-rejected", { recordingsDir })
};

/** The two real definitions: NUMBER "age" and IMAGE "profile_picture". */
export function recordedDefinitions(): WireField[] {
  return recorded.definitions().data;
}

/** The real `field_id` + `brand_id` this module's captures were taken against. */
export function recordedIds(): {
  clientId: string;
  brandId: string;
  ageFieldId: string;
  imageFieldId: string;
} {
  const defs = recordedDefinitions();
  const age = defs.find(field => field.code === "age");
  const image = defs.find(field => field.code === "profile_picture");
  if (!age || !image) {
    throw new Error(
      "Recorded definitions capture is missing the age/profile_picture rows " +
        "this suite's ids are read from."
    );
  }
  return {
    clientId: recorded.withValues().data.id,
    brandId: age.brand_id,
    ageFieldId: age.id,
    imageFieldId: image.id
  };
}

// -----------------------------------------------------------------------------

/**
 * Background bootstrap calls unrelated to any AC (brand/org config) fire as a
 * side effect of `initStore()`; stub them harmlessly so they never surface as
 * noise against a suite scoped to client-custom-fields.
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

/** The module's own registry namespace — both composables register under it. */
export const SCOPE_NAMESPACE = "client-custom-fields";

/** Every live scope key this module currently holds in the registry. */
export function clientCustomFieldsScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith(`${SCOPE_NAMESPACE}:`)
  );
}

/**
 * Evict every client-custom-fields scope entry so each test starts from a
 * fresh instance against ITS OWN handlers, and clear the shared query cache —
 * the registry entry and the TanStack cache are separate lifetimes.
 */
export function resetClientCustomFieldsScopes(): void {
  for (const key of clientCustomFieldsScopeKeys()) remove(key);
  queryClient.clear();
}

// -----------------------------------------------------------------------------

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
  selfBody: { data: { actor: { id: string; brand_id: string } } };
} {
  return {
    clientToken: getFixtureBody<IToken>("post-oauth-access-token-client", {
      recordingsDir: sessionStoreRecordingsDir
    }),
    selfBody: getFixtureBody<{
      data: { actor: { id: string; brand_id: string } };
    }>("get-self", { recordingsDir: sessionStoreRecordingsDir })
  };
}

/**
 * Seeds a real authenticated client session. `overrides` lets a caller
 * substitute the resolved client id / brand id for a SECOND, distinct
 * session (AC-2's "a different resolved client/brand" scenario) — the
 * session-store token/self shape stays the real recorded one; only the two
 * identity fields a scope resolves against are swapped, which is the same
 * "recorded envelope, documented override for the AC's own contract"
 * technique `client-email.mappers.test.ts` and `client-email.int-helpers.ts`
 * already use (never a fresh hand-authored session).
 */
export async function seedClientSession(overrides?: {
  clientId?: string;
  brandId?: string;
}): Promise<{ clientId: string; brandId: string; accessToken: string }> {
  resetClientCustomFieldsScopes();
  installBackgroundStubs();

  const { clientToken, selfBody } = recordedClientCredentials();
  installGuestTokenStub();

  const actor = {
    ...selfBody.data.actor,
    id: overrides?.clientId ?? selfBody.data.actor.id,
    brand_id: overrides?.brandId ?? selfBody.data.actor.brand_id
  };

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(
      clientToken,
      true,
      mapSessionUser({ ...selfBody.data, actor } as never)
    );

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });

  return {
    clientId: actor.id,
    brandId: actor.brand_id,
    accessToken: clientToken.access_token
  };
}

/**
 * Seeds a session that AUTHENTICATES but resolves NO client id — the second
 * limb of the addressability predicate (AC-25).
 */
export async function seedAuthenticatedSessionWithoutClientId(): Promise<void> {
  resetClientCustomFieldsScopes();
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
  resetClientCustomFieldsScopes();
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
};

/**
 * Passively observes every request whose URL contains `fragment`. Passive (an
 * MSW `request:start` listener) rather than an override handler, so it never
 * races the fixture replay for the same route.
 */
export function observeRequests(fragment: string): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  count: () => number;
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes(fragment)) return;
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
    count: () => seen.length,
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

/** Every header key the identity-transport read-back (A7) must NOT carry. */
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
 * The full A7 read-back for one observed request: the URL addresses the
 * TARGET id (never the session client's own, when the two differ), the
 * bearer token is the session's own (a retargeted VALUES context is an
 * entity id, never an actor swap — no second token is ever minted), and no
 * acting-as header is present.
 */
export function assertRetargetIdentityTransport(
  observed: ObservedRequest,
  targetId: string,
  accessToken: string
): void {
  expect(observed.url).toContain(`/clients/${targetId}`);
  expect(observed.headers.authorization ?? observed.headers.Authorization).toBe(
    `Bearer ${accessToken}`
  );
  assertNoActingAsHeaders(observed.headers);
}

/**
 * Serves the definitions list from a MUTABLE row set, wrapped in the RECORDED
 * envelope, so an "empty brand" / "scrambled order" scenario is a real
 * envelope with substituted `data` — never a fresh hand-authored fixture.
 */
export function installDefinitionsHandler(
  mswServer: SetupServer | undefined,
  brandId: string,
  rows: WireField[]
): { reads: () => number; lastUrl: () => string | undefined } {
  const envelope = recorded.definitions();
  let reads = 0;
  let lastUrl: string | undefined;

  mswServer?.use(
    http.get("*/custom_fields", ({ request }) => {
      reads += 1;
      lastUrl = request.url;
      const url = new URL(request.url);
      if (url.searchParams.get("brand_id") !== brandId) {
        return HttpResponse.json(
          { ...envelope, data: [], total: 0 },
          { status: 200 }
        );
      }
      return HttpResponse.json(
        { ...envelope, data: rows, total: rows.length },
        { status: 200 }
      );
    })
  );

  return { reads: () => reads, lastUrl: () => lastUrl };
}

/**
 * The criteria-aware sibling of {@link installDefinitionsHandler}: that
 * handler ignores every param but `brand_id`, so it cannot back a filter,
 * sort or page assertion. This one narrows the RECORDED two-row corpus by
 * the request's own `filter[name|like]` and windows it by `limit`/`offset`,
 * mirroring `product-catalogue.int-helpers.ts`'s `installProductsHandler`
 * (`narrowByLike` / `windowOf`, `../../../__tests__/criteria-int-kit`) —
 * this module's own recorded rows, the platform's established technique.
 */
export function installCriteriaAwareDefinitionsHandler(
  mswServer: SetupServer | undefined,
  brandId: string
): { reads: () => number } {
  const envelope = recorded.definitions();
  const corpus = recordedDefinitions();
  let reads = 0;

  mswServer?.use(
    http.get("*/custom_fields", ({ request }) => {
      reads += 1;
      const params = new URL(request.url).searchParams;
      if (params.get("brand_id") !== brandId) {
        return HttpResponse.json(
          { ...envelope, data: [], total: 0 },
          { status: 200 }
        );
      }
      const narrowed = narrowByLike(corpus, params, "name", row => row.name);
      return HttpResponse.json(
        {
          ...envelope,
          data: windowOf(narrowed, params),
          total: narrowed.length
        },
        // `x-total-count` — the pager's page-count math reads this header,
        // not the body's `total` field (see the recorded page-1/page-2
        // fixtures, which both carry it alongside an identical body.total).
        { status: 200, headers: { "x-total-count": String(narrowed.length) } }
      );
    })
  );

  return { reads: () => reads };
}
