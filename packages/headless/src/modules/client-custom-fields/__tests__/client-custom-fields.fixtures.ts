// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Custom-Fields API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the real `custom_fields` responses this module's criteria migration
 * emits:
 *
 *   pnpm fixtures:generate client-custom-fields
 *
 * ## Captures
 * `…-case-page-1` / `…-case-page-2` — a real `limit=1` walk of the client's
 * two-row collection, so the pager has a genuine second page. `…-case-name-like`
 * — the declared `filter[name|like]` wire form, captured alongside the declared
 * `order=order` sort. Every capture carries the URL-level
 * `filter[object_type]=client` the service pins, because that scopes WHICH
 * collection this is.
 *
 * ## Why this is not a normal test
 * REAL `fetch` calls against `VITE_API_URL` with staging credentials; the
 * `*.fixtures.ts` suffix keeps it out of the unit and integration projects.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { CustomFieldsMajorTypes, GrantTypes } from "@upmind-automation/types";
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

const OBJECT_TYPE = `filter[object_type]=${CustomFieldsMajorTypes.CLIENT}`;

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

describe("Client-Custom-Fields API Fixtures Generator", () => {
  let generator: Generator;
  let accessToken: string;
  let needle: string;

  beforeAll(async () => {
    accessToken = (await mintClientToken()).access_token;

    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-custom-fields"
    });

    const probe = await fetch(`${API_URL}/api/custom_fields?${OBJECT_TYPE}`, {
      headers: {
        Accept: "application/json",
        Origin: ORIGIN,
        Authorization: `Bearer ${accessToken}`
      }
    });
    const rows = ((await probe.json()) as { data?: { name?: string }[] })?.data;
    needle = rows?.[0]?.name?.slice(0, 3) ?? "";
    if (!needle) {
      throw new Error(
        "The brand declares no client custom field — the filter capture has " +
          "nothing real to narrow on."
      );
    }
  }, 30000);

  afterAll(() => generator.save());

  it("captures the limit=1 walk (pages 1 and 2)", async () => {
    generator.setBearerToken(accessToken);
    const pageOne = await generator.get(
      `/api/custom_fields?${OBJECT_TYPE}&order=order&limit=1&offset=0&case=page-1`
    );
    const pageTwo = await generator.get(
      `/api/custom_fields?${OBJECT_TYPE}&order=order&limit=1&offset=1&case=page-2`
    );
    generator.clearBearerToken();

    if (pageOne.status !== 200 || pageTwo.status !== 200) {
      throw new Error(
        `Paged capture returned ${pageOne.status}/${pageTwo.status} — refusing ` +
          "to ship a fixture that does not represent a real page."
      );
    }
    const total = (pageTwo.body as { total?: number })?.total ?? 0;
    if (total <= 1) {
      throw new Error(
        `The paged capture reports total ${total}; a limit=1 walk needs more ` +
          "than one custom field."
      );
    }
  });

  it("captures filter[name|like] with the declared order=order sort", async () => {
    generator.setBearerToken(accessToken);
    const { status, body } = await generator.get(
      `/api/custom_fields?${OBJECT_TYPE}&filter[name|like]=${encodeURIComponent(
        `%${needle}%`
      )}&order=order&limit=2&case=name-like`
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
