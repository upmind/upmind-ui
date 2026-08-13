// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/recorded-corpus
 * @description Serves the browser lane the SAME recorded captures the
 * integration lane replays through MSW — and it answers client-email traffic
 * through the ONE resolver `modules/scenarios/runtime/force/corpus.ts` owns, the
 * same one the force worker calls. What is left here is the adapter: Playwright's
 * `page.route`, the boot/session recordings the app needs before the module
 * renders, and the session seeding. The param branching is the resolver's; a
 * second copy here would be a second behaviour.
 *
 * Every body is read from a committed fixture written by `pnpm
 * fixtures:generate`; this module builds none of its own. Reading them from disk
 * is lawful in THIS lane and only here — eslint 8h admits a playground's own
 * tests glob and 8g bans the same reach everywhere else, which is why the
 * resolver takes its bodies as an argument rather than importing them: app
 * runtime reaches the same recordings through the `corpus.source.ts` seam
 * (`ESC6`).
 *
 * It exists because the playground cannot reach live staging at all — the
 * `labs.localhost` host is not a registered brand domain, so the guest token
 * 401s and `brand/settings` 404s before the app finishes booting. A browser lane
 * over this playground is therefore a REPLAY lane by construction, not by
 * preference.
 *
 * The resolver branching on the request's own params is what makes a filter/sort
 * read-back falsifiable: rows can only narrow or reorder if the criteria reached
 * the wire, so a client-side-only filter leaves the served rows untouched and
 * the assertion red.
 */

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { resolveCorpusRequest } from "../../modules/scenarios/runtime/force/corpus";
import { CORPUS_FIXTURE_NAMES } from "../../modules/scenarios/runtime/force/corpus.source.types";
import { fromPairs, map, some } from "lodash-es";
import type { CorpusResponse } from "../../modules/scenarios/runtime/force/corpus";
import type { CorpusBodies } from "../../modules/scenarios/runtime/force/corpus.source.types";
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

/** One recorded exchange, at the status it was recorded with. */
const recorded = (recordingsDir: string, key: string): CorpusResponse =>
  getFixture(key, { recordingsDir }).response;

/**
 * The ten committed client-email recordings, keyed by fixture name — the shape
 * the resolver reads, and the same set the seam serves once `ESC6` is ruled.
 */
const recordedCorpus = (): CorpusBodies =>
  fromPairs(
    map(CORPUS_FIXTURE_NAMES, name => [
      name,
      getFixture(name, { recordingsDir: clientEmailRecordings })
    ])
  ) as CorpusBodies;

/**
 * The session and boot traffic the app makes before the module renders — outside
 * the client-email corpus, so outside the resolver's remit.
 */
function resolveBoot(method: string, url: URL): CorpusResponse | undefined {
  const { pathname } = url;

  if (method === "POST" && pathname.endsWith("/oauth/access_token"))
    return recorded(sessionRecordings, "post-oauth-access-token-client");
  if (pathname.endsWith("/api/self"))
    return recorded(sessionRecordings, "get-self");

  if (pathname.endsWith("/api/org/modules"))
    return recorded(bootRecordings, "get-org-modules");
  if (pathname.endsWith("/api/brand/settings"))
    return recorded(bootRecordings, "get-brand-settings");
  if (pathname.endsWith("/api/config/brand/values"))
    return recorded(bootRecordings, "get-config-brand-values");
  if (pathname.endsWith("/api/config/organisation/values"))
    return recorded(bootRecordings, "get-config-organisation-values");

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
 * `useAuth`'s own scenario page (FE-2978) and does not render.
 */
export async function seedRecordedClientSession(page: Page): Promise<void> {
  const token = getFixtureBody<object>("post-oauth-access-token-client", {
    recordingsDir: sessionRecordings
  });
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
  const bodies = recordedCorpus();

  await page.route("**/api.staging.upmind.io/**", async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    requests.push(`${method} ${request.url()}`);

    const served =
      resolveBoot(method, url) ?? resolveCorpusRequest(bodies, method, url);

    if (!served) {
      unhandled.push(`${method} ${url.pathname}`);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok", data: null, total: null })
      });
    }

    return route.fulfill({
      status: served.status,
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
