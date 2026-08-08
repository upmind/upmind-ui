// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/recorded-corpus
 * @description Serves the browser lane the SAME recorded captures the
 * integration lane replays through MSW. Every body below is read from a
 * committed fixture written by `pnpm fixtures:generate`; this module builds
 * none of its own.
 *
 * It exists because the playground cannot reach live staging at all — the
 * `labs.localhost` host is not a registered brand domain, so the guest token
 * 401s and `brand/settings` 404s before the app finishes booting. A browser
 * lane over this playground is therefore a REPLAY lane by construction, not by
 * preference.
 *
 * The collection handler branches on the request's own params over the recorded
 * 3-row corpus, mirroring `installFilteredEmailsHandler` in the integration
 * kit. That branching is what makes a filter/sort read-back falsifiable: rows
 * can only narrow or reorder if the criteria reached the wire, so a
 * client-side-only filter leaves the served rows untouched and the assertion
 * red.
 */

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { filter, orderBy, some } from "lodash-es";
import type { Page, Route } from "@playwright/test";

// -----------------------------------------------------------------------------

const packages = fileURLToPath(
  new URL("../../../../packages/", import.meta.url)
);

const clientEmailRecordings = join(
  packages,
  "headless/src/modules/client-email/__tests__/fixtures"
);
const sessionRecordings = join(
  packages,
  "headless/src/modules/session-store/__tests__/fixtures"
);
const bootRecordings = fileURLToPath(
  new URL(
    "../../../../tests/journeys/storefront/oneoff-checkout/storefront-guest-oneoff-checkout-stripe/fixtures/journeys/storefront-guest-oneoff-checkout-stripe",
    import.meta.url
  )
);

/** One email as the recorded wire carries it. */
type WireEmail = {
  id: string;
  email: string;
  default: boolean;
  verified: boolean;
  bounced: boolean;
  created_at: string;
};

type Envelope<T> = { status: string; data: T; total: number | null };

const recorded = {
  emailPageOne: () =>
    getFixtureBody<Envelope<WireEmail[]>>("get-clients-id-emails-case-page-1", {
      recordingsDir: clientEmailRecordings
    }),
  emailPageTwo: () =>
    getFixtureBody<Envelope<WireEmail[]>>("get-clients-id-emails-case-page-2", {
      recordingsDir: clientEmailRecordings
    }),
  email: (key: string) =>
    getFixtureBody<Envelope<unknown>>(key, {
      recordingsDir: clientEmailRecordings
    }),
  session: (key: string) =>
    getFixtureBody<unknown>(key, { recordingsDir: sessionRecordings }),
  boot: (key: string) =>
    getFixtureBody<unknown>(key, { recordingsDir: bootRecordings })
};

/**
 * The recorded 3-row collection: the account's own verified default plus the
 * two unverified addresses the capture run created. Both halves are verbatim
 * recordings; the concatenation is the same one the integration kit's
 * `installFilteredEmailsHandler` builds.
 */
function corpus(): WireEmail[] {
  return [...recorded.emailPageOne().data, ...recorded.emailPageTwo().data];
}

const BOOLEAN_COLUMNS = ["verified", "bounced", "default"] as const;

/** Applies the request's own criteria to the recorded corpus. */
function servedRows(params: URLSearchParams): WireEmail[] {
  let rows = corpus();

  for (const column of BOOLEAN_COLUMNS) {
    const value = params.get(`filter[${column}|eq]`);
    if (value === "1") rows = filter(rows, row => row[column] === true);
    else if (value === "0") rows = filter(rows, row => row[column] === false);
  }

  const like = params.get("filter[email|like]");
  if (like) {
    const needle = like.replace(/%/g, "").toLowerCase();
    rows = filter(rows, row => row.email.toLowerCase().includes(needle));
  }

  const order = params.get("order");
  if (order) {
    const descending = order.startsWith("-");
    const field = (descending ? order.slice(1) : order) as keyof WireEmail;
    rows = orderBy(rows, [field], [descending ? "desc" : "asc"]);
  }

  const offset = Number(params.get("offset") ?? 0);
  const limit = Number(params.get("limit") ?? rows.length);

  return rows.slice(offset, offset + limit);
}

