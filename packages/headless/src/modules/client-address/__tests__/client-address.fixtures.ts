// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Address API Fixtures Generator (ADR 025 §A1.3 / ADR 035)
 *
 * ## Job To Be Done
 * Record the two kinds of fixture the suites replay, against REAL staging, then
 * leave staging as it was found. Run on demand:
 *
 *   pnpm fixtures:generate client-address
 *
 * Two describes, both writing through `Generator`:
 *  - **flat fixtures** (`fixtures/*.json`, one file per request) — the module's
 *    core reads, the co-located provenance pool the integrity guard requires
 *    beside the replay driver.
 *  - **scenario recordings** (`scenarios/<slug>/<NN>/`, one folder per step) —
 *    the module's CAPABILITIES: each driven `client-address.feature` scenario
 *    plays its own per-step recordings, one request answered per step. This is
 *    where every capability is proven (FE-3145 / ADR 035); there are no separate
 *    capability `*.int.test.ts` files.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal suites by the `*.fixtures.ts` suffix.
 *
 * ## Recording limits (surfaced, not papered over)
 * 1. **`state` is never on the wire.** `IAddress` declares `state`, but this API
 *    returns `county`; AC-31's order is asserted over the six components the wire
 *    really carries, and no `state` datum is invented.
 * 2. **AC-20/AC-21's forbidding brand read is recorded into its own scenario's
 *    step-01 folder**, not a shared side bundle: the staff administrator flips
 *    the gate, the client's own boot read is captured alongside that step's list
 *    read, and the flag is restored (ADR 035).
 *
 * ## Staging hygiene
 * Every mutation targets an address this run CREATES, and each describe's
 * `afterAll` deletes it and restores the account's original default.
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
import {
  filter,
  find,
  forEach,
  includes,
  kebabCase,
  map,
  split
} from "lodash-es";
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
const ADDRESS_WITH = "region,country";
/** A UUID the API is guaranteed not to hold — the rejected-write material. */
const UNKNOWN_ADDRESS_ID = "00000000-0000-0000-0000-000000000000";

type WireAddress = {
  id: string;
  name: string | null;
  address_1: string | null;
  city: string | null;
  postcode: string | null;
  region_id?: string | null;
  country_id: string;
  default: boolean;
  can_delete: boolean;
};

// -----------------------------------------------------------------------------

/** Plain, UNCAPTURED authed call — used for id lookup, arrangement and restore. */
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

// -----------------------------------------------------------------------------
// Admin brand-config arrange (FE-3145) — this module reads its region/lock gate
// from useBrand's SHARED boot config bundle, not a per-module read, so a
// forbidding variant is arranged with the STAFF (administrator) account and
// RECORDED as forbidding copies of every candidate brand bundle that carries the
// key — captured straight into the gated scenario's OWN step-01 folder,
// alongside that step's list read (ADR 035; same recipe as client-notes AC-14).
// -----------------------------------------------------------------------------

const BRAND_FIXTURES = join(
  import.meta.dirname,
  "../../brand/__tests__/fixtures"
);
/**
 * Both gate keys are carried in EVERY config bundle the brand boot records, so the
 * forbidding copy is recorded for all of them — the module's editor boot reads one
 * of them and we cannot know which by identity, so all are armed at replay.
 */
const REGION_BUNDLE_HASHES = ["1c963981", "c52ff370", "d158227c", "f57ff14a"];
const LOCK_BUNDLE_HASHES = ["1c963981", "c52ff370", "d158227c", "f57ff14a"];
const REGION_KEY = "invoices.common.required_region_in_address";
const LOCK_KEY = "clients.settings.allow_address_update";

type BrandField = {
  code?: string;
  value?: { value?: unknown } | null;
  required?: boolean;
};
type BrandGroup = {
  code?: string;
  fields?: { data?: BrandField[] } | BrandField[];
};

async function resolveBrandId(clientAccessToken: string): Promise<string> {
  const { body } = await call("GET", "/api/brand/settings", clientAccessToken);
  const id = String((body as { data?: { id?: string } })?.data?.id ?? "");
  if (!id)
    throw new Error(
      "Could not resolve the staging brand id for the admin arrange."
    );
  return id;
}

