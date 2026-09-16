// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/client-ticket-page.harness
 * @description The recorded-replay bench the client-ticket MANAGER page is
 * driven behind. It seeds a real authenticated client session, serves the
 * `tickets` module's COMMITTED staging captures to the real `useClientTicket`
 * stack over MSW, mounts `client-ticket.page.vue` behind a real router carrying
 * the scope suffix, and captures every outbound mutation so a read-back grades
 * the request the page actually sent.
 *
 * ## Provenance
 * Every body served here is a fixture captured by `pnpm fixtures:generate
 * tickets` / `... session-store` into the owning module's `__tests__/fixtures/`
 * — nothing is authored. The two lifecycle-state overrides
 * ({@link ticketBodyClosed}, {@link ticketBodyLocked}) toggle ONE documented
 * wire field on the recorded body to reach a state staging never captured as a
 * standalone read — the same technique the module's own recorded-reality oracle
 * uses (`packages/headless/src/modules/tickets/__tests__/tickets.manager.int.test.ts`,
 * AC-24 `settings.lock`, AC-25 `status.code`), never a fabricated response.
 * {@link messagesWithAttachment} is the one COMPOSITION here: a recorded
 * message row lifted into a recorded envelope, disclosed on that function.
 * The download capture stores a length, not bytes — see
 * {@link installTicketsHandlers}.
 *
 * ## The lane a consumer must declare
 * `// @vitest-environment happy-dom` — node's undici fetch rejects a jsdom
 * `AbortSignal` (vitest #8374), so every read fails before MSW sees it under
 * jsdom (the reason `init-deep-link.harness` states the same requirement).
 */

import { join } from "node:path";
import { mount } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { createRouter, createWebHistory } from "vue-router";
import { map } from "lodash-es";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";
import { TicketStatusCodes } from "@upmind-automation/types";
import {
  clearAll,
  mapSessionUser,
  queryClient,
  useActiveSession,
  useSessionStore
} from "@upmind-automation/headless";
import routerOptions from "../../../app/router.options";
import { registerScenarioRoutes } from "./nuxt-build-context";
import type { NuxtPage } from "@nuxt/schema";
import type { RouteLocationRaw, RouteRecordRaw } from "vue-router";
import type { VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const REPO_ROOT = join(process.cwd(), "..", "..");

const ticketsRecordingsDir = join(
  REPO_ROOT,
  "packages/headless/src/modules/tickets/__tests__/fixtures"
);

const sessionRecordingsDir = join(
  REPO_ROOT,
  "packages/headless/src/modules/session-store/__tests__/fixtures"
);

export const server = startReplayServer({
  recordingsDir: ticketsRecordingsDir
});

// -----------------------------------------------------------------------------

type Envelope<T> = { status: string; data: T };

const ticketsBody = (key: string): Record<string, unknown> =>
  getFixtureBody(key, { recordingsDir: ticketsRecordingsDir }) as Record<
    string,
    unknown
  >;

/** The recorded bodies the manager page reads and writes, by capture. */
export const recorded = {
  one: () => ticketsBody("get-tickets-id"),
  oneLinked: () => ticketsBody("get-tickets-id-case-linked"),
  oneUnlinked: () => ticketsBody("get-tickets-id-case-unlinked"),
  messages: () => ticketsBody("get-tickets-id-messages-filter-is-log-0"),
  messagesAfterWithdraw: () =>
    ticketsBody("get-tickets-id-messages-case-after-withdraw-filter-is-log-0"),
  oneMessage: () => ticketsBody("get-tickets-id-messages-id"),
  reply: () => ticketsBody("post-tickets-id-replies"),
  replyWithFile: () => ticketsBody("post-tickets-id-replies-case-with-file"),
  editedReply: () => ticketsBody("put-tickets-id-replies-id"),
  withdrawnMessage: () =>
    ticketsBody(
      "delete-tickets-id-messages-id-reason-recorded-withdrawal-for-fe-3226"
    ),
  deletedAttachment: () =>
    ticketsBody("delete-tickets-id-messages-id-files-id"),
  uploadedFile: () => ticketsBody("post-ticket-messages-files-case-upload"),
  downloadedFile: () => ticketsBody("get-ticket-messages-files-id-download"),
  linkedProduct: () => ticketsBody("put-tickets-id-case-link-product"),
  unlinkedProduct: () => ticketsBody("put-tickets-id-case-unlink-product"),
  contractProductsLookup: () =>
    ticketsBody("get-contract-products-case-lookup"),
  closedStatus: () => ticketsBody("put-tickets-id-status"),
  reopenedStatus: () => ticketsBody("put-tickets-id-status-case-reopen"),
  renamed: () => ticketsBody("put-tickets-id"),
  statuses: () => ticketsBody("get-statuses-filter-object-type-ticket"),
  brandDepartments: () => ticketsBody("get-brand-tickets-departments"),
  departments: () => ticketsBody("get-tickets-departments"),
  clientPrefs: () => ticketsBody("get-clients-id"),
  hooksLogs: () => ticketsBody("get-hooks-logs-client-id")
};

/**
 * The recorded messages-list envelope carrying the recorded ATTACHMENT-bearing
 * message row.
 *
 * ## Why this composition exists
 * Staging's messages-list capture (`get-tickets-id-messages-filter-is-log-0`)
 * was taken on a ticket whose rows carry `files: []` — no recorded LIST read on
 * this brand holds an attachment. The attachment-bearing row is not invented:
 * it is the row `post-tickets-id-replies-case-with-file` recorded live, on the
 * SAME ticket, with its real file (`temp_57.txt`). This lifts that recorded row
 * into the recorded list envelope so the feed can hold it.
 *
 * Every byte here is recorded — the envelope from one capture, the row from
 * another. Nothing is authored, and no fixture file is modified. This is the
 * same class of technique as {@link ticketBodyLocked}, disclosed the same way.
 */
export function messagesWithAttachment(): Record<string, unknown> {
  const envelope = recorded.messages();
  const reply = recorded.replyWithFile() as unknown as Envelope<
    Record<string, unknown>
  >;
  return { ...envelope, data: [reply.data] };
}

/** The recorded attachment row the {@link messagesWithAttachment} feed carries. */
export function recordedAttachment(): { id: string; name: string } {
  const [first] = (
    messagesWithAttachment() as unknown as Envelope<
      Array<{ files: Array<{ id: string; name: string }> }>
    >
  ).data;
  return first!.files[0]!;
}

/** The recorded message id the {@link messagesWithAttachment} feed carries. */
export function recordedAttachmentMessageId(): string {
  return (
    messagesWithAttachment() as unknown as Envelope<Array<{ id: string }>>
  ).data[0]!.id;
}

/** The real id the write-cycle fixtures were captured against. */
export const RECORDED_TICKET_ID = (
  recorded.one() as unknown as Envelope<{ id: string }>
).data.id;

/** The recorded body with its status toggled to CLOSED (oracle AC-25). */
export function ticketBodyClosed(): Record<string, unknown> {
  const body = recorded.one();
  const data = body.data as Record<string, unknown>;
  return {
    ...body,
    data: { ...data, status: { code: TicketStatusCodes.CLOSED } }
  };
}

/** The recorded body with its lock setting toggled on (oracle AC-24). */
export function ticketBodyLocked(): Record<string, unknown> {
  const body = recorded.one();
  const data = body.data as Record<string, unknown>;
  return { ...body, data: { ...data, settings: { lock: true } } };
}

// -----------------------------------------------------------------------------

/** The payloads the page-driven actions put on the wire, captured per test. */
export type SentPayloads = {
  replies: unknown[];
  statusPuts: { url: string; body: unknown }[];
  /** Every `PUT /tickets/:id` body — the subject write and the AC-13 product writes share the endpoint. */
  subjectPuts: unknown[];
  /** Every `GET /tickets/:id/messages` url, so an attachments-view read-back can read the filter off the wire. */
  messageReads: string[];
  /** Every `GET /tickets/:id/messages/:msgId` url — AC-16's single-message re-read. */
  messageGets: string[];
  /** Every `PUT /tickets/:id/replies/:replyId` — `{ url, body }`, AC-18. */
  replyPuts: { url: string; body: unknown }[];
  /** Every `DELETE /tickets/:id/messages/:msgId` — `{ url, body }`, AC-19's reason rides the body. */
  messageDeletes: { url: string; body: unknown }[];
  /** Every `DELETE …/messages/:msgId/files/:fileId` url — AC-21. */
  attachmentDeletes: string[];
  /** Every `GET /ticket_messages/files/:fileId/download` url — AC-20. */
  downloads: string[];
  /** Every `POST /ticket_messages/files` multipart form — AC-23. */
  uploads: FormData[];
};

/**
 * Serves the manager's endpoints from the recorded bodies and captures the
 * mutation payloads the page sends. `oneBody`/`statusBody` are overridable so a
 * read-back can point the read at a lifecycle state via a real captured field;
 * `messagesBody` so a read-back can hold a recorded ATTACHMENT-bearing feed
 * (see {@link messagesWithAttachment}), and `ticketPutBody` so the AC-13
 * product writes answer with their own recorded response rather than the
 * rename's.
 */
export function installTicketsHandlers(opts?: {
  oneBody?: Record<string, unknown>;
  statusBody?: Record<string, unknown>;
  messagesBody?: Record<string, unknown>;
  ticketPutBody?: Record<string, unknown>;
}): SentPayloads {
  const oneBody = opts?.oneBody ?? recorded.one();
  const statusBody = opts?.statusBody ?? recorded.closedStatus();
  const messagesBody = opts?.messagesBody ?? recorded.messages();
  const ticketPutBody = opts?.ticketPutBody ?? recorded.renamed();
  const sent: SentPayloads = {
    replies: [],
    statusPuts: [],
    subjectPuts: [],
    messageReads: [],
    messageGets: [],
    replyPuts: [],
    messageDeletes: [],
    attachmentDeletes: [],
    downloads: [],
    uploads: []
  };

  // The recorded download capture stores the file's LENGTH, not its bytes
  // (`{ __binary: true, byteLength }`), so the bench answers with a buffer of
  // exactly that recorded length. The length is the recorded fact; the content
  // is not, and nothing here asserts on it.
  const downloadLength =
    (recorded.downloadedFile() as unknown as { byteLength?: number })
      .byteLength ?? 0;

  server?.use(
    http.post("*/api/ticket_messages/files", async ({ request }) => {
      sent.uploads.push(await request.formData());
      return HttpResponse.json(recorded.uploadedFile());
    }),
    http.get("*/api/ticket_messages/files/:fileId/download", ({ request }) => {
      sent.downloads.push(request.url);
      return HttpResponse.arrayBuffer(new ArrayBuffer(downloadLength), {
        headers: { "Content-Type": "text/plain; charset=UTF-8" }
      });
    }),
    http.delete(
      "*/api/tickets/:id/messages/:messageId/files/:fileId",
      ({ request }) => {
        sent.attachmentDeletes.push(request.url);
        return HttpResponse.json(recorded.deletedAttachment());
      }
    ),
    http.delete("*/api/tickets/:id/messages/:msgId", async ({ request }) => {
      sent.messageDeletes.push({
        url: request.url,
        body: await request.json().catch(() => null)
      });
      return HttpResponse.json(recorded.withdrawnMessage());
    }),
    http.put("*/api/tickets/:id/replies/:replyId", async ({ request }) => {
      sent.replyPuts.push({
        url: request.url,
        body: await request.json().catch(() => null)
      });
      return HttpResponse.json(recorded.editedReply());
    }),
    http.get("*/api/tickets/:id/messages", ({ request }) => {
      sent.messageReads.push(request.url);
      return HttpResponse.json(messagesBody);
    }),
    http.get("*/api/tickets/:id/messages/:msgId", ({ request }) => {
      sent.messageGets.push(request.url);
      return HttpResponse.json(recorded.oneMessage());
    }),
    http.post("*/api/tickets/:id/replies", async ({ request }) => {
      sent.replies.push(await request.json().catch(() => null));
      return HttpResponse.json(recorded.reply());
    }),
    http.put("*/api/tickets/:id/status", async ({ request }) => {
      sent.statusPuts.push({
        url: request.url,
        body: await request.json().catch(() => null)
      });
      return HttpResponse.json(statusBody);
    }),
    http.put("*/api/tickets/:id", async ({ request }) => {
      sent.subjectPuts.push(await request.json().catch(() => null));
      return HttpResponse.json(ticketPutBody);
    }),
    http.get("*/api/tickets/:id", () => HttpResponse.json(oneBody)),
    http.get("*/api/brand/tickets/departments", () =>
      HttpResponse.json(recorded.brandDepartments())
    ),
    http.get("*/api/tickets/departments", () =>
      HttpResponse.json(recorded.departments())
    ),
    http.get("*/api/statuses", () => HttpResponse.json(recorded.statuses())),
    http.get("*/api/hooks/logs/client/:clientId", () =>
      HttpResponse.json(recorded.hooksLogs())
    ),
    http.get("*/api/clients/:id", () =>
      HttpResponse.json(recorded.clientPrefs())
    )
  );

  return sent;
}

function installBackgroundStubs(): void {
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
    ),
    http.get("*/billing_cycles", () =>
      HttpResponse.json({ status: "ok", data: [] })
    )
  );
}

