// -----------------------------------------------------------------------------
/**
 * @module client-notifications/__tests__/client-notifications.int-helpers
 * @description Shared integration scaffolding for client-notifications's
 * `*.int.test.ts` files: seed a real authenticated client session (or the
 * guest floor), evict this module's scope-registry entries between tests,
 * expose the RECORDED wire bodies every handler serves, and capture outbound
 * requests so the A7 read-backs (URL/param retarget + auth identity
 * transport) assert on the real wire.
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-notifications` against real staging. The
 * emailed-link token case carries NO recorded oracle for the link token —
 * its opt-outs handlers below serve the SAME recorded `client x self` body,
 * declared here as an inherited response shape, never presented as a link
 * recording of its own. The link-token assertions in the sibling specs are
 * request-side only (A7).
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
import type { SetupServer } from "msw/node";

// -----------------------------------------------------------------------------

export { mapSessionUser, useActiveSession, useSessionStore };

/** The Upmind response envelope, as the recorded fixtures carry it. */
export type Envelope<T> = {
  status: string;
  data: T;
  total: number | null;
  error: { code: number; message: string } | null;
  messages: unknown;
  meta: unknown;
};

export type WireTopic = {
  id: string;
  name: string;
  description: string;
  code: string;
  mandatory: boolean;
  can_opt_out: boolean;
  created_at: string;
  updated_at: string;
};

export type WireChannel = {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
};

export type WireOptOut = {
  id: string;
  topic_id: string;
  channel_id: string;
  created_at: string;
  updated_at: string;
};

/**
 * The recorded bodies, by capture. Each getter reads the co-located fixture
 * `pnpm fixtures:generate client-notifications` wrote from staging — the
 * single source of every response these tests replay.
 */
export const recorded = {
  /** `GET notifications/topics?limit=0`. */
  topics: () =>
    getFixtureBody<Envelope<WireTopic[]>>("get-notifications-topics", {
      recordingsDir
    }),
  /** `GET notifications/channels?filter[recipient_types.code]=client&limit=0`. */
  channels: () =>
    getFixtureBody<Envelope<WireChannel[]>>(
      "get-notifications-channels-filter-recipient-types-code-client",
      { recordingsDir }
    ),
  /** `GET notifications/opt-outs?limit=0` — the PRE-write state. */
  optOuts: () =>
    getFixtureBody<Envelope<WireOptOut[]>>("get-notifications-opt-outs", {
      recordingsDir
    }),
  /** `PUT notifications/opt-outs` — the recorded full-set write and its 200. */
  optOutsWrite: () =>
    getFixture("put-notifications-opt-outs", { recordingsDir })
};

/** The locked topic this account's real capture carries (`can_opt_out: false`). */
export function lockedTopic(): WireTopic {
  const topic = recorded.topics().data.find(row => row.can_opt_out === false);
  if (!topic) {
    throw new Error(
      "No recorded topic carries can_opt_out:false — AC-6's locked-topic " +
        "guard has nothing real to read back. Re-record with " +
        "`pnpm fixtures:generate client-notifications`."
    );
  }
  return topic;
}

/** An opt-outable (unlocked) topic from the real capture. */
export function optOutableTopic(): WireTopic {
  const topic = recorded.topics().data.find(row => row.can_opt_out === true);
  if (!topic) {
    throw new Error(
      "No recorded topic carries can_opt_out:true — nothing to exercise the " +
        "ordinary toggle path against."
    );
  }
  return topic;
}

/**
 * An opt-outable topic whose EVERY recorded channel already carries an
 * opt-out row — the real, non-trivial starting state for proving
 * `selectAll()` actually flips something (a topic that already has every
 * channel ON would make that assertion trivially true even with a no-op
 * `selectAll()`).
 */
