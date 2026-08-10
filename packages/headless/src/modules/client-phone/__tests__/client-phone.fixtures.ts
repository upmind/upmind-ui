// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Phone API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the real `clients/{id}/phones` responses this module's criteria
 * migration emits:
 *
 *   pnpm fixtures:generate client-phone
 *
 * ## Captures
 * `…-case-page-1` / `…-case-page-2` — a real `limit=2` walk. Then BOTH candidate
 * free-text keys, because they do not agree:
 * `…-case-number-like` is `filter[number|like]`, the model's own key spelled
 * straight onto the wire; `…-case-phone-like` is `filter[phone|like]`, the
 * column the row bodies carry and the one the schema now binds to. Whichever
 * answers 500 is recorded as it answered — a
 * capture that fails is evidence about the wire, so it is stored rather than
 * thrown on.
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

async function fetchClientId(accessToken: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/self?with=actor`, {
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const body = (await response.json().catch(() => null)) as {
    data?: { id?: string; actor?: { id?: string } };
  } | null;
  const id = body?.data?.actor?.id ?? body?.data?.id;
  if (!id) {
    throw new Error(
      "Could not resolve the client id from /self — cannot capture the " +
        "clients/{id}/phones fixtures."
    );
  }
  return id;
}

// -----------------------------------------------------------------------------

describe("Client-Phone API Fixtures Generator", () => {
  let generator: Generator;
  let clientId: string;
  let accessToken: string;
  let needle: string;

  beforeAll(async () => {
    const token = await mintClientToken();
    accessToken = token.access_token;
    clientId = await fetchClientId(accessToken);

    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-phone"
    });

    const probe = await fetch(
      `${API_URL}/api/clients/${clientId}/phones?limit=2`,
      {
        headers: {
          Accept: "application/json",
          Origin: ORIGIN,
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    const rows = ((await probe.json()) as { data?: { phone?: string }[] })
      ?.data;
    needle = rows?.[0]?.phone?.slice(-3) ?? "";
    if (!needle) {
      throw new Error(
        "The staging client holds no phone number — the filter captures have " +
          "nothing real to narrow on."
      );
    }
  }, 30000);

  afterAll(() => generator.save());

  it("captures the limit=2 walk (pages 1 and 2)", async () => {
    generator.setBearerToken(accessToken);
    const pageOne = await generator.get(
      `/api/clients/${clientId}/phones?limit=2&offset=0&case=page-1`
    );
    const pageTwo = await generator.get(
      `/api/clients/${clientId}/phones?limit=2&offset=2&case=page-2`
    );
    generator.clearBearerToken();

    if (pageOne.status !== 200 || pageTwo.status !== 200) {
      throw new Error(
        `Paged capture returned ${pageOne.status}/${pageTwo.status} — refusing ` +
          "to ship a fixture that does not represent a real page."
      );
    }
    const total = (pageTwo.body as { total?: number })?.total ?? 0;
    if (total <= 2) {
      throw new Error(
        `The paged capture reports total ${total}; a limit=2 walk needs more ` +
          "than one page of phones."
      );
    }
  });

  it("captures filter[number|like] — the model's key spelled straight onto the wire", async () => {
    generator.setBearerToken(accessToken);
    await generator.get(
      `/api/clients/${clientId}/phones?filter[number|like]=${encodeURIComponent(
        `%${needle}%`
      )}&limit=2&case=number-like`
    );
    generator.clearBearerToken();
  });

  it("captures filter[phone|like] — the column the row bodies carry, and the schema binds to", async () => {
    generator.setBearerToken(accessToken);
    await generator.get(
      `/api/clients/${clientId}/phones?filter[phone|like]=${encodeURIComponent(
        `%${needle}%`
      )}&limit=2&case=phone-like`
    );
    generator.clearBearerToken();
  });
});
