// -----------------------------------------------------------------------------
/**
 * @fileoverview The custom-fields page offers ITS OWN catalogues, and the list
 * re-derives on the one the operator picks (FE-3034)
 *
 * ## Job To Be Done
 * `selector-context-scope.spec.ts` grades the acting-for segment over a matrix
 * the test itself builds, on the client-emails route — so it stays green while
 * the custom-fields page offers no catalogue at all. This grades the page the
 * capability was built for: the declaration the registry serves at
 * `/useClientCustomFields`, the matrix that page's own module carries, the url
 * the pick writes, and the list that page boots at it.
 *
 * WHICH CATALOGUE REACHES THE WIRE is not re-proven here — that is the module's
 * own read-back (`client-custom-fields.catalogue-url.int.test.ts`, AC-38). What
 * this file grades is the page chain above it: that the pick lands on a list
 * entry OF ITS OWN rather than on the one already on screen.
 *
 * ## What Breaks If These Fail
 * The catalogue axis lands in the module and never reaches the page driving it —
 * or the pick moves the address bar while the page keeps serving the catalogue
 * it was already showing, which reads as a working picker and is not one.
 *
 * ## Provenance
 * The brand the session resolves, and the envelope any read is answered with,
 * come from the capture `pnpm fixtures:generate client-custom-fields` wrote; the
 * token and `/self` from `pnpm fixtures:generate session-store`. No body is
 * authored here.
 *
 * @anchor custom-fields-catalogue.feature
 * @anchor AC-1
 * @anchor AC-2
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX,
  ClientCustomFieldsContextTypes,
  ScopeActorTypes,
  queryClient,
  useClientCustomFields
} from "@upmind-automation/headless";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";
import clientCustomFields from "../../../modules/scenarios/useClientCustomFields/client-custom-fields.scenario";
import {
  CLIENT_CUSTOM_FIELDS_ROUTE,
  benchOn,
  flush,
  openPanel,
  resetDom,
  rows,
  textOf,
  type Bench
} from "../../components/scope/__tests__/harness";
import { parseScopeSuffix } from "../../composables/scope";
import {
  filter,
  find,
  first,
  includes,
  intersection,
  isEqual,
  map,
  reject,
  sortBy
} from "lodash-es";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

// `import.meta.url` is an http URL under jsdom, so the repo root comes from the
// lane's own `root` (`vitest.config.ts`), which is this package.
const headlessFixtures = (moduleName: string): string =>
  join(
    process.cwd(),
    "..",
    "..",
    "packages",
    "headless",
    "src",
    "modules",
    moduleName,
    "__tests__",
    "fixtures"
  );

const recordingsDir = headlessFixtures("client-custom-fields");
const sessionRecordingsDir = headlessFixtures("session-store");

const server = startReplayServer({ recordingsDir });

const DEFINITIONS_CAPTURE =
  "get-custom-fields-brand-id-filter-object-type-client-sort-order-asc";

/**
 * What the picker renders for the two declared catalogue members — the start
 * case of each member's own wire value, `invoice` and `contract_request`.
 * Named literally, because deriving it through the same transform the component
 * applies would assert nothing — it has to be the string an operator reads.
 */
const CATALOGUE_LABELS = ["Invoice", "Contract Request"];

const SCOPE_PATH = `/${CLIENT_CUSTOM_FIELDS_ROUTE}/as/client`;

type Envelope<T> = { status: string; data: T; total: number | null };
type WireField = { id: string; brand_id: string };

const recordedEnvelope = (): Envelope<WireField[]> =>
  getFixtureBody<Envelope<WireField[]>>(DEFINITIONS_CAPTURE, { recordingsDir });

// -----------------------------------------------------------------------------

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
    )
  );
}