export function topicFullyOptedOut(): WireTopic {
  const channelIds = recorded.channels().data.map(row => row.id);
  const optedOutByTopic = new Map<string, Set<string>>();
  for (const row of recorded.optOuts().data) {
    const set = optedOutByTopic.get(row.topic_id) ?? new Set<string>();
    set.add(row.channel_id);
    optedOutByTopic.set(row.topic_id, set);
  }

  const topic = recorded
    .topics()
    .data.find(
      candidate =>
        candidate.can_opt_out === true &&
        channelIds.every(id => optedOutByTopic.get(candidate.id)?.has(id))
    );
  if (!topic) {
    throw new Error(
      "No recorded topic has every channel already opted out — AC-4's " +
        "selectAll() assertion has no non-trivial starting state to prove " +
        "against. Re-record with `pnpm fixtures:generate client-notifications`."
    );
  }
  return topic;
}

// -----------------------------------------------------------------------------

/**
 * Background bootstrap calls unrelated to any AC (brand/org config, session
 * store's own housekeeping) fire as a side effect of `initStore()`; stub them
 * harmlessly so they never surface as noise against a suite scoped to
 * client-notifications. Re-applied on every seed — the replay server's own
 * `afterEach` resets handlers between tests.
 */
export function installBackgroundStubs(): void {
  server?.use(
    http.get("*/org/modules", () =>
      HttpResponse.json({ status: "ok", data: [] })
    ),
    http.get("*/config/organisation/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/brand/settings", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/billing_cycles", () =>
      HttpResponse.json({ status: "ok", data: [] })
    )
  );
}

/**
 * Every live scope key this module currently holds. Discovered from the
 * registry rather than asserted from a namespace constant — both composables
 * are the only registrants that carry `notification`.
 */
export function clientNotificationsScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key => /notification/i.test(key));
}

/** Evict every client-notifications scope entry so each test starts fresh. */
export function resetClientNotificationsScopes(): void {
  for (const key of clientNotificationsScopeKeys()) remove(key);
  queryClient.clear();
}

// -----------------------------------------------------------------------------

const sessionStoreRecordingsDir = join(
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

/**
 * Same wire contract as `installGuestTokenStub`, but the response is held
 * behind a manually-released gate — lets a test construct a scope WHILE the
 * session store's own bootstrap (`initStore()`) is still mid-flight, then
 * release it under test control, to prove behaviour across the exact race
 * the late-session `REFRESH` fix targets (a scope reaching `available` off
 * its OWN addressability — a token — before the session ever settles).
 */
export function installGatedGuestTokenStub(): { release: () => void } {
  const guestFixture = getFixture("post-oauth-access-token-guest", {
    recordingsDir: sessionStoreRecordingsDir
  });
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  server?.use(
    http.post("*/oauth/access_token", async () => {
      await gate;
      return HttpResponse.json(guestFixture.response.body as object, {
        status: guestFixture.response.status
      });
    })
  );
  return { release };
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

/**
 * The recorded client credentials `seedClientSession` adds, exposed so a
 * test can drive the same `add()` call at a moment of its own choosing — the
 * late-session race — instead of only through the all-in-one seed.
 */
export function clientCredentials(): {
  clientToken: IToken;
  selfBody: { data: { actor: { id: string } } };
} {
  return recordedClientCredentials();
}

/** Seeds a real authenticated CLIENT session; returns its resolved client id. */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetClientNotificationsScopes();
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
 * Settles the session store on its anonymous floor with no signed-in client
 * ever added — `initStore()`'s own bootstrap mints the ambient session token
 * (design.md §D9), and the active-session pointer falls back with nothing
 * else present. This ambient `guest_customer` grant is an ordinary client
 * session; it is the bearer topics/channels ride while opt-outs go out on the
 * link token alone.
 */
export async function seedGuestFloor(): Promise<{ accessToken: string }> {
  resetClientNotificationsScopes();
  installBackgroundStubs();
  installGuestTokenStub();

  await useSessionStore().initStore();

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
  });

  const guestFixture = getFixture("post-oauth-access-token-guest", {
    recordingsDir: sessionStoreRecordingsDir
  });
  const body = guestFixture.response.body as { access_token: string };
  return { accessToken: body.access_token };
}

// -----------------------------------------------------------------------------