/** Every field of a category group as `{ code: currentValue }`. */
async function readGroupFields(
  staffToken: string,
  brandId: string,
  category: string,
  group: string
): Promise<Record<string, unknown>> {
  const { status, body } = await call(
    "GET",
    `/api/admin/config/brand/categories/${category}/groups?brand_id=${brandId}&with=fields.value`,
    staffToken
  );
  if (status !== 200)
    throw new Error(`admin read of ${category}/${group} returned ${status}.`);
  const groups = (body as { data?: BrandGroup[] })?.data ?? [];
  const grp = find(groups, g => g.code === group);
  if (!grp) throw new Error(`admin group ${category}/${group} not found.`);
  const fields = Array.isArray(grp.fields)
    ? grp.fields
    : (grp.fields?.data ?? []);
  const out: Record<string, unknown> = {};
  forEach(fields, f => {
    if (!f.code) return;
    const raw = (f.value as { value?: unknown })?.value ?? null;
    // A required field that is null on staging (e.g. clients.settings.prohibit_*)
    // is echoed back as `false`: the whole-group PUT validates every required
    // field, and `null` fails "required". These are boolean toggles, so `false`
    // is the API's own normalisation of an unset flag — a neutral, forced value.
    out[f.code] = raw === null && f.required ? false : raw;
  });
  return out;
}

async function readBrandValue(
  staffToken: string,
  brandId: string,
  dottedKey: string
): Promise<unknown> {
  const [category, group, field] = split(dottedKey, ".");
  const fields = await readGroupFields(staffToken, brandId, category, group);
  return fields[field] ?? null;
}

/** Writes `{category}.{group}.{field}`, echoing the whole group with one field changed. */
async function writeBrandValue(
  staffToken: string,
  brandId: string,
  dottedKey: string,
  value: unknown
): Promise<void> {
  const [category, group, field] = split(dottedKey, ".");
  const fields = await readGroupFields(staffToken, brandId, category, group);
  fields[field] = value;
  const { status, body } = await call(
    "PUT",
    `/api/admin/config/brand/${category}?brand_id=${brandId}`,
    staffToken,
    { groups: { [group]: { fields } } }
  );
  if (status !== 200)
    throw new Error(
      `admin write of ${dottedKey}=${JSON.stringify(value)} returned ${status}: ${JSON.stringify(body).slice(0, 300)}`
    );
}

/** Replays the named forbidding candidate brand bundles through the given generator. */
async function recordGatedBrandBundles(
  generator: Generator,
  hashes: string[]
): Promise<void> {
  for (const hash of hashes) {
    const brandFix = JSON.parse(
      readFileSync(
        join(BRAND_FIXTURES, `get-config-brand-values-${hash}.json`),
        "utf-8"
      )
    ) as { request: { path: string } };
    await generator.get(brandFix.request.path);
  }
}

// -----------------------------------------------------------------------------
// FLAT FIXTURES — the module's core reads captured once into `fixtures/`, the
// co-located pool the integrity guard requires beside the replay driver. The
// capabilities are proven by the scenario recordings below; this pool is the
// provenance floor.
// -----------------------------------------------------------------------------

