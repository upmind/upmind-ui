// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Personal-Details API Fixtures Generator (ADR 025 §A1.3,
 * ADR 035 + Amendment 1)
 *
 * ## Job To Be Done
 * Record, against real staging, the TWO fixture families this module's suite
 * replays — no third kind (operator ruling, FE-3145):
 *
 * 1. FLAT capture (`fixtures/get-clients-id.json`) — the ONE flat file the pure
 *    mapper unit (`client-personal-details.mappers.test.ts`) reads to transform a
 *    recorded wire profile. No integration test reads it.
 * 2. SCENARIO recordings (`scenarios/<slug>/<NN>/`) — one folder per step of each
 *    DRIVEN `client-personal-details.feature` scenario, replayed by
 *    `client-personal-details.replay.int.test.ts` against the real composables.
 *    The read half's profile read is module-owned and recorded here; the editor's
 *    boot lookups (custom-field DEFINITIONS, brand language list) are owned by
 *    client-custom-fields / brand and answered from THEIR recordings, so this
 *    generator captures only `clients/{id}` and the profile PUT.
 *
 *   pnpm fixtures:generate client-personal-details
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — EXCLUDED from the normal suites by the `*.fixtures.ts` suffix.
 * It has no assertions: an `it()` succeeds when the capture completes.
 *
 * ## Staging reality (recorded, not assumed)
 * This brand has two real client custom-field definitions — NUMBER (`age`) and
 * IMAGE (`profile_picture`). The shared staging client currently holds NO `age`
 * value, so this run ARRANGES `age = 42` with the account before capturing (the
 * mapper unit and the clear scenario need a real non-null NUMBER to read/clear),
 * records against that arranged state, and resets `age` to its found value
 * afterwards — never flipped inside a recording (operator ruling 2026-09-24).
 *
 * ## Staging hygiene
 * The firstname edit is reverted to the account's own recorded value, and `age`
 * is reset to the value found at the start of the run, so a re-record leaves the
 * shared staging client exactly as it was found.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
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
import { kebabCase } from "lodash-es";
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

/** The real read the module makes — native fields plus the embedded definitions. */
const PROFILE_WITH = "with=custom_fields,custom_fields.field";

/** A real numeric value this run arranges the `age` NUMBER field to hold. */
const ARRANGED_AGE = 42;

type WireClient = {
  id: string;
  firstname?: string;
  public_name?: string;
  custom_fields?: Array<{ field_id: string; value: unknown; field?: unknown }>;
};

// -----------------------------------------------------------------------------

/** Plain, UNCAPTURED authed call — used for id lookup and staging arrange/restore. */
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

async function fetchClientId(accessToken: string): Promise<string | undefined> {
  const { body } = await call("GET", "/api/self?with=actor", accessToken);
  const data = (body as { data?: { id?: string; actor?: { id?: string } } })
    ?.data;
  return data?.actor?.id ?? data?.id;
}

/** The brand the ORIGIN resolves to — the `brand_id` the editor's lookups carry. */
async function fetchBrandId(accessToken: string): Promise<string | undefined> {
  const { body } = await call("GET", "/api/self", accessToken);
  return (body as { data?: { brand_id?: string } })?.data?.brand_id;
}

/** Reads the account's current profile — for the found firstname and age. */
async function readProfile(
  accessToken: string,
  clientId: string
): Promise<WireClient> {
  const { body } = await call(
    "GET",
    `/api/clients/${clientId}?${PROFILE_WITH}`,
    accessToken
  );
  return (body as { data: WireClient }).data;
}

const ageValueOf = (client: WireClient): unknown =>
  (client.custom_fields ?? []).find(
    row =>
      (row.field as { code?: string } | undefined)?.code === "age" ||
      row.field_id === "age"
  )?.value;

// -----------------------------------------------------------------------------
// FLAT CAPTURE — the one profile the mapper unit reads. `age` arranged to a real
// NUMBER first, so AC-32/AC-59's read-side assertions have a non-null value.
// -----------------------------------------------------------------------------

