// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Email-History API Fixtures Generator (ADR 025 §A1.3, NFR-2)
 *
 * ## Job To Be Done
 * Capture the real `self/email_history` and `emails/{id}` endpoints this
 * module's ONE in-scope cell (client × self) reads, and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir —
 * the same files the integration tests replay through MSW. Run on demand:
 *
 *   pnpm fixtures:generate client-email-history
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from `*.test.ts` / `*.int.test.ts` by the
 * `*.fixtures.ts` suffix. No assertions beyond "the capture completed and
 * returned a usable body"; `save()` in `afterAll` writes every capture once.
 *
 * ## The real wire shape (query-platform revert, 2026-08-07)
 * `useQuery().request()` never sends `sort=` — it maps a composable's `sort`
 * ref to **`order=`** (`useQuery.ts` request(), e.g. `order=-created_at`).
 * The module's `loadList` no longer sets `withSplitCount` — that platform
 * option, `skip_count=1` on the wire, and the separate `?limit=count`
 * side-channel request are ALL gone. `total` now arrives inline on the SAME
 * main list response every other field does — there is exactly ONE request
 * per list read, never two.
 *
 * `case=<label>` is added to several list captures purely to keep their
 * fixture filenames/identity distinct — `order`, `limit` and `offset` are all
 * excluded from a fixture's identity (`fixture-naming.mjs` `EXCLUDE_PARAMS`,
 * because they never change WHICH response comes back over the wire), so two
 * captures that differ ONLY in sort or offset need a `case` label to avoid
 * colliding on one fixture file — the SAME device the page-1/page-2 walk
 * already used. `case` is never sent by production code; it exists solely so
 * this capture step writes one file per distinct response.
 *
 * ## Read-only module — no seeded state
 * Unlike `client-email` (which creates/edits/deletes throwaway addresses so
 * every case is deterministic), this module has NO mutation surface (NFR-1:
 * `client-email-history.services.ts`'s `// MUTATIONS` section is empty). Every
 * capture below reads whatever the staging client's REAL, pre-existing history
 * contains — nothing here is seeded or shaped.
 *
 * ## Capture-limitation disclosure (required by NFR-2 / the 2026-08-05 receipt)
 * The staging client (`API_CREDENTIALS.client`) has a real history of ~2860
 * emails at capture time: the overwhelming majority carry an `error_id`, a
 * handful are `sent`, and a handful are `SENDING` (neither sent, bounced, nor
 * errored) — confirmed via `filter[bounced]=true` returning `total: 0` for
 * this account's ENTIRE history, not a page sample. Two AC-3 cases are
 * therefore **NOT captured here, on purpose, rather than hand-authored**:
 *
 *   1. A BOUNCED row (`bounced: true`) — none exists anywhere in this
 *      account's history.
 *   2. The bounced+error precedence row (`bounced: true` AND `error_id` set)
 *      — depends on (1).
 *
 * A separate staff credential check (`API_CREDENTIALS.staff`) to source a
 * bounced row from a different real account failed with a real 401 (staging
 * credential mismatch) — recorded, not worked around. This is a halted
 * sub-case, escalated in the prover's hand-off, never papered over with an
 * authored `bounced: true` row.
 *
 * The single-read endpoint's full body lives at the row's NESTED `data.body`
 * (the `with=data` relation) — every real row checked (36+, across every
 * subject category present) carried a POPULATED nested `data.body`; none with
 * an empty one turned up. `get-emails-id` below is therefore a genuine "body
 * present" capture; a real "no body" capture is the disclosed gap.
 *
 * ## Captures
 * `get-self-email-history?case=default` (default list, REAL `total` inline —
 * AC-1/AC-2, and must exceed one page for AC-9's walk) ·
 * `get-self-email-history?case=page-1` / `case=page-2` (real 2-page walk,
 * AC-9) · `get-self-email-history?filter[bounced]=true` (real EMPTY result,
 * genuine `total:0` inline — AC-4/AC-8) ·
 * `get-self-email-history?filter[error_id|neq]=null` (ERROR rows, AC-3) ·
 * `get-self-email-history?filter[sent]=true` (the one real SENT row, AC-3) ·
 * `get-self-email-history?filter[error_id]=null` (the SENDING + SENT rows,
 * AC-3) · `get-self-email-history?case=subject-sort` (real subject sort,
 * AC-6) · `get-self-email-history?query=invoice` (AC-7) ·
 * `get-self-email-history?query=invoice&subject=Invoice` (AC-7) ·
 * `get-emails-id` (single read, real populated body, AC-13).
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes } from "@upmind-automation/types";
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
const WITH_PARAM = "with=recipient,recipient_type,recipient.image";

// -----------------------------------------------------------------------------

async function mintToken(
  grant: Record<string, string>
): Promise<IToken | undefined> {
  const response = await fetch(`${API_URL}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Origin: ORIGIN
    },
    body: new URLSearchParams(grant).toString()
  });
  const body = await response.json().catch(() => null);
  const token = (body?.access_token ? body : body?.data) as IToken | undefined;
  return token?.access_token ? token : undefined;
}

// -----------------------------------------------------------------------------

describe("Client-Email-History API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let sentEmailId: string | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-email-history"
    });

    const token = await mintToken({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.client.username,
      password: API_CREDENTIALS.client.password
    });
    if (!token) {
      throw new Error(
        "Could not mint a client token with the staging credentials — " +
          "check tests/fixtures/credentials.ts against the recording brand."
      );
    }
    clientToken = token;
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET self/email_history (default list, REAL total inline — AC-1/AC-2/AC-9)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&order=-created_at&limit=10&case=default`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `List capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
    const total = (body as { total?: number | null })?.total ?? 0;
    if (total <= 10) {
      throw new Error(
        `The default list capture reports total ${total}; AC-9 needs more ` +
          "than one page of REAL history to walk."
      );
    }
  });

  it("captures GET self/email_history page 1/2 of the REAL history (AC-9)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const pageOne = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&order=-created_at&limit=10&offset=0&case=page-1`
    );
    const pageTwo = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&order=-created_at&limit=10&offset=10&case=page-2`
    );
    generator.clearBearerToken();
    if (pageOne.status !== 200 || pageTwo.status !== 200) {
      throw new Error(
        `Paged capture returned ${pageOne.status}/${pageTwo.status} — ` +
          "refusing to ship a fixture that does not represent a real page."
      );
    }
  });

  it("captures GET self/email_history filter[bounced]=true — the REAL empty case, total:0 inline (AC-4/AC-8)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&filter[bounced]=true&limit=10`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Empty-case capture returned ${status}.`);
    }
    const total = (body as { total?: number })?.total;
    if (total !== 0) {
      throw new Error(
        `Expected the REAL bounced-filter total to be 0 for this staging ` +
          `client (documented capture-limitation basis) but got ${total} — ` +
          "the disclosed gap above needs re-checking, not silent replacement."
      );
    }
  });

  it("captures GET self/email_history filter[error_id|neq]=null — REAL error rows (AC-3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&filter[error_id|neq]=null&limit=3`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Error-status capture returned ${status}.`);
    }
  });

  it("captures GET self/email_history filter[sent]=true — the ONE REAL sent row (AC-3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&filter[sent]=true&limit=1`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Sent-status capture returned ${status}.`);
    }
    const rows = (body as { data?: Array<{ id?: string }> })?.data ?? [];
    sentEmailId = rows[0]?.id;
  });

  it("captures GET self/email_history filter[error_id]=null — REAL sending rows (AC-3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&filter[error_id]=null&limit=10`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Sending-status capture returned ${status}.`);
    }
  });

  it("captures GET self/email_history order=-subject — REAL subject sort (AC-6)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&order=-subject&limit=10&case=subject-sort`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Subject-sort capture returned ${status}.`);
    }
  });

  it("captures GET self/email_history query=invoice — REAL free-text search (AC-7)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&query=invoice&limit=10`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Free-text search capture returned ${status}.`);
    }
  });

  it("captures GET self/email_history query=invoice&subject=Invoice — REAL combined search (AC-7)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&query=invoice&subject=Invoice&limit=10`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Combined search capture returned ${status}.`);
    }
  });

  it("captures GET emails/{id} — a REAL single read (AC-13, real populated body)", async () => {
    if (!sentEmailId) {
      throw new Error(
        "No sent-email id resolved from the filter[sent]=true capture — " +
          "cannot capture the single-read fixture."
      );
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/emails/${sentEmailId}?with=data`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Single-read capture returned ${status}.`);
    }
  });
});