/** One observed outbound request. */
export type ObservedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/** Passively observes every request whose URL contains `notifications`. */
export function observeNotificationsRequests(): {
  all: () => ObservedRequest[];
  first: () => ObservedRequest;
  matching: (fragment: string) => ObservedRequest[];
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("notifications")) return;
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
    matching: (fragment: string) =>
      seen.filter(entry => entry.url.includes(fragment)),
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

// -----------------------------------------------------------------------------

/**
 * Serves the recorded three reads (topics, channels, opt-outs) verbatim,
 * usable for BOTH a signed-in client and a client following an emailed link
 * (the link response shape is inherited from this same recorded capture).
 * Returns a
 * setter so a test can mutate the opt-outs the NEXT read serves, proving a
 * post-save refetch through a real subsequent GET rather than an assumption.
 */
export function installNotificationsReadHandlers(
  mswServer: SetupServer | undefined
): {
  setOptOuts: (rows: WireOptOut[]) => void;
  getOptOuts: () => WireOptOut[];
  reads: () => number;
} {
  const topicsEnvelope = recorded.topics();
  const channelsEnvelope = recorded.channels();
  const optOutsEnvelope = recorded.optOuts();
  let optOuts = optOutsEnvelope.data;
  let reads = 0;

  mswServer?.use(
    http.get("*/notifications/topics", () =>
      HttpResponse.json(topicsEnvelope, { status: 200 })
    ),
    http.get("*/notifications/channels", () =>
      HttpResponse.json(channelsEnvelope, { status: 200 })
    ),
    http.get("*/notifications/opt-outs", () => {
      reads += 1;
      return HttpResponse.json(
        { ...optOutsEnvelope, data: optOuts, total: optOuts.length },
        { status: 200 }
      );
    })
  );

  return {
    setOptOuts: rows => {
      optOuts = rows;
    },
    getOptOuts: () => optOuts,
    reads: () => reads
  };
}

/** Installs a PUT handler that serves the recorded write's real 200 response. */
export function installOptOutsWriteHandler(
  mswServer: SetupServer | undefined
): { bodies: () => unknown[] } {
  const writeFixture = recorded.optOutsWrite();
  const bodies: unknown[] = [];

  mswServer?.use(
    http.put("*/notifications/opt-outs", async ({ request }) => {
      bodies.push(await request.clone().json());
      return HttpResponse.json(writeFixture.response.body as object, {
        status: 200
      });
    })
  );

  return { bodies: () => bodies };
}

/**
 * Wires the GET and PUT opt-outs handlers to the SAME mutable state, so a
 * save's invalidate-then-refetch is observed through a real subsequent GET
 * that answers with the WRITTEN set — never asserted from the write alone.
 * Topics/channels are served from the recorded capture unchanged.
 */
export function installNotificationsReadWriteHandlers(
  mswServer: SetupServer | undefined
): {
  bodies: () => unknown[];
  getOptOuts: () => WireOptOut[];
  reads: () => number;
} {
  const topicsEnvelope = recorded.topics();
  const channelsEnvelope = recorded.channels();
  const optOutsEnvelope = recorded.optOuts();
  let optOuts = optOutsEnvelope.data;
  let reads = 0;
  const bodies: unknown[] = [];

  mswServer?.use(
    http.get("*/notifications/topics", () =>
      HttpResponse.json(topicsEnvelope, { status: 200 })
    ),
    http.get("*/notifications/channels", () =>
      HttpResponse.json(channelsEnvelope, { status: 200 })
    ),
    http.get("*/notifications/opt-outs", () => {
      reads += 1;
      return HttpResponse.json(
        { ...optOutsEnvelope, data: optOuts, total: optOuts.length },
        { status: 200 }
      );
    }),
    http.put("*/notifications/opt-outs", async ({ request }) => {
      const body = (await request.clone().json()) as {
        opt_outs: { topic_id: string; channel_id: string }[];
      };
      bodies.push(body);
      const now = new Date().toISOString();
      optOuts = body.opt_outs.map((row, index) => ({
        id: `written-${index}`,
        topic_id: row.topic_id,
        channel_id: row.channel_id,
        created_at: now,
        updated_at: now
      }));
      return HttpResponse.json(
        { ...optOutsEnvelope, data: optOuts, total: optOuts.length },
        { status: 200 }
      );
    })
  );

  return {
    bodies: () => bodies,
    getOptOuts: () => optOuts,
    reads: () => reads
  };
}

