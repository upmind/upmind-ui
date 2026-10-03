// -----------------------------------------------------------------------------
/**
 * @fileoverview Legacy-Invoices Scenario Fixtures Generator (ADR 035, FE-3145)
 *
 * ## Job To Be Done
 * Record ONE folder per step of each DRIVEN `legacy-invoices.feature` scenario
 * against real staging — the verbatim answers `legacy-invoices.replay.int.test.ts`
 * replays. Run on demand, ONE scenario at a time:
 *
 *   pnpm fixtures:generate legacy-invoices --scenario "<exact scenario title>"
 *
 * A bare `pnpm fixtures:generate legacy-invoices` re-records EVERY scenario.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix. It has no assertions: an `it()` succeeds
 * when the capture completes.
 *
 * ## How a client-self archive is arranged (the staff-minted client token)
 * The default staging test client holds ZERO imported invoices; the eight
 * imported-invoice rows on staging each belong to a DIFFERENT client, and the
 * resource is read-only to clients. So a client-self archive is recorded exactly
 * the way legacy's admin "login as" reaches it (vue-app
 * store/modules/auth/admin/index.ts:479-496 `impersonateClient`): with the STAFF
 * token, list `api/admin/import_invoice_data`, pick the owning client of a row,
 * then mint that client's own token the legacy way —
 * `POST api/admin/clients/${clientId}/access_token`. Every client-self scenario
 * is recorded as its owning client, under that minted token. The owner and the
 * record id are PICKED FROM the admin listing each run and READ OFF the recording
 * at replay — never a copied literal. These are reads only; nothing on staging is
 * mutated, so there is nothing to restore (ADR 035 §3).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintStaffToken
} from "../../auth/__tests__/auth.tokens";
import {
  ensureFixtureClient,
  OVERDUE_NUMBER
} from "./legacy-invoices.import-fixture";
import { filter, find } from "lodash-es";
import type { FixtureClient } from "./legacy-invoices.import-fixture";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (e.g. set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set " +
          "it in .env.recording). The API resolves the brand from the " +
          'Origin header; without it every call returns 404 "Domain not found!".'
      );
    })();

const feature = readFileSync(
  join(import.meta.dirname, "legacy-invoices.feature"),
  "utf-8"
);

/** The base archive path both cells read. */
const BASE = "/api/import_invoice_data";

/** The single-read include the `useLegacyInvoice` boot issues (services contract). */
const ONE_WITH = "with_staged_imports=1&with=import.credentials,import.source";

/**
 * The production session `/self` include (session-store's own, verbatim),
 * recorded in each scenario's boot step so the replay seed resolves the session
 * as THIS acting client. The archive read is id-less on the wire, but the
 * collection's availability read embeds the client id, so the seeded identity
 * and the recorded availability read must be the same client.
 */
const SELF_WITH =
  "/api/self?with_count=actor.child_client_configs&with=actor," +
  "actor.account,actor.brand,actor.image,actor.parent_client_config.parent_client," +
  "actor.parent_client_config.parent_client.image,accounts,delegated_ids,enabled_modules";

/**
 * The collection's own availability read (production d87d8cc828): the signed-in
 * client's record with the `legacy_invoices` relation requested, so the API
 * computes `has_legacy_invoices`. Fired at collection boot — every scenario's
 * boot step records it.
 */
const availabilityUrl = (clientId: string): string =>
  `/api/clients/${clientId}?with=legacy_invoices`;

// -----------------------------------------------------------------------------

/** Plain, UNCAPTURED authed call — admin listing, impersonation, id resolution. */
async function call(
  method: string,
  path: string,
  accessToken: string
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    }
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null)
  };
}

type AdminRow = {
  id: string;
  client_id: string;
  number: string;
  status_id: string;
};

/** The admin listing of every imported-invoice row and its owning client. */
async function adminRows(staffToken: string): Promise<AdminRow[]> {
  const { body } = await call(
    "GET",
    "/api/admin/import_invoice_data?limit=50",
    staffToken
  );
  return filter(
    (body as { data?: AdminRow[] })?.data ?? [],
    row => !!row.id && !!row.client_id
  );
}

/** Mint a client's own token the legacy "login as" way, or `undefined` if refused. */
async function impersonate(
  staffToken: string,
  clientId: string
): Promise<IToken | undefined> {
  const { body } = await call(
    "POST",
    `/api/admin/clients/${clientId}/access_token`,
    staffToken
  );
  const token = (
    (body as { access_token?: string }).access_token
      ? body
      : (body as { data?: IToken }).data
  ) as IToken | undefined;
  return token?.access_token ? token : undefined;
}

