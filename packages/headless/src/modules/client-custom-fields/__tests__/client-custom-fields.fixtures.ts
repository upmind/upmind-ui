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
 * custom_fields?filter[object_type]=client&limit=0&sort=order:asc`
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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import {
  generateFixtureName,
  redactValue,
  sanitize
} from "@upmind-automation/test-fixtures/fixture-naming.mjs";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { ForcedErrorCode } from "@upmind-automation/test-fixtures/types";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintStaffToken
} from "../../auth/__tests__/auth.tokens";
import { forEach, kebabCase } from "lodash-es";
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
 * The client-visible INVOICE catalogue field the AC-38 / AC-40 scenarios read.
 * The staging brand configures only `user_only` invoice fields, so the staff
 * account ARRANGES one client-visible field, the scenario records the client's
 * read of it, and the staff account removes it — leaving staging as it found it
 * (ADR 035; code-tests.companion §"Every answer is a recording").
 */
const INVOICE_FIELD_CODE = "fe3145_invoice_field";

/** Deletes any leftover invoice field this generator owns, so create is clean. */
async function purgeInvoiceField(staffToken: string): Promise<void> {
  const { body } = await call(
    "GET",
    "/api/admin/custom_fields?filter[object_type]=invoice&limit=0",
    staffToken
  );
  const rows =
    (body as { data?: Array<{ id: string; code: string }> })?.data ?? [];
  for (const row of rows) {
    if (row.code === INVOICE_FIELD_CODE) {
      await call("DELETE", `/api/admin/custom_fields/${row.id}`, staffToken);
    }
  }
}

/** Arranges one client-visible invoice field; returns its id for teardown. */
async function createInvoiceField(
  staffToken: string,
  brandId: string
): Promise<string> {
  const { status, body } = await call(
    "POST",
    "/api/admin/custom_fields",
    staffToken,
    {
      object_type: "invoice",
      name: "FE-3145 client-visible invoice field",
      type: 1,
      code: INVOICE_FIELD_CODE,
      user_only: false,
      hidden: false,
      client_readonly: false,
      required: false,
      show_on_invoice: true,
      brand_id: brandId
    }
  );
  const id = (body as { data?: { id?: string } })?.data?.id;
  if (status >= 400 || !id) {
    throw new Error(
      `Could not arrange the invoice custom field (${status}) — AC-38/AC-40 ` +
        "have no non-client catalogue to record."
    );
  }
  return id;
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
  pathSuffix: string,
  targetDir: string = recordingsDir
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

  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
  const filename = `${generateFixtureName("POST", safePath, responseBody)}.json`;
  writeFileSync(
    join(targetDir, filename),
    JSON.stringify(fixture, null, 2) + "\n"
  );

  return { status: response.status, body: sanitizedBody };
}

/** A 1x1 PNG used only as upload MATERIAL — the FIXTURE is the API's real
 * response to it, captured verbatim. */
const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64"
);

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

    const token = await mintClientToken();
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
      throw new Error("Could not resolve the client's brand_id from /self.");
    }
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/custom_fields?filter[object_type]=client&limit=0&sort=order:asc`
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

  // The catalogue read exactly as the labs page's boot issues it — `order=order`
  // (not the legacy `sort=order:asc` above), so the forced-state corpus answers
  // the page's real read by identity. `order`/`limit` are excluded from the
  // fixture name, `sort` is not, so this is a distinct file from the mapper
  // unit's `sort=order:asc` capture (FE-3145, ADR 035).
  it("captures GET /api/custom_fields (labs page boot read — order=order)", async () => {
    if (!brandId) throw new Error("Could not resolve the client's brand_id.");
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/custom_fields?filter[object_type]=client&order=order&limit=0`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Boot-read definitions capture returned ${status}.`);
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

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145, ADR 035) — one recording per driven `client-custom-fields
// .feature` scenario, one fixtures folder per step, named from the feature by
// `recordedStepDir`. The DEFINITIONS collection is read-only, so every driven
// scenario only READS: it arranges no staging data and leaves staging untouched.
//
// The collection boots by reading the client's own record (for the resolved
// brand) and then the brand-scoped catalogue. The URL shapes below are exactly
// what `useClientCustomFields()` sends at replay: `order=order` (never the
// legacy `sort=order:asc`), `filter[object_type]=client`, the resolved
// `brand_id`; `limit`/`offset` are identity-excluded, so they never split a
// fixture.
// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-custom-fields.feature"),
  "utf-8"
);