describe("Client-Address flat fixtures", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let countryAId: string;
  let regionAId: string | undefined;
  let throwawayId: string | undefined;
  let undeletableId: string | undefined;

  const collection = () => `/api/clients/${clientId}/addresses`;
  const stamp = Date.now();

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-address"
    });
    clientToken = await mintClientToken();
    clientId = (await fetchClientId(clientToken.access_token)) ?? "";
    if (!clientId)
      throw new Error("Could not resolve the client id from /self.");

    const { body } = await call(
      "GET",
      `${collection()}?with=${ADDRESS_WITH}&limit=0`,
      clientToken.access_token
    );
    const rows = ((body as { data?: WireAddress[] })?.data ??
      []) as WireAddress[];
    if (!rows.length)
      throw new Error("The staging client holds no address to record from.");
    const withRegion = find(
      rows,
      row => Boolean(row.region_id) && row.region_id !== "none"
    );
    countryAId = withRegion?.country_id ?? rows[0].country_id;
    regionAId = withRegion?.region_id ?? undefined;
    undeletableId = find(rows, row => !row.can_delete)?.id;
  }, 60000);

  afterAll(async () => {
    generator.save();
    if (throwawayId)
      await call(
        "DELETE",
        `${collection()}/${throwawayId}`,
        clientToken.access_token
      ).catch(() => undefined);
  }, 60000);

  it("captures the collection, one address and the form lookups", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `${collection()}?with=${ADDRESS_WITH}&limit=0`
    );
    if (status !== 200) throw new Error(`List capture returned ${status}.`);
    const rows = (body as { data?: WireAddress[] })?.data ?? [];
    const first = find(rows, row => Boolean(row.default)) ?? rows[0];
    if (first)
      await generator.get(`${collection()}/${first.id}?with=${ADDRESS_WITH}`);
    await generator.get("/api/countries?limit=0");
    await generator.get(`/api/countries/${countryAId}/regions?limit=0`);
    generator.clearBearerToken();
  });

  it("captures the created row (type 3, verified 2) the mapper unit reads", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(collection(), {
      name: `client-address-fixture-${stamp}`,
      type: 3,
      verified: 2,
      address_1: "1 Prover Street",
      address_2: "Flat 2",
      city: "Guildford",
      postcode: "GU4 8PH",
      region_id: regionAId,
      country_id: countryAId
    });
    generator.clearBearerToken();
    if (status >= 400) throw new Error(`Create capture returned ${status}.`);
    throwawayId = (body as { data?: { id?: string } })?.data?.id;
  });

  it("captures the real refusals the forced error states replay (409, 422)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const rejectedDefault = await generator.put(
      `${collection()}/${UNKNOWN_ADDRESS_ID}?case=set-default-rejected`,
      { default: true }
    );
    if (rejectedDefault.status < 400)
      console.warn(
        `[client-address.fixtures] set-default-rejected expected 4xx, got ${rejectedDefault.status}.`
      );
    if (undeletableId) {
      const rejectedRemove = await generator.delete(
        `${collection()}/${undeletableId}?case=remove-rejected`
      );
      if (rejectedRemove.status < 400)
        console.warn(
          `[client-address.fixtures] remove-rejected expected 4xx, got ${rejectedRemove.status}.`
        );
    }
    generator.clearBearerToken();
  });
});

// -----------------------------------------------------------------------------
// SCENARIO RECORDINGS (FE-3145) — one recording per driven scenario, one folder
// per step, named from the feature by `recordedStepDir`. Sequences live here.
// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-address.feature"),
  "utf-8"
);

/** The Background step every scenario opens with — it reads the collection. */
const OPEN_BG = "I am signed in as a client managing my addresses";
const ERRORED_OPEN =
  "I am signed in as a client whose address list cannot be read";
/** The page-scenario Given — it opens the same collection. */
const OPEN_PAGE = "I am an authenticated client on the addresses page";