describe("Client-Personal-Details API Fixtures Generator — flat capture", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let originalFirstname: string | undefined;
  let originalAge: unknown;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-personal-details"
    });
    clientToken = await mintClientToken();
    const id = await fetchClientId(clientToken.access_token);
    if (!id) throw new Error("Could not resolve the client id from /self.");
    clientId = id;

    const profile = await readProfile(clientToken.access_token, clientId);
    originalFirstname = profile.firstname;
    originalAge = ageValueOf(profile);

    await call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
      custom_fields: { age: ARRANGED_AGE }
    });
  }, 30000);

  afterAll(async () => {
    generator.save();
    await call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
      firstname: originalFirstname,
      custom_fields: { age: originalAge ?? null }
    });
  }, 30000);

  it("captures GET /api/clients/{id} (the real profile — mapper unit)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}?${PROFILE_WITH}`
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`Profile capture returned ${status}.`);
  });

  // The record-that-is-not-there read — a single-record surface's own `empty`
  // (ADR 035): a real 404 the API answers for an unknown client id, never a
  // hollowed body. `case=not-found` keeps it a distinct file from the real
  // profile, whose id-templated path is otherwise identical.
  it("captures GET /api/clients/{id} for an absent record (404 — the single-record empty)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/00000000-0000-0000-0000-000000000000?${PROFILE_WITH}&case=not-found`
    );
    generator.clearBearerToken();
    if (status !== 404) {
      throw new Error(
        `Absent-record capture returned ${status}, expected 404 — the ` +
          "single-record empty has no real recording to serve."
      );
    }
  });
});

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145; operator ruling 2026-09-24) — one recording per DRIVEN
// `client-personal-details.feature` scenario, one fixtures folder per step, named
// from the feature by `recordedStepDir`. The editor's boot lookups are owned by
// client-custom-fields / brand and answered from their recordings, so only the
// module-owned `clients/{id}` read and the profile PUT are recorded here.
// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-personal-details.feature"),
  "utf-8"
);

const BG = "I am an authenticated client with my own profile";
const OPEN_EDITOR = "I have opened my profile in the editor";

