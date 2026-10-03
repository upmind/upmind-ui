/**
 * @fileoverview LI-1 (FE-3230) legacy-invoices fixture recorder
 *
 * ## Job To Be Done
 * Record the client×self `api/import_invoice_data*` responses that LI-1's unit
 * and integration tests replay. Every capture is the CLIENT path — this file
 * never calls `api/admin/…`, because the admin cell is Out of Scope on FE-3230.
 *
 * ## Why this file exists
 * The agent session that authored LI-1 is sandboxed out of both credential
 * entry and live account data, so it cannot log in to staging. An operator runs
 * this script; the script logs in, captures, and saves. No credential is ever
 * written to disk or echoed — it is read from the environment and used once.
 *
 * ## Usage
 *   UM_USER='<client login>' UM_PASS='<password>' \
 *     node --experimental-strip-types tests/fixtures/record-legacy-invoices.ts
 *
 * Optional environment:
 *   TARGET_API          default https://api.staging.upmind.io
 *   LEGACY_INVOICE_ID   pin the detail/PDF captures to one record;
 *                       omitted, the first row of the list is used
 *
 * ## What it captures (maps 1:1 to the FE-3230 ACs)
 *   AC1  GET /api/import_invoice_data                      — the plain list
 *   AC2  GET /api/import_invoice_data?filter[number]=…     — a filtered list
 *   AC3  GET /api/import_invoice_data?order=…              — a sorted list
 *   AC4  GET /api/import_invoice_data?limit=…&offset=…     — a paginated list
 *   AC6  GET /api/import_invoice_data/{id}                 — the rich detail
 *   AC8  GET /api/import_invoice_data/{id}/download_pdf    — the blob read
 *
 * The recorder ALSO captures the list with `with_staged_imports=1` twice — with
 * and without — because audit drift row D5 records that the oracle's client-self
 * list sends neither that param nor `filter[client_id]`, while AC1's text says
 * it does. Two fixtures settle which shape the wire actually answers.
 */

import { ApiFixtureGenerator } from "./api-fixture-generator.ts";

// --- configuration

const TARGET_API = process.env.TARGET_API || "https://api.staging.upmind.io";
const UM_USER = process.env.UM_USER;
const UM_PASS = process.env.UM_PASS;
const PINNED_ID = process.env.LEGACY_INVOICE_ID;

/**
 * The staging API resolves the BRAND from the caller's origin, not from the
 * token request body. A login posted with no origin answers 401 even when the
 * credentials are right, so the brand storefront is sent on every call.
 */
const BRAND_ORIGIN = process.env.BRAND_ORIGIN;

const LIST = "/api/import_invoice_data";

// --- helpers

/** Headers that tell the API which brand this caller belongs to. */
function brandHeaders(): Record<string, string> {
  if (!BRAND_ORIGIN) return {};
  return { Origin: BRAND_ORIGIN, Referer: `${BRAND_ORIGIN}/` };
}

/** Exchange a client login for a bearer token. Never logged, never saved. */
async function login(): Promise<string> {
  const res = await fetch(`${TARGET_API}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...brandHeaders()
    },
    body: JSON.stringify({
      grant_type: "password",
      username: UM_USER,
      password: UM_PASS
    })
  });

  if (!res.ok) {
    // The body names WHICH check failed (bad credentials vs unknown brand),
    // which is the difference between a typo and a missing BRAND_ORIGIN.
    const detail = await res.text().catch(() => "");
    throw new Error(
      `[record:legacy-invoices] login failed: ${res.status} ${res.statusText}\n` +
        detail.slice(0, 500)
    );
  }

  const json = (await res.json()) as {
    access_token?: string;
    data?: { access_token?: string };
  };
  const token = json.access_token ?? json.data?.access_token;

  if (!token) {
    throw new Error("[record:legacy-invoices] login returned no access_token");
  }

  return token;
}

/** Pull the first legacy-invoice id out of whatever envelope the list returns. */
function firstId(body: unknown): string | undefined {
  const rows = (body as { data?: unknown })?.data ?? body;
  if (!Array.isArray(rows)) return undefined;
  const row = rows[0] as { id?: string } | undefined;
  return row?.id;
}

// --- main

async function main(): Promise<void> {
  if (!UM_USER || !UM_PASS) {
    console.error(
      "[record:legacy-invoices] Set UM_USER and UM_PASS to a CLIENT login that\n" +
        "owns imported invoices, then re-run. Example:\n\n" +
        "  UM_USER='someone@example.com' UM_PASS='…' \\\n" +
        "    node --experimental-strip-types tests/fixtures/record-legacy-invoices.ts\n"
    );
    process.exitCode = 1;
    return;
  }

  const generator = new ApiFixtureGenerator(TARGET_API, {
    caseName: "legacy-invoices",
    defaultHeaders: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...brandHeaders()
    }
  });

  const token = await login();
  generator.setBearerToken(token);

  // AC1 — the list, in both request shapes, so D5 is settled from the wire.
  const plain = await generator.get(LIST);
  await generator.get(`${LIST}?with_staged_imports=1`);

  if (plain.status !== 200) {
    throw new Error(
      `[record:legacy-invoices] the list returned ${plain.status}; this account ` +
        "may not own any imported invoices."
    );
  }

  // AC2 — filter. `number` is the one filter key a recorded row can always fill.
  const rows = ((plain.body as { data?: unknown })?.data ?? []) as Array<{
    id?: string;
    number?: string;
  }>;
  const sample = rows[0];

  if (sample?.number) {
    await generator.get(
      `${LIST}?filter[number]=${encodeURIComponent(sample.number)}`
    );
  } else {
    console.warn(
      "[record:legacy-invoices] no row number — AC2 capture skipped"
    );
  }

  // AC3 — sort, the oracle's default: create_datetime DESC.
  await generator.get(`${LIST}?order=-create_datetime`);

  // AC4 — pagination.
  await generator.get(`${LIST}?limit=2&offset=0`);

  // AC6 — the rich detail read.
  const id = PINNED_ID || firstId(plain.body);

  if (!id) {
    console.warn(
      "[record:legacy-invoices] no legacy invoice id found — AC6 and AC8 skipped.\n" +
        "Set LEGACY_INVOICE_ID to record them."
    );
    generator.save();
    return;
  }

  await generator.get(
    `${LIST}/${id}?with_staged_imports=1&with=import.credentials,import.source`
  );

  // AC8 — the PDF read. The generator stores a null body for a non-JSON
  // response, so the fixture proves the status and the route, and the
  // content-type is printed here for the integration test to assert against.
  const pdf = await generator.get(`${LIST}/${id}/download_pdf`, {
    Accept: "application/pdf"
  });
  console.log(`[record:legacy-invoices] download_pdf status ${pdf.status}`);

  generator.save();
}

await main();
