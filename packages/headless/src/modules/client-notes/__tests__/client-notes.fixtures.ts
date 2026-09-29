// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Notes (Vault) API Fixtures Generator (ADR 025 §A1.3 / parity.yaml row X1)
 *
 * ## Job To Be Done
 * Declare the real `clients/{id}/vault[...]` endpoints the `client-notes`
 * module hits for its ONE in-scope cell (client x self) and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir — the
 * same files the integration tests replay through MSW. Run on demand:
 *
 *   pnpm fixtures:generate client-notes
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal `*.test.ts` / `*.int.test.ts` suites
 * by the `*.fixtures.ts` suffix. It has no assertions: an `it()` succeeds when
 * the capture completes. `save()` in `afterAll` writes every capture once.
 *
 * This module starts from ZERO baseline coverage (parity.yaml row X1) — there
 * is no prior recorded acceptance anywhere for the vault, so every capture
 * below is a first recording, not a re-recording.
 *
 * ## Captures (parity.yaml rows C1-C17, M1-M9, X1-X5)
 * `get-clients-id-vault` (list, with= the full relation expansion — C1/C12) ·
 * `get-clients-id-vault-case-*-eq-0` / `-1` (X2's two-sided proof of the
 * filter[encrypted|eq] wire form — C2/AC-31) · label / pinned filter captures
 * (C3/C4) · two `case=page-*` captures (C6, caller limit=2) · six
 * `case=order-*` captures (C7/X4 — label, -label, pinned, -pinned,
 * created_at, -created_at; an endpoint 500 on any one is the gate parity.yaml
 * row X4 names — the column is deleted from the schema enum, never shipped
 * hopefully) · `post-clients-id-vault` (create a note — M3) and
 * `?case=secret` (create a secret with a label — M4) ·
 * `get-clients-id-vault-id` (load one — M1/loadOne) · `.../decrypt` captured
 * TWICE with a `case` disambiguator (C11 — reveal is never cached, so a
 * second reveal must fire a second, distinct GET) · pin/unpin, convert both
 * directions, and a five-key edit (C8/C10/M5) · delete, plus a genuine 4xx
 * against a non-existent id (C9) · the brand-readiness bootstrap
 * (`get-org-modules`, `get-brand-settings`,
 * `get-config-brand-values-keys-security-ui-allow-vault`) —
 * `loadLookups` waits on this via `ensureBrandReady()` before the vault is
 * ever addressed, mirroring the client-phone/client-address precedent.
 * NO `admin/*` captures — those belong to the dropped staff cell (S1-S6).
 *
 * ## Why the paged/ordered captures carry a `?case=` marker
 * `limit`/`offset`/`order` sit in the naming utility's `EXCLUDE_PARAMS`, so
 * reads of the same collection differing only by them would share ONE fixture
 * identity and overwrite each other. `case` is an identity param — the same
 * disambiguator `client-phone.fixtures.ts` and `client-address.fixtures.ts`
 * use for their own paged/ordered captures.
 *
 * ## Staging hygiene
 * Every mutation targets a vault asset this run CREATES, and the run deletes
 * it again at the end — a note and a secret, each exercised through pin,
 * convert, edit, decrypt and delete before removal.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintGuestToken,
  mintStaffToken
} from "../../auth/__tests__/auth.tokens";
import {
  filter,
  find,
  forEach,
  includes,
  kebabCase,
  map,
  split
} from "lodash-es";
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

const recordingsDir = join(import.meta.dirname, "fixtures");

/** parity.yaml row C12's exact with= list — URL scoping, not criteria. */
const WITH = [
  "contract_product",
  "contract_product.product.image",
  "contract_product.product.brand.currency",
  "author_user",
  "author_user.image",
  "author_client",
  "author_client.image",
  "editor_user",
  "editor_user.image",
  "editor_client",
  "editor_client.image"
].join(",");

// -----------------------------------------------------------------------------

async function call(
  method: string,
  path: string,
  accessToken: string,
  body?: unknown
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    },
    body: body == null ? undefined : JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null)
  };
}

async function fetchClientId(accessToken: string): Promise<string | undefined> {
  const { body } = await call("GET", "/api/self?with=actor", accessToken);
  const data = (body as { data?: { id?: string; actor?: { id?: string } } })
    ?.data;
  return data?.actor?.id ?? data?.id;
}

// -----------------------------------------------------------------------------
// Admin brand-config arrange (FE-3145, AC-14 gate-OFF) — the staff administrator
// switches the vault feature flag off, the client's boot is recorded reading it
// off, then the flag is restored. Same recipe as commit 442cc3d9d.
// -----------------------------------------------------------------------------

type BrandField = {
  code?: string;
  value?: { value?: unknown } | null;
  required?: boolean;
};
type BrandGroup = {
  code?: string;
  fields?: { data?: BrandField[] } | BrandField[];
};

async function resolveBrandId(clientAccessToken: string): Promise<string> {
  const { body } = await call("GET", "/api/brand/settings", clientAccessToken);
  const id = String((body as { data?: { id?: string } })?.data?.id ?? "");
  if (!id)
    throw new Error(
      "Could not resolve the staging brand id for the admin arrange."
    );
  return id;
}

async function readGroupFields(
  staffToken: string,
  brandId: string,
  category: string,
  group: string
): Promise<Record<string, unknown>> {
  const { status, body } = await call(
    "GET",
    `/api/admin/config/brand/categories/${category}/groups?brand_id=${brandId}&with=fields.value`,
    staffToken
  );
  if (status !== 200)
    throw new Error(`admin read of ${category}/${group} returned ${status}.`);
  const groups = (body as { data?: BrandGroup[] })?.data ?? [];
  const grp = find(groups, g => g.code === group);
  if (!grp) throw new Error(`admin group ${category}/${group} not found.`);
  const fields = Array.isArray(grp.fields)
    ? grp.fields
    : (grp.fields?.data ?? []);
  const out: Record<string, unknown> = {};
  forEach(fields, f => {
    if (!f.code) return;
    const raw = (f.value as { value?: unknown })?.value ?? null;
    out[f.code] = raw === null && f.required ? false : raw;
  });
  return out;
}

async function readBrandValue(
  staffToken: string,
  brandId: string,
  dottedKey: string
): Promise<unknown> {
  const [category, group, field] = split(dottedKey, ".");
  const fields = await readGroupFields(staffToken, brandId, category, group);
  return fields[field] ?? null;
}