describe("Client-Personal-Details scenario recordings", () => {
  let clientToken: IToken;
  let clientId: string;
  let brandId: string | undefined;
  let originalFirstname: string | undefined;
  let originalAge: unknown;
  const prepared = new Set<string>();

  const profilePath = (): string => `/api/clients/${clientId}?${PROFILE_WITH}`;

  /** The editor's client custom-field DEFINITIONS lookup, as the module sends it.
   * `brand_id` was removed (operator ruling): the module resolves the brand from
   * the session/Origin, so the request no longer carries it. */
  const definitionsPath = (): string =>
    `/api/custom_fields?filter[object_type]=client`;

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
    generator.clearBearerToken();
    generator.save();
  }

  const readProfileStep = (generator: Generator): Promise<unknown> =>
    generator.get(profilePath());

  /**
   * A boot read: the profile PLUS the client custom-field definitions the read
   * half and the editor both resolve their fields/schema against. Recorded on
   * every boot/open step so the scenario is self-contained (the definitions read
   * the module sends uses `order=order`, a different identity from the
   * custom-fields module's own `sort=order:asc` capture, so it is not answered by
   * that owner recording).
   */
  const bootRead = async (generator: Generator): Promise<void> => {
    await generator.get(profilePath());
    await generator.get(definitionsPath());
  };

  async function arrangeAge(value: unknown): Promise<void> {
    await call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
      custom_fields: { age: value }
    });
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();
    clientId = (await fetchClientId(clientToken.access_token)) ?? "";
    if (!clientId)
      throw new Error("Could not resolve the client id from /self.");
    brandId = await fetchBrandId(clientToken.access_token);
    if (!brandId)
      throw new Error("Could not resolve the brand id from /api/brand.");

    const profile = await readProfile(clientToken.access_token, clientId);
    originalFirstname = profile.firstname;
    originalAge = ageValueOf(profile);

    // Arrange a real NUMBER on `age` so the read/editor recordings show a real
    // value, and the clear scenario has something to clear.
    await arrangeAge(ARRANGED_AGE);
  }, 30000);

  afterAll(async () => {
    // Staging back exactly as found: original firstname, original age.
    await call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
      firstname: originalFirstname,
      custom_fields: { age: originalAge ?? null }
    });
  }, 30000);

  describe("My profile shows my actual custom field values", () => {
    const scenario = "My profile shows my actual custom field values";
    it(BG, () => recordStep(scenario, BG, bootRead));
    it("I read my profile", () =>
      recordStep(scenario, "I read my profile", bootRead));
  });

  describe("I can open my profile editor without passing it anything", () => {
    const scenario = "I can open my profile editor without passing it anything";
    it(BG, () => recordStep(scenario, BG, bootRead));
    it("I open my profile editor with no arguments", () =>
      recordStep(
        scenario,
        "I open my profile editor with no arguments",
        bootRead
      ));
  });

  describe("Saving my profile only sends what I actually changed", () => {
    const scenario = "Saving my profile only sends what I actually changed";
    afterAll(async () => {
      await call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
        firstname: originalFirstname
      });
    }, 30000);

    it(BG, () => recordStep(scenario, BG, bootRead));
    it(OPEN_EDITOR, () => recordStep(scenario, OPEN_EDITOR, bootRead));
    it("I change only my first name and save", () =>
      recordStep(
        scenario,
        "I change only my first name and save",
        async generator => {
          await generator.put(`/api/clients/${clientId}`, {
            firstname: "Prover"
          });
          await readProfileStep(generator);
        }
      ));
  });

  describe("Clearing a value on my profile actually clears it", () => {
    const scenario = "Clearing a value on my profile actually clears it";
    afterAll(async () => {
      await arrangeAge(ARRANGED_AGE);
    }, 30000);

    it(BG, () => recordStep(scenario, BG, bootRead));
    it(OPEN_EDITOR, () => recordStep(scenario, OPEN_EDITOR, bootRead));
    it("I clear one of my custom fields and save", () =>
      recordStep(
        scenario,
        "I clear one of my custom fields and save",
        async generator => {
          await generator.put(`/api/clients/${clientId}`, {
            custom_fields: { age: null }
          });
          await readProfileStep(generator);
        }
      ));
  });

  describe("I can discard my edits and get back exactly what I started with", () => {
    const scenario =
      "I can discard my edits and get back exactly what I started with";
    // Only the editor open reads the wire; the two input steps and the revert
    // make no request, so their step folders keep only their `.gitkeep`.
    it(BG, () => recordStep(scenario, BG, bootRead));
    it(OPEN_EDITOR, () => recordStep(scenario, OPEN_EDITOR, bootRead));
  });

  // AC-31/40 — the profile read is issued for real, its response forced to a 500,
  // so the read half settles errored on a genuine request the recording
  // overrides. A control response, exempt from the recorded-only law.
  describe("I am told when my profile fails to load, and I am never left waiting", () => {
    const scenario =
      "I am told when my profile fails to load, and I am never left waiting";
    const bootReadForced = async (generator: Generator): Promise<void> => {
      await generator.get(
        profilePath(),
        undefined,
        ForcedErrorCode.Internal_Server_Error
      );
      await generator.get(definitionsPath());
    };
    const given = "I am an authenticated client whose profile fails to load";
    it(given, () => recordStep(scenario, given, bootReadForced));
  });

  // AC-35 — CREATED each run: staff sets the client's language to one the brand
  // offers, then drops that language from the brand's list (the legacy admin
  // brand form saves `supported_languages`, vue-app brandSettings.vue:120-128,
  // 512-515). The boot's brand-settings read is recorded in step 01, then both
  // the brand list and the client's language are restored.
  describe("If my current language isn't offered any more, I still see it, just not selectable", () => {
    const scenario =
      "If my current language isn't offered any more, I still see it, just not selectable";
    let staffToken: IToken;
    let brandId: string;
    let originalLanguages: string[];
    let originalClientLanguage: string | null;

    beforeAll(async () => {
      staffToken = await mintStaffToken();
      const settings = await call(
        "GET",
        "/api/brand/settings",
        clientToken.access_token
      );
      const brand = (
        settings.body as {
          data?: {
            id?: string;
            language_id?: string;
            languages?: Array<{ id: string }>;
          };
        }
      )?.data;
      brandId = brand?.id ?? "";
      originalLanguages = (brand?.languages ?? []).map(({ id }) => id);
      const target = originalLanguages.find(id => id !== brand?.language_id);
      if (!brandId || !target)
        throw new Error(
          "AC-35 arrange: no non-default brand language to drop."
        );

      const client = await call(
        "GET",
        `/api/clients/${clientId}`,
        clientToken.access_token
      );
      originalClientLanguage =
        (client.body as { data?: { interface_language_id?: string | null } })
          ?.data?.interface_language_id ?? null;

      const setClient = await call(
        "PUT",
        `/api/admin/clients/${clientId}`,
        staffToken.access_token,
        {
          interface_language_id: target
        }
      );
      const setBrand = await call(
        "PUT",
        `/api/admin/brands/${brandId}`,
        staffToken.access_token,
        {
          supported_languages: originalLanguages.filter(id => id !== target)
        }
      );
      const check = await call(
        "GET",
        "/api/brand/settings",
        clientToken.access_token
      );
      const stillOffered = (
        (check.body as { data?: { languages?: Array<{ id: string }> } })?.data
          ?.languages ?? []
      ).some(({ id }) => id === target);
      if (setClient.status >= 400 || setBrand.status >= 400 || stillOffered)
        throw new Error(
          `AC-35 arrange failed: client ${setClient.status}, brand ${setBrand.status} ${JSON.stringify(setBrand.body).slice(0, 300)}, still offered: ${stillOffered}`
        );
    }, 60000);

    afterAll(async () => {
      await call(
        "PUT",
        `/api/admin/brands/${brandId}`,
        staffToken.access_token,
        {
          supported_languages: originalLanguages
        }
      );
      await call(
        "PUT",
        `/api/admin/clients/${clientId}`,
        staffToken.access_token,
        {
          interface_language_id: originalClientLanguage
        }
      );
    }, 60000);

    it(BG, () =>
      recordStep(scenario, BG, async generator => {
        await generator.get("/api/brand/settings");
        await bootRead(generator);
      })
    );
    it("I view my profile's language choices", () =>
      recordStep(scenario, "I view my profile's language choices", () =>
        Promise.resolve()
      ));
  });

  // AC-51 — a REQUIRED client custom-field arranged with the admin user, recorded,
  // then deleted immediately. With that field required and empty, the editor
  // refuses the save client-side, so no request escapes. `type: 7` is the NUMBER
  // definition shape this brand already carries (the `age` field). NOTE: the admin
  // create is a shared-brand mutation the sandbox refuses when an agent runs it —
  // the OPERATOR runs `pnpm fixtures:generate client-personal-details`.
  describe("Saving is refused before anything is sent when a required custom field is left empty", () => {
    const scenario =
      "Saving is refused before anything is sent when a required custom field is left empty";
    let staffToken: IToken;
    let requiredFieldId: string | undefined;

    beforeAll(async () => {
      staffToken = await mintStaffToken();
      // The admin create requires the brand explicitly — GET /api/brand/settings
      // (client token) resolves the acting brand's id (422 "Please select brand!"
      // without it).
      const settings = await call(
        "GET",
        "/api/brand/settings",
        clientToken.access_token
      );
      const brandId = (settings.body as { data?: { id?: string } })?.data?.id;
      if (!brandId)
        throw new Error(
          `Could not resolve the brand id from /api/brand/settings (${settings.status}).`
        );
      const { status, body } = await call(
        "POST",
        "/api/admin/custom_fields",
        staffToken.access_token,
        {
          object_type: "client",
          name: "FE3145 Required",
          code: "fe3145_required",
          type: 7,
          required: true,
          show_on_order_form: true,
          client_readonly: false,
          brand_id: brandId
        }
      );
      const data = (body as { data?: { id?: string } })?.data;
      if (status >= 300 || !data?.id)
        throw new Error(
          `Could not arrange the required custom field (${status}): ${JSON.stringify(
            body
          )}`
        );
      requiredFieldId = data.id;
    }, 30000);

    afterAll(async () => {
      if (requiredFieldId)
        await call(
          "DELETE",
          `/api/admin/custom_fields/${requiredFieldId}`,
          staffToken.access_token
        );
    }, 30000);

    it(BG, () => recordStep(scenario, BG, bootRead));
    it("I clear a required custom field and try to save", () =>
      recordStep(
        scenario,
        "I clear a required custom field and try to save",
        bootRead
      ));
  });
});
