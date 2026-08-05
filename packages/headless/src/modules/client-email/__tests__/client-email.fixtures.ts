// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Email API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real `clients/{id}/emails[...]` endpoints the `client-email`
 * module hits for its ONE in-scope cell (client × self) and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir —
 * the same files the integration tests replay through MSW. Run on demand:
 *
 *   pnpm fixtures:generate client-email
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` /
 * `*.int.test.ts` suites by the `*.fixtures.ts` suffix (see the package vitest
 * configs). It has no assertions: an `it()` succeeds when the capture
 * completes. `save()` in `afterAll` writes every capture once.
 *
 * ## Captures (design.md §9)
 * `get-clients-id-emails` · `get-clients-id-emails-id` ·
 * `post-clients-id-emails` · `put-clients-id-emails-id` (edit, R26
 * `verified:0`) · `put-clients-id-emails-id-case-set-default` (AC-5 success) ·
 * `put-clients-id-emails-id-case-set-default-unverified` (the real 409 the API
 * answers when the target is unverified — AC-22's rejected-mutation material) ·
 * `patch-clients-id-emails-id-send-verify` · `delete-clients-id-emails-id` ·
 * `get-clients-id-emails-case-page-1` / `-case-page-2` (AC-8's caller-supplied
 * `limit=2` walk).
 * NO `admin/*` captures — those belong to the dropped staff cell (R27-R33).
 *
 * ## Why the paged captures carry a `?case=` marker
 * `limit` and `offset` are in the naming utility's `EXCLUDE_PARAMS`
 * (`tests/fixtures/fixture-naming.mjs`), so two reads of the same collection at
 * different offsets share ONE fixture identity and would overwrite each other.
 * `case` is an identity param, so `?case=page-1` / `?case=page-2` keep the two
 * REAL responses as two files — the same disambiguator the set-default captures
 * already use. Pulling `limit`/`offset` out of `EXCLUDE_PARAMS` would re-key
 * every other unit's fixtures and is not this module's call to make.
 *
 * ## Recording limit (surfaced, not papered over)
 * AC-5's literal precondition is "a VERIFIED address that is not my default".
 * The staging client holds exactly one address — its verified default — and a
 * freshly-created address cannot be verified from here (the code only arrives
 * by email), while the API refuses to default an unverified one (409, captured).
 * The AC-5 success capture is therefore `{default:true}` against the address
 * that already holds the default. It is a real recorded 200 for exactly the
 * wire call AC-5 names; what it does not exercise server-side is the
 * previous-default flip, which the AC-5 test drives through its own list.
 *
 * ## Staging hygiene
 * Every mutation targets an address this run CREATES, and the run deletes it
 * again — including the two extra addresses the paging captures need. The
 * default is never moved off the account's own address, so a re-record cannot
 * leave the shared staging client pointing at a throwaway.
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

type WireEmail = {
  id: string;
  email: string;
  default?: boolean | number;
  verified?: boolean | number;
};

// -----------------------------------------------------------------------------

/**
 * Mint a REAL (unsanitised) token outside the capture pipeline. The Generator
 * only ever returns sanitised bodies, so credentials for authed captures must
 * come from a plain fetch that never touches disk.
 */
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

/** Plain, UNCAPTURED authed call — used for id lookup and staging restore. */
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

/** Resolve the authed client's id from `/self` (not captured). */
async function fetchClientId(accessToken: string): Promise<string | undefined> {
  const { body } = await call("GET", "/api/self?with=actor", accessToken);
  const data = (body as { data?: { id?: string; actor?: { id?: string } } })
    ?.data;
  return data?.actor?.id ?? data?.id;
}

const isTruthyFlag = (value: unknown): boolean =>
  value === true || value === 1 || value === "1";

// -----------------------------------------------------------------------------