/** The status code the single read's content carries, read off an impersonated read. */
async function statusCodeOf(
  clientToken: string,
  recordId: string
): Promise<string | undefined> {
  const { body } = await call(
    "GET",
    `${BASE}/${recordId}?${ONE_WITH}`,
    clientToken
  );
  return (body as { data?: { content?: { status?: { code?: string } } } })?.data
    ?.content?.status?.code;
}

type Owner = { token: IToken; row: AdminRow };

/**
 * The collection boot every signed-in scenario makes: the session's own `/self`
 * (the replay seed), the per-client availability read (`has_legacy_invoices`),
 * and the archive list. `clientId` is the session's active client, the id the
 * availability read is keyed on.
 */
const bootRequests =
  (clientId: string) =>
  async (generator: Generator): Promise<void> => {
    await generator.get(SELF_WITH);
    await generator.get(availabilityUrl(clientId));
    await generator.get(BASE);
  };

/** Impersonate the owner of the FIRST row an admin listing exposes that we can log in as. */
async function firstOwner(
  staffToken: string,
  rows: AdminRow[]
): Promise<Owner | undefined> {
  for (const row of rows) {
    const token = await impersonate(staffToken, row.client_id);
    if (token) return { token, row };
  }
  return undefined;
}

/** Impersonate the owner whose single-read content carries the given status code. */
async function ownerWithStatus(
  staffToken: string,
  rows: AdminRow[],
  code: string
): Promise<Owner | undefined> {
  for (const row of rows) {
    const token = await impersonate(staffToken, row.client_id);
    if (!token) continue;
    if ((await statusCodeOf(token.access_token, row.id)) === code)
      return { token, row };
  }
  return undefined;
}

// -----------------------------------------------------------------------------

/** The Background step every scenario in the Rule opens with. */
const OPEN =
  "I am an authenticated client reading my archive of imported invoices";