/** A real client session, seeded from session-store's own recorded captures. */
async function seedClientSession(): Promise<{ brandId: string }> {
  const { useSessionStore, useActiveSession, mapSessionUser } =
    await import("@upmind-automation/headless");

  queryClient.clear();
  installBackgroundStubs();

  const guest = getFixtureBody<IToken>("post-oauth-access-token-guest", {
    recordingsDir: sessionRecordingsDir
  });
  const token = getFixtureBody<IToken>("post-oauth-access-token-client", {
    recordingsDir: sessionRecordingsDir
  });
  const self = getFixtureBody<{
    data: { actor: { id: string; brand_id: string } };
  }>("get-self", { recordingsDir: sessionRecordingsDir });

  server?.use(
    http.post("*/oauth/access_token", () =>
      HttpResponse.json({ status: "ok", data: guest })
    )
  );

  const brandId = first(recordedEnvelope().data)?.brand_id;
  if (!brandId) {
    throw new Error(
      `The recorded "${DEFINITIONS_CAPTURE}" capture carries no rows to read a ` +
        "brand id off. Re-run `pnpm fixtures:generate client-custom-fields`."
    );
  }

  const actor = { ...self.data.actor, brand_id: brandId };
  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(token, true, mapSessionUser({ ...self.data, actor } as never));

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
  });

  return { brandId };
}

/** The definitions-list entries the page currently holds in the shared cache. */
function listKeys(): unknown[][] {
  return map(
    filter(queryClient.getQueryCache().getAll(), query =>
      includes(JSON.stringify(query.queryKey), "customFields")
    ),
    query => query.queryKey as unknown[]
  );
}

/**
 * Mounts the page's acting-for segment over the matrix the custom-fields
 * DECLARATION carries — the one `ScenarioPlayground` registers for this route,
 * never a matrix built here.
 */
async function benchOnCustomFieldsPage(): Promise<{
  bench: Bench;
  panel: HTMLElement;
}> {
  const { default: ActingForSegment } =
    await import("../../components/scope/ActingForSegment.vue");
  const bench = await benchOn(
    ActingForSegment,
    SCOPE_PATH,
    clientCustomFields.useList?.scopeMatrix
  );

  return { bench, panel: await openPanel("acting-for") };
}

const rowFor = (panel: Element, label: string): HTMLElement | undefined =>
  find(rows(panel), row => textOf(row) === label);

/** Boots the page's OWN list composable at a named catalogue, or at none. */
function bootPageList(catalogue?: string): void {
  const cell = useClientCustomFields().as(ScopeActorTypes.CLIENT);
  const scoped = catalogue
    ? cell.for(catalogue as ClientCustomFieldsContextTypes)
    : cell;
  void scoped.useContext().data.value;
}

// -----------------------------------------------------------------------------

describe("the custom-fields page, scoped to one of its brand's catalogues", () => {
  let bench: Bench | undefined;

  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(() => {
    bench?.wrapper.unmount();
    bench = undefined;
    resetDom();
    server?.resetHandlers();
  });

  it(
    "@AC-1 offers every catalogue the custom-fields module itself declares",
    { timeout: 40000 },
    async () => {
      expect(clientCustomFields.useList).toBe(useClientCustomFields);
      expect(clientCustomFields.useList?.scopeMatrix).toBe(
        CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX
      );

      const opened = await benchOnCustomFieldsPage();
      bench = opened.bench;

      expect(
        sortBy(intersection(map(rows(opened.panel), textOf), CATALOGUE_LABELS))
      ).toEqual(sortBy(CATALOGUE_LABELS));
    }
  );

  it(
    "@AC-2 scopes the page to the catalogue picked, and the list re-derives there",
    { timeout: 40000 },
    async () => {
      bootPageList();
      await vi.waitFor(() => expect(listKeys()).toHaveLength(1));
      const shownKey = first(listKeys()) as unknown[];

      const opened = await benchOnCustomFieldsPage();
      bench = opened.bench;

      const row = rowFor(opened.panel, "Invoice");
      if (!row) throw new Error("the page's scope bar offered no invoice row");
      row.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await flush();

      const fullPath = bench.router.currentRoute.value.fullPath;
      expect(fullPath).toBe(`${SCOPE_PATH}/for/invoice`);

      const picked = parseScopeSuffix(
        fullPath.replace(`/${CLIENT_CUSTOM_FIELDS_ROUTE}/`, "")
      );
      expect(picked.context?.type).toBe(ClientCustomFieldsContextTypes.INVOICE);

      bootPageList(picked.context?.type);
      await vi.waitFor(() => expect(listKeys()).toHaveLength(2));

      const derived = reject(listKeys(), key => isEqual(key, shownKey));
      expect(derived).toHaveLength(1);
      expect(JSON.stringify(first(derived))).toContain(
        ClientCustomFieldsContextTypes.INVOICE
      );
      expect(listKeys()).toContainEqual(shownKey);
    }
  );
});