// -----------------------------------------------------------------------------

type Served = { body: unknown; status?: number };

/** Resolves one API request to its recorded answer, or `undefined` if unhandled. */
function resolve(method: string, url: URL): Served | undefined {
  const { pathname, searchParams } = url;

  if (method === "POST" && pathname.endsWith("/oauth/access_token"))
    return { body: recorded.session("post-oauth-access-token-client") };

  if (pathname.endsWith("/api/self"))
    return { body: recorded.session("get-self") };

  if (pathname.endsWith("/api/org/modules"))
    return { body: recorded.boot("get-org-modules") };
  if (pathname.endsWith("/api/brand/settings"))
    return { body: recorded.boot("get-brand-settings") };
  if (pathname.endsWith("/api/config/brand/values"))
    return { body: recorded.boot("get-config-brand-values") };
  if (pathname.endsWith("/api/config/organisation/values"))
    return { body: recorded.boot("get-config-organisation-values") };

  const collection = /\/clients\/[^/]+\/emails$/.exec(pathname);
  const member = /\/clients\/[^/]+\/emails\/[^/]+$/.exec(pathname);
  const verify = /\/clients\/[^/]+\/emails\/[^/]+\/send_verify$/.exec(pathname);

  if (verify)
    return { body: recorded.email("patch-clients-id-emails-id-send-verify") };

  if (member) {
    if (method === "GET")
      return { body: recorded.email("get-clients-id-emails-id") };
    if (method === "DELETE")
      return { body: recorded.email("delete-clients-id-emails-id") };
    if (method === "PUT")
      return {
        body: recorded.email(
          searchParams.has("case")
            ? "put-clients-id-emails-id-case-set-default"
            : "put-clients-id-emails-id"
        )
      };
  }

  if (collection) {
    if (method === "POST")
      return { body: recorded.email("post-clients-id-emails") };
    if (method === "GET") {
      const rows = servedRows(searchParams);
      return {
        body: { ...recorded.emailPageOne(), data: rows, total: rows.length }
      };
    }
  }

  return undefined;
}

// -----------------------------------------------------------------------------

/**
 * The session-store's cookie of record for a client actor
 * (`session-store/docs/CHANGELOG.md` — one cookie per actor type).
 */
const CLIENT_SESSION_COOKIE = "upm_client_session";

/**
 * Seeds a real client session from the RECORDED token capture, the same one
 * `seedClientSession()` seeds the integration lane with. The cookie of record
 * is the app's own hydration route — nothing here reaches inside the session
 * store, and the `/self` hydration it triggers is served from the recording
 * too.
 *
 * The playground's own login page cannot stand in for it: that surface is
 * `useAuth`'s canary (FE-2978) and does not render.
 */
export async function seedRecordedClientSession(page: Page): Promise<void> {
  const token = recorded.session("post-oauth-access-token-client") as object;
  const value = Buffer.from(
    JSON.stringify({ ...token, status: 200 }),
    "utf-8"
  ).toString("base64");

  await page.context().addCookies([
    {
      name: CLIENT_SESSION_COOKIE,
      value,
      domain: "labs.localhost",
      path: "/"
    }
  ]);
}

/** Every API request the lane saw, as `METHOD url`. */
export type RecordedTraffic = {
  requests: () => readonly string[];
  unhandled: () => readonly string[];
  sawParam: (name: string, value: string) => boolean;
};

/**
 * Installs the recorded corpus over one page. Call before the first navigation
 * — the app's session bootstrap fires on load.
 */
export async function installRecordedCorpus(
  page: Page
): Promise<RecordedTraffic> {
  const requests: string[] = [];
  const unhandled: string[] = [];

  await page.route("**/api.staging.upmind.io/**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push(`${request.method()} ${request.url()}`);

    const served = resolve(request.method(), url);
    if (!served) {
      unhandled.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok", data: null, total: null })
      });
    }

    return route.fulfill({
      status: served.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(served.body)
    });
  });

  return {
    requests: () => requests,
    unhandled: () => unhandled,
    sawParam: (name, value) =>
      some(
        requests,
        entry =>
          new URL(entry.slice(entry.indexOf(" ") + 1)).searchParams.get(
            name
          ) === value
      )
  };
}