describe("Legacy-Invoices scenario recordings", () => {
  let staffToken: string;
  let rows: AdminRow[];
  const prepared = new Set<string>();

  /** Records the requests one step makes into that step's own folder, as `token`. */
  async function recordStep(
    scenario: string,
    step: string,
    token: IToken,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, feature, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        feature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: "legacy-invoices"
    });
    generator.setBearerToken(token.access_token);
    await requests(generator);
    generator.save();
  }

  beforeAll(async () => {
    staffToken = (await mintStaffToken()).access_token;
    rows = await adminRows(staffToken);
    if (rows.length === 0)
      throw new Error(
        "admin api/admin/import_invoice_data returned no rows — cannot arrange " +
          "a client-self archive to record."
      );
  }, 60000);

  afterAll(() => undefined);

  // --- AC-1: the archive read — the client's own imported invoices -----------

  describe("I read my archive of imported invoices", () => {
    const scenario = "I read my archive of imported invoices";
    let owner: Owner;
    beforeAll(async () => {
      const found = await firstOwner(staffToken, rows);
      if (!found)
        throw new Error(`${scenario}: no impersonable owning client found.`);
      owner = found;
    }, 60000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, owner.token, bootRequests(owner.row.client_id))
    );
  });

  // --- AC-5: availability — an owning client reports its archive available ---
  // The archive's availability reads `GET /api/clients/{clientId}?with=legacy_invoices`
  // (`has_legacy_invoices`), keyed on the session's active client. Seed the
  // OWNING client (its own `/self` in the Background step) so that read is made
  // for a client who genuinely holds imported invoices.

  describe("My archive reports itself available when I have imported invoices", () => {
    const scenario =
      "My archive reports itself available when I have imported invoices";
    let owner: Owner;
    beforeAll(async () => {
      const found = await firstOwner(staffToken, rows);
      if (!found)
        throw new Error(`${scenario}: no impersonable owning client found.`);
      owner = found;
    }, 60000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, owner.token, bootRequests(owner.row.client_id))
    );
  });

  // --- AC-5: the empty archive (the default test client holds zero rows) -----

  describe("My archive reports an empty result when it holds no rows", () => {
    const scenario = "My archive reports an empty result when it holds no rows";
    const emptyStep = "I open my empty archive";
    let emptyToken: IToken;
    let emptyClientId: string;
    beforeAll(async () => {
      emptyToken = await mintClientToken();
      const { body } = await call(
        "GET",
        "/api/self?with=actor",
        emptyToken.access_token
      );
      const data = (body as { data?: { id?: string; actor?: { id?: string } } })
        ?.data;
      emptyClientId = data?.actor?.id ?? data?.id ?? "";
    }, 30000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, emptyToken, bootRequests(emptyClientId))
    );
    it(emptyStep, () =>
      recordStep(scenario, emptyStep, emptyToken, g => g.get(BASE))
    );
  });

  // --- AC-2: narrowing (the `like` contains operator) ------------------------
  // The match step narrows to the OWNER'S OWN number (read off its row); the
  // shortfall step narrows to a value no number contains. Each is its own step,
  // its own recording — `filter[...]` is part of fixture identity.

  describe("Narrowing my archive returns only the invoices that match", () => {
    const scenario =
      "Narrowing my archive returns only the invoices that match";
    const narrowStep = "I narrow my archive to part of one invoice's number";
    const shortfallStep = "I narrow my archive to something no number contains";
    let owner: Owner;
    beforeAll(async () => {
      const found = await firstOwner(staffToken, rows);
      if (!found)
        throw new Error(`${scenario}: no impersonable owning client found.`);
      owner = found;
    }, 60000);

    const likeUrl = (contains: string): string =>
      `${BASE}?filter[number|like]=${encodeURIComponent(`%${contains}%`)}`;

    it(OPEN, () =>
      recordStep(scenario, OPEN, owner.token, bootRequests(owner.row.client_id))
    );
    it(narrowStep, () =>
      recordStep(scenario, narrowStep, owner.token, g =>
        // The trailing digits of the owner's own number — a genuine substring.
        g.get(likeUrl(owner.row.number.slice(-5)))
      )
    );
    it(shortfallStep, () =>
      recordStep(scenario, shortfallStep, owner.token, g =>
        g.get(likeUrl("ZZZNOPE"))
      )
    );
  });

  // --- AC-6: open one record, and the absent-record branch -------------------

  describe("I open one of my imported invoices", () => {
    const scenario = "I open one of my imported invoices";
    const givenStep = "one of my imported invoices";
    let owner: Owner;
    beforeAll(async () => {
      const found = await firstOwner(staffToken, rows);
      if (!found)
        throw new Error(`${scenario}: no impersonable owning client found.`);
      owner = found;
    }, 60000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, owner.token, bootRequests(owner.row.client_id))
    );
    it(givenStep, () =>
      recordStep(scenario, givenStep, owner.token, g =>
        g.get(`${BASE}/${owner.row.id}?${ONE_WITH}`)
      )
    );
  });

  describe("Opening an imported invoice that does not resolve publishes no record", () => {
    const scenario =
      "Opening an imported invoice that does not resolve publishes no record";
    const givenStep = "an imported invoice id that does not resolve";
    const UNKNOWN = "00000000-0000-0000-0000-000000000000";
    let owner: Owner;
    beforeAll(async () => {
      const found = await firstOwner(staffToken, rows);
      if (!found)
        throw new Error(`${scenario}: no impersonable owning client found.`);
      owner = found;
    }, 60000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, owner.token, bootRequests(owner.row.client_id))
    );
    it(givenStep, () =>
      recordStep(scenario, givenStep, owner.token, g =>
        g.get(`${BASE}/${UNKNOWN}?${ONE_WITH}`)
      )
    );
  });

  // --- AC-7: the paid condition, as an arranged state ------------------------

  describe("A paid imported invoice reports itself paid", () => {
    const scenario = "A paid imported invoice reports itself paid";
    const givenStep = "one of my imported invoices that is paid";
    let owner: Owner;
    beforeAll(async () => {
      const found = await ownerWithStatus(staffToken, rows, "invoice_paid");
      if (!found)
        throw new Error(
          `${scenario}: no impersonable client owns a row whose content status ` +
            "code is invoice_paid."
        );
      owner = found;
    }, 60000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, owner.token, bootRequests(owner.row.client_id))
    );
    it(givenStep, () =>
      recordStep(scenario, givenStep, owner.token, g =>
        g.get(`${BASE}/${owner.row.id}?${ONE_WITH}`)
      )
    );
  });

  // --- AC-8: download the PDF document ---------------------------------------

  describe("I download an imported invoice's document", () => {
    const scenario = "I download an imported invoice's document";
    const givenStep = "one of my imported invoices with a built document";
    const downloadStep = "I download its document";
    let owner: Owner;
    beforeAll(async () => {
      const found = await firstOwner(staffToken, rows);
      if (!found)
        throw new Error(`${scenario}: no impersonable owning client found.`);
      owner = found;
    }, 60000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, owner.token, bootRequests(owner.row.client_id))
    );
    it(givenStep, () =>
      recordStep(scenario, givenStep, owner.token, g =>
        g.get(`${BASE}/${owner.row.id}?${ONE_WITH}`)
      )
    );
    it(downloadStep, () =>
      recordStep(scenario, downloadStep, owner.token, g =>
        g.get(`${BASE}/${owner.row.id}/download_pdf`)
      )
    );
  });

  // === COMMITTED-SET SCENARIOS — the dedicated synthetic client ==============
  // AC-3 / AC-4 / AC-14 / AC-7-overdue read ONE dedicated client whose multi-page
  // archive, varied totals and dates, and overdue row are created ONCE through
  // the staging import factory (committed, KEPT — operator ruling 2026-10-02) and
  // found by the `LI-` number marker on every run (`ensureFixtureClient`).

  // --- AC-7: the overdue condition, off a real imported overdue row ----------

  describe("An overdue imported invoice reports itself overdue", () => {
    const scenario = "An overdue imported invoice reports itself overdue";
    const givenStep = "one of my imported invoices that is overdue";
    let fx: FixtureClient;
    let overdueId: string;
    beforeAll(async () => {
      fx = await ensureFixtureClient();
      const row = find(fx.rows, r => r.number === OVERDUE_NUMBER);
      if (!row) throw new Error(`${scenario}: no ${OVERDUE_NUMBER} row.`);
      overdueId = row.id;
    }, 300000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, fx.token, bootRequests(fx.clientId))
    );
    it(givenStep, () =>
      recordStep(scenario, givenStep, fx.token, g =>
        g.get(`${BASE}/${overdueId}?${ONE_WITH}`)
      )
    );
  });

  // The collection boot a paged/ordered scenario records: /self, the availability
  // read, then the archive's FIRST PAGE exactly as the module reads it (limit 10,
  // offset 0, newest-first) so page-1 content is the real page.
  const pagedBoot =
    (clientId: string) =>
    async (generator: Generator): Promise<void> => {
      await generator.get(SELF_WITH);
      await generator.get(availabilityUrl(clientId));
      await generator.get(`${BASE}?order=-create_datetime&limit=10&offset=0`);
    };

  // --- AC-4: the page window and the server's own total ----------------------

  describe("I am given one page of my archive at a time, with the server's total", () => {
    const scenario =
      "I am given one page of my archive at a time, with the server's total";
    const nextStep = "I ask for the next page of my archive";
    let fx: FixtureClient;
    beforeAll(async () => {
      fx = await ensureFixtureClient();
    }, 300000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, fx.token, pagedBoot(fx.clientId))
    );
    it(nextStep, () =>
      recordStep(scenario, nextStep, fx.token, g =>
        g.get(`${BASE}?order=-create_datetime&limit=10&offset=10`)
      )
    );
  });

  // --- AC-3: ordering — amount ascending decorrelates from the default date order

  describe("Ordering my archive reorders the invoices I am given", () => {
    const scenario = "Ordering my archive reorders the invoices I am given";
    const orderStep = "I order my archive by total amount";
    let fx: FixtureClient;
    beforeAll(async () => {
      fx = await ensureFixtureClient();
    }, 300000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, fx.token, pagedBoot(fx.clientId))
    );
    it(orderStep, () =>
      recordStep(scenario, orderStep, fx.token, g =>
        g.get(`${BASE}?order=total_amount&limit=10&offset=0`)
      )
    );
  });

  // --- AC-14: an over-shot page recovers onto the last page ------------------

  describe("Asking beyond my archive's last page lands me on the last page", () => {
    const scenario =
      "Asking beyond my archive's last page lands me on the last page";
    const overshootStep = "I ask for a page beyond my archive's last page";
    let fx: FixtureClient;
    beforeAll(async () => {
      fx = await ensureFixtureClient();
    }, 300000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, fx.token, pagedBoot(fx.clientId))
    );
    it(overshootStep, () =>
      recordStep(scenario, overshootStep, fx.token, g =>
        g.get(`${BASE}?order=-create_datetime&limit=10&offset=10`)
      )
    );
  });

  // --- AC-14: re-ordering a non-first page returns it to its first page ------

  describe("Narrowing or re-ordering my archive returns it to its first page", () => {
    const scenario =
      "Narrowing or re-ordering my archive returns it to its first page";
    const offPageStep = "my archive is not on its first page";
    const reorderStep = "I narrow or re-order my archive";
    let fx: FixtureClient;
    beforeAll(async () => {
      fx = await ensureFixtureClient();
    }, 300000);

    it(OPEN, () =>
      recordStep(scenario, OPEN, fx.token, pagedBoot(fx.clientId))
    );
    it(offPageStep, () =>
      recordStep(scenario, offPageStep, fx.token, g =>
        g.get(`${BASE}?order=-create_datetime&limit=10&offset=10`)
      )
    );
    it(reorderStep, () =>
      recordStep(scenario, reorderStep, fx.token, g =>
        g.get(`${BASE}?order=total_amount&limit=10&offset=0`)
      )
    );
  });
});
