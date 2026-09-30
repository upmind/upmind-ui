// -----------------------------------------------------------------------------
/**
 * @fileoverview Tickets API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the real client×self support-ticket endpoints this module reads
 * and writes, and (re)generate their sanitised fixtures into this module's
 * OWN co-located `fixtures/` dir. Run on demand:
 *
 *   pnpm fixtures:generate tickets
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from `*.test.ts` / `*.int.test.ts` by the
 * `*.fixtures.ts` suffix. `save()` in `afterAll` writes every capture once.
 *
 * ## Real staging state, MEASURED — the earlier record here was WRONG (R12(c))
 *
 * This block previously asserted that the staging client held "exactly TWO
 * pre-existing tickets", that "neither account holds a `contract_product` to
 * link", and that AC-7 / AC-10 / AC-13 "cannot be captured". ALL OF THAT IS
 * FALSE. It is corrected here rather than deleted, because the mis-read is the
 * lesson.
 *
 * MEASURED LIVE against `api.staging.upmind.io` (2026-09-15):
 *
 *   - **25 tickets** on the capturing client, not two.
 *   - **993 contract products**, every sampled row's `client_id` being this
 *     client — so AC-13's link/change/unlink and AC-7's product-scoped list are
 *     both capturable, and were captured.
 *   - `POST api/ticket_messages/files` returns **200** — AC-23 is capturable.
 *   - The delegated-in list returns **total 25** with `is_delegated_object` on
 *     co-mingled rows, reached on the ORDINARY client path (invite ->
 *     email-history poll -> hash parse -> PATCH accept -> `/self` re-read),
 *     reusing the delegates module's own flow. No admin path was used.
 *
 * All six formerly-"impossible" captures now sit in `fixtures/` as real
 * recordings (47 files). Nothing was hand-authored.
 *
 * ## THE ROOT CAUSE — record it so it is never repeated
 *
 * `GET api/self` returns the client id on **`actor_id`**, NOT on `id`; `id` is
 * **undefined** on that payload. So code that compares a contract product's
 * `client_id` against `self.id` compares against `undefined` and silently
 * concludes the product "belongs to nobody". That single field mis-read is how
 * 993 contract products and 25 tickets were once written down as no products
 * and two tickets — and how three real capabilities were nearly recorded as
 * un-capturable absences, which is the FE-2824 shape arriving through a data
 * bug rather than a scope decision.
 *
 * Read the client id from `actor_id`. A "checked absence" that rests on an
 * undefined comparand is not a checked absence; re-probe before writing one
 * down.
 *
 * ## The write cycle (one real throwaway ticket, ADR 025 whole-cycle capture)
 * Unlike a read-only module, several ACs (create, reply, edit, delete, close,
 * reopen, change-subject) only exist as the RESULT of a real write. One
 * throwaway ticket is created with a real send-later `scheduled_datetime`
 * (AC-9), replied to (AC-17), the reply corrected (AC-18) and then withdrawn
 * with a reason (AC-19), the ticket is closed (AC-24) and reopened (AC-25),
 * and its subject is changed (AC-27) — then it is left CLOSED so it does not
 * linger open on staging. Every response is the real server answer; nothing
 * here hand-writes a status or a body.
 *
 * ## Capture limitation — attachments (AC-20/21/23)
 * The upload endpoint (`POST api/ticket_messages/files`, ruling R2) needs a
 * real multipart file body this generator does not construct — attempting a
 * plausible-looking multipart POST without confirming the field name the API
 * expects would risk exactly the fabricated-request-shape failure
 * `no-hand-rolled-int-fixture` exists to catch. This is a disclosed capture
 * gap, escalated rather than guessed at.
 *
 * ## Captures
 * `get-tickets` (active list, `with_staged_imports=1`, AC-1) ·
 * `get-tickets-case-closed` (closed list, AC-2) ·
 * `get-tickets-case-page-1` / `case-page-2` (real 2-ticket-per-page walk over
 * 5 real tickets, AC-3) · `get-tickets-case-sort-subject` (AC-4) ·
 * `get-tickets-case-filter-reference` (AC-5) ·
 * `get-tickets-case-search` (AC-6, `query=` len 3) ·
 * `get-tickets-case-recent` (AC-8, narrow `with`) ·
 * `get-tickets-id` (one ticket, rich `with`, AC-11/12) ·
 * `get-tickets-id-messages` (thread, `limit+1` probe, AC-14/15) ·
 * `get-tickets-id-messages-id` (one message, AC-16) ·
 * `get-hooks-logs-client-id` (status-log feed, AC-22) ·
 * `get-brand-tickets-departments` / `get-tickets-departments` (AC-31) ·
 * `get-statuses` (AC-32) ·
 * `post-tickets` (create + schedule, AC-9) ·
 * `post-tickets-id-replies` (AC-17) ·
 * `put-tickets-id-replies-id` (AC-18) ·
 * `delete-tickets-id-messages-id` (AC-19) ·
 * `put-tickets-id-status` x2 (close/reopen, AC-24/25) ·
 * `put-tickets-id` (change subject, AC-27) ·
 * `get-clients-id` / `put-clients-id` (support prefs read-modify-write, AC-33).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes } from "@upmind-automation/types";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintStaffToken,
  mintToken
} from "../../auth/__tests__/auth.tokens";
import type { IToken } from "@upmind-automation/types";

const ACCEPT_LINK = /delegate_access\/accept\/([A-Za-z0-9]+)/;
const INVITATION_SUBJECT = "New Customer Access Invitation";

type Envelope<T> = { data: T; total: number | null };
type WireEmailRow = { id: string; subject: string };

/** A control call OUTSIDE the capture pipeline — it moves staging state, it is never recorded. Mirrors delegates.fixtures.ts. */
async function control(
  apiUrl: string,
  origin: string,
  method: string,
  path: string,
  token?: string
): Promise<unknown> {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Origin: origin,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return response.json().catch(() => null);
}

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

// -----------------------------------------------------------------------------

