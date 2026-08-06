import { ref } from "vue";
import { useClientEmails } from "@upmind-automation/headless/modules/client-email";
import pageOne from "@upmind-automation/headless/modules/client-email/__tests__/fixtures/get-clients-id-emails-case-page-1.json";
import pageTwo from "@upmind-automation/headless/modules/client-email/__tests__/fixtures/get-clients-id-emails-case-page-2.json";
import { ScopeActorTypes } from "@upmind-automation/headless/modules/scope";
import {
  mapSessionUser,
  useActiveSession,
  useSessionStore
} from "@upmind-automation/headless/modules/session-store";
import { usePOP } from "@upmind-automation/headless/utils";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  filter,
  includes,
  isEmpty,
  map,
  orderBy,
  slice,
  startsWith,
  toLower,
  toNumber
} from "lodash-es";
import type { IToken } from "@upmind-automation/types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module stories/modules/client-email.demo
 * @description The OFFLINE rig the Client Email List story runs the real
 * `useClientEmails` composable on. Nothing here re-implements the module: the
 * story drives the live composable, and this file only stands in for the two
 * things a browser story has no access to — the network and a session.
 *
 * - **Data is recorded.** Every row served comes verbatim from this module's own
 *   captured fixtures (`__tests__/fixtures/get-clients-id-emails-case-page-*`),
 *   the same three-row corpus its integration suite replays.
 * - **No live API, no credentials.** `installRecordedApi` swaps `globalThis.fetch`
 *   for a handler that answers from those fixtures and REJECTS anything it does
 *   not recognise, so no request can leave the page; the API base URL is pinned
 *   to an unroutable host as a second guard, and the demo session token is an
 *   obvious placeholder string, not a captured one.
 * - **The mock answers the WIRE.** Filtering, ordering and paging are applied
 *   from the request's own `filter[col|op]=` / `order=` / `limit` / `offset`
 *   params — never from the story's state — so what the operator sees narrow and
 *   reorder is the translated query taking effect, not a client-side slice.
 *   Same discipline as `installFilteredEmailsHandler` in the module's own suite.
 */

/** One row as the recorded wire carries it. */
type RecordedRow = (typeof pageOne)["response"]["body"]["data"][number];

/** The recorded list envelope every response below is wrapped in. */
const RECORDED_ENVELOPE = pageOne.response.body;

/** The recorded three-row corpus: the captured page 1 (two rows) plus page 2. */
const RECORDED_CORPUS: RecordedRow[] = [
  ...pageOne.response.body.data,
  ...pageTwo.response.body.data
];

/** The client the corpus was captured against — read off the rows themselves. */
const RECORDED_CLIENT_ID = RECORDED_CORPUS[0].client_id;

/** The tri-state boolean columns the query schema declares an `eq` operator for. */
const BOOLEAN_COLUMNS = ["verified", "bounced", "default"] as const;

/**
 * A placeholder session token. NOT a recording and not a credential — nothing in
 * this rig verifies it; it exists only so the session store has an authenticated
 * client to resolve, which is what enables the collection's list query.
 */
const DEMO_TOKEN: IToken = {
  access_token: "storybook-demo-not-a-real-token",
  actor_id: RECORDED_CLIENT_ID,
  actor_type: AccessRoleTypes.CLIENT,
  expires_in: 86400,
  refresh_expires_in: 86400,
  refresh_token: "storybook-demo-not-a-real-token",
  second_factor_required: false,
  token_type: "Bearer",
  twofa_provider: undefined as never
};

/** Every outbound request the rig answered, newest last. */
export const outboundRequests: Ref<string[]> = ref([]);

// -----------------------------------------------------------------------------

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

/** `order=-created_at,email` → the lodash `orderBy` field/direction pair. */
function sortSpec(order: string): {
  fields: string[];
  directions: Array<"asc" | "desc">;
} {
  const tokens = filter(order.split(","), token => !isEmpty(token));
  return {
    // `RequestSortDirection.DESC` is the "-" prefix the serialiser joins on.
    fields: map(tokens, token =>
      startsWith(token, "-") ? token.slice(1) : token
    ),
    directions: map(tokens, token => (startsWith(token, "-") ? "desc" : "asc"))
  };
}

/**
 * Answers `GET clients/{id}/emails` from the recorded corpus, narrowed, ordered
 * and paged by the request's OWN params — the server-side effect the replay
 * stands in for.
 */
function serveRecordedEmails(url: URL): Response {
  const params = url.searchParams;
  let rows = RECORDED_CORPUS;

  for (const column of BOOLEAN_COLUMNS) {
    const value = params.get(`filter[${column}|eq]`);
    if (value === "1") rows = filter(rows, row => row[column] === true);
    else if (value === "0") rows = filter(rows, row => row[column] === false);
  }

  const like = params.get("filter[email|like]");
  if (like) {
    const needle = toLower(like.replace(/%/g, ""));
    rows = filter(rows, row => includes(toLower(row.email), needle));
  }

  const order = params.get("order");
  if (order) {
    const { fields, directions } = sortSpec(order);
    rows = orderBy(rows, fields, directions);
  }

  const total = rows.length;
  const limit = toNumber(params.get("limit") ?? 0);
  const offset = toNumber(params.get("offset") ?? 0);
  const page = limit ? slice(rows, offset, offset + limit) : rows;

  return jsonResponse({ ...RECORDED_ENVELOPE, data: page, total });
}

/**
 * Replaces `globalThis.fetch` for the lifetime of the story. The original is
 * never captured or called: an unrecognised request REJECTS, so the demo cannot
 * reach a real API even if the module asks for something this rig does not know.
 */
function installRecordedApi(): void {
  globalThis.fetch = (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(input.toString());
    outboundRequests.value = [...outboundRequests.value, url.toString()];

    if (includes(url.pathname, "/emails")) {
      return Promise.resolve(serveRecordedEmails(url));
    }

    // The session/brand bootstrap `initStore()` fires as a side effect. Answered
    // harmlessly so it never surfaces as noise in a story about the query.
    if (includes(url.pathname, "/access_token")) {
      return Promise.resolve(jsonResponse(DEMO_TOKEN));
    }
    if (
      includes(url.pathname, "/config/") ||
      includes(url.pathname, "/brand") ||
      includes(url.pathname, "/org/")
    ) {
      return Promise.resolve(jsonResponse({ status: "ok", data: {} }));
    }

    return Promise.reject(
      new Error(
        `[client-email demo] refusing to call the network: ${url.pathname}`
      )
    );
  };
}

/**
 * Seeds an authenticated client session for the recorded client, mirroring the
 * module's own integration seed (`seedClientSession`): init the store, then add
 * the session with its user already mapped so no `/self` read is needed.
 */
async function seedDemoSession(): Promise<void> {
  if (useActiveSession().useMeta().isAuthenticated.value) return;

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(
      DEMO_TOKEN,
      true,
      mapSessionUser({
        actor: {
          id: RECORDED_CLIENT_ID,
          email: RECORDED_CORPUS[0].email,
          firstname: "Storybook"
        }
      } as never)
    );
}

/**
 * Boots the demo: pin the API base somewhere unroutable, install the recorded
 * API, seed the session, then hand back the REAL scoped collection once its
 * first read has settled.
 */
export async function bootClientEmails(): Promise<
  ReturnType<ReturnType<typeof useClientEmails>["as"]>
> {
  usePOP({ apiUrl: "https://storybook.invalid" });
  installRecordedApi();
  await seedDemoSession();

  const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
  await emails.useActions().isReady();

  return emails;
}
