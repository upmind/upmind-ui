// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Address API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the real `clients/{id}/addresses` responses this module's criteria
 * migration emits, so its integration specs replay recorded reality instead of
 * an authored body:
 *
 *   pnpm fixtures:generate client-address
 *
 * ## Captures
 * `…-case-page-1` / `…-case-page-2` — a real `limit=2` walk, the corpus the
 * param-branching handler narrows. `…-case-name-like` — the declared
 * `filter[name|like]` wire form answered by the API, which is the only proof
 * the migrated key is accepted rather than assumed.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` with staging credentials,
 * so the `*.fixtures.ts` suffix keeps it out of the unit and integration
 * projects. It asserts nothing; a capture that does not represent a readable
 * collection throws instead of shipping.
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
        "clients/{id}/addresses fixtures."
    );
  }
  return id;
}

// -----------------------------------------------------------------------------

describe("Client-Address API Fixtures Generator", () => {
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
      name: "client-address"
    });

    const probe = await fetch(
      `${API_URL}/api/clients/${clientId}/addresses?limit=2`,
      {
        headers: {
          Accept: "application/json",
          Origin: ORIGIN,
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    const rows = ((await probe.json()) as { data?: { name?: string }[] })?.data;
    // The filter capture has to narrow something real, so the needle is taken
    // from a row the collection actually holds rather than invented.
    needle = rows?.[0]?.name?.slice(0, 3) ?? "";
    if (!needle) {
      throw new Error(
        "The staging client holds no named address — the filter capture has " +
          "nothing real to narrow on."
      );
    }
  }, 30000);

  afterAll(() => generator.save());

  it("captures the limit=2 walk (pages 1 and 2)", async () => {
    generator.setBearerToken(accessToken);
    const pageOne = await generator.get(
      `/api/clients/${clientId}/addresses?limit=2&offset=0&case=page-1`
    );
    const pageTwo = await generator.get(
      `/api/clients/${clientId}/addresses?limit=2&offset=2&case=page-2`
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
          "than one page of addresses."
      );
    }
  });

  it("captures filter[name|like] — the migrated wire form", async () => {
    generator.setBearerToken(accessToken);
    const { status, body } = await generator.get(
      `/api/clients/${clientId}/addresses?filter[name|like]=${encodeURIComponent(
        `%${needle}%`
      )}&limit=2&case=name-like`
    );
    generator.clearBearerToken();

    if (status !== 200) {
      throw new Error(
        `filter[name|like] returned ${status} — the API does not accept the ` +
          "criteria wire form for this collection (E1 evidence, not a test bug)."
      );
    }
    const total = (body as { total?: number })?.total ?? 0;
    if (total === 0) {
      throw new Error(
        `filter[name|like]=%${needle}% narrowed to zero rows; the needle came ` +
          "from a live row, so a zero result means the key was ignored."
      );
    }
  });
});