describe("Client-Address brand-gated recordings", () => {
  let clientToken: IToken;
  let staffToken: string;
  let brandId: string;
  let clientId: string;
  let originalRegion: unknown;
  let originalLock: unknown;
  let editId: string;
  let editCountryId: string;
  let originalCountryId: string;
  const prepared = new Set<string>();

  const list = () =>
    `/api/clients/${clientId}/addresses?with=${ADDRESS_WITH}&limit=0`;
  const one = (id: string) =>
    `/api/clients/${clientId}/addresses/${id}?with=${ADDRESS_WITH}`;
  const countries = () => "/api/countries?limit=0";
  const regions = (countryId: string) =>
    `/api/countries/${countryId}/regions?limit=0`;
  const readList = (g: Generator) => g.get(list());
  const draftBoot = async (g: Generator): Promise<void> => {
    await g.get(countries());
    await g.get(regions(originalCountryId));
  };

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

  beforeAll(async () => {
    clientToken = await mintClientToken();
    staffToken = (await mintStaffToken()).access_token;
    clientId = (await fetchClientId(clientToken.access_token)) ?? "";
    if (!clientId)
      throw new Error("Could not resolve the client id from /self.");
    brandId = await resolveBrandId(clientToken.access_token);
    originalRegion = await readBrandValue(staffToken, brandId, REGION_KEY);
    originalLock = await readBrandValue(staffToken, brandId, LOCK_KEY);
    const { body } = await call("GET", list(), clientToken.access_token);
    const rows = (body as { data: WireAddress[] }).data ?? [];
    if (!rows.length)
      throw new Error(
        "The staging client holds no address for the lock scenario."
      );
    const row = find(rows, r => Boolean(r.default)) ?? rows[0];
    editId = row.id;
    editCountryId = row.country_id;
    originalCountryId = row.country_id;
  }, 60000);

  afterAll(async () => {
    await writeBrandValue(staffToken, brandId, REGION_KEY, originalRegion);
    await writeBrandValue(staffToken, brandId, LOCK_KEY, originalLock);
  }, 60000);

  describe("Where this brand requires a region, I must give one", () => {
    const scenario = "Where this brand requires a region, I must give one";
    const WHEN = "I complete the address form without a region";
    it(
      OPEN_BG,
      async () => {
        await writeBrandValue(staffToken, brandId, REGION_KEY, true);
        await recordStep(scenario, OPEN_BG, async g => {
          await recordGatedBrandBundles(g, REGION_BUNDLE_HASHES);
          await readList(g);
        });
        await writeBrandValue(staffToken, brandId, REGION_KEY, originalRegion);
      },
      60000
    );
    it(WHEN, () => recordStep(scenario, WHEN, draftBoot));
  });

  describe("I cannot change the country of an address I already saved", () => {
    const scenario =
      "I cannot change the country of an address I already saved";
    const WHEN = "I open one of my existing addresses to edit";
    it(
      OPEN_BG,
      async () => {
        await writeBrandValue(staffToken, brandId, LOCK_KEY, false);
        await recordStep(scenario, OPEN_BG, async g => {
          await recordGatedBrandBundles(g, LOCK_BUNDLE_HASHES);
          await readList(g);
        });
        await writeBrandValue(staffToken, brandId, LOCK_KEY, originalLock);
      },
      60000
    );
    it(WHEN, () =>
      recordStep(scenario, WHEN, async g => {
        await g.get(one(editId));
        await g.get(countries());
        await g.get(regions(editCountryId));
      })
    );
  });
});