function installSessionStubs(): void {
  const guest = getFixture("post-oauth-access-token-guest", {
    recordingsDir: sessionRecordingsDir
  });
  const self = getFixture("get-self", { recordingsDir: sessionRecordingsDir });

  server?.use(
    http.post("*/oauth/access_token", () =>
      HttpResponse.json(guest.response.body as object, {
        status: guest.response.status
      })
    ),
    http.get("*/api/self", () =>
      HttpResponse.json(self.response.body as object, {
        status: self.response.status
      })
    )
  );
}

/** A real client session, seeded from session-store's own recorded captures. */
export async function seedClientSession(): Promise<void> {
  clearAll();
  queryClient.clear();
  installBackgroundStubs();
  installSessionStubs();

  const token = getFixtureBody("post-oauth-access-token-client", {
    recordingsDir: sessionRecordingsDir
  });
  const self = getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
    recordingsDir: sessionRecordingsDir
  });

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(token as never, true, mapSessionUser(self.data as never));

  await vi.waitFor(() => {
    const session = useActiveSession();
    expect(session.useMeta().isAuthenticated.value).toBe(true);
    expect(session.useContext().activeUser.value?.id).toBeTruthy();
  });
}

/** Drops the seeded session and every live manager instance. */
export function teardownSession(): void {
  try {
    useSessionStore().useActions().logout();
  } catch {
    // No active session to log out of.
  }
  clearAll();
  queryClient.clear();
}