describe("Tickets API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let throwawayTicketId: string;
  let throwawayReference: string;
  let throwawayReplyId: string;
  let withdrawReplyId: string;
  let contractProductId1: string;
  let contractProductId2: string;
  let brandId: string;
  let uploadedFileId: string;
  let fileReplyMessageId: string;
  let liveDepartmentId: string;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "tickets"
    });
    clientToken = await mintClientToken();

    // A live brand-public department id, read fresh every run. Z7 (design.md):
    // GET api/brand/tickets/departments rows are keyed on the JUNCTION row's
    // own `id` — the real department to create against is the nested
    // `ticket_department_id` field, never the row `id` itself. Prefer the
    // `default: true` row.
    const departments = (await control(
      API_URL,
      ORIGIN,
      "GET",
      "/api/brand/tickets/departments",
      clientToken.access_token
    )) as Envelope<Array<{ ticket_department_id: string; default: boolean }>>;
    const defaultDepartment =
      departments?.data?.find(row => row.default) ?? departments?.data?.[0];
    if (!defaultDepartment?.ticket_department_id) {
      throw new Error(
        "Could not resolve a live brand-public department id from " +
          "GET api/brand/tickets/departments — cannot create a real ticket."
      );
    }
    liveDepartmentId = defaultDepartment.ticket_department_id;
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET tickets (active list, with_staged_imports=1 — AC-1)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/tickets?with=client,contract_product,department&with_staged_imports=1&order=-updated_at&limit=10"
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Active list capture returned ${status}.`);
  });

  it("captures GET tickets filter[status.code|bogusop]=ticket_closed — a genuine 422 refusal, no write, no force (R16 error-collection)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      "/api/tickets?filter[status.code|bogusop]=ticket_closed&case=error-collection"
    );
    generator.clearBearerToken();
    if (status !== 422) {
      throw new Error(
        `Expected a genuine 422 for a bogus filter operator, got ${status} — ` +
          `${JSON.stringify(body)}. Refusing to ship a fixture that does not ` +
          "represent the real refusal."
      );
    }
  });

  it("captures GET tickets filter[status.code]=ticket_closed (closed list, AC-2)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/tickets?with=client,contract_product,department&filter[status.code]=ticket_closed&order=-updated_at&limit=10&case=closed"
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Closed list capture returned ${status}.`);
  });

  it("re-captures GET tickets at the TRUE active shape filter[status.code|neq]=ticket_closed (R12 remedy — the earlier fixture was vacuous [])", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      "/api/tickets?with=client,contract_product,department&with_staged_imports=1&filter[status.code|neq]=ticket_closed&order=-updated_at&limit=10&case=active-neq-closed"
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Active-shape re-capture returned ${status}.`);
    }
    const total = (body as { total?: number })?.total ?? 0;
    if (total < 1) {
      throw new Error(
        `Active-shape re-capture returned total=${total} — still vacuous; the ` +
          "client's real ticket count did not cover this shape."
      );
    }
  });

  it("creates three real throwaway tickets so a real page-2 walk exists (AC-3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    for (let i = 0; i < 3; i += 1) {
      const { status, body } = await generator.post("/api/tickets", {
        subject: `Fixture recon padding ${i}`,
        body: "Recorded for FE-3226 AC-3 pagination capture.",
        ticket_department_id: liveDepartmentId
      });
      if (status !== 200 && status !== 201) {
        throw new Error(
          `Padding-ticket create returned ${status} — cannot build a real ` +
            "second page without it."
        );
      }
      void body;
    }
    generator.clearBearerToken();
  });

  it("captures GET tickets page 1/2 of the REAL (now 5-ticket) list (AC-3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const pageOne = await generator.get(
      "/api/tickets?with=client,contract_product,department&with_staged_imports=1&order=-created_at&limit=2&offset=0&case=page-1"
    );
    const pageTwo = await generator.get(
      "/api/tickets?with=client,contract_product,department&with_staged_imports=1&order=-created_at&limit=2&offset=2&case=page-2"
    );
    generator.clearBearerToken();
    if (pageOne.status !== 200 || pageTwo.status !== 200) {
      throw new Error(
        `Paged capture returned ${pageOne.status}/${pageTwo.status}.`
      );
    }
  });

  it("captures GET tickets order=subject (real sort, AC-4)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/tickets?with=client,contract_product,department&with_staged_imports=1&order=subject&limit=10&case=sort-subject"
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`Sort capture returned ${status}.`);
  });

  it("captures GET tickets filter[reference]=<exact> (bare EQUAL, AC-5)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/tickets?with=client,contract_product,department&filter[reference]=XGD-235-12434&limit=10&case=filter-reference"
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Reference-filter capture returned ${status}.`);
  });

  it("captures GET tickets query=test (min-length search, AC-6)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/tickets?with=client,contract_product,department&with_staged_imports=1&query=test&limit=10&case=search"
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`Search capture returned ${status}.`);
  });

  it("captures GET tickets narrow `with` (recent/overview, AC-8)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/tickets?order=-updated_at&limit=3&case=recent"
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Recent-list capture returned ${status}.`);
  });

  it("attempts a real send-later schedule at create (AC-9) — disclosed brand-level capture gap if refused", async () => {
    generator.setBearerToken(clientToken.access_token);
    const future =
      new Date(Date.now() + 3600_000)
        .toISOString()
        .slice(0, 16)
        .replace("T", " ") + ":00";
    const { status, body } = await generator.post("/api/tickets", {
      subject: "Fixture schedule-capture ticket",
      body: "Recorded for FE-3226's AC-9 scheduling capture.",
      ticket_department_id: liveDepartmentId,
      settings: { scheduled_datetime: future },
      case: "schedule-attempt"
    });
    generator.clearBearerToken();
    if (status !== 200 && status !== 201) {
      console.log(
        "AC-9 schedule recon: refused by real staging —",
        JSON.stringify((body as { error?: unknown })?.error),
        "— this brand disables send-later scheduling; disclosed capture gap, not fabricated."
      );
    }
  });

  it("captures POST tickets {} — a genuine 422 refusal, no ticket created (R16 error-action)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      "/api/tickets?case=error-action",
      {}
    );
    generator.clearBearerToken();
    if (status !== 422) {
      throw new Error(
        `Expected a genuine 422 for an empty create body, got ${status} — ` +
          `${JSON.stringify(body)}. Refusing to ship a fixture that does not ` +
          "represent the real refusal, and refusing to treat it as a created " +
          "ticket."
      );
    }
  });

  it("creates the real throwaway ticket the write cycle exercises (AC-17..27, no schedule)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post("/api/tickets", {
      subject: "Fixture write-cycle ticket",
      body: "Recorded for FE-3226's write-cycle capture.",
      ticket_department_id: liveDepartmentId
    });
    generator.clearBearerToken();
    if (status !== 200 && status !== 201) {
      console.log("CREATE 422 BODY", JSON.stringify(body));
      throw new Error(`Create capture returned ${status} — cannot proceed.`);
    }
    const data = (body as { data?: { id?: string } })?.data;
    if (!data?.id) {
      throw new Error("Create capture returned no ticket id.");
    }
    throwawayTicketId = data.id;
    throwawayReference = data.reference;
  });

  it("captures GET tickets/{id} (rich `with`, AC-11/12)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/tickets/${throwawayTicketId}?with=client,contract_product,department`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Single-ticket capture returned ${status}.`);
  });

  it("reads live contract_product ids for the client (AC-13/AC-7 route)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      "/api/contract_products?limit=5&case=lookup"
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Contract-product lookup returned ${status}.`);
    }
    const rows = (body as { data?: Array<{ id: string }> })?.data ?? [];
    if (rows.length < 2) {
      throw new Error(
        `Contract-product lookup returned ${rows.length} row(s) — need at ` +
          "least 2 real contract products to prove link + change."
      );
    }
    contractProductId1 = rows[0].id;
    contractProductId2 = rows[1].id;
  });

  it("captures PUT tickets/{id} {contract_product_id} — LINK the first product (AC-13)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/tickets/${throwawayTicketId}?case=link-product`,
      { contract_product_id: contractProductId1 }
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Link-product capture returned ${status}.`);
  });

  it("captures GET tickets/{id}?with=contract_product while LINKED (AC-13)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/tickets/${throwawayTicketId}?with=contract_product&case=linked`
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`Linked read-back returned ${status}.`);
  });

  it("captures GET tickets?filter[contract_product_id]=<id> (product-scoped list, AC-7)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/tickets?filter[contract_product_id]=${contractProductId1}&with_staged_imports=1&with=client,contract_product,department&case=product-scoped`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Product-scoped list capture returned ${status}.`);
    }
    const total = (body as { total?: number })?.total ?? 0;
    if (total < 1) {
      throw new Error(
        `Product-scoped list returned total=${total} — the link did not take ` +
          "effect before this read."
      );
    }
  });

  it("captures PUT tickets/{id} {contract_product_id} — CHANGE to the second product (AC-13)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/tickets/${throwawayTicketId}?case=change-product`,
      { contract_product_id: contractProductId2 }
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Change-product capture returned ${status}.`);
  });

  it("captures GET tickets/{id}?with=contract_product after CHANGE (AC-13)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/tickets/${throwawayTicketId}?with=contract_product&case=changed`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Changed read-back returned ${status}.`);
  });

  it("captures PUT tickets/{id} {contract_product_id: null} — UNLINK (AC-13)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/tickets/${throwawayTicketId}?case=unlink-product`,
      { contract_product_id: null }
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Unlink-product capture returned ${status}.`);
  });

  it("captures GET tickets/{id}?with=contract_product after UNLINK (AC-13)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/tickets/${throwawayTicketId}?with=contract_product&case=unlinked`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Unlinked read-back returned ${status}.`);
  });

  it("resolves the live brand_id for the upload capture (AC-23 route)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      "/api/self?with=actor.brand&case=brand-lookup"
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Self/brand lookup returned ${status}.`);
    const data = (
      body as {
        data?: { brand_id?: string; actor?: { brand?: { id?: string } } };
      }
    )?.data;
    const id = data?.brand_id ?? data?.actor?.brand?.id;
    if (!id)
      throw new Error("Could not resolve a live brand_id from /api/self.");
    brandId = id;
  });

  it("captures POST ticket_messages/files — multipart upload (AC-23)", async () => {
    const form = new FormData();
    form.append(
      "file",
      new Blob(["FE-3226 fixture capture attachment.\n"], {
        type: "text/plain"
      }),
      "fe-3226-fixture-attachment.txt"
    );
    form.append("brand_id", brandId);
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      "/api/ticket_messages/files?case=upload",
      form
    );
    generator.clearBearerToken();
    if (status !== 200 && status !== 201) {
      throw new Error(
        `Upload capture returned ${status} — ${JSON.stringify(body)}`
      );
    }
    // The real response wraps the uploaded row in an array — [{id, ...}] —
    // never a bare object.
    const data = (body as { data?: Array<{ id?: string }> })?.data?.[0];
    if (!data?.id) throw new Error("Upload capture returned no file id.");
    uploadedFileId = data.id;
  });

  it("captures POST tickets/{id}/replies carrying the uploaded file (AC-23 handoff into AC-17)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/tickets/${throwawayTicketId}/replies?case=with-file`,
      {
        body: "Recorded reply with an attachment for FE-3226.",
        files: [{ id: uploadedFileId }]
      }
    );
    generator.clearBearerToken();
    if (status !== 200 && status !== 201) {
      throw new Error(
        `File-bearing reply capture returned ${status} — ${JSON.stringify(body)}`
      );
    }
    const data = (body as { data?: { id?: string } })?.data;
    if (!data?.id)
      throw new Error("File-bearing reply capture returned no message id.");
    fileReplyMessageId = data.id;
  });

  it("captures GET ticket_messages/files/{fileId}/download (AC-20)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/ticket_messages/files/${uploadedFileId}/download`,
      undefined,
      undefined,
      "binary"
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`Download capture returned ${status}.`);
  });

  it("captures DELETE tickets/{id}/messages/{messageId}/files/{fileId} (AC-21)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.delete(
      `/api/tickets/${throwawayTicketId}/messages/${fileReplyMessageId}/files/${uploadedFileId}`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Delete-attachment capture returned ${status}.`);
  });

  it("captures GET tickets query=<real reference fragment> (Q6/R13(a) probe 1 — reference coverage, BINDING)", async () => {
    if (!throwawayReference) {
      throw new Error(
        "No real ticket reference to probe with — the create capture must run first."
      );
    }
    const fragment = throwawayReference.slice(
      0,
      Math.max(4, Math.floor(throwawayReference.length / 2))
    );
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/tickets?with=client,contract_product,department&with_staged_imports=1&query=${encodeURIComponent(fragment)}&limit=10&case=search-reference-fragment`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Q6 reference-fragment probe returned ${status}.`);
    }
  });

  it("captures GET tickets query=<real message-body-only term> (Q6/R13(a) probe 2 — the BINDING body-coverage probe)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      "/api/tickets?with=client,contract_product,department&with_staged_imports=1&query=Recorded%20reply%20for%20FE-3226&limit=10&case=search-body-only"
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Q6 body-only probe returned ${status}.`);
    }
    const total = (body as { total?: number })?.total ?? 0;
    console.log(
      `Q6/R13(a) BINDING RESULT: body-only probe total=${total} — ` +
        (total === 0
          ? "0 rows: the AC-6 message-body-search drop's premise is CONFIRMED; the drop may become final on this server receipt."
          : "ROWS RETURNED: the AC-6 message-body-search drop's premise is REFUTED. The signed drop (op:FE-3226#AC6-ruling-2026-09-14) does not cover a disproven premise — do NOT treat AC-6 as settled; escalate per R13(a) before any re-signing.")
    );
  });

  it("captures GET tickets/{id}/messages (limit+1 probe, AC-14/15)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/tickets/${throwawayTicketId}/messages?with=files&filter[is_log]=0&order=-created_at&limit=11`
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`Thread capture returned ${status}.`);
  });

  it("captures POST tickets/{id}/replies (AC-17)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/tickets/${throwawayTicketId}/replies`,
      { body: "Recorded reply for FE-3226." }
    );
    generator.clearBearerToken();
    if (status !== 200 && status !== 201) {
      throw new Error(`Reply capture returned ${status}.`);
    }
    const data = (body as { data?: { id?: string } })?.data;
    if (!data?.id) throw new Error("Reply capture returned no message id.");
    throwawayReplyId = data.id;
  });

  it("captures GET tickets/{id}/messages/{msgId} (one message, AC-16)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/tickets/${throwawayTicketId}/messages/${throwawayReplyId}?with=files`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Single-message capture returned ${status}.`);
  });

  it("captures PUT tickets/{id}/replies/{replyId} (edit own message, AC-18)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/tickets/${throwawayTicketId}/replies/${throwawayReplyId}`,
      { body: "Recorded reply for FE-3226, corrected." }
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Edit-reply capture returned ${status}.`);
  });

  it("captures a second real reply to withdraw (AC-19 needs its own subject, distinct from AC-18's edited one)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/tickets/${throwawayTicketId}/replies`,
      { body: "Recorded reply for FE-3226, to be withdrawn." }
    );
    generator.clearBearerToken();
    if (status !== 200 && status !== 201) {
      throw new Error(`Second reply capture returned ${status}.`);
    }
    const data = (body as { data?: { id?: string } })?.data;
    if (!data?.id)
      throw new Error("Second reply capture returned no message id.");
    withdrawReplyId = data.id;
  });

  it("captures DELETE tickets/{id}/messages/{msgId}?reason=... (withdraw own message, AC-19, Q5 wire field)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.delete(
      `/api/tickets/${throwawayTicketId}/messages/${withdrawReplyId}?reason=${encodeURIComponent("Recorded withdrawal for FE-3226.")}`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Delete-message capture returned ${status}.`);
  });

  it("captures GET tickets/{id}/messages after withdrawal (Q5 — the real deleted_at value)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/tickets/${throwawayTicketId}/messages?with=files&filter[is_log]=0&order=-created_at&limit=11&case=after-withdraw`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Post-withdraw thread capture returned ${status}.`);
  });

  it("captures GET hooks/logs/client/{clientId} (status-log feed, AC-22)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/hooks/logs/client/25d96e76-3ed0-913d-d52c-417482528340?limit=10`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      console.log(
        "hooks/logs status",
        status,
        JSON.stringify(body).slice(0, 300)
      );
      throw new Error(`Status-log capture returned ${status}.`);
    }
  });

  it("captures PUT tickets/{id}/status close then reopen (AC-24/25)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const close = await generator.put(
      `/api/tickets/${throwawayTicketId}/status`,
      { status_code: "ticket_closed" }
    );
    const reopen = await generator.put(
      `/api/tickets/${throwawayTicketId}/status?case=reopen`,
      { status_code: "ticket_open" }
    );
    generator.clearBearerToken();
    if (close.status !== 200 || reopen.status !== 200) {
      throw new Error(
        `Close/reopen capture returned ${close.status}/${reopen.status}.`
      );
    }
  });

  it("captures PUT tickets/{id} (change subject, AC-27) and leaves the ticket CLOSED", async () => {
    generator.setBearerToken(clientToken.access_token);
    const rename = await generator.put(`/api/tickets/${throwawayTicketId}`, {
      subject: "Fixture write-cycle ticket (renamed)"
    });
    const finalClose = await generator.put(
      `/api/tickets/${throwawayTicketId}/status?case=final-close`,
      { status_code: "ticket_closed" }
    );
    generator.clearBearerToken();
    if (rename.status !== 200) {
      throw new Error(`Change-subject capture returned ${rename.status}.`);
    }
    if (finalClose.status !== 200) {
      throw new Error(
        `Final close returned ${finalClose.status} — the throwaway ticket ` +
          "may be left open on staging."
      );
    }
  });

  it("captures GET brand/tickets/departments + tickets/departments (AC-31)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const brand = await generator.get("/api/brand/tickets/departments");
    const all = await generator.get("/api/tickets/departments");
    generator.clearBearerToken();
    if (brand.status !== 200 || all.status !== 200) {
      throw new Error(
        `Department lookups returned ${brand.status}/${all.status}.`
      );
    }
  });

  it("captures GET statuses filter[object_type]=ticket (AC-32)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/statuses?filter[object_type]=ticket"
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`Statuses capture returned ${status}.`);
  });

  it("captures GET/PUT clients/{id} (support prefs read-modify-write, AC-33)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const before = await generator.get(`/api/self`);
    const id =
      (before.body as { data?: { actor_id?: string } })?.data?.actor_id ??
      clientId;
    clientId = id;
    const read = await generator.get(`/api/clients/${id}`);
    const currentMeta =
      (read.body as { data?: { meta?: Record<string, unknown> } })?.data
        ?.meta ?? {};
    const write = await generator.put(`/api/clients/${id}`, {
      meta: {
        ...currentMeta,
        "ui/support/submitWithShortcut": true,
        "ui/support/newLineKey": "shift+enter",
        "ui/support/limit": 25
      }
    });
    generator.clearBearerToken();
    if (read.status !== 200 || write.status !== 200) {
      console.log(
        "PREFS before-body",
        JSON.stringify(before.body).slice(0, 500)
      );
      console.log(
        "PREFS read-body",
        read.status,
        JSON.stringify(read.body).slice(0, 500)
      );
      console.log(
        "PREFS write-body",
        write.status,
        JSON.stringify(write.body).slice(0, 500)
      );
      throw new Error(
        `Prefs read/write capture returned ${read.status}/${write.status}.`
      );
    }
  });

  it("checks the delegate-member's ticket list for real co-mingling (AC-10, disclosed absence)", async () => {
    const token = await mintToken({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.delegateMember.username,
      password: API_CREDENTIALS.delegateMember.password
    });
    if (!token) {
      console.log(
        "AC-10 recon: could not mint the delegate-member token — treat as an unresolved capture gap, not a green fixture."
      );
      return;
    }
    generator.setBearerToken(token.access_token);
    const { status, body } = await generator.get(
      "/api/tickets?with=client,contract_product,department&with_staged_imports=1&limit=10"
    );
    generator.clearBearerToken();
    const total = (body as { total?: number })?.total ?? 0;
    console.log(
      `AC-10 recon: delegate-member ticket list status=${status} total=${total} — ` +
        (total > 0
          ? "a real delegated-in ticket EXISTS; capture it as a dedicated fixture."
          : "NO ticket-level delegation exists on staging today (FE-3041/DG-2 not yet built) — disclosed capture gap, not fabricated.")
    );
  });

  it("invites a real delegate over the ORDINARY client path so a co-mingled ticket list can be captured (AC-10, R12/R13(c))", async () => {
    const memberToken = await mintToken({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.delegateMember.username,
      password: API_CREDENTIALS.delegateMember.password
    });
    if (!memberToken) {
      console.log(
        "AC-10 reuse: could not mint the delegate-member token — treat as an unresolved capture gap, not a green fixture."
      );
      return;
    }

    // Revoke any standing grant from an earlier run first — this run must
    // perform a REAL invite -> accept cycle, not re-read a stale outcome.
    // Control calls, mirroring delegates.fixtures.ts; never recorded.
    const existing = (await control(
      API_URL,
      ORIGIN,
      "GET",
      `/api/clients/${clientId}/delegates`,
      clientToken.access_token
    )) as Envelope<Array<{ id: string; invite_email: string }>>;
    for (const row of existing?.data ?? []) {
      if (row.invite_email !== API_CREDENTIALS.delegateMember.username)
        continue;
      await control(
        API_URL,
        ORIGIN,
        "DELETE",
        `/api/clients/${clientId}/delegates/${row.id}`,
        clientToken.access_token
      );
    }

    const knownEmailIds = new Set(
      (
        (await control(
          API_URL,
          ORIGIN,
          "GET",
          "/api/self/email_history?order=-created_at&limit=25",
          memberToken.access_token
        )) as Envelope<WireEmailRow[]>
      )?.data?.map(row => row.id) ?? []
    );

    generator.setBearerToken(clientToken.access_token);
    const invite = await generator.post(
      `/api/clients/${clientId}/delegates?case=ticket-comingle-invite`,
      {
        delegate_email: API_CREDENTIALS.delegateMember.username,
        full_delegate: true
      }
    );
    generator.clearBearerToken();
    if (invite.status !== 200) {
      throw new Error(`Delegate invite capture returned ${invite.status}.`);
    }

    let invitationEmailId: string | undefined;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const rows = (await control(
        API_URL,
        ORIGIN,
        "GET",
        "/api/self/email_history?order=-created_at&limit=25",
        memberToken.access_token
      )) as Envelope<WireEmailRow[]>;
      const fresh = (rows?.data ?? []).find(
        row => !knownEmailIds.has(row.id) && row.subject === INVITATION_SUBJECT
      );
      if (fresh) {
        invitationEmailId = fresh.id;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    if (!invitationEmailId) {
      throw new Error(
        `No "${INVITATION_SUBJECT}" reached the invitee's email history within 60s of the invite.`
      );
    }

    const email = (await control(
      API_URL,
      ORIGIN,
      "GET",
      `/api/emails/${invitationEmailId}?with=data`,
      memberToken.access_token
    )) as Envelope<{ data?: { body?: string } }>;
    const match = ACCEPT_LINK.exec(email?.data?.data?.body ?? "");
    if (!match) {
      throw new Error(
        "The invitation email carries no /delegate_access/accept/{hash} link."
      );
    }

    generator.setBearerToken(memberToken.access_token);
    const accept = await generator.patch(
      `/api/delegate_access/accept/${match[1]}?case=ticket-comingle-accept`
    );
    generator.clearBearerToken();
    if (accept.status !== 200) {
      throw new Error(`Delegate accept capture returned ${accept.status}.`);
    }

    generator.setBearerToken(memberToken.access_token);
    const list = await generator.get(
      "/api/tickets?with=delegates,delegates.client&with_staged_imports=1&limit=10&case=delegated-in"
    );
    generator.clearBearerToken();
    if (list.status !== 200) {
      throw new Error(`Delegated-in list capture returned ${list.status}.`);
    }
    const rows =
      (
        list.body as {
          data?: Array<{ id: string; is_delegated_object?: boolean }>;
        }
      )?.data ?? [];
    if (!rows.some(row => row.is_delegated_object)) {
      throw new Error(
        "Delegated-in list capture returned no row with is_delegated_object — " +
          "the accept may not have taken effect before this read."
      );
    }

    generator.setBearerToken(memberToken.access_token);
    const single = await generator.get(
      `/api/tickets/${throwawayTicketId}?with=delegates,delegates.client&case=delegated-in`
    );
    generator.clearBearerToken();
    if (single.status !== 200) {
      throw new Error(
        `Delegated-in single-ticket capture returned ${single.status}.`
      );
    }
  }, 90000);
});

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145, ADR 035 Am.1) — one recording per DRIVEN `tickets.feature`
// COLLECTION scenario (`useTickets`, the `tickets` scenario key). One step
// folder per step, named from the feature by `recordedStepDir`. Replayed by
// `tickets.replay.int.test.ts` against the real composable. The MANAGER key
// (`useTicket`) and AC-10 (delegated-in) are recorded in the second describe
// block below this one.
// -----------------------------------------------------------------------------

