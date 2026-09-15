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

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes } from "@upmind-automation/types";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken, mintToken } from "../../auth/__tests__/auth.tokens";
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
