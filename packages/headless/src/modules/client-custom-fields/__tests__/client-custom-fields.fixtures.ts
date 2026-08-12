// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Custom-Fields API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real `custom_fields` / `clients/{id}` / `clients/fields/{id}/image`
 * endpoints the `client-custom-fields` module hits for its ONE in-scope cell
 * (client × self) and (re)generate their sanitised v3 fixtures into this
 * module's OWN co-located `fixtures/` dir. Run on demand:
 *
 *   pnpm fixtures:generate client-custom-fields
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal `*.test.ts` / `*.int.test.ts` suites
 * by the `*.fixtures.ts` suffix. It has no assertions of module behaviour: an
 * `it()` succeeds when the capture completes. `save()` in `afterAll` writes
 * every `Generator`-captured fixture once; the two multipart image captures
 * (below) are written by hand-rolling the SAME `sanitize()` / v3 shape the
 * `Generator` itself uses, because `Generator.capture()` only encodes
 * JSON/url-encoded bodies and the image upload is `multipart/form-data`.
 *
 * ## Captures
 * `get-custom-fields` (AC-1/AC-3/AC-4 — the two real definitions this staging
 * brand has configured: NUMBER "age", IMAGE "profile_picture") ·
 * `get-clients-id-case-with-values` (AC-10/AC-13/AC-16/AC-17 — the client's own
 * record with `custom_fields,custom_fields.field` embedded, captured WHILE a
 * real value is set so the embedded-field shape is real, not empty) ·
 * `put-clients-id-case-set-custom-field` (AC-23 shape — the wire's own
 * response to a code-keyed `custom_fields` body) ·
 * `put-clients-id-case-clear-custom-field` (AC-24 — clearing a value returns
 * the row with `value: null`, not a deleted row) ·
 * `post-clients-fields-id-image` (AC-18/AC-20/AC-21 — a real upload's hash +
 * `image_url`) · `post-clients-fields-id-image-case-rejected` (AC-19 — the
 * real 422 `error.data.image`, captured from an actually-rejected upload).
 *
 * ## Recording limit — surfaced, not papered over (type_code_findings)
 * This staging brand has exactly TWO custom field definitions configured:
 * `type: 7 / type_code: "number"` (age) and `type: 8 / type_code: "image"`
 * (profile_picture) — confirmed live against `GET
 * custom_fields?filter[object_type]=client&brand_id=<id>&limit=0&sort=order:asc`
 * on 2026-08-10. The other 6 `CustomFieldsTypes` members (TEXT, PASSWORD,
 * SELECT, SELECT_RADIO, TEXTAREA, DATE) have NO real definition on this brand
 * and are NOT capturable here — reported as a contract gap, not guessed at
 * or hand-authored as a fixture. `utils/useFields.ts`'s string-keyed switches
 * at `:38` ("number") and `:168` ("image") match these two real `type_code`
 * values exactly; `:49` ("date") and `:61` ("password") remain UNCONFIRMED —
 * this run neither confirms nor contradicts them, and does not fabricate data
 * to pretend otherwise.
 *
 * ## Staging hygiene
 * The shared staging client (`API_CREDENTIALS.client`, same account
 * `client-email.fixtures.ts` uses) starts and ends this run with BOTH custom
 * field values cleared (`value: null`) — verified empty (`custom_fields: []`)
 * before this run's first mutation. `afterAll` clears both again regardless of
 * capture outcome.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import {
  generateFixtureName,
  redactValue,
  sanitize
} from "@upmind-automation/test-fixtures/fixture-naming.mjs";
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

/** Plain, UNCAPTURED authed call — id lookup and staging restore only. */
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

async function fetchClientRecord(
  accessToken: string
): Promise<{ id?: string; brand_id?: string }> {
  const { body } = await call("GET", "/api/self?with=actor", accessToken);
  const data = (
    body as {
      data?: {
        id?: string;
        brand_id?: string;
        actor?: { id?: string; brand_id?: string };
      };
    }
  )?.data;
  return {
    id: data?.actor?.id ?? data?.id,
    brand_id: data?.actor?.brand_id ?? data?.brand_id
  };
}

/**
 * A real multipart upload, captured by hand-rolling the SAME v3 shape +
 * `sanitize()` pipeline `Generator.capture()` uses — `Generator` itself only
 * encodes JSON / url-encoded bodies, so `multipart/form-data` is captured
 * here directly rather than through it. Every value below (status, headers,
 * body) is the REAL response; only the assembly is hand-rolled, not the data.
 */
async function captureImageUpload(
  fieldId: string,
  accessToken: string,
  file: { name: string; type: string; bytes: Uint8Array },
  pathSuffix: string
): Promise<{ status: number; body: unknown }> {
  const form = new FormData();
  form.append("image", new Blob([file.bytes], { type: file.type }), file.name);

  const path = `/api/clients/fields/${fieldId}/image${pathSuffix}`;
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    },
    body: form
  });
  const responseBody = await response.json().catch(() => null);
  const sanitizedBody = sanitize(responseBody);
  const safePath = redactValue(path);

  const fixture = {
    version: 3,
    request: {
      method: "POST",
      path: safePath,
      headers: sanitize({
        Accept: "application/json",
        Origin: ORIGIN,
        Authorization: `Bearer ${accessToken}`
      }),
      body: { image: `<binary:${file.type}>` }
    },
    response: {
      status: response.status,
      headers: sanitize(Object.fromEntries(response.headers.entries())),
      body: sanitizedBody
    },
    captured_at: new Date().toISOString(),
    brand_domain: new URL(ORIGIN).hostname,
    source: "case",
    provenance: { case: "client-custom-fields" }
  };

  if (!existsSync(recordingsDir)) mkdirSync(recordingsDir, { recursive: true });
  const filename = `${generateFixtureName("POST", safePath, responseBody)}.json`;
  writeFileSync(
    join(recordingsDir, filename),
    JSON.stringify(fixture, null, 2) + "\n"
  );

  return { status: response.status, body: sanitizedBody };
}

