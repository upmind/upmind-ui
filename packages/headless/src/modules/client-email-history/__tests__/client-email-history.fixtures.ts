// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Email-History API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the real `self/email_history` responses this module's criteria
 * migration emits:
 *
 *   pnpm fixtures:generate client-email-history
 *
 * ## Captures
 * `…-case-page-1` / `…-case-page-2` — a real `limit=2` walk under the declared
 * `order=-created_at` default. Then every declared filter column, each as the
 * `filter[col|op]` form the migration adopts: `…-case-subject-like`,
 * `…-case-sent-eq`, `…-case-bounced-eq`, `…-case-error-neq`.
 *
 * ## Why the collection is captured paged, never unpaged
 * The schema's `pagination.limit` default is `0`, and `?limit=0` against this
 * account returns all 2 866 rows — 4.3 MB, which is not a committable fixture.
 * The captures are therefore real pages; the specs assert the `limit=0` the
 * module puts ON THE WIRE from the observed request, and replay these recorded
 * bodies as the answer.
 *
 * ## Why this is not a normal test
 * REAL `fetch` calls against `VITE_API_URL` with staging credentials; the
 * `*.fixtures.ts` suffix keeps it out of the unit and integration projects.
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
        "VITE_API_URL is required to generate fixtures (set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures; the API " +
          'resolves the brand from Origin and answers 404 "Domain not found!" ' +
          "without it."
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

/** The `with` expansion the service pins on the URL — it scopes the rows. */
const WITH = "with=recipient,recipient_type,recipient.image";

// -----------------------------------------------------------------------------

async function mintClientToken(): Promise<IToken> {
  const response = await fetch(`${API_URL}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Origin: ORIGIN
    },
    body: new URLSearchParams({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.client.username,
      password: API_CREDENTIALS.client.password
    }).toString()
  });
  const body = await response.json().catch(() => null);
  const token = (body?.access_token ? body : body?.data) as IToken | undefined;
  if (!token?.access_token) {
    throw new Error(
      "Could not mint a client token with the staging credentials — check " +
        "tests/fixtures/credentials.ts against the recording brand."
    );
  }
  return token;
}

// -----------------------------------------------------------------------------

describe("Client-Email-History API Fixtures Generator", () => {
  let generator: Generator;
  let accessToken: string;
  let needle: string;

  beforeAll(async () => {
    accessToken = (await mintClientToken()).access_token;

    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-email-history"
    });

    const probe = await fetch(`${API_URL}/api/self/email_history?limit=2`, {
      headers: {
        Accept: "application/json",
        Origin: ORIGIN,
        Authorization: `Bearer ${accessToken}`
      }
    });
    const rows = ((await probe.json()) as { data?: { subject?: string }[] })
      ?.data;
    needle = rows?.[0]?.subject?.slice(0, 6) ?? "";
    if (!needle) {
      throw new Error(
        "The staging account has no sent email with a subject — the filter " +
          "capture has nothing real to narrow on."
      );
    }
  }, 30000);

  afterAll(() => generator.save());

  it("captures the limit=2 walk under the declared order=-created_at", async () => {
    generator.setBearerToken(accessToken);
    const pageOne = await generator.get(
      `/api/self/email_history?${WITH}&order=-created_at&limit=2&offset=0&case=page-1`
    );
    const pageTwo = await generator.get(
      `/api/self/email_history?${WITH}&order=-created_at&limit=2&offset=2&case=page-2`
    );
    generator.clearBearerToken();

    if (pageOne.status !== 200 || pageTwo.status !== 200) {
      throw new Error(
        `Paged capture returned ${pageOne.status}/${pageTwo.status} — refusing ` +
          "to ship a fixture that does not represent a real page."
      );
    }
  });

  it("captures filter[subject|like] — the migrated free-text key", async () => {
    generator.setBearerToken(accessToken);
    const { status, body } = await generator.get(
      `/api/self/email_history?${WITH}&filter[subject|like]=${encodeURIComponent(
        `%${needle}%`
      )}&limit=2&case=subject-like`
    );
    generator.clearBearerToken();

    if (status !== 200) {
      throw new Error(
        `filter[subject|like] returned ${status} — the API does not accept the ` +
          "criteria wire form for this collection (E1 evidence, not a test bug)."
      );
    }
    if (((body as { total?: number })?.total ?? 0) === 0) {
      throw new Error(
        `filter[subject|like]=%${needle}% narrowed to zero rows; the needle ` +
          "came from a live row, so a zero result means the key was ignored."
      );
    }
  });

  it("captures filter[sent|eq] and filter[bounced|eq] — the boolean columns", async () => {
    generator.setBearerToken(accessToken);
    const sent = await generator.get(
      `/api/self/email_history?${WITH}&filter[sent|eq]=1&limit=2&case=sent-eq`
    );
    const bounced = await generator.get(
      `/api/self/email_history?${WITH}&filter[bounced|eq]=1&limit=2&case=bounced-eq`
    );
    generator.clearBearerToken();

    if (sent.status !== 200 || bounced.status !== 200) {
      throw new Error(
        `Boolean filter capture returned ${sent.status}/${bounced.status} — ` +
          "the API does not accept the criteria wire form for these columns."
      );
    }
  });

  it("captures filter[error_id|neq] — the only column that survives the legacy spelling", async () => {
    generator.setBearerToken(accessToken);
    const { status } = await generator.get(
      `/api/self/email_history?${WITH}&filter[error_id|neq]=null&limit=2&case=error-neq`
    );
    generator.clearBearerToken();

    if (status !== 200) {
      throw new Error(
        `filter[error_id|neq] returned ${status} — the API does not accept the ` +
          "criteria wire form for this column."
      );
    }
  });
});
