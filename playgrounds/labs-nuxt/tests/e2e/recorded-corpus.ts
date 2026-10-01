// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/recorded-corpus
 * @description Serves the browser lane the SAME recorded captures the
 * integration lane replays, through the ONE shared resolver
 * (`tests/fixtures/corpus-replay.ts`, imported by relative path — design
 * 8.12). What is left here is the adapter: Playwright's `page.route`, the
 * boot and session recordings the app needs before a module renders, the
 * session seeding, and the pins of the running pair.
 *
 * Every body is a committed fixture. For the module of the running pair, each
 * `packages/headless/src/modules/<module>/__tests__/fixtures/*.json` is read
 * from disk, keyed by file name — no fixture-name list. A pin names the
 * captures that answer one `METHOD endpoint-shape`; each other capture of that
 * shape is dropped, because the resolver answers a request with the first
 * capture that asks the same criteria and ignores the record id [h42].
 *
 * A served write lands on the rows the next read is answered from, through
 * the shared replay's own session — the same fake API the labs page arms.
 *
 * The playground cannot reach staging (`labs.localhost` is no registered
 * brand domain), so this lane is a replay lane by construction.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
// eslint-disable-next-line @workspace/no-cross-package-path-imports -- design 8.12: the one shared resolver, by relative path in the Playwright process
import { resolveCorpusRequest } from "../../../../tests/fixtures/corpus-replay";
import {
  castArray,
  endsWith,
  filter,
  fromPairs,
  has,
  includes,
  map,
  omitBy,
  some,
  split,
  toUpper
} from "lodash-es";
import type { CorpusPins } from "./catalogs";
// eslint-disable-next-line @workspace/no-cross-package-path-imports -- design 8.12, as above
import type {
  CorpusBodies,
  CorpusResponse,
  RecordedFixture
} from "../../../../tests/fixtures/corpus-replay";
import type { Page, Route } from "@playwright/test";

// -----------------------------------------------------------------------------

const packages = fileURLToPath(
  new URL("../../../../packages/", import.meta.url)
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

/** The fixtures directory of one headless module. */
export const moduleRecordings = (module: string): string =>
  join(packages, `headless/src/modules/${module}/__tests__/fixtures`);

/** A read pool over the recorded captures, read by `resolveCorpusRequest`. */
type CorpusSession = {
  bodies: () => CorpusBodies;
  apply: (method: string, url: URL, body: unknown, answered: unknown) => void;
};

/**
 * Wraps one module's recorded captures as the lane's read pool. FE-3145
 * (`4de1d19778`) folded `corpus-replay`'s stateful session into
 * `resolveCorpusRequest`, which this lane reads directly, so the session is now
 * only the pool `resolveCorpusRequest` reads from. The orders collection
 * is READ-ONLY — pay and cancel are the manager's own, through the payment
 * engine and the cancellation port, never an invoice write — so no served write
 * lands on the pool: every read is answered by its own recorded capture.
 */
function createCorpusSession(source: CorpusBodies): CorpusSession {
  return {
    bodies: () => source,
    apply: () => {}
  };
}

const IDENTIFIER =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|mock-uuid-\d+)$/i;

/** `METHOD api/x/{id}/y` — the key a pin is declared under. */
export function endpointShape(method: string, path: string): string {
  const [pathname = ""] = split(path, "?");
  const segments = map(filter(split(pathname, "/")), segment =>
    IDENTIFIER.test(segment) ? "{id}" : segment
  );
  return `${toUpper(method)} ${segments.join("/")}`;
}

/** One recorded exchange, at the status it was recorded with. */
const recorded = (recordingsDir: string, key: string): CorpusResponse =>
  getFixture(key, { recordingsDir }).response;

/**
 * Every committed capture of one module, keyed by file name, with each
 * capture of a pinned shape dropped unless the pin names it.
 */
export function moduleCorpus(module: string, pins: CorpusPins): CorpusBodies {
  const directory = moduleRecordings(module);
  const files = filter(readdirSync(directory), file => endsWith(file, ".json"));
  const bodies = fromPairs(
    map(files, file => [
      file.slice(0, -".json".length),
      JSON.parse(
        readFileSync(join(directory, file), "utf-8")
      ) as RecordedFixture
    ])
  );

  return omitBy(bodies, (fixture, name) => {
    const shape = endpointShape(fixture.request.method, fixture.request.path);
    return has(pins, shape) && !includes(castArray(pins[shape]), name);
  });
}

/**
 * The session and boot traffic the app makes before a module renders —
 * outside every module corpus, so outside the resolver's remit.
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

/** The session-store's cookie of record for a client actor. */
const CLIENT_SESSION_COOKIE = "upm_client_session";

/**
 * Seeds a real client session from the RECORDED token capture. The cookie of
 * record is the app's own hydration route, and the `/self` hydration it
 * triggers is served from the recording too.
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
 * Installs one module's recorded corpus over one page. Call before the first
 * navigation — the app's session bootstrap fires on load.
 *
 * @param page The page the lane drives.
 * @param module The headless module whose recordings answer its requests.
 * @param pins The captures that answer each pinned endpoint shape.
 */
export async function installRecordedCorpus(
  page: Page,
  module: string,
  pins: CorpusPins = {}
): Promise<RecordedTraffic> {
  const requests: string[] = [];
  const unhandled: string[] = [];
  const session = createCorpusSession(moduleCorpus(module, pins));

  await page.route("**/api.staging.upmind.io/**", async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    requests.push(`${method} ${request.url()}`);

    const boot = resolveBoot(method, url);
    const sent = boot || method === "GET" ? undefined : request.postDataJSON();
    const served =
      boot ?? resolveCorpusRequest(session.bodies(), method, url, sent);

    if (!boot && served && method !== "GET" && served.status < 400)
      session.apply(method, url, sent, served.body);

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
