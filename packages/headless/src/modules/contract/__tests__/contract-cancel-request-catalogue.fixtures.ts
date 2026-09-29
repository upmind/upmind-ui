// -----------------------------------------------------------------------------
/**
 * @fileoverview Contract CANCEL_REQUEST custom-field catalogue capture (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * The `requestCancellation` / `scheduleCancellation` forms compose the
 * CANCEL_REQUEST custom-field catalogue (`useClientCustomFields().as(CLIENT)
 * .for(CANCEL_REQUEST)` -> `GET custom_fields?filter[object_type]=contract_request`,
 * ruling R28 / D5). Record that catalogue read's REAL response into the contract
 * module's own `fixtures/` so the schema's `customFields` branch can be proven
 * against recorded reality. Read-only — no staging mutation.
 *
 *   FIXTURE_MODE=record pnpm exec vitest run --config vitest.fixtures.config.ts \
 *     src/modules/contract/__tests__/contract-cancel-request-catalogue.fixtures.ts
 *
 * ## Finding, surfaced not papered over
 * FE-3034's own catalogue-url test records that the recording brand carries NO
 * `contract_request` field. This capture confirms that verbatim: if the real
 * response has zero rows, that IS the capture, reported — never fabricated into
 * a populated catalogue.
 */

import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain; recording lane, not the runtime module graph.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error("VITE_API_URL is required (set it in .env.recording).");
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required (set it in .env.recording)."
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

async function call(
  path: string,
  accessToken: string
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    }
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null)
  };
}

// -----------------------------------------------------------------------------

describe("Contract CANCEL_REQUEST catalogue capture", () => {
  let generator: Generator;
  let clientToken: IToken;
  let brandId: string;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "contract"
    });
    clientToken = await mintClientToken();
    const { body } = await call(
      "/api/self?with=actor",
      clientToken.access_token
    );
    const data = (
      body as { data?: { brand_id?: string; actor?: { brand_id?: string } } }
    )?.data;
    const resolved = data?.actor?.brand_id ?? data?.brand_id;
    if (!resolved) throw new Error("Could not resolve brand_id from /self.");
    brandId = resolved;
  }, 60000);

  afterAll(() => {
    generator.save();
  }, 30000);

  it("captures GET /api/custom_fields (object_type=contract_request — the CANCEL_REQUEST catalogue)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/custom_fields?filter[object_type]=contract_request&brand_id=${brandId}&limit=0&sort=order:asc`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`CANCEL_REQUEST catalogue capture returned ${status}.`);
    }
    const rows = (body as { data?: unknown[] })?.data ?? [];

    console.log(
      `CANCEL_REQUEST_CATALOGUE_ROWS=${rows.length} :: ${JSON.stringify(body)}`
    );
  });
});