describe("Client-Email API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let createdEmailId: string | undefined;
  let pagingEmailId: string | undefined;
  let originalDefaultId: string | undefined;

  const stamp = Date.now();
  const createdAddress = `client-email-fixture-${stamp}@example.com`;
  const editedAddress = `client-email-fixture-edited-${stamp}@example.com`;
  const pagingAddress = `client-email-fixture-paging-${stamp}@example.com`;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-email"
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

    const id = await fetchClientId(clientToken.access_token);
    if (!id) {
      throw new Error(
        "Could not resolve the client id from /self — cannot capture the " +
          "clients/{id}/emails fixtures."
      );
    }
    clientId = id;

    // The account's current default, so the set-default capture can be
    // reverted and the shared staging client left as it was found.
    const { body } = await call(
      "GET",
      `/api/clients/${clientId}/emails`,
      clientToken.access_token
    );
    const rows = ((body as { data?: WireEmail[] })?.data ?? []) as WireEmail[];
    originalDefaultId = rows.find(row => isTruthyFlag(row.default))?.id;
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/clients/{id}/emails (list — AC-1/AC-8)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(`/api/clients/${clientId}/emails`);
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `List capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
  });

  it("captures POST /api/clients/{id}/emails (add — AC-7/AC-15, R25)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/clients/${clientId}/emails`,
      { email: createdAddress }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Add capture returned ${status}; cannot continue.`);
    }
    createdEmailId = (body as { data?: { id?: string } })?.data?.id;
    if (!createdEmailId) {
      throw new Error(
        "The add capture returned no id — the remaining per-email captures " +
          "have nothing to address."
      );
    }
  });

  it("captures GET /api/clients/{id}/emails/{id} (load one — AC-11)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(`/api/clients/${clientId}/emails/${createdEmailId}`);
    generator.clearBearerToken();
  });

  it("captures PUT /api/clients/{id}/emails/{id} (edit — AC-14, R26 verified:0)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}/emails/${createdEmailId}`,
      { email: editedAddress, verified: 0 }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      console.warn(
        `[client-email.fixtures] edit returned ${status} — kept as an honest ` +
          "capture; inspect it before the integration tests rely on it."
      );
    }
  });

  it("captures PUT /api/clients/{id}/emails/{id} ?case=set-default-unverified (the real 409 — AC-22)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}/emails/${createdEmailId}?case=set-default-unverified`,
      { default: true }
    );
    generator.clearBearerToken();
    if (status < 400) {
      console.warn(
        `[client-email.fixtures] defaulting an UNVERIFIED address returned ` +
          `${status}, expected 4xx — AC-22's rejected-mutation capture no ` +
          "longer carries an error body. Inspect before relying on it."
      );
    }
  });

  it("captures PUT /api/clients/{id}/emails/{id} ?case=set-default (AC-5)", async () => {
    if (!originalDefaultId) {
      throw new Error(
        "The staging client has no default address to re-assert — AC-5 has " +
          "no verified target to capture a successful set-default against."
      );
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}/emails/${originalDefaultId}?case=set-default`,
      { default: true }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Set-default capture returned ${status} against the account's own ` +
          "verified default — AC-5 has no recorded success to replay."
      );
    }
  });

  it("captures PATCH /api/clients/{id}/emails/{id}/send_verify (AC-6)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.patch(
      `/api/clients/${clientId}/emails/${createdEmailId}/send_verify`
    );
    generator.clearBearerToken();
    if (status >= 400) {
      console.warn(
        `[client-email.fixtures] send_verify returned ${status} — kept as an ` +
          "honest capture."
      );
    }
  });

  it("captures GET /api/clients/{id}/emails?limit=2 pages 1 and 2 (AC-8, caller-supplied limit)", async () => {
    // AC-8's caller-supplied walk needs a collection larger than one page. The
    // account holds its own address plus this run's throwaway (2); a third
    // makes `limit=2` a genuine two-page read — total 3, pages 2 — so both
    // captures are real API answers rather than a staged collection size.
    const created = await call(
      "POST",
      `/api/clients/${clientId}/emails`,
      clientToken.access_token,
      { email: pagingAddress }
    );
    pagingEmailId = (created.body as { data?: { id?: string } })?.data?.id;
    if (!pagingEmailId) {
      throw new Error(
        `Could not create the third address the paging capture needs ` +
          `(status ${created.status}) — AC-8 has no recorded second page.`
      );
    }

    try {
      generator.setBearerToken(clientToken.access_token);
      const pageOne = await generator.get(
        `/api/clients/${clientId}/emails?limit=2&offset=0&case=page-1`
      );
      const pageTwo = await generator.get(
        `/api/clients/${clientId}/emails?limit=2&offset=2&case=page-2`
      );
      generator.clearBearerToken();

      if (pageOne.status !== 200 || pageTwo.status !== 200) {
        throw new Error(
          `Paged list capture returned ${pageOne.status}/${pageTwo.status} — ` +
            "refusing to ship a fixture that does not represent a real page."
        );
      }

      const total = (pageTwo.body as { total?: number })?.total ?? 0;
      if (total <= 2) {
        throw new Error(
          `The paged capture reports total ${total}; a caller-supplied ` +
            "limit=2 needs more than one page of addresses to walk."
        );
      }
    } finally {
      await call(
        "DELETE",
        `/api/clients/${clientId}/emails/${pagingEmailId}`,
        clientToken.access_token
      );
    }
  });

  it("captures DELETE /api/clients/{id}/emails/{id} (AC-4)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.delete(
      `/api/clients/${clientId}/emails/${createdEmailId}`
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Delete capture returned ${status} — the throwaway address ` +
          `${createdEmailId} is still on the staging client. Clean it up.`
      );
    }
  });
});