/** Installs a PUT handler that always rejects (AC-7). */
export function installOptOutsWriteRejectionHandler(
  mswServer: SetupServer | undefined,
  status = 422
): { bodies: () => unknown[] } {
  const bodies: unknown[] = [];
  mswServer?.use(
    http.put("*/notifications/opt-outs", async ({ request }) => {
      bodies.push(await request.clone().json());
      return HttpResponse.json(
        {
          status: "error",
          data: null,
          error: { code: status, message: "Rejected" }
        },
        { status }
      );
    })
  );
  return { bodies: () => bodies };
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

// -----------------------------------------------------------------------------

/**
 * Composes a synthetic opt-out row from an EXISTING recorded row's shape,
 * overriding only the topic/channel it addresses — state COMPOSITION from a
 * real recorded capture, never a hand-authored fixture
 * (`verify-cosplay.companion.md`'s data-provenance receipt).
 */
export function composeOptOutRow(
  topicId: string,
  channelId: string,
  idSuffix: string
): WireOptOut {
  const template = recorded.optOuts().data[0];
  if (!template) {
    throw new Error(
      "No recorded opt-out row exists to compose a synthetic row's shape " +
        "from — re-record with `pnpm fixtures:generate client-notifications`."
    );
  }
  return {
    ...template,
    id: `${template.id}-${idSuffix}`,
    topic_id: topicId,
    channel_id: channelId
  };
}

/**
 * Same wire contract as `installNotificationsReadWriteHandlers`, but the
 * opt-outs GET starts from a CALLER-SUPPLIED seed instead of the recorded
 * capture verbatim — lets a test compose server state the real capture does
 * not carry (e.g. a pre-existing opt-out on a topic that has since become
 * locked), built from the recorded fixtures' own row shape via
 * `composeOptOutRow`, never a hand-authored fixture file.
 */
export function installNotificationsReadWriteHandlersSeeded(
  mswServer: SetupServer | undefined,
  seedOptOuts: WireOptOut[]
): {
  bodies: () => unknown[];
  getOptOuts: () => WireOptOut[];
  reads: () => number;
} {
  const topicsEnvelope = recorded.topics();
  const channelsEnvelope = recorded.channels();
  const optOutsEnvelope = recorded.optOuts();
  let optOuts = seedOptOuts;
  let reads = 0;
  const bodies: unknown[] = [];

  mswServer?.use(
    http.get("*/notifications/topics", () =>
      HttpResponse.json(topicsEnvelope, { status: 200 })
    ),
    http.get("*/notifications/channels", () =>
      HttpResponse.json(channelsEnvelope, { status: 200 })
    ),
    http.get("*/notifications/opt-outs", () => {
      reads += 1;
      return HttpResponse.json(
        { ...optOutsEnvelope, data: optOuts, total: optOuts.length },
        { status: 200 }
      );
    }),
    http.put("*/notifications/opt-outs", async ({ request }) => {
      const body = (await request.clone().json()) as {
        opt_outs: { topic_id: string; channel_id: string }[];
      };
      bodies.push(body);
      const now = new Date().toISOString();
      optOuts = body.opt_outs.map((row, index) => ({
        id: `written-${index}`,
        topic_id: row.topic_id,
        channel_id: row.channel_id,
        created_at: now,
        updated_at: now
      }));
      return HttpResponse.json(
        { ...optOutsEnvelope, data: optOuts, total: optOuts.length },
        { status: 200 }
      );
    })
  );

  return {
    bodies: () => bodies,
    getOptOuts: () => optOuts,
    reads: () => reads
  };
}