describe("Client-Address scenario recordings", () => {
  let clientToken: IToken;
  let clientId: string;
  let originalIds: string[] = [];
  let originalDefaultId: string | undefined;
  let originalCountryId: string;
  let editId: string;
  let editCountryId: string;
  /** A saved address that carries a region — the lookups/country-switch editor. */
  let regionEditId: string;
  let regionEditCountryId: string;
  /** A DIFFERENT country that also has regions — the AC-19 country-switch target. */
  let otherCountryId: string;
  const prepared = new Set<string>();

  const list = () =>
    `/api/clients/${clientId}/addresses?with=${ADDRESS_WITH}&limit=0`;
  const paged = (limit: number, offset: number) =>
    `/api/clients/${clientId}/addresses?with=${ADDRESS_WITH}&limit=${limit}&offset=${offset}`;
  const filtered = (needle: string) =>
    `/api/clients/${clientId}/addresses?with=${ADDRESS_WITH}&limit=0&filter[name|like]=${encodeURIComponent(
      `%${needle}%`
    )}`;
  const collection = () => `/api/clients/${clientId}/addresses`;
  const one = (id: string) => `${collection()}/${id}?with=${ADDRESS_WITH}`;
  const countries = () => "/api/countries?limit=0";
  const regions = (countryId: string) =>
    `/api/countries/${countryId}/regions?limit=0`;

  async function arrangeAddress(name: string): Promise<string> {
    const { body } = await call(
      "POST",
      collection(),
      clientToken.access_token,
      {
        name,
        address_1: "1 Scenario Street",
        city: "Guildford",
        postcode: "GU1 1AA",
        country_id: originalCountryId
      }
    );
    return (body as { data: { id: string } }).data.id;
  }

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

  const readList = (generator: Generator) => generator.get(list());

  async function restoreStaging(): Promise<void> {
    if (originalDefaultId)
      await call(
        "PUT",
        `${collection()}/${originalDefaultId}`,
        clientToken.access_token,
        { default: true }
      );
    const { body } = await call("GET", list(), clientToken.access_token);
    const added = filter(
      (body as { data: WireAddress[] }).data,
      ({ id }) => !includes(originalIds, id)
    );
    for (const { id } of added)
      await call("DELETE", `${collection()}/${id}`, clientToken.access_token);
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();
    clientId = (await fetchClientId(clientToken.access_token)) ?? "";
    const { body } = await call("GET", list(), clientToken.access_token);
    const rows = (body as { data: WireAddress[] }).data;
    originalIds = map(rows, "id");
    originalDefaultId = find(rows, row => Boolean(row.default))?.id;
    originalCountryId = rows[0]?.country_id;
    const editRow = find(rows, row => Boolean(row.default)) ?? rows[0];
    editId = editRow.id;
    editCountryId = editRow.country_id;

    const regionRow = find(
      rows,
      row => Boolean(row.region_id) && row.region_id !== "none"
    );
    if (!regionRow)
      throw new Error(
        "The staging client holds no region-bearing address — AC-18/AC-19 cannot be recorded."
      );
    regionEditId = regionRow.id;
    regionEditCountryId = regionRow.country_id;

    // A second country that also has regions — the AC-19 country-switch target.
    const { body: countryList } = await call(
      "GET",
      countries(),
      clientToken.access_token
    );
    const candidates = (countryList as { data: { id: string }[] }).data;
    for (const candidate of candidates.slice(0, 60)) {
      if (candidate.id === regionEditCountryId) continue;
      const { body: regionList } = await call(
        "GET",
        regions(candidate.id),
        clientToken.access_token
      );
      if (((regionList as { data: unknown[] }).data ?? []).length) {
        otherCountryId = candidate.id;
        break;
      }
    }
    if (!otherCountryId)
      throw new Error(
        "No second country with regions found — AC-19 cannot be recorded."
      );
  }, 120000);

  afterAll(restoreStaging);

  describe("I open one of my saved addresses in the editor", () => {
    const scenario = "I open one of my saved addresses in the editor";
    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
    it("I am editing one of my saved addresses", () =>
      recordStep(
        scenario,
        "I am editing one of my saved addresses",
        async g => {
          await g.get(one(editId));
          await g.get(countries());
          await g.get(regions(editCountryId));
        }
      ));
  });

  // The editor save/validate/abandon scenarios all edit ONE throwaway address —
  // created here, edited across the scenarios, and deleted in afterAll.
  describe("editor save / validate / abandon", () => {
    let editableId: string;
    const EDIT_GIVEN = "I am editing a saved address of mine";

    beforeAll(async () => {
      editableId = await arrangeAddress("scenario-editable");
    });
    afterAll(restoreStaging);

    const openEditor = async (g: Generator): Promise<void> => {
      await g.get(one(editableId));
      await g.get(countries());
      await g.get(regions(originalCountryId));
    };

    describe("I change the town of a saved address and save it", () => {
      const scenario = "I change the town of a saved address and save it";
      it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
      it(EDIT_GIVEN, () => recordStep(scenario, EDIT_GIVEN, openEditor));
      it("I change the town and save", () =>
        recordStep(scenario, "I change the town and save", async g => {
          await g.put(`${collection()}/${editableId}`, { city: "Manchester" });
          await g.get(one(editableId));
        }));
    });

    describe("I change the kind of a saved address and save it", () => {
      const scenario = "I change the kind of a saved address and save it";
      it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
      it(EDIT_GIVEN, () => recordStep(scenario, EDIT_GIVEN, openEditor));
      it("I change the address type and save", () =>
        recordStep(scenario, "I change the address type and save", async g => {
          await g.put(`${collection()}/${editableId}`, { type: 2 });
          await g.get(one(editableId));
        }));
    });

    describe("An incomplete address is refused before it is saved", () => {
      const scenario = "An incomplete address is refused before it is saved";
      it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
      it(EDIT_GIVEN, () => recordStep(scenario, EDIT_GIVEN, openEditor));
    });

    describe("I abandon my changes to a saved address", () => {
      const scenario = "I abandon my changes to a saved address";
      it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
      it(EDIT_GIVEN, () => recordStep(scenario, EDIT_GIVEN, openEditor));
    });
  });

  // The blank-draft and create scenarios boot the editor with NO context
  // (`.fresh()`); the create makes a real address and afterAll deletes it.
  describe("editor blank draft and create", () => {
    afterAll(restoreStaging);

    const DRAFT_GIVEN = "I am starting a brand new address";
    const draftBoot = async (g: Generator): Promise<void> => {
      await g.get(countries());
      await g.get(regions(originalCountryId));
    };

    describe("I start a blank address form", () => {
      const scenario = "I start a blank address form";
      it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
      it(DRAFT_GIVEN, () => recordStep(scenario, DRAFT_GIVEN, draftBoot));
    });

    describe("I add a brand new address", () => {
      const scenario = "I add a brand new address";
      it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
      it(DRAFT_GIVEN, () => recordStep(scenario, DRAFT_GIVEN, draftBoot));
      it("I provide a new address and save it", () =>
        recordStep(scenario, "I provide a new address and save it", g =>
          g.post(collection(), {
            name: "Prover New Address",
            address_1: "1 Prover Way",
            city: "Leeds",
            postcode: "LS1 1AA",
            country_id: originalCountryId
          })
        ));
    });
  });

  it(`lists my saved addresses — ${OPEN_BG}`, () =>
    recordStep(
      "The addresses playground lists my saved addresses",
      OPEN_BG,
      readList
    ));
  it(`lists my saved addresses — ${OPEN_PAGE}`, () =>
    recordStep(
      "The addresses playground lists my saved addresses",
      OPEN_PAGE,
      readList
    ));

  describe("The playground refreshes my address collection", () => {
    const scenario = "The playground refreshes my address collection";
    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
    it(OPEN_PAGE, () => recordStep(scenario, OPEN_PAGE, readList));
    it("I refresh the address collection", () =>
      recordStep(scenario, "I refresh the address collection", readList));
  });

  describe("The playground removes a non-default address", () => {
    const scenario = "The playground removes a non-default address";
    let removableId: string;
    beforeAll(async () => {
      removableId = await arrangeAddress("scenario-removable");
    });
    afterAll(restoreStaging);

    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
    it(OPEN_PAGE, () => recordStep(scenario, OPEN_PAGE, readList));
    it("I remove a non-default address", () =>
      recordStep(
        scenario,
        "I remove a non-default address",
        async generator => {
          await generator.delete(`${collection()}/${removableId}`);
          await readList(generator);
        }
      ));
  });

  describe("The playground makes a non-default address the default", () => {
    const scenario = "The playground makes a non-default address the default";
    let defaultableId: string;
    beforeAll(async () => {
      defaultableId = await arrangeAddress("scenario-defaultable");
    });
    afterAll(restoreStaging);

    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
    it(OPEN_PAGE, () => recordStep(scenario, OPEN_PAGE, readList));
    it("I make the non-default address my default", () =>
      recordStep(
        scenario,
        "I make the non-default address my default",
        async generator => {
          await generator.put(`${collection()}/${defaultableId}`, {
            default: true
          });
          await readList(generator);
        }
      ));
  });

  // --- read-only collection scenarios: only the Background list read ---------

  describe("I can tell which address is my default", () => {
    const scenario = "I can tell which address is my default";
    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
  });

  describe("I get a filter bar and a sort over my addresses from one place", () => {
    const scenario =
      "I get a filter bar and a sort over my addresses from one place";
    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
  });

  describe("My address list opens already sorted and searchable the way my account declares", () => {
    const scenario =
      "My address list opens already sorted and searchable the way my account declares";
    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
  });

  // --- filter: a uniquely-named arranged address, narrowed by its name -------

  describe("I find an address by typing part of it", () => {
    const scenario = "I find an address by typing part of it";
    const NEEDLE = "scenario-filter-needle";
    beforeAll(async () => {
      await arrangeAddress(NEEDLE);
    });
    afterAll(restoreStaging);

    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
    it("I search my addresses for part of one", () =>
      recordStep(scenario, "I search my addresses for part of one", generator =>
        generator.get(filtered(NEEDLE))
      ));
  });

  // --- pagination: page one and page two in their own step folders -----------

  describe("I can page through a long list of addresses", () => {
    const scenario = "I can page through a long list of addresses";
    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
    it("I set my address page size to one", () =>
      recordStep(scenario, "I set my address page size to one", generator =>
        generator.get(paged(1, 0))
      ));
    it("I move to the next page of addresses", () =>
      recordStep(scenario, "I move to the next page of addresses", generator =>
        generator.get(paged(1, 1))
      ));
  });

  // --- editor lookups and dependent-field scenarios --------------------------

  const openRegionEditor = async (g: Generator): Promise<void> => {
    await g.get(one(regionEditId));
    await g.get(countries());
    await g.get(regions(regionEditCountryId));
  };

  describe("The form offers me real countries and regions", () => {
    const scenario = "The form offers me real countries and regions";
    const GIVEN = "I am editing an address that has a region";
    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
    it(GIVEN, () => recordStep(scenario, GIVEN, openRegionEditor));
  });

  describe("Changing the country gives me that country's regions", () => {
    const scenario = "Changing the country gives me that country's regions";
    const GIVEN = "I am editing an address that has a region";
    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
    it(GIVEN, () => recordStep(scenario, GIVEN, openRegionEditor));
    it("I change the country to another", () =>
      recordStep(scenario, "I change the country to another", generator =>
        generator.get(regions(otherCountryId))
      ));
  });

  describe("The form I am shown is the form that is checked", () => {
    const scenario = "The form I am shown is the form that is checked";
    const GIVEN = "I am editing one of my saved addresses";
    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
    it(GIVEN, () =>
      recordStep(scenario, GIVEN, async g => {
        await g.get(one(editId));
        await g.get(countries());
        await g.get(regions(editCountryId));
      })
    );
  });

  // AC-4 (list half) — the Background list read is issued for real, its response
  // forced to a 500, so the collection settles errored on a genuine request.
  describe("When my address list cannot be read, I am told it failed", () => {
    const scenario = "When my address list cannot be read, I am told it failed";
    it(ERRORED_OPEN, () =>
      recordStep(scenario, ERRORED_OPEN, generator =>
        generator.get(list(), undefined, ForcedErrorCode.Internal_Server_Error)
      )
    );
  });

  // The two @signed-out guards ask the server for nothing — the module is
  // guarded before any request. Only their scenario dirs are prepared (empty
  // step folders), so the replay wall proves the silence and traceability counts
  // them driven; a request no step recorded fails the scenario by name.
  describe("Signed out, nothing of mine is read or changed", () => {
    const scenario = "Signed out, nothing of mine is read or changed";
    it("I am not signed in", () =>
      recordStep(scenario, "I am not signed in", () => Promise.resolve()));
  });

  describe("The address form is inert without an authenticated client session", () => {
    const scenario =
      "The address form is inert without an authenticated client session";
    it("I open the address form without an authenticated client session", () =>
      recordStep(
        scenario,
        "I open the address form without an authenticated client session",
        () => Promise.resolve()
      ));
  });

  // AC-14 — a real DELETE is issued against an arranged address, its response
  // forced to a 500, so the collection lands the failure. The real request DOES
  // remove the address on staging; restoreStaging reconciles the account after.
  describe("When a change to my addresses fails, I am told, not interrupted", () => {
    const scenario =
      "When a change to my addresses fails, I am told, not interrupted";
    let faultId: string;
    beforeAll(async () => {
      faultId = await arrangeAddress("scenario-fault-delete");
    });
    afterAll(restoreStaging);

    it(OPEN_BG, () => recordStep(scenario, OPEN_BG, readList));
    it("I delete that address", () =>
      recordStep(scenario, "I delete that address", generator =>
        generator.delete(
          `${collection()}/${faultId}`,
          undefined,
          ForcedErrorCode.Internal_Server_Error
        )
      ));
  });
});
