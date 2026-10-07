// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/__tests__/legacy-invoices.import-fixture
 * @description Find-or-create the ONE dedicated synthetic client whose imported
 * invoices the committed-set scenarios read (AC-3 ordering, AC-4 paging, AC-14
 * reset/clamp, AC-7 overdue). The client and its rows are created ONCE through
 * the staging import factory (`tests/fixtures/imports`) as a COMMITTED import and
 * KEPT on staging (operator ruling 2026-10-02 — committed import data stays).
 * Every subsequent run FINDS them by the stable `LI-` number marker and imports
 * only when absent, exactly like `ensureArrangedInvoice` in `invoices.fixtures.ts`.
 *
 * This is recording-time arrangement, not a runtime module import — the recorder
 * reads the dedicated client's own archive AS the client (a staff-minted client
 * token, the legacy "login as"), and the replay plays only those recordings.
 */

import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import {
  buildImportSet,
  importToStaging
} from "@upmind-automation/test-fixtures/imports/import-factory";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain; recording lane, not the runtime module graph.
import { mintStaffToken } from "../../auth/__tests__/auth.tokens";
import { filter, find, map } from "lodash-es";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = (process.env.VITE_API_URL ?? "").replace(/\/$/, "");
const ORIGIN = (process.env.RECORDING_BRAND_ORIGIN ?? "").replace(/\/$/, "");

/** The recording brand the recorders arrange against (QA Automation Testing). */
const BRAND_ID = "2785d26e-9678-3d16-999f-314502e70439";

/** The stable number marker every dedicated-client invoice carries. */
export const FIXTURE_MARKER = "LI-";

/** The overdue row's number — the one AC-7 overdue opens. */
export const OVERDUE_NUMBER = "LI-OVERDUE";

type AdminRow = { id: string; client_id: string; number: string };

type ApiBody = {
  data?: unknown;
  access_token?: string;
  error?: { message?: string };
} | null;

function headers(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Origin: ORIGIN,
    Authorization: `Bearer ${token}`,
    "Run-As": "user"
  };
}

async function call(
  method: string,
  path: string,
  token: string,
  body?: unknown
): Promise<{ status: number; body: ApiBody }> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: headers(token),
    body: body == null ? undefined : JSON.stringify(body)
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

/** Every `LI-` row on staging, read off the admin listing. */
async function fixtureRows(staffToken: string): Promise<AdminRow[]> {
  const { body } = await call(
    "GET",
    "/api/admin/import_invoice_data?limit=100",
    staffToken
  );
  return filter(
    (body?.data ?? []) as AdminRow[],
    row => !!row.number && row.number.startsWith(FIXTURE_MARKER)
  );
}

/** The committed import set: one dedicated client, a product, a contract, and the invoices. */
function fixtureSet() {
  const invoices: Record<string, string>[] = [];
  for (let i = 1; i <= 12; i++)
    invoices.push({
      id: `pg${i}`,
      client_id: "li-client",
      number: `LI-PG-${String(i).padStart(2, "0")}`,
      status: i % 2 ? "invoice_unpaid" : "invoice_paid",
      due_date: "2030-06-01",
      created_at: `2030-${String(i).padStart(2, "0")}-01 00:00:00`,
      total_amount: `${i * 10}.00`,
      net_amount: `${i * 10}.00`,
      invoice_product_id: `ip-pg${i}`
    });
  invoices.push({
    id: "ovd",
    client_id: "li-client",
    number: OVERDUE_NUMBER,
    status: "invoice_overdue",
    due_date: "2020-01-01",
    created_at: "2029-01-01 00:00:00",
    total_amount: "77.00",
    net_amount: "77.00",
    invoice_product_id: "ip-ovd"
  });
  return buildImportSet({
    brandId: BRAND_ID,
    staged: false,
    name: "li-fixture",
    clients: [
      {
        id: "li-client",
        has_login: "1",
        verified: "1",
        email: "li-fixture-client@example.com",
        first_name: "LIFIXTURE",
        last_name: "Client",
        company_name: "",
        address_address_1: "1 Fixture St",
        address_city: "Testville",
        address_postcode: "TE5 7XX",
        address_country_code: "GB"
      }
    ],
    products: [{ id: "p1" }],
    contracts: [{ id: "ct1", client_id: "li-client" }],
    invoices
  });
}

export type FixtureClient = {
  token: IToken;
  clientId: string;
  rows: AdminRow[];
};

/**
 * Find the dedicated client and its rows, importing them once (committed) if
 * absent, and return a staff-minted client token for it. Enables the client's
 * login the legacy way if staff's first mint answers 409 "Customer login
 * disabled!".
 */
export async function ensureFixtureClient(): Promise<FixtureClient> {
  const staff = (await mintStaffToken()).access_token;

  let rows = await fixtureRows(staff);
  if (rows.length === 0) {
    await importToStaging(fixtureSet(), {
      apiUrl: API_URL,
      origin: ORIGIN,
      token: staff
    });
    rows = await fixtureRows(staff);
  }
  const clientId = find(rows, r => r.number === OVERDUE_NUMBER)?.client_id;
  if (!clientId)
    throw new Error(
      "legacy-invoices import fixture: no dedicated client resolved after import."
    );

  let imp = await call(
    "POST",
    `/api/admin/clients/${clientId}/access_token`,
    staff
  );
  if (imp.status === 409) {
    await call("PATCH", `/api/admin/clients/${clientId}`, staff, {
      has_login: true
    });
    imp = await call(
      "POST",
      `/api/admin/clients/${clientId}/access_token`,
      staff
    );
  }
  const token = (imp.body?.access_token
    ? imp.body
    : imp.body?.data) as unknown as IToken | undefined;
  if (!token?.access_token)
    throw new Error(
      `legacy-invoices import fixture: could not mint the dedicated client's ` +
        `token (${imp.status} ${imp.body?.error?.message ?? ""}).`
    );

  return { token, clientId, rows: map(rows, r => r) };
}

/** The staging credentials check these helpers need (mirrors the recorder). */
export const importFixtureCredentials = API_CREDENTIALS;
