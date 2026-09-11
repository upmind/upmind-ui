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

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
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
    const { status } = await generator.get(
      `/api/clients/${clientId}/vault?with=${WITH}&with_staged_imports=1`
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