// -----------------------------------------------------------------------------

describe("Client-Custom-Fields API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let brandId: string | undefined;

  const IMAGE_FIELD_ID = "3de78642-de53-9714-7ec2-1208469530d0";

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-custom-fields"
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

    const record = await fetchClientRecord(clientToken.access_token);
    if (!record.id) {
      throw new Error(
        "Could not resolve the client id from /self — cannot capture the " +
          "custom_fields / clients/{id} fixtures."
      );
    }
    clientId = record.id;
    brandId = record.brand_id;

    // Staging hygiene precondition: the shared client must start clean.
    const { body } = await call(
      "GET",
      `/api/clients/${clientId}?with=custom_fields`,
      clientToken.access_token
    );
    const existing = (
      body as { data?: { custom_fields?: Array<{ value: unknown }> } }
    )?.data?.custom_fields;
    const dirty = (existing ?? []).some(
      row => row.value !== null && row.value !== undefined
    );
    if (dirty) {
      throw new Error(
        "The shared staging client already holds a non-null custom field " +
          "value before this run started — refusing to capture over an " +
          "unknown prior state. Clear it manually first."
      );
    }
  }, 30000);

  afterAll(async () => {
    generator.save();
    // Restore the shared staging client to the clean state this run found —
    // regardless of which captures above succeeded.
    await call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
      custom_fields: { age: null, profile_picture: null }
    });
  });

  it("captures GET /api/custom_fields (definitions — AC-1/AC-3/AC-4)", async () => {
    if (!brandId) {
      throw new Error(
        "Could not resolve the client's brand_id from /self — AC-2's " +
          "brand-scoping read-back has nothing to capture against."
      );
    }
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/custom_fields?filter[object_type]=client&brand_id=${brandId}&limit=0&sort=order:asc`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Definitions capture returned ${status}.`);
    }
    const rows = (body as { data?: Array<{ id: string }> })?.data ?? [];
    if (rows.length === 0) {
      throw new Error(
        "The definitions capture returned zero rows — this staging brand " +
          "has no custom field catalogue to prove full-fidelity mapping " +
          "against (AC-4)."
      );
    }
  });

  it("captures PUT /api/clients/{id} ?case=set-custom-field (AC-23 wire shape)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=set-custom-field`,
      { custom_fields: { age: "42" } }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Set-custom-field capture returned ${status}.`);
    }
  });

  it("captures GET /api/clients/{id} ?case=with-values (embedded field — AC-10/AC-13/AC-16/AC-17)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/clients/${clientId}?with=custom_fields,custom_fields.field&case=with-values`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`With-values capture returned ${status}.`);
    }
    const rows =
      (body as { data?: { custom_fields?: unknown[] } })?.data?.custom_fields ??
      [];
    if (rows.length === 0) {
      throw new Error(
        "The with-values capture came back with no custom_fields rows even " +
          "after setting one — AC-16's embedded-field read-back has nothing " +
          "real to replay."
      );
    }
  });

  it("captures POST /api/clients/fields/{field_id}/image (real upload — AC-18/AC-20/AC-21)", async () => {
    // A 1x1 PNG, generated locally as upload MATERIAL (not a fixture) —
    // exactly as much a "hand-authored fixture" as the file client-email's
    // own generator sends as an add-address body. The FIXTURE is the API's
    // real response, captured verbatim below.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
      "base64"
    );
    const { status } = await captureImageUpload(
      IMAGE_FIELD_ID,
      clientToken.access_token,
      { name: "pixel.png", type: "image/png", bytes: new Uint8Array(png) },
      ""
    );
    if (status !== 200) {
      throw new Error(`Image upload capture returned ${status}.`);
    }
  }, 30000);

  it("captures POST /api/clients/fields/{field_id}/image ?case=rejected (real 422 — AC-19)", async () => {
    const notAnImage = Buffer.from("not an image", "utf-8");
    const { status, body } = await captureImageUpload(
      IMAGE_FIELD_ID,
      clientToken.access_token,
      {
        name: "not-an-image.txt",
        type: "text/plain",
        bytes: new Uint8Array(notAnImage)
      },
      "?case=rejected"
    );
    if (status < 400) {
      throw new Error(
        `Expected the API to reject a non-image upload; got ${status}. ` +
          "AC-19's error-key rewrite has no real rejection to replay."
      );
    }
    const hasImageErrorKey = Boolean(
      (body as { error?: { data?: { image?: unknown } } })?.error?.data?.image
    );
    if (!hasImageErrorKey) {
      throw new Error(
        "The rejected upload's real error body carries no `error.data.image` " +
          "key — AC-19's rewrite target does not exist in this capture."
      );
    }
  }, 30000);

  it("captures PUT /api/clients/{id} ?case=clear-custom-field (AC-24 — value:null, not deleted)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.put(
      `/api/clients/${clientId}?case=clear-custom-field`,
      { custom_fields: { age: null } }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Clear-custom-field capture returned ${status}.`);
    }
    const rows =
      (body as { data?: { custom_fields?: Array<{ value: unknown }> } })?.data
        ?.custom_fields ?? [];
    const cleared = rows.find(row => row.value === null);
    if (!cleared) {
      throw new Error(
        "The clear-custom-field capture carries no row with value:null — " +
          "AC-24's read-back (an explicit empty signal, not omission) has " +
          "no real evidence."
      );
    }
  });
});