/** The Background step every scenario opens with — it makes the boot reads. */
const OPEN = "I am an authenticated client with my own custom field values";

describe("Client-Custom-Fields scenario recordings", () => {
  let clientToken: IToken;
  let staffToken: IToken;
  let clientId: string;
  let brandId: string;
  const prepared = new Set<string>();

  const clientRecord = () =>
    `/api/clients/${clientId}?with=custom_fields,custom_fields.field`;

  const catalogueOf = (
    objectType: string,
    query: string,
    limit = 0,
    offset = 0
  ) =>
    `/api/custom_fields?filter[object_type]=${objectType}&limit=${limit}&${query}&offset=${offset}`;

  const catalogue = (query: string, limit = 0, offset = 0) =>
    catalogueOf("client", query, limit, offset);

  /** Records the requests one step makes into that step's own folder. */
  async function recordStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, feature, scenario);
      prepared.add(scenario);
    }

    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        feature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: kebabCase(scenario)
    });
    generator.setBearerToken(clientToken.access_token);
    await requests(generator);
    generator.save();
  }

  /** The boot reads every scenario's Background makes: the client record (for the
   * resolved brand) and the brand-scoped catalogue in its default order. */
  async function recordBoot(generator: Generator): Promise<void> {
    await generator.get(clientRecord());
    await generator.get(catalogue("order=order"));
  }

  /** The boot reads opening the INVOICE selector catalogue makes. */
  async function recordInvoiceBoot(generator: Generator): Promise<void> {
    await generator.get(clientRecord());
    await generator.get(catalogueOf("invoice", "order=order"));
  }

  /** The staging brand's IMAGE field (`profile_picture`) — stable, not created
   * per run, so its id is spelled here like a known catalogue entity. */
  const IMAGE_FIELD_ID = "3de78642-de53-9714-7ec2-1208469530d0";

  /** The brand-settings read `system-upload` makes on boot to learn the allowed
   * upload file types. Booting the image editor triggers it; it is not among the
   * collection's boot reads, so it is recorded here per scenario (ADR 035
   * self-containment). The encoded key list is the composable's own request,
   * decoded so the recorder sends exactly what replay will. */
  const uploadConfigRead = (): string =>
    `/api/config/brand/values?${decodeURIComponent(
      "filter%5Bkeys%7Ceq%5D=analytics.google.measurement_id%2Canalytics.gtm.container_id%2Cui.basket.default_currency%2Cui.basket.add_to_basket_funnelling%2Cui.basket.payment_term_descriptions%2Cbilling.gateway.force_auto_payment_for_stored_details%2Cbilling.gateway.force_card_storage%2Cui.checkout.checkout_flow%2Cui.checkout.hide_promotions_field%2Cinvoices.common.require_phone_for_orders%2Cui.checkout.checkout_summary_color_stop1%2Cui.checkout.checkout_summary_color_stop2%2Cui.checkout.checkout_summary_contrast_mode%2Csecurity.ui.allow_vault%2Cui.client_area.homepage%2Cinvoices.common.default_payment_period%2Cui.client_area.hide_registration_forms%2Cinvoices.guest_checkout.enabled%2Cprovisioning.domain_names.search_method%2Cbilling.gateway.client_allow_partial_payments%2Cinvoices.common.is_available_pay_later%2Cbilling.gateway.allow_card_removal_replacement%2Cinvoices.common.display_price_type%2Cinvoices.common.require_address_for_orders%2Cinvoices.common.require_company_for_orders%2Cui.client_registration.require_phone%2Cinvoices.common.required_region_in_address%2Csecurity.orders.require_verified_email%2Cui.basket.truncate_product_description%2Cui.client_area.show_catalog%2Cinvoices.common.show_promotion_as%2Ctickets.support.support_pin_enabled%2Cprice_tax.tax.enable_automatic_vat_validation%2Cui.client_area.disable_support_system%2Cui.client_area.page_after_login%2Cui.client_area.enter_key_action%2Cui.client_area.price_before_discount_position%2Cinvoices.common.require_payment_details_for_zero_amount_orders%2Csecurity.uploads.allowed_upload_file_types"
    )}`;

  /** The boot reads the IMAGE editor makes: the collection boot reads plus the
   * upload file-types brand read. */
  async function recordImageBoot(generator: Generator): Promise<void> {
    await recordBoot(generator);
    await generator.get(uploadConfigRead());
  }

  /** Records one image-editor step: the boot reads it makes (client record +
   * catalogue, to resolve the field) and a real multipart upload into the SAME
   * step folder. `Generator` records JSON; the multipart POST is written beside
   * it by `captureImageUpload`. */
  async function recordImageUploadStep(
    scenario: string,
    step: string,
    file: { name: string; type: string; bytes: Uint8Array }
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, feature, scenario);
      prepared.add(scenario);
    }
    const dir = recordedStepDir(import.meta.dirname, feature, scenario, step);
    const generator = new Generator(API_URL, {
      recordingsDir: dir,
      origin: ORIGIN,
      source: "case",
      name: kebabCase(scenario)
    });
    generator.setBearerToken(clientToken.access_token);
    await recordImageBoot(generator);
    generator.save();
    await captureImageUpload(
      IMAGE_FIELD_ID,
      clientToken.access_token,
      file,
      "",
      dir
    );
  }

  /**
   * Uploads a real image and returns the stored hash (`data.value`) — for
   * ARRANGING a field's stored value so a later boot reads it back. No fixture is
   * written; the scenario's own upload, when it has one, is captured separately.
   */
  async function uploadImageHash(fieldId: string): Promise<string | undefined> {
    const form = new FormData();
    form.append(
      "image",
      new Blob([new Uint8Array(PIXEL_PNG)], { type: "image/png" }),
      "pixel.png"
    );
    const response = await fetch(
      `${API_URL}/api/clients/fields/${fieldId}/image`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Origin: ORIGIN,
          Authorization: `Bearer ${clientToken.access_token}`
        },
        body: form
      }
    );
    const body = await response.json().catch(() => null);
    return (body as { data?: { value?: string } })?.data?.value;
  }

  /** Records ONLY the multipart upload into a step's own folder — the editor was
   * booted on an earlier step, so the save step carries the upload alone. */
  async function recordImageUploadOnly(
    scenario: string,
    step: string,
    fieldId: string
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, feature, scenario);
      prepared.add(scenario);
    }
    await captureImageUpload(
      fieldId,
      clientToken.access_token,
      {
        name: "pixel.png",
        type: "image/png",
        bytes: new Uint8Array(PIXEL_PNG)
      },
      "",
      recordedStepDir(import.meta.dirname, feature, scenario, step)
    );
  }

  /** Creates a SECOND client IMAGE custom field (AC-22 needs two) as staff. */
  async function createSecondImageField(): Promise<{
    id: string;
    code: string;
  }> {
    const code = `fe3145_second_image_${Date.now()}`;
    const { status, body } = await call(
      "POST",
      "/api/admin/custom_fields",
      staffToken.access_token,
      {
        object_type: "client",
        name: "FE-3145 second image field",
        type: 8,
        code,
        user_only: false,
        hidden: false,
        client_readonly: false,
        required: false,
        brand_id: brandId
      }
    );
    const id = (body as { data?: { id?: string } })?.data?.id;
    if (status >= 400 || !id)
      throw new Error(
        `Could not create the second image field (${status}) — AC-22 has no ` +
          "second image field to record."
      );
    return { id, code };
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();
    staffToken = await mintStaffToken();
    const record = await fetchClientRecord(clientToken.access_token);
    if (!record.id || !record.brand_id) {
      throw new Error(
        "Could not resolve the client id / brand_id from /self — cannot " +
          "record the client-custom-fields scenarios."
      );
    }
    clientId = record.id;
    brandId = record.brand_id;
  }, 30000);

  // --- scenarios whose only requests are the Background boot reads ----------

  forEach(
    [
      "A client sees the custom fields their brand defines",
      "A client's definitions appear in the order their brand configured",
      "A client narrows the definitions already in front of them",
      "The catalogue arrives in its own display order by default"
    ],
    scenario => {
      it(`${scenario} — ${OPEN}`, () => recordStep(scenario, OPEN, recordBoot));
    }
  );

  // AC-9 — the count-of-zero is a REAL empty result: a search whose term no
  // field's name matches, so the server returns an empty catalogue.
  describe("I can tell how many definitions there are, including none at all", () => {
    const scenario =
      "I can tell how many definitions there are, including none at all";
    const step = "I search my definitions for a term no field matches";

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(step, () =>
      recordStep(scenario, step, generator =>
        generator.get(
          catalogue(
            `filter[name|like]=${encodeURIComponent("%zzznomatch%")}&order=order`
          )
        )
      )
    );
  });

  describe("The client can see how their catalogue is being read", () => {
    const scenario = "The client can see how their catalogue is being read";
    const step = "I have ordered, searched and paged my definitions";

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(step, () =>
      recordStep(scenario, step, generator =>
        generator.get(
          catalogue(
            `filter[name|like]=${encodeURIComponent("%age%")}&order=-name`,
            1,
            0
          )
        )
      )
    );
  });

  describe("A client asks for a fresh copy of their definitions", () => {
    const scenario = "A client asks for a fresh copy of their definitions";
    const step = "I ask for a fresh copy";

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(step, () => recordStep(scenario, step, recordBoot));
  });

  describe("A client re-orders the catalogue by a column the catalogue offers", () => {
    const scenario =
      "A client re-orders the catalogue by a column the catalogue offers";
    const step = "I order my definitions by field name, descending";

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(step, () =>
      recordStep(scenario, step, generator =>
        generator.get(catalogue("order=-name"))
      )
    );
  });

  describe("A client searches all their fields by a term", () => {
    const scenario = "A client searches all their fields by a term";
    const step = "I search my definitions for a term";

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(step, () =>
      recordStep(scenario, step, generator =>
        generator.get(
          catalogue(
            `filter[name|like]=${encodeURIComponent("%age%")}&order=order`
          )
        )
      )
    );
  });

  describe("A client pages the catalogue once a page size is set", () => {
    const scenario = "A client pages the catalogue once a page size is set";
    const pageStep = "I have set a page size on my definitions";
    const nextStep = "I ask for the next page of my definitions";

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(pageStep, () =>
      recordStep(scenario, pageStep, generator =>
        generator.get(catalogue("order=order", 1, 0))
      )
    );
    it(nextStep, () =>
      recordStep(scenario, nextStep, generator =>
        generator.get(catalogue("order=order", 1, 1))
      )
    );
  });

  // --- AC-38 / AC-40: a non-client (INVOICE) catalogue. The staff account
  // arranges a client-visible invoice field, the client records its read of
  // that catalogue, and the staff account removes it afterward.

  describe("I read a catalogue of my brand's fields other than my own", () => {
    const scenario =
      "I read a catalogue of my brand's fields other than my own";
    const step = "I open that catalogue by name";
    let fieldId: string;

    beforeAll(async () => {
      await purgeInvoiceField(staffToken.access_token);
      fieldId = await createInvoiceField(staffToken.access_token, brandId);
    }, 30000);

    afterAll(() =>
      call(
        "DELETE",
        `/api/admin/custom_fields/${fieldId}`,
        staffToken.access_token
      ).then(() => undefined)
    );

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(step, () => recordStep(scenario, step, recordInvoiceBoot));
  });

  describe("Each catalogue I open keeps its own copy of what it holds", () => {
    const scenario =
      "Each catalogue I open keeps its own copy of what it holds";
    const step = "I open a second catalogue in the same sitting";
    let fieldId: string;

    beforeAll(async () => {
      await purgeInvoiceField(staffToken.access_token);
      fieldId = await createInvoiceField(staffToken.access_token, brandId);
    }, 30000);

    afterAll(() =>
      call(
        "DELETE",
        `/api/admin/custom_fields/${fieldId}`,
        staffToken.access_token
      ).then(() => undefined)
    );

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(step, () => recordStep(scenario, step, recordInvoiceBoot));
  });

  // --- AC-18 / AC-19: the per-field IMAGE editor. A real multipart upload is
  // recorded into the editor step; the matcher answers a POST by path+method,
  // so the recording serves the composable's real upload at replay.

  describe("I see my image upload progress", () => {
    const scenario = "I see my image upload progress";
    const step = "I upload an image for one of my custom fields";

    afterAll(
      () =>
        call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
          custom_fields: { profile_picture: null }
        }).then(() => undefined),
      30000
    );

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(step, () =>
      recordImageUploadStep(scenario, step, {
        name: "pixel.png",
        type: "image/png",
        bytes: new Uint8Array(PIXEL_PNG)
      })
    );
  });

  describe("A problem uploading an image is reported beside that field", () => {
    const scenario =
      "A problem uploading an image is reported beside that field";
    const step = "uploading an image for one of my custom fields is rejected";

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(step, () =>
      recordImageUploadStep(scenario, step, {
        name: "not-an-image.txt",
        type: "text/plain",
        bytes: new Uint8Array(Buffer.from("not an image", "utf-8"))
      })
    );
  });

  // --- AC-20: a stored image gives a link + preview. The field's value is
  // ARRANGED (upload → PUT the hash) so the boot reads it back; viewing it calls
  // getImageByHash, which short-circuits with NO request (the preview is derived
  // from the hash). Reset to null afterward.

  describe("A stored image gives me a link and a preview, and clearing removes both", () => {
    const scenario =
      "A stored image gives me a link and a preview, and clearing removes both";
    const holds = "one of my custom fields holds a stored image";
    const view = "I view that field";

    beforeAll(async () => {
      const hash = await uploadImageHash(IMAGE_FIELD_ID);
      if (hash)
        await call(
          "PUT",
          `/api/clients/${clientId}`,
          clientToken.access_token,
          {
            custom_fields: { profile_picture: hash }
          }
        );
    }, 30000);

    afterAll(
      () =>
        call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
          custom_fields: { profile_picture: null }
        }).then(() => undefined),
      30000
    );

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(holds, () => recordStep(scenario, holds, recordImageBoot));
    it(view, () => recordStep(scenario, view, () => Promise.resolve()));
  });

  // --- AC-21: a changed image is stored (uploaded) on save, and the saved value
  // carries the returned hash. The editor boots on the "changed" step; the save
  // step carries the multipart upload alone.

  describe("A changed image is safely stored before the rest of my save happens", () => {
    const scenario =
      "A changed image is safely stored before the rest of my save happens";
    const changed = "I have changed the image for one of my custom fields";
    const save = "I save my changes";

    afterAll(
      () =>
        call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
          custom_fields: { profile_picture: null }
        }).then(() => undefined),
      30000
    );

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(changed, () => recordStep(scenario, changed, recordImageBoot));
    it(save, () => recordImageUploadOnly(scenario, save, IMAGE_FIELD_ID));
  });

  // --- AC-22: only the changed image re-uploads. A SECOND image field is created
  // and given a stored value (so its flush short-circuits); the first field is
  // left empty and uploaded on save. The save step records ONE upload — a second
  // upload at replay lands with no recording and fails the scenario by name.

  describe("Only the images I actually changed get uploaded again", () => {
    const scenario = "Only the images I actually changed get uploaded again";
    const two = "I have two image fields, one I changed and one I left alone";
    const save = "I save my changes";
    let secondFieldId: string | undefined;
    let secondFieldCode: string | undefined;

    beforeAll(async () => {
      const field = await createSecondImageField();
      secondFieldId = field.id;
      secondFieldCode = field.code;
      const hash = await uploadImageHash(secondFieldId);
      if (hash)
        await call(
          "PUT",
          `/api/clients/${clientId}`,
          clientToken.access_token,
          {
            custom_fields: { [secondFieldCode]: hash }
          }
        );
      await call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
        custom_fields: { profile_picture: null }
      });
    }, 60000);

    afterAll(async () => {
      if (secondFieldCode)
        await call(
          "PUT",
          `/api/clients/${clientId}`,
          clientToken.access_token,
          {
            custom_fields: { [secondFieldCode]: null }
          }
        );
      await call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
        custom_fields: { profile_picture: null }
      });
      if (secondFieldId)
        await call(
          "DELETE",
          `/api/admin/custom_fields/${secondFieldId}`,
          staffToken.access_token
        );
    }, 30000);

    it(OPEN, () => recordStep(scenario, OPEN, recordBoot));
    it(two, () => recordStep(scenario, two, recordImageBoot));
    it(save, () => recordImageUploadOnly(scenario, save, IMAGE_FIELD_ID));
  });

  // --- AC-6: a boot fault (top level) — the client record answers, the
  // catalogue read is forced to 500, so the catalogue settles errored, not
  // hanging. `forceStatus` records the REAL request with a synthetic 5xx body.

  describe("Waiting to know whether my fields are ready always ends when the read fails", () => {
    const scenario =
      "Waiting to know whether my fields are ready always ends when the read fails";
    const step = "loading my definitions fails at the server";

    it(step, () =>
      recordStep(scenario, step, async generator => {
        await generator.get(clientRecord());
        await generator.get(
          catalogue("order=order"),
          undefined,
          ForcedErrorCode.Internal_Server_Error
        );
      })
    );
  });

  // --- AC-25: the signed-out guard (top level) — no client is signed in, so the
  // module asks the server for nothing. Only the scenario dir is prepared; the
  // replay wall fails the scenario by name if any request escapes.

  describe("Nothing about my custom field values is touched unless I am actually signed in", () => {
    const scenario =
      "Nothing about my custom field values is touched unless I am actually signed in";
    const step = "my custom field values are read while signed out";

    it(step, () => recordStep(scenario, step, () => Promise.resolve()));
  });
});