async function writeBrandValue(
  staffToken: string,
  brandId: string,
  dottedKey: string,
  value: unknown
): Promise<void> {
  const [category, group, field] = split(dottedKey, ".");
  const fields = await readGroupFields(staffToken, brandId, category, group);
  fields[field] = value;
  const { status, body } = await call(
    "PUT",
    `/api/admin/config/brand/${category}?brand_id=${brandId}`,
    staffToken,
    { groups: { [group]: { fields } } }
  );
  if (status !== 200)
    throw new Error(
      `admin write of ${dottedKey}=${JSON.stringify(value)} returned ${status}: ${JSON.stringify(body).slice(0, 300)}`
    );
}

// -----------------------------------------------------------------------------

describe("Client-Notes (Vault) API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let noteId: string | undefined;
  let secretId: string | undefined;
  let pagingId: string | undefined;
  let labelledNoteId: string | undefined;

  const stamp = Date.now().toString().slice(-7);

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-notes"
    });

    const token = await mintClientToken();
    clientToken = token;

    const id = await fetchClientId(clientToken.access_token);
    if (!id) {
      throw new Error(
        "Could not resolve the client id from /self — cannot capture the " +
          "clients/{id}/vault fixtures."
      );
    }
    clientId = id;
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  // --- bootstrap: brand readiness (loadLookups waits on this) ---------------

  it("captures GET /api/org/modules (brand-readiness bootstrap)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get("/api/org/modules");
    generator.clearBearerToken();
  });

  it("captures GET /api/brand/settings (brand-readiness bootstrap)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get("/api/brand/settings");
    generator.clearBearerToken();
  });

  it("captures GET /api/config/brand/values?keys=security.ui.allow_vault (C14 gate — BrandConfigKeys.CLIENT_NOTES_AND_SECRETS_ENABLED)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(
      "/api/config/brand/values?keys=security.ui.allow_vault"
    );
    generator.clearBearerToken();
  });

  // D22 (2026-09-02): BOUNDED, not `limit=0`. The unbounded capture returned
  // 984 products and wrote a 19 MB fixture — the largest sibling fixture in
  // the repo is 52 KB. `limit=0` was never needed to prove the channel, and
  // the picker this feeds is paginated, so one page IS the shape under test.
  it("captures GET /api/contracts_products?filter[clients.id]={id} (D-A lookups channel, AC-41/AC-42)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(
      `/api/contracts_products?filter[clients.id]=${clientId}&limit=3`
    );
    generator.clearBearerToken();
  });

  // client-notes-product-lookup: the async remote-select's own captures. Two
  // sequential pages (limit=2, offset 0 then 2) back the loadMore/hasMore
  // paging proof (design.md §Proof "two-page fixture"); the product.name|like
  // page is the real search response the like-filtered request is answered
  // with. limit/offset sit in the naming utility's EXCLUDE_PARAMS, so each
  // carries a `case=` identity marker — the client-phone/vault paging precedent.
  it("captures GET /api/contracts_products?...&limit=2&case=lookup-page-1 (product lookup paging, page 1)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(
      `/api/contracts_products?filter[clients.id]=${clientId}&limit=2&case=lookup-page-1`
    );
    generator.clearBearerToken();
  });

  it("captures GET /api/contracts_products?...&limit=2&offset=2&case=lookup-page-2 (product lookup paging, page 2)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(
      `/api/contracts_products?filter[clients.id]=${clientId}&limit=2&offset=2&case=lookup-page-2`
    );
    generator.clearBearerToken();
  });

  it("captures GET /api/contracts_products?...&filter[product.name|like]=%a% (product lookup search)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(
      `/api/contracts_products?filter[clients.id]=${clientId}&filter[product.name|like]=%25a%25&limit=2&case=lookup-search`
    );
    generator.clearBearerToken();
  });

  // --- create the two throwaway assets this run needs ------------------------

  it("captures POST /api/clients/{id}/vault (create a note — M3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/clients/${clientId}/vault`,
      {
        encrypted: false,
        pinned: false,
        contract_product_id: null,
        note: `prover fixture capture note ${stamp}`,
        visible_for_client: true
      }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Note create capture returned ${status}; cannot continue.`
      );
    }
    noteId = (body as { data?: { id?: string } })?.data?.id;
    if (!noteId) {
      throw new Error(
        "The note-create capture returned no id — every downstream note " +
          "capture (pin, convert, edit, delete) has nothing to address."
      );
    }
  });

  it("captures POST /api/clients/{id}/vault?case=secret (create a secret — M4)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/clients/${clientId}/vault?case=secret`,
      {
        encrypted: true,
        pinned: false,
        contract_product_id: null,
        label: `prover fixture secret ${stamp}`,
        note: `prover fixture secret value ${stamp}`,
        visible_for_client: true
      }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Secret create capture returned ${status}; cannot continue.`
      );
    }
    secretId = (body as { data?: { id?: string } })?.data?.id;
    if (!secretId) {
      throw new Error(
        "The secret-create capture returned no id — decrypt/convert have " +
          "nothing to address."
      );
    }
  });

  it("captures POST /api/clients/{id}/vault?case=note-with-label (AC-10(ii), a note that already carries a label)", async () => {
    // No captured row anywhere in this corpus is BOTH encrypted:false AND
    // carries a non-null label (every note this staging client had was
    // label-less) — AC-10(ii)'s "a note WITH a label converts with a body of
    // exactly { encrypted: true }" has nothing recorded to drive it without
    // this capture.
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/clients/${clientId}/vault?case=note-with-label`,
      {
        encrypted: false,
        pinned: false,
        contract_product_id: null,
        label: `prover fixture labelled note ${stamp}`,
        note: `prover fixture labelled note value ${stamp}`,
        visible_for_client: true
      }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Labelled-note create capture returned ${status}; cannot continue.`
      );
    }
    labelledNoteId = (body as { data?: { id?: string } })?.data?.id;
    if (!labelledNoteId) {
      throw new Error(
        "The labelled-note-create capture returned no id — AC-10(ii)'s " +
          "convert capture has nothing to address."
      );
    }
  });

  it("captures PUT .../vault/{id}?case=convert-labelled-to-secret (AC-10(ii), a note WITH a label converting)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.put(
      `/api/clients/${clientId}/vault/${labelledNoteId}?case=convert-labelled-to-secret`,
      { encrypted: true }
    );
    generator.clearBearerToken();
  });

  it("captures DELETE .../vault/{id} (cleans up the labelled-note throwaway)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.delete(`/api/clients/${clientId}/vault/${labelledNoteId}`);
    generator.clearBearerToken();
  });

  // --- the collection, and its criteria matrix -------------------------------

  it("captures GET /api/clients/{id}/vault (list, with= expansion — C1/C12)", async () => {
    generator.setBearerToken(clientToken.access_token);
    // `limit=3` is the labs page's boot window; excluded from the fixture name,
    // so this stays `get-clients-id-vault-…` and only its recorded query gains
    // the limit the forced-state corpus matches the page's read on (FE-3145).
    const { status } = await generator.get(
      `/api/clients/${clientId}/vault?with=${WITH}&with_staged_imports=1&limit=3`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `List capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
  });

  it("captures GET .../vault?filter[encrypted|eq]=0 (X2/C2, notes only)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(
      `/api/clients/${clientId}/vault?filter[encrypted|eq]=0`
    );
    generator.clearBearerToken();
  });

  it("captures GET .../vault?filter[encrypted|eq]=1 (X2/C2, secrets only)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(
      `/api/clients/${clientId}/vault?filter[encrypted|eq]=1`
    );
    generator.clearBearerToken();
  });

  it("captures GET .../vault?filter[label|like]=%prover%25 (C3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(
      `/api/clients/${clientId}/vault?filter[label|like]=%25prover%25`
    );
    generator.clearBearerToken();
  });

  it("captures GET .../vault?filter[pinned|eq]=1 (C4)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(`/api/clients/${clientId}/vault?filter[pinned|eq]=1`);
    generator.clearBearerToken();
  });

  it("captures GET .../vault?filter[pinned|eq]=0 (C4)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(`/api/clients/${clientId}/vault?filter[pinned|eq]=0`);
    generator.clearBearerToken();
  });

  it("captures GET .../vault?limit=2 pages 1 and 2 (C6, caller-supplied limit)", async () => {
    const created = await call(
      "POST",
      `/api/clients/${clientId}/vault`,
      clientToken.access_token,
      {
        encrypted: false,
        pinned: false,
        contract_product_id: null,
        note: `prover fixture paging note ${stamp}`,
        visible_for_client: true
      }
    );
    pagingId = (created.body as { data?: { id?: string } })?.data?.id;
    if (!pagingId) {
      throw new Error(
        `Could not create the throwaway note the paging capture needs ` +
          `(status ${created.status}) — pagination has no recorded second page.`
      );
    }

    generator.setBearerToken(clientToken.access_token);
    await generator.get(`/api/clients/${clientId}/vault?limit=2&case=page-1`);
    await generator.get(
      `/api/clients/${clientId}/vault?limit=2&offset=2&case=page-2`
    );
    generator.clearBearerToken();

    await call(
      "DELETE",
      `/api/clients/${clientId}/vault/${pagingId}`,
      clientToken.access_token
    );
  });

  const orderColumns: Array<{ field: string; dir: "" | "-" }> = [
    { field: "label", dir: "" },
    { field: "label", dir: "-" },
    { field: "pinned", dir: "" },
    { field: "pinned", dir: "-" },
    { field: "created_at", dir: "" },
    { field: "created_at", dir: "-" }
  ];

  for (const { field, dir } of orderColumns) {
    it(`captures GET .../vault?order=${dir}${field} (X4/C7)`, async () => {
      generator.setBearerToken(clientToken.access_token);
      const { status } = await generator.get(
        `/api/clients/${clientId}/vault?order=${dir}${field}&case=order-${dir === "-" ? "desc" : "asc"}-${field}`
      );
      generator.clearBearerToken();
      if (status >= 500) {
        console.warn(
          `[client-notes.fixtures] order=${dir}${field} returned ${status} ` +
            "— parity.yaml row X4 requires this column be DELETED from the " +
            "schema enum, not shipped hopefully. Surfacing, not working around."
        );
      }
    });
  }

  // --- the manager half -------------------------------------------------------

  it("captures GET /api/clients/{id}/vault/{id} (load one — M1)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(`/api/clients/${clientId}/vault/${noteId}`);
    generator.clearBearerToken();
  });

  it("captures GET .../vault/{id}/decrypt, twice (C11/M2 — never cached)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const first = await generator.get(
      `/api/clients/${clientId}/vault/${secretId}/decrypt?case=first-reveal`
    );
    const second = await generator.get(
      `/api/clients/${clientId}/vault/${secretId}/decrypt?case=second-reveal`
    );
    generator.clearBearerToken();
    if (first.status !== 200 || second.status !== 200) {
      throw new Error(
        `Decrypt capture returned ${first.status}/${second.status} — C11 has ` +
          "no recorded plaintext to replay."
      );
    }
  });

  // --- writes -----------------------------------------------------------------

  it("captures PUT .../vault/{id}?case=pin (C8)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.put(`/api/clients/${clientId}/vault/${noteId}?case=pin`, {
      pinned: true
    });
    generator.clearBearerToken();
  });

  it("captures GET .../vault/{id}?case=confirm-pinned (AC-8, a genuine pinned:true row)", async () => {
    // No captured `list`/`filter[pinned|eq]=1` row is ever pinned:true (this
    // staging client has none), so AC-8's toggle-from-true direction has
    // nothing recorded to replay. This captures the note THIS RUN just
    // pinned, read back before it is unpinned, for exactly that purpose.
    generator.setBearerToken(clientToken.access_token);
    await generator.get(
      `/api/clients/${clientId}/vault/${noteId}?case=confirm-pinned`
    );
    generator.clearBearerToken();
  });

  it("captures PUT .../vault/{id}?case=unpin (C8)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.put(`/api/clients/${clientId}/vault/${noteId}?case=unpin`, {
      pinned: false
    });
    generator.clearBearerToken();
  });

  it("captures PUT .../vault/{id}?case=convert-to-secret (C10 (ii), note WITH a label)", async () => {
    // AC-10(iii)'s label-less refusal is a client-side rejection with ZERO
    // requests — nothing to capture. This is the (ii) branch: a note WITH a
    // label converting to a secret.
    generator.setBearerToken(clientToken.access_token);
    await generator.put(
      `/api/clients/${clientId}/vault/${noteId}?case=convert-to-secret`,
      { encrypted: true, label: `prover fixture converted label ${stamp}` }
    );
    generator.clearBearerToken();
  });

  it("captures PUT .../vault/{id}?case=convert-to-note (C10 (i))", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.put(
      `/api/clients/${clientId}/vault/${secretId}?case=convert-to-note`,
      { encrypted: false }
    );
    generator.clearBearerToken();
  });

  it("captures PUT .../vault/{id}?case=edit (M5, the five-key body)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.put(`/api/clients/${clientId}/vault/${noteId}?case=edit`, {
      contract_product_id: null,
      label: null,
      visible_for_client: true,
      encrypted: false,
      note: `prover fixture edited note ${stamp}`
    });
    generator.clearBearerToken();
  });

  it("captures DELETE .../vault/{id} against a non-existent id (C9, a genuine 4xx)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.delete(
      `/api/clients/${clientId}/vault/00000000-0000-0000-0000-000000000000?case=error`
    );
    generator.clearBearerToken();
    if (status < 400) {
      console.warn(
        `[client-notes.fixtures] delete of a non-existent asset returned ` +
          `${status}, expected 4xx — AC-9's rejected-mutation capture no ` +
          "longer carries an error body. Inspect before relying on it."
      );
    }
  });

  it("captures DELETE .../vault/{id} (C9, success — cleans up both throwaway assets)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.delete(`/api/clients/${clientId}/vault/${noteId}`);
    await generator.delete(`/api/clients/${clientId}/vault/${secretId}`);
    generator.clearBearerToken();
  });
});

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145, ADR 035) — one recording per driven `client-notes.feature`
// scenario, one fixtures folder per step, named from the feature by
// `recordedStepDir`. Each scenario arranges the data its steps need on staging,
// records the requests its steps make in their order, and leaves staging as it
// found it. Only request-firing steps record; a step that makes no request keeps
// the empty folder `prepareScenarioDirs` laid out. `with`/`lang`/`limit`/
// `offset`/`order` are not request identity, so a re-read at a different page or
// order shares its base identity and is answered by the later-armed step.
// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-notes.feature"),
  "utf-8"
);