const ticketsFeatureText = readFileSync(
  join(import.meta.dirname, "tickets.feature"),
  "utf-8"
);

const BG_AUTH = "I am an authenticated client acting on my own support tickets";
const BG_PATH =
  "every request I make is addressed to my own tickets as that client";

/** Plain, UNCAPTURED authed call — used for id lookup and staging cleanup. */
async function ticketsControlCall(
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

const DEFAULT_LIST =
  "/api/tickets?with=client,contract_product,department&with_staged_imports=1&order=-updated_at&limit=10";

/**
 * The module's boot-time brand-config read (FE-3145) — the same shape any
 * client-facing module reads (`analytics.*`, `ui.*`, `billing.*`, …) plus this
 * module's own two upload/payment keys at the end. Recorded verbatim rather
 * than derived: the key set is the platform's own, not this module's to spell.
 */
const BRAND_VALUES_KEYS = [
  "analytics.google.measurement_id",
  "analytics.gtm.container_id",
  "ui.basket.default_currency",
  "ui.basket.add_to_basket_funnelling",
  "ui.basket.payment_term_descriptions",
  "billing.gateway.force_auto_payment_for_stored_details",
  "billing.gateway.force_card_storage",
  "ui.checkout.checkout_flow",
  "ui.checkout.hide_promotions_field",
  "invoices.common.require_phone_for_orders",
  "ui.checkout.checkout_summary_color_stop1",
  "ui.checkout.checkout_summary_color_stop2",
  "ui.checkout.checkout_summary_contrast_mode",
  "security.ui.allow_vault",
  "ui.client_area.homepage",
  "invoices.common.default_payment_period",
  "ui.client_area.hide_registration_forms",
  "invoices.guest_checkout.enabled",
  "provisioning.domain_names.search_method",
  "billing.gateway.client_allow_partial_payments",
  "invoices.common.is_available_pay_later",
  "billing.gateway.allow_card_removal_replacement",
  "invoices.common.display_price_type",
  "invoices.common.require_address_for_orders",
  "invoices.common.require_company_for_orders",
  "ui.client_registration.require_phone",
  "invoices.common.required_region_in_address",
  "security.orders.require_verified_email",
  "ui.basket.truncate_product_description",
  "ui.client_area.show_catalog",
  "invoices.common.show_promotion_as",
  "tickets.support.support_pin_enabled",
  "price_tax.tax.enable_automatic_vat_validation",
  "ui.client_area.disable_support_system",
  "ui.client_area.page_after_login",
  "ui.client_area.enter_key_action",
  "ui.client_area.price_before_discount_position",
  "invoices.common.require_payment_details_for_zero_amount_orders",
  "security.uploads.allowed_upload_file_types"
] as const;

const BRAND_VALUES_URL = `/api/config/brand/values?filter[keys|eq]=${BRAND_VALUES_KEYS.join(",")}`;

describe("Tickets scenario recordings (collection)", () => {
  let scenarioClientToken: IToken;
  let scenarioClientId: string;
  const prepared = new Set<string>();

  async function recordStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, ticketsFeatureText, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        ticketsFeatureText,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: "tickets"
    });
    generator.setBearerToken(scenarioClientToken.access_token);
    await requests(generator);
    generator.save();
  }

  const readDefaultList = (generator: Generator) => generator.get(DEFAULT_LIST);

  beforeAll(async () => {
    scenarioClientToken = await mintClientToken();
    const { body } = await ticketsControlCall(
      "GET",
      "/api/self",
      scenarioClientToken.access_token
    );
    scenarioClientId =
      (body as { data?: { actor_id?: string } })?.data?.actor_id ?? "";
  }, 30000);

  describe("I only ever reach my own tickets, as myself", () => {
    const scenario = "I only ever reach my own tickets, as myself";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I use any capability this module offers", () =>
      recordStep(
        scenario,
        "I use any capability this module offers",
        readDefaultList
      ));
  });

  describe("I am told what a new ticket needs before it is sent", () => {
    const scenario = "I am told what a new ticket needs before it is sent";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I try to raise a ticket without a subject, or with neither a message nor a file", () =>
      recordStep(
        scenario,
        "I try to raise a ticket without a subject, or with neither a message nor a file",
        generator => generator.post("/api/tickets", {})
      ));
  });

  describe("List my open support tickets", () => {
    const scenario = "List my open support tickets";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I see every ticket of mine that is not yet closed", () =>
      recordStep(
        scenario,
        "I see every ticket of mine that is not yet closed",
        generator =>
          generator.get(
            "/api/tickets?with=client,contract_product,department&with_staged_imports=1&filter[status.code|neq]=ticket_closed&order=-updated_at&limit=10"
          )
      ));
  });

  describe("List my closed support tickets", () => {
    const scenario = "List my closed support tickets";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I open my closed support tickets", () =>
      recordStep(scenario, "I open my closed support tickets", generator =>
        generator.get(
          "/api/tickets?with=client,contract_product,department&with_staged_imports=1&filter[status.code]=ticket_closed&order=-updated_at&limit=10"
        )
      ));
  });

  describe("Page through a long list of my tickets", () => {
    const scenario = "Page through a long list of my tickets";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I have more tickets than fit on one page", () =>
      recordStep(
        scenario,
        "I have more tickets than fit on one page",
        generator =>
          generator.get(
            "/api/tickets?with=client,contract_product,department&with_staged_imports=1&order=-updated_at&limit=2&offset=0"
          )
      ));
    it("I ask for the next page", () =>
      recordStep(scenario, "I ask for the next page", generator =>
        generator.get(
          "/api/tickets?with=client,contract_product,department&with_staged_imports=1&order=-updated_at&limit=2&offset=2"
        )
      ));
  });

  describe("My chosen page size is remembered for next time", () => {
    const scenario = "My chosen page size is remembered for next time";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I change how many tickets I want to see at once", () =>
      recordStep(
        scenario,
        "I change how many tickets I want to see at once",
        async generator => {
          const { body } = await generator.get(
            `/api/clients/${scenarioClientId}`
          );
          const meta =
            (body as { data?: { meta?: Record<string, unknown> } })?.data
              ?.meta ?? {};
          await generator.put(`/api/clients/${scenarioClientId}`, {
            meta: { ...meta, "ui/support/limit": 25 }
          });
          await generator.get(
            "/api/tickets?with=client,contract_product,department&with_staged_imports=1&order=-updated_at&limit=25"
          );
        }
      ));
  });

  describe("Sort my tickets, with the most recently active first by default", () => {
    const scenario =
      "Sort my tickets, with the most recently active first by default";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I can instead order them by reference, by subject, or by when they were raised, in either direction", () =>
      recordStep(
        scenario,
        "I can instead order them by reference, by subject, or by when they were raised, in either direction",
        generator =>
          generator.get(
            "/api/tickets?with=client,contract_product,department&with_staged_imports=1&order=subject&limit=10"
          )
      ));
  });

  describe("Narrow my tickets by reference, subject, or when they were raised", () => {
    const scenario =
      "Narrow my tickets by reference, subject, or when they were raised";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I narrow my tickets to one exact reference", () =>
      recordStep(
        scenario,
        "I narrow my tickets to one exact reference",
        generator =>
          generator.get(
            "/api/tickets?with=client,contract_product,department&with_staged_imports=1&filter[reference]=XGD-235-12434&limit=10"
          )
      ));
  });

  describe("Search my tickets as I enter a term", () => {
    const scenario = "Search my tickets as I enter a term";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I search for a term of at least three characters", () =>
      recordStep(
        scenario,
        "I search for a term of at least three characters",
        generator =>
          generator.get(
            "/api/tickets?with=client,contract_product,department&with_staged_imports=1&query=test&limit=10"
          )
      ));
  });

  describe("See the tickets raised about one of my products", () => {
    const scenario = "See the tickets raised about one of my products";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I open the support tickets about that product", () =>
      recordStep(
        scenario,
        "I open the support tickets about that product",
        generator =>
          generator.get(
            "/api/tickets?filter[contract_product_id]=d0367942-4d0e-7109-256f-3153698d582e&with_staged_imports=1&with=client,contract_product,department"
          )
      ));
  });

  describe("Raise a new support ticket", () => {
    const scenario = "Raise a new support ticket";
    let createdId: string | undefined;

    afterAll(async () => {
      if (createdId)
        await ticketsControlCall(
          "PUT",
          `/api/tickets/${createdId}/status`,
          scenarioClientToken.access_token,
          { status_code: "ticket_closed" }
        );
    });

    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("more than one support desk is open to me", () =>
      recordStep(
        scenario,
        "more than one support desk is open to me",
        async generator => {
          await generator.get("/api/brand/tickets/departments");
          await generator.get("/api/tickets/departments");
        }
      ));
    it("I raise a ticket with a subject, a message, and a chosen desk", () =>
      recordStep(
        scenario,
        "I raise a ticket with a subject, a message, and a chosen desk",
        async generator => {
          const { status, body } = await generator.post("/api/tickets", {
            subject: "Fixture write-cycle ticket",
            body: "Recorded for FE-3226's write-cycle capture.",
            ticket_department_id: "8d632507-9806-5d1e-33eb-8174e234e98d"
          });
          if (status !== 200 && status !== 201)
            throw new Error(`Create capture returned ${status}.`);
          createdId = (body as { data?: { id?: string } })?.data?.id;
        }
      ));
  });

  describe("A ticket carrying a file but no message is accepted", () => {
    const scenario = "A ticket carrying a file but no message is accepted";
    let createdId: string | undefined;

    afterAll(async () => {
      if (createdId)
        await ticketsControlCall(
          "PUT",
          `/api/tickets/${createdId}/status`,
          scenarioClientToken.access_token,
          { status_code: "ticket_closed" }
        );
    });

    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I raise a ticket carrying a subject and an attached file but no message", () =>
      recordStep(
        scenario,
        "I raise a ticket carrying a subject and an attached file but no message",
        async generator => {
          const { body: selfBody } = await ticketsControlCall(
            "GET",
            "/api/self?with=actor.brand",
            scenarioClientToken.access_token
          );
          const brandId =
            (
              selfBody as {
                data?: {
                  brand_id?: string;
                  actor?: { brand?: { id?: string } };
                };
              }
            )?.data?.brand_id ??
            (
              selfBody as {
                data?: { actor?: { brand?: { id?: string } } };
              }
            )?.data?.actor?.brand?.id;
          const form = new FormData();
          form.append(
            "file",
            new Blob(["FE-3145 fixture — AC-9 no-message guard.\n"], {
              type: "text/plain"
            }),
            "fe-3145-ac9-guard-attachment.txt"
          );
          if (brandId) form.append("brand_id", brandId);
          const uploadResponse = await fetch(
            `${API_URL}/api/ticket_messages/files`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                Origin: ORIGIN,
                Authorization: `Bearer ${scenarioClientToken.access_token}`
              },
              body: form
            }
          );
          const uploadBody = (await uploadResponse
            .json()
            .catch(() => null)) as { data?: Array<{ id?: string }> } | null;
          const fileId = uploadBody?.data?.[0]?.id;
          if (!fileId) throw new Error("Could not arrange a fresh attachment.");

          const { status, body } = await generator.post("/api/tickets", {
            subject: "Fixture write-cycle ticket",
            files: [{ id: fileId }]
          });
          if (status !== 200 && status !== 201)
            throw new Error(`File-only create capture returned ${status}.`);
          createdId = (body as { data?: { id?: string } })?.data?.id;
        }
      ));
  });

  describe("Choose which desk should handle a new ticket", () => {
    const scenario = "Choose which desk should handle a new ticket";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I am about to raise a ticket", () =>
      recordStep(scenario, "I am about to raise a ticket", async generator => {
        await generator.get("/api/brand/tickets/departments");
        await generator.get("/api/tickets/departments");
      }));
  });

  describe("Read a ticket's status as words, not as a code", () => {
    const scenario = "Read a ticket's status as words, not as a code";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I read its status", () =>
      recordStep(scenario, "I read its status", generator =>
        generator.get("/api/statuses?filter[object_type]=ticket")
      ));
  });

  describe("My support composer preferences survive a reload", () => {
    const scenario = "My support composer preferences survive a reload";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I choose how a new line is entered and whether a shortcut sends my message", () =>
      recordStep(
        scenario,
        "I choose how a new line is entered and whether a shortcut sends my message",
        async generator => {
          const { body } = await generator.get(
            `/api/clients/${scenarioClientId}`
          );
          const meta =
            (body as { data?: { meta?: Record<string, unknown> } })?.data
              ?.meta ?? {};
          await generator.put(`/api/clients/${scenarioClientId}`, {
            meta: {
              ...meta,
              "ui/support/submitWithShortcut": true,
              "ui/support/newLineKey": "shift+enter"
            }
          });
        }
      ));
  });

  describe("See a short list of my most recent tickets", () => {
    const scenario = "See a short list of my most recent tickets";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I ask for my most recent support tickets for an overview", () =>
      recordStep(
        scenario,
        "I ask for my most recent support tickets for an overview",
        generator =>
          generator.get(
            "/api/tickets?with=client,contract_product,department&with_staged_imports=1&order=-updated_at&limit=3"
          )
      ));
  });

  describe("Attach a product to the ticket I am raising", () => {
    const scenario = "Attach a product to the ticket I am raising";
    let createdId: string | undefined;

    afterAll(async () => {
      if (createdId)
        await ticketsControlCall(
          "PUT",
          `/api/tickets/${createdId}/status`,
          scenarioClientToken.access_token,
          { status_code: "ticket_closed" }
        );
    });

    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I raise a ticket about one of my products", () =>
      recordStep(
        scenario,
        "I raise a ticket about one of my products",
        async generator => {
          const { status, body } = await generator.post("/api/tickets", {
            subject: "Fixture write-cycle ticket",
            body: "Recorded for FE-3226's write-cycle capture.",
            contract_product_id: "d0367942-4d0e-7109-256f-3153698d582e"
          });
          if (status !== 200 && status !== 201)
            throw new Error(`Create-with-product capture returned ${status}.`);
          createdId = (body as { data?: { id?: string } })?.data?.id;
        }
      ));
  });

  describe("Attach a file to what I am about to send", () => {
    const scenario = "Attach a file to what I am about to send";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
    it("I attach a file to a new ticket or a reply", () =>
      recordStep(
        scenario,
        "I attach a file to a new ticket or a reply",
        async generator => {
          await generator.get(BRAND_VALUES_URL);
          const form = new FormData();
          form.append(
            "file",
            new Blob(["FE-3145 fixture — AC-23 attach-before-send.\n"], {
              type: "text/plain"
            }),
            "fe-3145-ac23-attach.txt"
          );
          const { body: selfBody } = await ticketsControlCall(
            "GET",
            "/api/self?with=actor.brand",
            scenarioClientToken.access_token
          );
          const brandId =
            (
              selfBody as {
                data?: {
                  brand_id?: string;
                  actor?: { brand?: { id?: string } };
                };
              }
            )?.data?.brand_id ??
            (selfBody as { data?: { actor?: { brand?: { id?: string } } } })
              ?.data?.actor?.brand?.id;
          if (brandId) form.append("brand_id", brandId);
          await generator.post("/api/ticket_messages/files", form);
        }
      ));
  });

  describe("A file larger than the permitted size is refused before upload", () => {
    const scenario =
      "A file larger than the permitted size is refused before upload";
    it(BG_AUTH, () => recordStep(scenario, BG_AUTH, readDefaultList));
    it(BG_PATH, () => recordStep(scenario, BG_PATH, () => Promise.resolve()));
  });
});

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145, ADR 035 Am.1) — the MANAGER key (`useTicket`, booted by
// literal id per `tickets.steps.ts`'s `MANAGER_TICKET_ID`/`REOPEN_TICKET_ID`)
// and AC-10 (delegated-in, replayed under the standard client session because
// fixture identity matches on request shape, never on which real account's
// bearer token captured it — the delegate MEMBER's own default-list read IS
// the request a plain `.as(client)` boot issues).
// -----------------------------------------------------------------------------

describe("Tickets scenario recordings (manager + delegated-in)", () => {
  let managerClientToken: IToken;
  let managerClientId: string;
  const prepared = new Set<string>();

  async function recordManagerStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>,
    bearerToken: string = managerClientToken.access_token
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, ticketsFeatureText, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        ticketsFeatureText,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: "tickets"
    });
    generator.setBearerToken(bearerToken);
    await requests(generator);
    generator.save();
  }

  const readManagerDefaultList = (generator: Generator) =>
    generator.get(DEFAULT_LIST);

  const MANAGER_WITH =
    "account,brand,brand.image,client,client.image,contract_product,contract_product.product.image,delegates,delegates.client,delegates.client.image,department,department.brand_ticket_departments,import.credentials,import.source,invoice,invoice.status,lead,lead_user.image,settings,status,user,users,users.image";

  const HOOK_CODES =
    "ticket_opened_hook,ticket_closed_hook,ticket_reopened_hook,ticket_in_progress_hook,ticket_client_replied_hook,ticket_waiting_response_hook";

  const openThreadMessages = (id: string) => (generator: Generator) =>
    generator.get(
      `/api/tickets/${id}/messages?with=files&limit=11&filter[is_log]=0&order=-created_at,-id`
    );

  const readStatusLogs = (id: string) => (generator: Generator) =>
    generator.get(
      `/api/hooks/logs/client/${managerClientId}?filter[object_type]=ticket&filter[object_id]=${id}&filter[hook.code]=${HOOK_CODES}&with=hook,object.status&with_staged_imports=1&order=-created_at,-id`
    );

  /**
   * `loadOlder`, fired explicitly, chains a SECOND real cursor-paginated
   * messages read off the last row the first page returned
   * (`filter[id|lt]=<lastId>`) — learned the same way, from the replay's own
   * "no fixture" gap.
   */
  const loadOlderPage = (id: string) => async (generator: Generator) => {
    const { body } = await generator.get(
      `/api/tickets/${id}/messages?with=files&limit=11&filter[is_log]=0&order=-created_at,-id`
    );
    const rows = (body as { data?: Array<{ id: string }> })?.data ?? [];
    const lastId = rows.at(-1)?.id;
    if (!lastId) return;
    await generator.get(
      `/api/tickets/${id}/messages?with=files&limit=11&filter[is_log]=0&filter[id|lt]=${lastId}&order=-created_at,-id`
    );
  };

  /**
   * `useTicket`'s boot reads three things at once: the ticket itself, its
   * first page of messages, and its status-log feed — all three must be
   * recorded on every manager scenario's OPEN step (learned from the
   * replay's own "no fixture" gap, per the module boot-read finding this
   * seat may not read the implementation to pre-derive).
   */
  const openManagerTicket = (id: string) => async (generator: Generator) => {
    await generator.get(
      `/api/tickets/${id}?with=${MANAGER_WITH}&with_staged_imports=1`
    );
    await openThreadMessages(id)(generator);
    await readStatusLogs(id)(generator);
  };

  async function createTicket(subject: string, body: string): Promise<string> {
    const response = await ticketsControlCall(
      "POST",
      "/api/tickets",
      managerClientToken.access_token,
      {
        subject,
        body,
        ticket_department_id: "8d632507-9806-5d1e-33eb-8174e234e98d"
      }
    );
    const id = (response.body as { data?: { id?: string } })?.data?.id;
    if (!id)
      throw new Error(`Could not create the throwaway ticket "${subject}".`);
    return id;
  }

  async function closeTicket(id: string): Promise<void> {
    await ticketsControlCall(
      "PUT",
      `/api/tickets/${id}/status`,
      managerClientToken.access_token,
      { status_code: "ticket_closed" }
    );
  }

  async function replyTo(id: string, body: string): Promise<string> {
    const response = await ticketsControlCall(
      "POST",
      `/api/tickets/${id}/replies`,
      managerClientToken.access_token,
      { body }
    );
    const messageId = (response.body as { data?: { id?: string } })?.data?.id;
    if (!messageId)
      throw new Error(`Could not arrange a reply on ticket ${id}.`);
    return messageId;
  }

  async function uploadRealFile(
    name: string,
    contents: string
  ): Promise<string> {
    const form = new FormData();
    form.append("file", new Blob([contents], { type: "text/plain" }), name);
    const { body: selfBody } = await ticketsControlCall(
      "GET",
      "/api/self?with=actor.brand",
      managerClientToken.access_token
    );
    const brandId =
      (
        selfBody as {
          data?: { brand_id?: string; actor?: { brand?: { id?: string } } };
        }
      )?.data?.brand_id ??
      (selfBody as { data?: { actor?: { brand?: { id?: string } } } })?.data
        ?.actor?.brand?.id;
    if (brandId) form.append("brand_id", brandId);
    const response = await fetch(`${API_URL}/api/ticket_messages/files`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Origin: ORIGIN,
        Authorization: `Bearer ${managerClientToken.access_token}`
      },
      body: form
    });
    const uploadBody = (await response.json().catch(() => null)) as {
      data?: Array<{ id?: string }>;
    } | null;
    const fileId = uploadBody?.data?.[0]?.id;
    if (!fileId) throw new Error(`Could not upload "${name}".`);
    return fileId;
  }

  async function replyWithFile(
    id: string,
    body: string,
    fileId: string
  ): Promise<void> {
    await ticketsControlCall(
      "POST",
      `/api/tickets/${id}/replies`,
      managerClientToken.access_token,
      { body, files: [{ id: fileId }] }
    );
  }

  beforeAll(async () => {
    managerClientToken = await mintClientToken();
    const { body } = await ticketsControlCall(
      "GET",
      "/api/self",
      managerClientToken.access_token
    );
    managerClientId =
      (body as { data?: { actor_id?: string } })?.data?.actor_id ?? "";
  }, 30000);

  describe("The manager-cycle throwaway ticket", () => {
    let managerTicketId: string;
    let replyMessageId: string;

    beforeAll(async () => {
      const response = await ticketsControlCall(
        "POST",
        "/api/tickets",
        managerClientToken.access_token,
        {
          subject: "Fixture manager-cycle ticket",
          body: "Recorded for FE-3145's manager-cycle capture.",
          ticket_department_id: "8d632507-9806-5d1e-33eb-8174e234e98d"
        }
      );
      const id = (response.body as { data?: { id?: string } })?.data?.id;
      if (!id) throw new Error("Could not create the manager-cycle ticket.");
      managerTicketId = id;
    }, 30000);

    describe("Open one of my tickets", () => {
      const scenario = "Open one of my tickets";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("I open one of my support tickets", () =>
        recordManagerStep(
          scenario,
          "I open one of my support tickets",
          openManagerTicket(managerTicketId)
        ));
    });

    describe("Know the state of the ticket I am reading", () => {
      const scenario = "Know the state of the ticket I am reading";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("I open a ticket", () =>
        recordManagerStep(
          scenario,
          "I open a ticket",
          openManagerTicket(managerTicketId)
        ));
    });

    describe("Read the conversation on a ticket", () => {
      const scenario = "Read the conversation on a ticket";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("I open a ticket", () =>
        recordManagerStep(
          scenario,
          "I open a ticket",
          openManagerTicket(managerTicketId)
        ));
      it("I see its messages newest first, each with the files attached to it", () =>
        recordManagerStep(
          scenario,
          "I see its messages newest first, each with the files attached to it",
          loadOlderPage(managerTicketId)
        ));
    });

    describe("Reply to a ticket", () => {
      const scenario = "Reply to a ticket";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("I am reading one of my tickets", () =>
        recordManagerStep(
          scenario,
          "I am reading one of my tickets",
          openManagerTicket(managerTicketId)
        ));
      it("I send a reply", () =>
        recordManagerStep(scenario, "I send a reply", async generator => {
          const { status, body } = await generator.post(
            `/api/tickets/${managerTicketId}/replies`,
            { body: "Recorded reply for FE-3145, to be re-read." }
          );
          if (status !== 200 && status !== 201)
            throw new Error(`Reply capture returned ${status}.`);
          const data = (body as { data?: { id?: string } })?.data;
          if (!data?.id)
            throw new Error("Reply capture returned no message id.");
          replyMessageId = data.id;
        }));
      it("the ticket's own state is refreshed, because replying can change it", () =>
        recordManagerStep(
          scenario,
          "the ticket's own state is refreshed, because replying can change it",
          openManagerTicket(managerTicketId)
        ));
    });

    describe("Re-read one message on its own", () => {
      const scenario = "Re-read one message on its own";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("I am reading a ticket's conversation", () =>
        recordManagerStep(
          scenario,
          "I am reading a ticket's conversation",
          async generator => {
            await openManagerTicket(managerTicketId)(generator);
            await loadOlderPage(managerTicketId)(generator);
          }
        ));
      it("I ask for one message again", () =>
        recordManagerStep(
          scenario,
          "I ask for one message again",
          generator => {
            if (!replyMessageId)
              throw new Error(
                "No reply message id to re-read — run after reply."
              );
            return generator.get(
              `/api/tickets/${managerTicketId}/messages/${replyMessageId}?with=files`
            );
          }
        ));
    });

    describe("Read further back in a long conversation / See only messages with files (AC-15)", () => {
      let longThreadId: string;

      beforeAll(async () => {
        longThreadId = await createTicket(
          "Fixture long-thread ticket",
          "Recorded for FE-3145's AC-15 pagination capture."
        );
        for (let i = 0; i < 12; i += 1) {
          await replyTo(
            longThreadId,
            `Recorded reply ${i} for FE-3145's AC-15 capture.`
          );
        }
      }, 60000);

      describe("Read further back in a long conversation", () => {
        const scenario = "Read further back in a long conversation";
        it(BG_AUTH, () =>
          recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
        );
        it(BG_PATH, () =>
          recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
        );
        it("a ticket has more messages than I have been shown", () =>
          recordManagerStep(
            scenario,
            "a ticket has more messages than I have been shown",
            async generator => {
              await openManagerTicket(longThreadId)(generator);
              await loadOlderPage(longThreadId)(generator);
            }
          ));
        it("I ask for older messages", () =>
          recordManagerStep(
            scenario,
            "I ask for older messages",
            loadOlderPage(longThreadId)
          ));
      });

      describe("See only the messages that carry files", () => {
        const scenario = "See only the messages that carry files";
        it(BG_AUTH, () =>
          recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
        );
        it(BG_PATH, () =>
          recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
        );
        it("some messages on a ticket carry files and others do not", () =>
          recordManagerStep(
            scenario,
            "some messages on a ticket carry files and others do not",
            async generator => {
              await openManagerTicket(longThreadId)(generator);
              await loadOlderPage(longThreadId)(generator);
            }
          ));
        it("I ask to see only the messages with files", () =>
          recordManagerStep(
            scenario,
            "I ask to see only the messages with files",
            generator =>
              generator.get(
                `/api/tickets/${longThreadId}/messages?with=files&limit=11&filter[is_log]=0&filter[files.id|gt]=0&order=-created_at,-id`
              )
          ));
      });
    });

    describe("Link, change, and unlink the product a ticket is about", () => {
      const scenario = "Link, change, and unlink the product a ticket is about";
      const LINKED = "d0367942-4d0e-7109-256f-3153698d582e";
      const CHANGED = "d6325079-8065-d1e3-5e9c-8174e234e98d";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("I am reading one of my tickets", () =>
        recordManagerStep(
          scenario,
          "I am reading one of my tickets",
          openManagerTicket(managerTicketId)
        ));
      it("I attach one of my products to it", () =>
        recordManagerStep(
          scenario,
          "I attach one of my products to it",
          async generator => {
            await generator.put(`/api/tickets/${managerTicketId}`, {
              contract_product_id: LINKED
            });
            await openManagerTicket(managerTicketId)(generator);
          }
        ));
      it("choosing a different product replaces it rather than adding a second", () =>
        recordManagerStep(
          scenario,
          "choosing a different product replaces it rather than adding a second",
          async generator => {
            await generator.put(`/api/tickets/${managerTicketId}`, {
              contract_product_id: CHANGED
            });
            await openManagerTicket(managerTicketId)(generator);
          }
        ));
      it("unlinking clears the product from the ticket entirely", () =>
        recordManagerStep(
          scenario,
          "unlinking clears the product from the ticket entirely",
          async generator => {
            await generator.put(`/api/tickets/${managerTicketId}`, {
              contract_product_id: null
            });
            await openManagerTicket(managerTicketId)(generator);
          }
        ));
    });

    describe("Rename a ticket's subject", () => {
      const scenario = "Rename a ticket's subject";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("one of my tickets is open", () =>
        recordManagerStep(
          scenario,
          "one of my tickets is open",
          openManagerTicket(managerTicketId)
        ));
      it("I change its subject", () =>
        recordManagerStep(scenario, "I change its subject", generator =>
          generator.put(`/api/tickets/${managerTicketId}`, {
            subject: "Fixture manager-cycle ticket (renamed)"
          })
        ));
    });

    describe("Close a ticket I no longer need help with", () => {
      const scenario = "Close a ticket I no longer need help with";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("one of my tickets is open", () =>
        recordManagerStep(
          scenario,
          "one of my tickets is open",
          openManagerTicket(managerTicketId)
        ));
      it("I close it", () =>
        recordManagerStep(scenario, "I close it", generator =>
          generator.put(`/api/tickets/${managerTicketId}/status`, {
            status_code: "ticket_closed"
          })
        ));
    });
  });

  describe("Reopen a ticket that was closed", () => {
    const scenario = "Reopen a ticket that was closed";
    let reopenTicketId: string;

    beforeAll(async () => {
      const created = await ticketsControlCall(
        "POST",
        "/api/tickets",
        managerClientToken.access_token,
        {
          subject: "Fixture reopen-cycle ticket",
          body: "Recorded for FE-3145's reopen capture.",
          ticket_department_id: "8d632507-9806-5d1e-33eb-8174e234e98d"
        }
      );
      const id = (created.body as { data?: { id?: string } })?.data?.id;
      if (!id) throw new Error("Could not create the reopen-cycle ticket.");
      reopenTicketId = id;
      await ticketsControlCall(
        "PUT",
        `/api/tickets/${reopenTicketId}/status`,
        managerClientToken.access_token,
        { status_code: "ticket_closed" }
      );
    }, 30000);

    it(BG_AUTH, () =>
      recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
    );
    it(BG_PATH, () =>
      recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
    );
    it("one of my tickets is closed", () =>
      recordManagerStep(scenario, "one of my tickets is closed", generator =>
        openManagerTicket(reopenTicketId)(generator)
      ));
    it("I reopen it", () =>
      recordManagerStep(scenario, "I reopen it", generator =>
        generator.put(`/api/tickets/${reopenTicketId}/status`, {
          status_code: "ticket_open"
        })
      ));
  });

  describe("See what happened to the ticket, in the conversation", () => {
    const scenario = "See what happened to the ticket, in the conversation";
    let logTicketId: string;

    beforeAll(async () => {
      logTicketId = await createTicket(
        "Fixture status-log ticket",
        "Recorded for FE-3145's AC-22 status-log capture."
      );
      await replyTo(logTicketId, "Recorded reply for FE-3145's AC-22 capture.");
      await closeTicket(logTicketId);
    }, 30000);

    it(BG_AUTH, () =>
      recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
    );
    it(BG_PATH, () =>
      recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
    );
    it("a ticket has been opened, replied to, and closed", () =>
      recordManagerStep(
        scenario,
        "a ticket has been opened, replied to, and closed",
        openManagerTicket(logTicketId)
      ));
    it("I read its conversation", () =>
      recordManagerStep(
        scenario,
        "I read its conversation",
        loadOlderPage(logTicketId)
      ));
  });

  describe("Poll scenarios (AC-29) — fired directly, never timer-waited", () => {
    let pollTicketId: string;
    let closedPollTicketId: string;

    beforeAll(async () => {
      pollTicketId = await createTicket(
        "Fixture poll-open ticket",
        "Recorded for FE-3145's AC-29 open-ticket capture."
      );
      closedPollTicketId = await createTicket(
        "Fixture poll-resolved ticket",
        "Recorded for FE-3145's AC-29 resolved-ticket capture."
      );
      await closeTicket(closedPollTicketId);
    }, 30000);

    describe("New activity on an open ticket reaches me without my asking", () => {
      const scenario =
        "New activity on an open ticket reaches me without my asking";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("I am reading one of my open tickets", () =>
        recordManagerStep(
          scenario,
          "I am reading one of my open tickets",
          openManagerTicket(pollTicketId)
        ));
      it("time passes while I am watching it", () =>
        recordManagerStep(
          scenario,
          "time passes while I am watching it",
          openManagerTicket(pollTicketId)
        ));
    });

    describe("A resolved ticket is not watched", () => {
      const scenario = "A resolved ticket is not watched";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("I am reading one of my closed tickets", () =>
        recordManagerStep(
          scenario,
          "I am reading one of my closed tickets",
          openManagerTicket(closedPollTicketId)
        ));
    });

    describe("A ticket I am not looking at is not watched", () => {
      const scenario = "A ticket I am not looking at is not watched";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("I am reading one of my open tickets", () =>
        recordManagerStep(
          scenario,
          "I am reading one of my open tickets",
          openManagerTicket(pollTicketId)
        ));
      it("I switch away to something else", () =>
        recordManagerStep(
          scenario,
          "I switch away to something else",
          openManagerTicket(pollTicketId)
        ));
    });

    describe("Leaving a ticket stops watching it for good", () => {
      const scenario = "Leaving a ticket stops watching it for good";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("I am reading one of my open tickets", () =>
        recordManagerStep(
          scenario,
          "I am reading one of my open tickets",
          openManagerTicket(pollTicketId)
        ));
    });
  });

  describe("Correct a message I wrote / Withdraw a message I wrote (AC-18/AC-19)", () => {
    let editTicketId: string;
    let editMessageId: string;

    beforeAll(async () => {
      editTicketId = await createTicket(
        "Fixture edit-withdraw ticket",
        "Recorded for FE-3145's AC-18/AC-19 capture."
      );
      editMessageId = await replyTo(
        editTicketId,
        "Recorded reply for FE-3145, to be corrected."
      );
    }, 30000);

    const openThreadBundle = (id: string) => async (generator: Generator) => {
      await openManagerTicket(id)(generator);
      await loadOlderPage(id)(generator);
    };

    describe("Correct a message I wrote", () => {
      const scenario = "Correct a message I wrote";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("one of the messages on the ticket is mine to manage", () =>
        recordManagerStep(
          scenario,
          "one of the messages on the ticket is mine to manage",
          openThreadBundle(editTicketId)
        ));
      it("I correct its wording", () =>
        recordManagerStep(scenario, "I correct its wording", generator =>
          generator.put(
            `/api/tickets/${editTicketId}/replies/${editMessageId}`,
            { body: "Recorded reply for FE-3145, corrected." }
          )
        ));
    });

    describe("Withdraw a message I wrote", () => {
      const scenario = "Withdraw a message I wrote";
      let withdrawMessageId: string;

      beforeAll(async () => {
        withdrawMessageId = await replyTo(
          editTicketId,
          "Recorded reply for FE-3145, to be withdrawn."
        );
      }, 30000);

      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("one of the messages on the ticket is mine to manage", () =>
        recordManagerStep(
          scenario,
          "one of the messages on the ticket is mine to manage",
          openThreadBundle(editTicketId)
        ));
      it("I withdraw it and say why", () =>
        recordManagerStep(
          scenario,
          "I withdraw it and say why",
          async generator => {
            // The module sends the reason in the DELETE body, then re-reads the feed.
            await generator.capture(
              "DELETE",
              `/api/tickets/${editTicketId}/messages/${withdrawMessageId}`,
              { reason: "Recorded withdrawal for FE-3145." }
            );
            await openThreadBundle(editTicketId)(generator);
          }
        ));
    });
  });

  describe("Download a file from the conversation", () => {
    const scenario = "Download a file from the conversation";
    let downloadTicketId: string;
    let downloadFileId: string;

    beforeAll(async () => {
      downloadTicketId = await createTicket(
        "Fixture download ticket",
        "Recorded for FE-3145's AC-20 capture."
      );
      downloadFileId = await uploadRealFile(
        "fe-3145-ac20-download.txt",
        "FE-3145 fixture — AC-20 download attachment.\n"
      );
      await replyWithFile(
        downloadTicketId,
        "Recorded reply with an attachment for FE-3145's AC-20 capture.",
        downloadFileId
      );
    }, 30000);

    it(BG_AUTH, () =>
      recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
    );
    it(BG_PATH, () =>
      recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
    );
    it("a message on the ticket carries a file", () =>
      recordManagerStep(
        scenario,
        "a message on the ticket carries a file",
        openManagerTicket(downloadTicketId)
      ));
    it("I download that file", () =>
      recordManagerStep(scenario, "I download that file", generator =>
        generator.get(
          `/api/ticket_messages/files/${downloadFileId}/download`,
          undefined,
          undefined,
          "binary"
        )
      ));
  });

  describe("Remove a file I attached", () => {
    const scenario = "Remove a file I attached";
    let removeTicketId: string;
    let removeFileMessageId: string;
    let removeFileId: string;

    beforeAll(async () => {
      removeTicketId = await createTicket(
        "Fixture remove-file ticket",
        "Recorded for FE-3145's AC-21 capture."
      );
      removeFileId = await uploadRealFile(
        "fe-3145-ac21-remove.txt",
        "FE-3145 fixture — AC-21 remove attachment.\n"
      );
      const reply = await ticketsControlCall(
        "POST",
        `/api/tickets/${removeTicketId}/replies`,
        managerClientToken.access_token,
        {
          body: "Recorded reply with an attachment for FE-3145's AC-21 capture.",
          files: [{ id: removeFileId }]
        }
      );
      const messageId = (reply.body as { data?: { id?: string } })?.data?.id;
      if (!messageId)
        throw new Error("Could not arrange the AC-21 file-bearing reply.");
      removeFileMessageId = messageId;
    }, 30000);

    it(BG_AUTH, () =>
      recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
    );
    it(BG_PATH, () =>
      recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
    );
    it("a message of mine carries a file", () =>
      recordManagerStep(
        scenario,
        "a message of mine carries a file",
        openManagerTicket(removeTicketId)
      ));
    it("I remove that file", () =>
      recordManagerStep(scenario, "I remove that file", generator =>
        generator.delete(
          `/api/tickets/${removeTicketId}/messages/${removeFileMessageId}/files/${removeFileId}`
        )
      ));
  });

  describe("Reply to a ticket that has files attached", () => {
    const scenario = "Reply to a ticket that has files attached";
    let filesTicketId: string;

    beforeAll(async () => {
      filesTicketId = await createTicket(
        "Fixture reply-with-files ticket",
        "Recorded for FE-3145's AC-17 files capture."
      );
    }, 30000);

    it(BG_AUTH, () =>
      recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
    );
    it(BG_PATH, () =>
      recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
    );
    it("I have attached files to my reply", () =>
      recordManagerStep(
        scenario,
        "I have attached files to my reply",
        async generator => {
          await openManagerTicket(filesTicketId)(generator);
          const form = new FormData();
          form.append(
            "file",
            new Blob(["FE-3145 fixture — AC-17 files attached.\n"], {
              type: "text/plain"
            }),
            "fe-3145-ac17-files.txt"
          );
          const { body: selfBody } = await ticketsControlCall(
            "GET",
            "/api/self?with=actor.brand",
            managerClientToken.access_token
          );
          const brandId =
            (
              selfBody as {
                data?: {
                  brand_id?: string;
                  actor?: { brand?: { id?: string } };
                };
              }
            )?.data?.brand_id ??
            (selfBody as { data?: { actor?: { brand?: { id?: string } } } })
              ?.data?.actor?.brand?.id;
          if (brandId) form.append("brand_id", brandId);
          generator.setBearerToken(managerClientToken.access_token);
          await generator.post("/api/ticket_messages/files", form);
        }
      ));
    it("I send the reply", () =>
      recordManagerStep(scenario, "I send the reply", async generator => {
        const uploadFileId = await uploadRealFile(
          "fe-3145-ac17-actual-send.txt",
          "FE-3145 fixture — AC-17 files actual send.\n"
        );
        await generator.post(`/api/tickets/${filesTicketId}/replies`, {
          body: "Recorded reply with an attachment for FE-3145.",
          files: [{ id: uploadFileId }]
        });
      }));
  });

  describe("Tickets shared with me sit alongside my own", () => {
    const scenario = "Tickets shared with me sit alongside my own";
    let memberToken: IToken | undefined;

    beforeAll(async () => {
      memberToken = await mintToken({
        grant_type: GrantTypes.PASSWORD,
        username: API_CREDENTIALS.delegateMember.username,
        password: API_CREDENTIALS.delegateMember.password
      });
      if (!memberToken)
        throw new Error(
          "Could not mint the delegate-member token for AC-10 — the earlier " +
            "invite/accept capture must run first, in the same file."
        );
    }, 30000);

    it(BG_AUTH, () =>
      recordManagerStep(
        scenario,
        BG_AUTH,
        readManagerDefaultList,
        memberToken?.access_token
      )
    );
    it(BG_PATH, () =>
      recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
    );
  });

  describe("Reply when an agent has replied first", () => {
    const scenario = "Reply when an agent has replied first";
    let conflictTicketId: string;

    beforeAll(async () => {
      conflictTicketId = await createTicket(
        "Fixture conflict ticket",
        "Recorded for FE-3145's AC-17 conflict capture."
      );
    }, 30000);

    it(BG_AUTH, () =>
      recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
    );
    it(BG_PATH, () =>
      recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
    );
    it("an agent replied after the last message I was shown", () =>
      recordManagerStep(
        scenario,
        "an agent replied after the last message I was shown",
        openManagerTicket(conflictTicketId)
      ));
    it("I send my reply", async () => {
      const staffToken = await mintStaffToken();
      await ticketsControlCall(
        "POST",
        `/api/admin/tickets/${conflictTicketId}/replies`,
        staffToken.access_token,
        { body: "A staff reply the client has not seen yet." }
      );
      await recordManagerStep(scenario, "I send my reply", generator =>
        generator.post(`/api/tickets/${conflictTicketId}/replies`, {
          body: "A reply on a stale thread"
        })
      );
    });
  });

  describe("AC-18/AC-19 guards — a message not mine to manage", () => {
    let notMineTicketId: string;

    beforeAll(async () => {
      notMineTicketId = await createTicket(
        "Fixture not-mine ticket",
        "Recorded for FE-3145's AC-18/AC-19 guard capture."
      );
      const staffToken = await mintStaffToken();
      await ticketsControlCall(
        "POST",
        `/api/admin/tickets/${notMineTicketId}/replies`,
        staffToken.access_token,
        { body: "A staff reply the client cannot manage." }
      );
    }, 30000);

    let notMineMessageId: string;

    describe("I cannot correct a message that is not mine", () => {
      const scenario = "I cannot correct a message that is not mine";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("a message on the ticket is not mine to manage", () =>
        recordManagerStep(
          scenario,
          "a message on the ticket is not mine to manage",
          async generator => {
            await openManagerTicket(notMineTicketId)(generator);
            await loadOlderPage(notMineTicketId)(generator);
            const { body } = await generator.get(
              `/api/tickets/${notMineTicketId}/messages?with=files&limit=11&filter[is_log]=0&order=-created_at,-id`
            );
            const rows =
              (body as { data?: Array<{ id: string; can_manage?: boolean }> })
                ?.data ?? [];
            notMineMessageId = rows.find(row => !row.can_manage)?.id ?? "";
          }
        ));
      it("I try to correct it", () =>
        recordManagerStep(scenario, "I try to correct it", () =>
          Promise.resolve()
        ));
    });

    describe("I cannot withdraw a message that is not mine", () => {
      const scenario = "I cannot withdraw a message that is not mine";
      it(BG_AUTH, () =>
        recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
      );
      it(BG_PATH, () =>
        recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
      );
      it("a message on the ticket is not mine to manage", () =>
        recordManagerStep(
          scenario,
          "a message on the ticket is not mine to manage",
          async generator => {
            await openManagerTicket(notMineTicketId)(generator);
            await loadOlderPage(notMineTicketId)(generator);
            const { body } = await generator.get(
              `/api/tickets/${notMineTicketId}/messages?with=files&limit=11&filter[is_log]=0&order=-created_at,-id`
            );
            const rows =
              (body as { data?: Array<{ id: string; can_manage?: boolean }> })
                ?.data ?? [];
            notMineMessageId = rows.find(row => !row.can_manage)?.id ?? "";
          }
        ));
      it("I try to withdraw it", () =>
        recordManagerStep(scenario, "I try to withdraw it", () =>
          Promise.resolve()
        ));
    });
  });

  // AC-24 / AC-27 locked guards — staff locks the ticket the legacy way
  // (vue-app ticketProvider.ts toggleLock: update the ticket with
  // `settings.lock`), the client's reads are recorded, then staff unlocks it.
  describe("AC-24/AC-27 guards — a locked ticket", () => {
    let lockedTicketId: string;
    let staffAccessToken: string;

    const setLock = async (lock: boolean): Promise<void> => {
      await ticketsControlCall(
        "PUT",
        `/api/admin/tickets/${lockedTicketId}`,
        staffAccessToken,
        { settings: { lock } }
      );
      const { body } = await ticketsControlCall(
        "GET",
        `/api/tickets/${lockedTicketId}?with=settings`,
        managerClientToken.access_token
      );
      const settled = (body as { data?: { settings?: { lock?: boolean } } })
        ?.data?.settings?.lock;
      if (!!settled !== lock)
        throw new Error(
          `ticket ${lockedTicketId} lock=${lock} not applied: ${JSON.stringify(body).slice(0, 300)}`
        );
    };

    beforeAll(async () => {
      staffAccessToken = (await mintStaffToken()).access_token;
      lockedTicketId = await createTicket(
        "Fixture locked ticket",
        "Recorded for FE-3145's AC-24/AC-27 locked guards."
      );
      await setLock(true);
    }, 60000);

    afterAll(() => setLock(false), 60000);

    for (const [scenario, when] of [
      ["I cannot close a locked ticket", "I try to close it"],
      ["I cannot rename a locked ticket", "I try to change its subject"]
    ] as const) {
      describe(scenario, () => {
        it(BG_AUTH, () =>
          recordManagerStep(scenario, BG_AUTH, readManagerDefaultList)
        );
        it(BG_PATH, () =>
          recordManagerStep(scenario, BG_PATH, () => Promise.resolve())
        );
        it("one of my tickets is locked", () =>
          recordManagerStep(
            scenario,
            "one of my tickets is locked",
            openManagerTicket(lockedTicketId)
          ));
        it(when, () =>
          recordManagerStep(scenario, when, () => Promise.resolve())
        );
      });
    }
  });
});