// -----------------------------------------------------------------------------

export type ObservedRequest = { method: string; url: string };

/** Records the method + url of every outbound ticket-facing request. */
export function observeRequests(): {
  all: () => ObservedRequest[];
  count: (fragment: string) => number;
  stop: () => void;
} {
  const seen: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    seen.push({ method: request.method, url: request.url });
  };
  server?.events.on("request:start", listener);

  return {
    all: () => seen,
    count: fragment => seen.filter(r => r.url.includes(fragment)).length,
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

// -----------------------------------------------------------------------------

let mounted: VueWrapper | undefined;
let registeredPages: NuxtPage[] | undefined;

/**
 * The scenario routes exactly as the shipped Nuxt registrar pushes them — so
 * `useClientTicket` carries its real `/:scopeSuffix(.*)*` catch-all under the
 * `/:brandIdOrOrg?` prefix, never a route hand-spelled by the bench. Cached
 * once: the registrar's directory scan is the same on every mount.
 */
async function scenarioRoutes(page: Component): Promise<RouteRecordRaw[]> {
  if (!registeredPages)
    ({ pages: registeredPages } = await registerScenarioRoutes());
  return routerOptions.routes(
    map(registeredPages, entry => ({
      ...entry,
      component:
        entry.name === "useClientTicket" ? page : { render: () => null }
    }))
  ) as RouteRecordRaw[];
}

/**
 * Mounts the manager page behind the REAL boot path a browser drives: the
 * registrar's catch-all route resolves the deep link to `params.scopeSuffix`,
 * and the shipped `scope.global` middleware runs `parseScopeSuffix` over it to
 * write `route.meta.scopeConfig` — the value the page reads to target
 * `.as(CLIENT).for(TICKET, id)`. A dropped catch-all or a failed parse leaves
 * `scopeConfig` unset, so the page never boots and the read-back fails, which
 * is the point: the bench asserts the wiring a browser depends on, not a
 * pre-baked stand-in for it.
 */
export async function mountTicketPage(
  id: string = RECORDED_TICKET_ID
): Promise<VueWrapper> {
  const { wrapper } = await mountManagerAt(
    `/useClientTicket/as/client/for/ticket/${id}`
  );
  return wrapper;
}

/** Every route the manager page pushes while mounted, in order. */
export type ManagerMount = { wrapper: VueWrapper; pushes: string[] };

/**
 * Mounts the manager page at any deep link over the REAL registrar route +
 * `scope.global` middleware, and captures every route the page pushes — the
 * seam the row-link and the reference-loader both drive (a paste resolves to an
 * id, then the page navigates to its manager url). The base link
 * (`/useClientTicket`, no suffix) leaves `scopeConfig` unset, which is the
 * page's "no ticket named" openTicket entry.
 */
export async function mountManagerAt(url: string): Promise<ManagerMount> {
  const page = (await import("../useClientTicket/client-ticket.page.vue"))
    .default as Component;

  (globalThis as Record<string, unknown>).defineNuxtRouteMiddleware ??= (
    fn: unknown
  ) => fn;
  const scopeMiddleware = (await import("../../../app/middleware/scope.global"))
    .default as (to: unknown, from: unknown) => unknown;

  const router = createRouter({
    history: createWebHistory(),
    routes: await scenarioRoutes(page)
  });
  (globalThis as Record<string, unknown>).navigateTo ??= (
    loc: RouteLocationRaw
  ) => loc;
  router.beforeEach(to => scopeMiddleware(to, to) as never);

  const pushes: string[] = [];
  const push = router.push.bind(router);
  router.push = (to: RouteLocationRaw) => {
    pushes.push(typeof to === "string" ? to : JSON.stringify(to));
    return push(to);
  };

  window.history.replaceState({}, "", url);
  await router.push(url);
  await router.isReady();
  pushes.length = 0;

  mounted = mount(page, {
    attachTo: document.body,
    global: { plugins: [router] }
  });
  return { wrapper: mounted, pushes };
}

/**
 * Serves the collection list read the reference-loader resolves through
 * (`useClientTickets` filtered by reference), from a RECORDED body, and reports
 * every list url it saw so a test can assert the bare-EQUAL reference filter
 * went out. `installTicketsHandlers` serves only the manager's `/:id` reads.
 */
export function installTicketsListBody(body: unknown): {
  seen: () => string[];
} {
  const seen: string[] = [];
  server?.use(
    http.get("*/api/tickets", ({ request }) => {
      seen.push(request.url);
      return HttpResponse.json(body as object);
    })
  );
  return { seen: () => seen };
}

/** Unmounts the page before the session is dropped (order matters). */
export function unmountTicketPage(): void {
  mounted?.unmount();
  mounted = undefined;
  document.body.innerHTML = "";
}

// -----------------------------------------------------------------------------

/** A `data-test-key` node in the mounted tree. */
export function testKey(
  wrapper: VueWrapper,
  key: string
): ReturnType<VueWrapper["find"]> {
  return wrapper.find(`[data-test-key="${key}"]`);
}