/** The Background step every scenario opens with — it boots and reads the vault. */
const OPEN = "I am an authenticated client acting on my own vault";

/** The vault brand-gate flag the boot reads (client-notes' own feature gate). */
const FLAG = "/api/config/brand/values?keys=security.ui.allow_vault";

type WireAsset = { id: string; encrypted?: boolean | number };

describe("Client-Notes scenario recordings", () => {
  let clientToken: IToken;
  let guestToken: IToken | undefined;
  let clientId: string;
  let productId: string | undefined;
  let originalIds: string[] = [];
  const prepared = new Set<string>();
  const stamp = Date.now().toString().slice(-7);

  const vault = () => `/api/clients/${clientId}/vault`;
  const list = () =>
    `${vault()}?with_staged_imports=1&with=${WITH}&limit=3&offset=0`;
  const pageList = (limit: number, offset: number) =>
    `${vault()}?with_staged_imports=1&with=${WITH}&limit=${limit}&offset=${offset}`;

  async function arrangeNote(note: string, label?: string): Promise<string> {
    const { body } = await call("POST", vault(), clientToken.access_token, {
      encrypted: false,
      pinned: false,
      contract_product_id: null,
      note,
      ...(label ? { label } : {}),
      visible_for_client: true
    });
    return (body as { data: { id: string } }).data.id;
  }

  async function arrangeSecret(label: string, note: string): Promise<string> {
    const { body } = await call("POST", vault(), clientToken.access_token, {
      encrypted: true,
      pinned: false,
      contract_product_id: null,
      label,
      note,
      visible_for_client: true
    });
    return (body as { data: { id: string } }).data.id;
  }

  async function pin(id: string): Promise<void> {
    await call("PUT", `${vault()}/${id}`, clientToken.access_token, {
      pinned: true
    });
  }

  async function arrangeNoteWithProduct(note: string): Promise<string> {
    const { body } = await call("POST", vault(), clientToken.access_token, {
      encrypted: false,
      pinned: false,
      contract_product_id: productId,
      note,
      visible_for_client: true
    });
    return (body as { data: { id: string } }).data.id;
  }

  async function restoreStaging(): Promise<void> {
    const { body } = await call(
      "GET",
      `${vault()}?with_staged_imports=1&limit=200`,
      clientToken.access_token
    );
    const rows = (body as { data: WireAsset[] }).data ?? [];
    const added = filter(rows, ({ id }) => !includes(originalIds, id));
    for (const { id } of added)
      await call("DELETE", `${vault()}/${id}`, clientToken.access_token);
  }

  async function recordStep(
    scenario: string,
    step: string,
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
      name: kebabCase(scenario)
    });
    generator.setBearerToken(clientToken.access_token);
    await requests(generator);
    generator.save();
  }

  /** The boot every scenario's first Background step makes: flag then list. */
  const boot = async (generator: Generator): Promise<void> => {
    await generator.get(FLAG);
    await generator.get(list());
  };
  const readList = (generator: Generator) => generator.get(list());

  /**
   * A `@signed-out` step records on the GUEST session, never the client's —
   * `seedGuestSession` leaves no client signed in, so `installGuestTokenStub`
   * is the only bearer live when the module boots, and the brand-config gate
   * read it still fires (brand config is fetchable at any time) must be
   * recorded under that same identity. No vault fixture is ever recorded
   * here — the replay wall fails the scenario by name if one ever fires.
   */
  async function recordSignedOutStep(
    scenario: string,
    step: string,
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
      name: kebabCase(scenario)
    });
    if (guestToken?.access_token)
      generator.setBearerToken(guestToken.access_token);
    await requests(generator);
    generator.save();
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();
    guestToken = await mintGuestToken();
    clientId = (await fetchClientId(clientToken.access_token)) ?? "";
    if (!clientId)
      throw new Error("Could not resolve the client id from /self.");
    const { body } = await call(
      "GET",
      `${vault()}?with_staged_imports=1&limit=200`,
      clientToken.access_token
    );
    originalIds = map((body as { data: WireAsset[] }).data ?? [], "id");

    const products = await call(
      "GET",
      `/api/contracts_products?filter[clients.id]=${clientId}&limit=1`,
      clientToken.access_token
    );
    productId = (products.body as { data?: Array<{ id: string }> }).data?.[0]
      ?.id;
  }, 30000);

  // --- AC-14: the vault gate OFF (top-level @vault-gate) ---------------------
  // The module reads the vault gate with its OWN single-key request
  // GET /api/config/brand/values?keys=security.ui.allow_vault. The staff
  // administrator switches `security.ui.allow_vault` off, the client's own gate
  // read is recorded returning it off into the scenario's "I look at my vault"
  // step, and the flag is restored (never flipped inside a recording, ADR 035).
  // With the gate off the module folds it into isAvailable and asks NOTHING of the
  // vault, so any vault request at replay is unmatched and the wall fails the
  // scenario by name.
  describe("My vault is unavailable when my brand switches it off", () => {
    const scenario = "My vault is unavailable when my brand switches it off";
    const GATE_KEY = "security.ui.allow_vault";
    let staffToken: string;
    let brandId: string;
    let original: unknown;

    beforeAll(async () => {
      staffToken = (await mintStaffToken()).access_token;
      brandId = await resolveBrandId(clientToken.access_token);
      original = await readBrandValue(staffToken, brandId, GATE_KEY);
      await writeBrandValue(staffToken, brandId, GATE_KEY, false);
    }, 30000);

    afterAll(async () => {
      await writeBrandValue(staffToken, brandId, GATE_KEY, original);
    }, 30000);

    it("When I look at my vault", () =>
      recordStep(scenario, "I look at my vault", generator =>
        generator.get(FLAG)
      ));
  });

  // --- AC-33: the vault waits on the brand's settings (held at replay) -------
  // Gate ON: a normal available boot. The delay is applied at replay by the
  // `@held-brand` tag, not recorded here — the recording is a plain boot.

  describe("My vault waits for my brand's own settings before saying it is not ready", () => {
    const scenario =
      "My vault waits for my brand's own settings before saying it is not ready";
    beforeAll(async () => {
      await arrangeNote(`prover fixture ac33 note ${stamp}`);
    });
    afterAll(restoreStaging);

    it("my brand's own settings have not yet arrived", () =>
      recordStep(
        scenario,
        "my brand's own settings have not yet arrived",
        boot
      ));
  });

  // --- AC-1: Read my own vault ----------------------------------------------

  describe("Read my own vault", () => {
    const scenario = "Read my own vault";
    beforeAll(async () => {
      await arrangeNote(`prover fixture read note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("When I open my vault", () =>
      recordStep(scenario, "I open my vault", readList));
  });

  // --- AC-3: Narrow my vault by label ---------------------------------------

  describe("Narrow my vault by label", () => {
    const scenario = "Narrow my vault by label";
    beforeAll(async () => {
      await arrangeSecret(
        `prover fixture label secret ${stamp}`,
        `prover fixture label value ${stamp}`
      );
      await arrangeNote(`prover fixture other note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("When I search my vault for part of a label", () =>
      recordStep(scenario, "I search my vault for part of a label", generator =>
        generator.get(`${list()}&filter[label|like]=%25prover%25`)
      ));
  });

  // --- AC-4: Narrow my vault to pinned or unpinned assets --------------------

  describe("Narrow my vault to pinned or unpinned assets", () => {
    const scenario = "Narrow my vault to pinned or unpinned assets";
    beforeAll(async () => {
      const pinnedId = await arrangeNote(`prover fixture pinned ${stamp}`);
      await pin(pinnedId);
      await arrangeNote(`prover fixture unpinned ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("When I choose to see only pinned assets", () =>
      recordStep(scenario, "I choose to see only pinned assets", generator =>
        generator.get(`${list()}&filter[pinned|eq]=1`)
      ));
    it("And choosing to see only unpinned assets shows me only those", () =>
      recordStep(
        scenario,
        "choosing to see only unpinned assets shows me only those",
        generator => generator.get(`${list()}&filter[pinned|eq]=0`)
      ));
    it("And clearing the choice shows me both again", () =>
      recordStep(
        scenario,
        "clearing the choice shows me both again",
        readList
      ));
  });

  // --- AC-7: Order my vault by a column I choose -----------------------------

  describe("Order my vault by a column I choose", () => {
    const scenario = "Order my vault by a column I choose";
    beforeAll(async () => {
      await arrangeNote(`prover fixture alpha ${stamp}`, `alpha ${stamp}`);
      await arrangeNote(`prover fixture bravo ${stamp}`, `bravo ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("When I first open my vault", () =>
      recordStep(scenario, "I first open my vault", readList));
    it("And when I then ask for my vault ordered by label", () =>
      recordStep(
        scenario,
        "when I then ask for my vault ordered by label, I see it ordered by label",
        generator => generator.get(`${list()}&order=label`)
      ));
    it("And asking for it in the opposite direction reverses that order", () =>
      recordStep(
        scenario,
        "asking for it in the opposite direction reverses that order",
        generator => generator.get(`${list()}&order=-label`)
      ));
  });

  // --- AC-11: Reveal one of my secrets --------------------------------------

  describe("Reveal one of my secrets, hide it again, and reveal it once more", () => {
    const scenario =
      "Reveal one of my secrets, hide it again, and reveal it once more";
    let secretId: string;
    beforeAll(async () => {
      secretId = await arrangeSecret(
        `prover fixture reveal secret ${stamp}`,
        `prover fixture reveal value ${stamp}`
      );
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("Given one of my vault assets is a secret shown to me masked", () =>
      recordStep(
        scenario,
        "one of my vault assets is a secret shown to me masked",
        generator => generator.get(`${list()}&filter[encrypted|eq]=1`)
      ));
    it("When I ask to see it", () =>
      recordStep(scenario, "I ask to see it", generator =>
        generator.get(`${vault()}/${secretId}/decrypt`)
      ));
    it("And asking to see it a second time fetches it again", () =>
      recordStep(
        scenario,
        "asking to see it a second time fetches it again, because its value was never kept",
        generator => generator.get(`${vault()}/${secretId}/decrypt`)
      ));
  });

  // --- AC-16: Know whether my vault is loading, empty, or errored -----------

  describe("Know whether my vault is loading, empty, or errored", () => {
    const scenario = "Know whether my vault is loading, empty, or errored";
    beforeAll(async () => {
      await arrangeNote(`prover fixture state note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("When I open my vault", () =>
      recordStep(scenario, "I open my vault", readList));
  });

  // --- AC-2 / AC-31: only notes, or only secrets ----------------------------

  describe("I show only my notes, or only my secrets", () => {
    const scenario = "I show only my notes, or only my secrets";
    beforeAll(async () => {
      await arrangeNote(`prover fixture notes-only note ${stamp}`);
      await arrangeSecret(
        `prover fixture notes-only secret ${stamp}`,
        `prover fixture notes-only value ${stamp}`
      );
    });
    afterAll(restoreStaging);

    const notes = (generator: Generator) =>
      generator.get(`${list()}&filter[encrypted|eq]=0`);
    const secrets = (generator: Generator) =>
      generator.get(`${list()}&filter[encrypted|eq]=1`);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("choose only notes", () =>
      recordStep(scenario, "I choose to see only my notes", notes));
    it("choose only secrets", () =>
      recordStep(
        scenario,
        "when I choose to see only my secrets I see exactly my secrets and none of my notes",
        secrets
      ));
    it("each asked of the real system", () =>
      recordStep(
        scenario,
        "only-notes and only-secrets are each asked of the real system",
        async generator => {
          await notes(generator);
          await secrets(generator);
        }
      ));
    it("together account for everything", () =>
      recordStep(
        scenario,
        "together they account for everything in my vault",
        readList
      ));
  });

  // --- AC-5: narrow to one product I bought ---------------------------------

  describe("Narrow my vault to one product I bought", () => {
    const scenario = "Narrow my vault to one product I bought";
    beforeAll(async () => {
      if (!productId)
        throw new Error(
          "no contract product on the staging client — AC-5 has no product to attach to."
        );
      await arrangeNoteWithProduct(`prover fixture product note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("narrow to that product", () =>
      recordStep(scenario, "I narrow my vault to that product", generator =>
        generator.get(`${list()}&filter[contract_product_id|eq]=${productId}`)
      ));
  });

  // --- AC-42: narrow to one of my products ----------------------------------

  describe("I can narrow my vault to one of my products", () => {
    const scenario = "I can narrow my vault to one of my products";
    beforeAll(async () => {
      if (!productId)
        throw new Error(
          "no contract product on the staging client — AC-42 has no product to attach to."
        );
      await arrangeNoteWithProduct(`prover fixture product42 note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("narrow it to one product", () =>
      recordStep(scenario, "I narrow it to one product", generator =>
        generator.get(`${list()}&filter[contract_product_id|eq]=${productId}`)
      ));
  });

  // --- AC-6: a page at a time ------------------------------------------------

  describe("Read my vault a page at a time", () => {
    const scenario = "Read my vault a page at a time";
    beforeAll(async () => {
      await arrangeNote(`prover fixture page note 1 ${stamp}`);
      await arrangeNote(`prover fixture page note 2 ${stamp}`);
      await arrangeNote(`prover fixture page note 3 ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("holds more than one page", () =>
      recordStep(
        scenario,
        "my vault holds more assets than fit on one page",
        generator => generator.get(pageList(2, 0))
      ));
    it("open a page at a time", () =>
      recordStep(scenario, "I open my vault a page at a time", generator =>
        generator.get(pageList(2, 0))
      ));
    it("next page and back", () =>
      recordStep(
        scenario,
        "I can move to the next page and back again",
        generator => generator.get(pageList(2, 2))
      ));
    it("larger or smaller page", () =>
      recordStep(
        scenario,
        "I can ask for a larger or smaller page",
        generator => generator.get(pageList(3, 0))
      ));
  });

  // --- AC-30: every sort actually sorts -------------------------------------

  describe("Every way I can sort my vault actually sorts it", () => {
    const scenario = "Every way I can sort my vault actually sorts it";
    beforeAll(async () => {
      await arrangeNote(`prover fixture sort a ${stamp}`, `alpha ${stamp}`);
      await arrangeNote(`prover fixture sort b ${stamp}`, `bravo ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("each order asked of the real system", () =>
      recordStep(
        scenario,
        "each of those orders is asked of the real system",
        async generator => {
          await generator.get(`${list()}&order=label`);
          await generator.get(`${list()}&order=pinned`);
          await generator.get(`${list()}&order=created_at`);
        }
      ));
  });

  // --- AC-8: pin and unpin --------------------------------------------------

  describe("Pin and unpin an asset from my vault list", () => {
    const scenario = "Pin and unpin an asset from my vault list";
    let pinId: string;
    beforeAll(async () => {
      pinId = await arrangeNote(`prover fixture pin toggle ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I pin it", () =>
      recordStep(scenario, "I pin it", async generator => {
        await generator.put(`${vault()}/${pinId}`, { pinned: true });
        await generator.get(list());
      }));
    it("unpinning records it as unpinned again", () =>
      recordStep(
        scenario,
        "unpinning it records it as unpinned again",
        async generator => {
          await generator.put(`${vault()}/${pinId}`, { pinned: false });
          await generator.get(list());
        }
      ));
  });

  // --- AC-9: delete, and the failure path -----------------------------------

  describe("Delete an asset from my vault list", () => {
    const scenario = "Delete an asset from my vault list";
    let deleteId: string;
    beforeAll(async () => {
      deleteId = await arrangeNote(`prover fixture delete me ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I delete it", () =>
      recordStep(scenario, "I delete it", async generator => {
        await generator.delete(`${vault()}/${deleteId}`);
        await generator.get(list());
      }));
    it("if the deletion fails I am told that", () =>
      recordStep(
        scenario,
        "if the deletion fails I am told that, and my vault records the failure for me to read",
        async generator => {
          await generator.delete(`${vault()}/${deleteId}`);
        }
      ));
  });

  // --- AC-10: convert both ways, and the label-less refusal -----------------

  describe("Turn one of my notes into a secret, and a secret back into a note", () => {
    const scenario =
      "Turn one of my notes into a secret, and a secret back into a note";
    let secretId: string;
    let labelledNoteId: string;
    beforeAll(async () => {
      secretId = await arrangeSecret(
        `prover fixture convert secret ${stamp}`,
        `prover fixture convert value ${stamp}`
      );
      labelledNoteId = await arrangeSecret(
        `prover fixture convert labelled ${stamp}`,
        `prover fixture convert labelled value ${stamp}`
      );
      await call(
        "PUT",
        `${vault()}/${labelledNoteId}`,
        clientToken.access_token,
        {
          encrypted: false
        }
      );
      // A third, UNLABELLED note — its conversion is refused client-side with
      // no request, so it needs no recording, only to exist for the step.
      await arrangeNote(`prover fixture convert unlabelled ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I turn it into a note", () =>
      recordStep(scenario, "I turn it into a note", async generator => {
        await generator.put(`${vault()}/${secretId}`, { encrypted: false });
        await generator.get(list());
      }));
    it("turning a labelled note into a secret", () =>
      recordStep(
        scenario,
        "turning a labelled note into a secret records it as a secret",
        async generator => {
          await generator.put(`${vault()}/${labelledNoteId}`, {
            encrypted: true
          });
          await generator.get(list());
        }
      ));
  });

  // === THE EDITOR (manager composable) =======================================
  // Each editor scenario opens with the shared Background (collection boot:
  // flag + list) and then boots the manager on a recorded asset id. The manager
  // reads `loadOne` (GET /vault/{id}) and, for a secret, `decrypt`
  // (GET /vault/{id}/decrypt); the brand flag is cached from the Background.

  // --- AC-18: open a secret for editing, see its real value ------------------

  describe("Open one of my secrets for editing and see its real value", () => {
    const scenario =
      "Open one of my secrets for editing and see its real value";
    let secretId: string;
    let noteId: string;
    beforeAll(async () => {
      secretId = await arrangeSecret(
        `prover fixture editor secret ${stamp}`,
        `prover fixture editor secret value ${stamp}`
      );
      noteId = await arrangeNote(`prover fixture editor note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I open it for editing", () =>
      recordStep(scenario, "I open it for editing", async generator => {
        await generator.get(`${vault()}/${secretId}`);
        await generator.get(`${vault()}/${secretId}/decrypt`);
      }));
    it("opening one of my NOTES for editing asks the server for nothing extra", () =>
      recordStep(
        scenario,
        "opening one of my NOTES for editing asks the server for nothing extra",
        generator => generator.get(`${vault()}/${noteId}`)
      ));
  });

  // --- AC-25: know the state of the editor -----------------------------------

  describe("Know the state of the editor while I use it", () => {
    const scenario = "Know the state of the editor while I use it";
    let noteId: string;
    beforeAll(async () => {
      noteId = await arrangeNote(`prover fixture editor state note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I have opened an existing vault asset for editing", () =>
      recordStep(
        scenario,
        "I have opened an existing vault asset for editing",
        generator => generator.get(`${vault()}/${noteId}`)
      ));
    it("it tells me while it is saving, when it has saved, and when the save failed", () =>
      recordStep(
        scenario,
        "it tells me while it is saving, when it has saved, and when the save failed",
        async generator => {
          await generator.put(`${vault()}/${noteId}`, {
            contract_product_id: null,
            label: null,
            visible_for_client: true,
            encrypted: false,
            note: `prover fixture editor state edited ${stamp}`
          });
          await generator.get(list());
        }
      ));
  });

  // --- AC-35: clearing the editor gives a blank note -------------------------

  describe("Clearing the editor gives me a blank note, not the one I was editing", () => {
    const scenario =
      "Clearing the editor gives me a blank note, not the one I was editing";
    let noteId: string;
    beforeAll(async () => {
      noteId = await arrangeNote(`prover fixture editor clear note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I have the editor open on a note I already have", () =>
      recordStep(
        scenario,
        "I have the editor open on a note I already have",
        generator => generator.get(`${vault()}/${noteId}`)
      ));
  });

  // --- AC-19/AC-20: write a new note, or a new secret ------------------------

  describe("I write a new note, or a new secret", () => {
    const scenario = "I write a new note, or a new secret";
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I write it as a new note and save it", () =>
      recordStep(
        scenario,
        "I write it as a new note and save it",
        async generator => {
          await generator.post(vault(), {
            encrypted: false,
            pinned: false,
            contract_product_id: null,
            note: `prover fixture new note ${stamp}`,
            visible_for_client: true
          });
          await generator.get(list());
        }
      ));
    it("I write it as a new secret with a label and save it", () =>
      recordStep(
        scenario,
        "I write it as a new secret with a label and save it",
        async generator => {
          await generator.post(vault(), {
            encrypted: true,
            pinned: false,
            contract_product_id: null,
            label: `prover fixture new secret label ${stamp}`,
            note: `prover fixture new secret value ${stamp}`,
            visible_for_client: true
          });
          await generator.get(list());
        }
      ));
  });

  // --- AC-21: change one of my existing vault assets -------------------------

  describe("Change one of my existing vault assets", () => {
    const scenario = "Change one of my existing vault assets";
    let noteId: string;
    beforeAll(async () => {
      noteId = await arrangeNote(
        `prover fixture ac21 note ${stamp}`,
        `prover fixture ac21 label ${stamp}`
      );
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I open one of my existing notes in the editor", () =>
      recordStep(
        scenario,
        "I open one of my existing notes in the editor",
        generator => generator.get(`${vault()}/${noteId}`)
      ));
    it("I change its body and save", () =>
      recordStep(scenario, "I change its body and save", async generator => {
        await generator.put(`${vault()}/${noteId}`, {
          contract_product_id: null,
          label: `prover fixture ac21 label ${stamp}`,
          visible_for_client: true,
          encrypted: false,
          note: `prover fixture ac21 changed body ${stamp}`
        });
        await generator.get(list());
      }));
  });

  // --- AC-22/AC-41: attach one of my notes to a product, and detach it -------

  describe("I attach one of my notes to a product I bought, and detach it", () => {
    const scenario =
      "I attach one of my notes to a product I bought, and detach it";
    let noteId: string;
    beforeAll(async () => {
      if (!productId)
        throw new Error(
          "no contract product on the staging client — AC-22 has no product to attach."
        );
      noteId = await arrangeNote(`prover fixture ac22 note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I open a note of mine that is attached to no product", () =>
      recordStep(
        scenario,
        "I open a note of mine that is attached to no product",
        generator => generator.get(`${vault()}/${noteId}`)
      ));
    it("I attach it to a product I bought and save", () =>
      recordStep(
        scenario,
        "I attach it to a product I bought and save",
        async generator => {
          await generator.put(`${vault()}/${noteId}`, {
            contract_product_id: productId
          });
          await generator.get(list());
        }
      ));
    it("detaching it again records it attached to nothing", () =>
      recordStep(
        scenario,
        "detaching it again records it attached to nothing",
        async generator => {
          await generator.put(`${vault()}/${noteId}`, {
            contract_product_id: null
          });
          await generator.get(list());
        }
      ));
  });

  // --- AC-23: turn an unlabelled note into a secret by giving it a label -----

  describe("Turn an unlabelled note into a secret by giving it a label", () => {
    const scenario =
      "Turn an unlabelled note into a secret by giving it a label";
    let noteId: string;
    beforeAll(async () => {
      noteId = await arrangeNote(`prover fixture ac23 unlabelled ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I open one of my label-less notes in the editor", () =>
      recordStep(
        scenario,
        "I open one of my label-less notes in the editor",
        generator => generator.get(`${vault()}/${noteId}`)
      ));
    it("giving it a label and saving stores it as a secret with that label", () =>
      recordStep(
        scenario,
        "giving it a label and saving stores it as a secret with that label",
        async generator => {
          await generator.put(`${vault()}/${noteId}`, {
            encrypted: true,
            label: `prover fixture ac23 label ${stamp}`
          });
          await generator.get(list());
        }
      ));
  });

  // --- AC-24: the form asks for a label only when writing a secret -----------
  // Every step but the Background boot is client-side (parse/validate), so this
  // scenario records only the boot flag + list.

  describe("The form asks me for a label only when I am writing a secret", () => {
    const scenario =
      "The form asks me for a label only when I am writing a secret";
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
  });

  // --- AC-36: what I wrote is still there when I come back to it -------------
  // The two body/label changes are client-side `input`s; only the editor open
  // (loadOne) makes a request beyond the Background boot.

  describe("What I wrote is still there when I come back to it", () => {
    const scenario = "What I wrote is still there when I come back to it";
    let noteId: string;
    beforeAll(async () => {
      noteId = await arrangeNote(`prover fixture ac36 note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I open one of my notes and change its body in the editor", () =>
      recordStep(
        scenario,
        "I open one of my notes and change its body in the editor",
        generator => generator.get(`${vault()}/${noteId}`)
      ));
  });

  // --- AC-26: the list and the editor together -------------------------------
  // The list boots with the Background; the editor opens beside it on a throwaway
  // note. The save carries the SECOND typed value, and the list re-read shows it.

  describe("What I save in the editor is my last edit, and my vault list shows it", () => {
    const scenario =
      "What I save in the editor is my last edit, and my vault list shows it";
    let noteId: string;
    const secondValue = `prover fixture ac26 saved second ${stamp}`;
    beforeAll(async () => {
      noteId = await arrangeNote(`prover fixture ac26 original ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I open one of my existing notes in the editor beside my vault list", () =>
      recordStep(
        scenario,
        "I open one of my existing notes in the editor beside my vault list",
        generator => generator.get(`${vault()}/${noteId}`)
      ));
    it("I give one value, then quickly replace it, and save", () =>
      recordStep(
        scenario,
        "I give one value, then quickly replace it, and save",
        generator =>
          generator.put(`${vault()}/${noteId}`, {
            contract_product_id: null,
            label: null,
            visible_for_client: true,
            encrypted: false,
            note: secondValue
          })
      ));
    it("my vault list shows my second value", () =>
      recordStep(scenario, "my vault list shows my second value", readList));
  });

  // --- AC-27: everything I do acts on my own vault, as me --------------------
  // ONE step reads the list then opens, edits and saves one asset: the read and
  // the write both address `clients/{clientId}/vault[...]` under the seeded
  // client session. The recording is keyed to that client id, so the replay wall
  // fails by name if the module ever addressed another client or another
  // identity — the identity guarantee is carried by the recording, as the
  // signed-out guards' "no request escapes" is carried by the same wall.

  describe("Everything I do acts on my own vault, as me", () => {
    const scenario = "Everything I do acts on my own vault, as me";
    let noteId: string;
    beforeAll(async () => {
      noteId = await arrangeNote(`prover fixture ac27 note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I read my vault and then save a change to one of its assets", () =>
      recordStep(
        scenario,
        "I read my vault and then save a change to one of its assets",
        async generator => {
          await generator.get(list());
          await generator.get(`${vault()}/${noteId}`);
          await generator.put(`${vault()}/${noteId}`, {
            contract_product_id: null,
            label: null,
            visible_for_client: true,
            encrypted: false,
            note: `prover fixture ac27 changed ${stamp}`
          });
          await generator.get(list());
        }
      ));
  });

  // --- AC-37: the editor only offers fields it will actually save -----------
  // Boot + open the editor on a note; the step asserts the schema OFFERS body,
  // label, related product and provider-visibility and does NOT offer a pin
  // control. matchesExpectation reads an expected `null` as absent, so the pin's
  // absence is asserted with a null expectation on its schema path — no request
  // beyond the Background boot and the editor loadOne.

  describe("The editor only offers me fields it will actually save", () => {
    const scenario = "The editor only offers me fields it will actually save";
    let noteId: string;
    beforeAll(async () => {
      noteId = await arrangeNote(`prover fixture ac37 note ${stamp}`);
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I open the editor on any note or secret", () =>
      recordStep(
        scenario,
        "I open the editor on any note or secret",
        generator => generator.get(`${vault()}/${noteId}`)
      ));
  });

  // --- AC-17 / AC-32 / AC-34 / AC-43: signed-out guards (top level) -----------
  // No client is signed in and no Background is inherited, so the module never
  // addresses the vault; it DOES still read the brand-config gate on boot (brand
  // config is fetchable at any time, on whatever session is active — the GUEST
  // session when signed out), so that one read is recorded under the guest
  // token. Only their scenario dirs are prepared for everything else — the
  // replay wall fails the scenario by name if any VAULT request escapes.

  describe("My vault never hangs waiting for a client that will not arrive", () => {
    const scenario =
      "My vault never hangs waiting for a client that will not arrive";
    const step = "I wait for my vault while signed out";
    it(step, () =>
      recordSignedOutStep(scenario, step, generator => generator.get(FLAG))
    );
  });

  describe("My vault reveals nothing to me once I am signed out", () => {
    const scenario = "My vault reveals nothing to me once I am signed out";
    const step = "I look at my vault while signed out";
    it(step, () =>
      recordSignedOutStep(scenario, step, generator => generator.get(FLAG))
    );
  });

  describe("The editor holds no secret of mine once I am signed out", () => {
    const scenario = "The editor holds no secret of mine once I am signed out";
    const step = "I open the vault editor while signed out";
    it(step, () =>
      recordSignedOutStep(scenario, step, generator => generator.get(FLAG))
    );
  });

  // AC-14 is now DRIVEN — the module reads the vault gate with its own single-key
  // request, so the generator arranges `security.ui.allow_vault=false` with the
  // staff account, records the gate-off read into the scenario's "I look at my
  // vault" step, and restores the flag. AC-37 is DRIVEN — the developer dropped
  // the editable `pinned` from the editor schema, so its recorded assertion
  // passes. AC-12/AC-40, AC-13, AC-38 and AC-44 were DROPPED from the feature
  // (display-mapper / i18n presentation, not headless capability).
});
