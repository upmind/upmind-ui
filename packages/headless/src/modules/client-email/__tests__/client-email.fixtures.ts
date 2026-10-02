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
import { filter, find, forEach, includes, kebabCase, map } from "lodash-es";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * The free-text needle the labs table-channel spec filters by, arranged as
 * `client-email-alpha@example.com` — an RFC 2606 reserved domain the recorder
 * leaves unmasked, so the spec reads back the address it filtered for.
 */
const CLIENT_EMAIL_NEEDLE = "alpha";

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
  let originalIds: string[] = [];

  const emails = () => `/api/clients/${clientId}/emails`;
  let unverifiedId = "";

  /** Adds an address on staging, uncaptured — a corpus arrangement. */
  async function arrangeAddress(email: string): Promise<string> {
    const { body } = await call("POST", emails(), clientToken.access_token, {
      email
    });
    return (body as { data: { id: string } }).data.id;
  }

  /** Staging back as it was found: every address this run added is removed. */
  async function restoreStaging(): Promise<void> {
    const { body } = await call("GET", emails(), clientToken.access_token);
    const added = filter(
      (body as { data: WireEmail[] }).data,
      ({ id }) => !includes(originalIds, id)
    );
    for (const { id } of added)
      await call("DELETE", `${emails()}/${id}`, clientToken.access_token);
  }

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-email"
    });

    clientToken = await mintClientToken();
    const id = await fetchClientId(clientToken.access_token);
    if (!id) {
      throw new Error(
        "Could not resolve the client id from /self — cannot capture the " +
          "clients/{id}/emails fixtures."
      );
    }
    clientId = id;

    const { body } = await call("GET", emails(), clientToken.access_token);
    originalIds = map((body as { data?: WireEmail[] })?.data ?? [], "id");

    // The two unverified addresses the labs table-channel spec narrows by, so
    // the flat list is a real three-row corpus — the account's own verified
    // default plus these two — arranged here and removed in afterAll.
    await arrangeAddress(`client-email-${CLIENT_EMAIL_NEEDLE}@example.com`);
    unverifiedId = await arrangeAddress("client-email-beta@example.com");
  }, 30000);

  afterAll(async () => {
    await restoreStaging();
    generator.save();
  });

  // The collection list read exactly as the labs page's boot issues it —
  // `order` + `limit` are the module's own query defaults, so the forced-state
  // corpus answers the page's real read by identity (FE-3145, ADR 035). `order`
  // and `limit` are excluded from the fixture name, so this overwrites the same
  // `get-clients-id-emails.json` and only its recorded query gains the params.
  it("captures GET /api/clients/{id}/emails (the three-row corpus list)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `${emails()}?order=-default,email&limit=10`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `List capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
  });

  // The single-record read the labs component lane projects one row from
  // (`recorded-emails.ts`), addressed to an arranged unverified address.
  it("captures GET /api/clients/{id}/emails/{id} (one address)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(`${emails()}/${unverifiedId}`);
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Single-address capture returned ${status}.`);
    }
  });

  // The resend-verification write the labs page offers as a row action — a third
  // module route the forced-state corpus must cover so an armed page answers a
  // resend the operator fires (FE-3145, `force-handlers` AC8.3).
  it("captures PATCH .../emails/{id}/send_verify (resend verification)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.patch(
      `${emails()}/${unverifiedId}/send_verify`
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Resend-verification capture returned ${status}.`);
    }
  });

  // A plain served update (edit the address) — the module's own non-refused
  // write, so a forced `loading` holds it pending and `replay`/`empty` serve it
  // as recorded, told apart from the refused 409 write below (FE-3145).
  it("captures PUT /api/clients/{id}/emails/{id} (edit an address — served update)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(`${emails()}/${unverifiedId}`, {
      email: "client-email-beta-edited@example.com"
    });
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Address-edit capture returned ${status}.`);
    }
  });

  // The real 409 the API answers a set-default on an UNVERIFIED address with —
  // the recorded refusal the action-feedback lane replays and the labs page's
  // error-action forces on a write. A real refusal is not an injected fault; the
  // default is never moved, so staging ends as found.
  it("captures PUT .../emails/{id} set-default on an unverified address (409)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `${emails()}/${unverifiedId}?case=set-default-unverified`,
      { default: true }
    );
    generator.clearBearerToken();
    if (status !== 409) {
      throw new Error(
        `Set-default-on-unverified returned ${status}, expected 409 — the ` +
          "recorded refusal the feedback lane needs is not on file."
      );
    }
  });

  it("captures GET .../emails?filter[verified|eq]=0 (the two unverified rows)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(`${emails()}?filter[verified|eq]=0`);
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Filtered (verified) capture returned ${status}.`);
    }
  });

  it("captures GET .../emails?filter[email|like]=%needle% (the one needle match)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `${emails()}?filter[email|like]=${encodeURIComponent(
        `%${CLIENT_EMAIL_NEEDLE}%`
      )}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Filtered (email like) capture returned ${status}.`);
    }
  });

  // The created-row shape the `mapIEmail` unit test reads back (AC-15, R25) —
  // a throwaway address, cleaned up with the rest by `restoreStaging`.
  it("captures POST /api/clients/{id}/emails (the created row)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.post(emails(), {
      email: `client-email-created-${Date.now()}@example.com`
    });
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Add capture returned ${status} — the mapper reference row is missing.`
      );
    }
  });
});

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145) — one recording per `client-email.feature` scenario, one
// fixtures folder per step, named from the feature by `recordedStepDir`. Each
// scenario arranges the data its steps need on staging, records the requests
// its steps make, in their order, and leaves staging as it found it.
// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-email.feature"),
  "utf-8"
);

/** The Background step every scenario opens with — it reads the collection. */
const OPEN = "I am an authenticated client managing my own account";
const ERRORED_OPEN =
  "I am an authenticated client whose email collection cannot be read";

describe("Client-Email scenario recordings", () => {
  let clientToken: IToken;
  let staffToken: IToken;
  let clientId: string;
  let originalIds: string[] = [];
  let originalDefaultId: string | undefined;
  const prepared = new Set<string>();

  const emails = () => `/api/clients/${clientId}/emails`;

  /** Adds an address on staging, uncaptured — a scenario's arrangement. */
  async function arrangeAddress(email: string): Promise<string> {
    const { body } = await call("POST", emails(), clientToken.access_token, {
      email
    });
    return (body as { data: { id: string } }).data.id;
  }

  /** Records the requests one step makes into that step's own folder. */
  async function recordStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    // Once per scenario, before its first step records: every step's folder,
    // and nothing left from an earlier recording.
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

  /** The collection read every step that re-reads the list makes. */
  const readList = (generator: Generator) => generator.get(emails());

  /** Staging back as it was: the original default, and only the original addresses. */
  async function restoreStaging(): Promise<void> {
    await call(
      "PUT",
      `${emails()}/${originalDefaultId}`,
      clientToken.access_token,
      { default: true }
    );
    const { body } = await call("GET", emails(), clientToken.access_token);
    const added = filter(
      (body as { data: WireEmail[] }).data,
      ({ id }) => !includes(originalIds, id)
    );
    for (const { id } of added) {
      await call("DELETE", `${emails()}/${id}`, clientToken.access_token);
    }
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();
    staffToken = await mintStaffToken();
    clientId = (await fetchClientId(clientToken.access_token)) ?? "";

    const { body } = await call("GET", emails(), clientToken.access_token);
    const rows = (body as { data: WireEmail[] }).data;
    originalIds = map(rows, "id");
    originalDefaultId = find(rows, row => isTruthyFlag(row.default))?.id;
  }, 30000);

  afterAll(restoreStaging);

  // --- scenarios that read the collection and change nothing ---------------

  forEach(
    [
      "A client sees their email collection",
      "Asking for a page that is not there is refused, not guessed",
      "Discarding the collection releases it",
      // The fresh-editor scenarios: the Background reads the collection; the
      // editor steps are client-side (validate/clear/new-flag) and make no
      // request, so only the Background list read is recorded.
      "The editor refuses a malformed new address",
      "The editor accepts a well-formed new address",
      "A new email editor reports itself as new",
      "The editor forgets a cleared change",
      "The editor tells me how to render its form"
    ],
    scenario => {
      it(`${scenario} — ${OPEN}`, () => recordStep(scenario, OPEN, readList));
    }
  );

  describe("A client refreshes their collection", () => {
    const scenario = "A client refreshes their collection";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it("the client refreshes the collection", () =>
      recordStep(scenario, "the client refreshes the collection", readList));
  });

  describe("Sorting reorders the collection", () => {
    const scenario = "Sorting reorders the collection";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it("the client sorts the collection by address descending", () =>
      recordStep(
        scenario,
        "the client sorts the collection by address descending",
        generator => generator.get(`${emails()}?order=-email`)
      ));
  });

  // --- scenarios that change the collection --------------------------------

  describe("A client adds an email address", () => {
    const scenario = "A client adds an email address";
    const step = 'the client adds the address "client-email-added@example.com"';

    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it(step, () =>
      recordStep(scenario, step, async generator => {
        await generator.post(emails(), {
          email: "client-email-added@example.com"
        });
        await readList(generator);
      })
    );
  });

  describe("A client deletes an email address", () => {
    const scenario = "A client deletes an email address";
    const step =
      "the client deletes the address the server allows them to delete";
    let deletableId: string;

    beforeAll(async () => {
      deletableId = await arrangeAddress("client-email-deletable@example.com");
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it(step, () =>
      recordStep(scenario, step, async generator => {
        await generator.delete(`${emails()}/${deletableId}`);
        await readList(generator);
      })
    );
  });

  describe("A client resends a verification email", () => {
    const scenario = "A client resends a verification email";
    const step =
      "the client resends the verification for their unverified address";
    let unverifiedId: string;

    beforeAll(async () => {
      unverifiedId = await arrangeAddress(
        "client-email-unverified@example.com"
      );
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it(step, () =>
      recordStep(scenario, step, async generator => {
        await generator.patch(`${emails()}/${unverifiedId}/send_verify`);
        await readList(generator);
      })
    );
  });

  describe("A client sets a default email", () => {
    const scenario = "A client sets a default email";
    const step = "the client makes their non-default address the default";
    let verifiedId: string;

    // A verified address that is not the default. A client cannot verify one
    // (the code only arrives by email); staff can, through the admin API.
    beforeAll(async () => {
      verifiedId = await arrangeAddress("client-email-verified@example.com");
      await call(
        "PUT",
        `/api/admin/clients/${clientId}/emails/${verifiedId}`,
        staffToken.access_token,
        { verified: 1 }
      );
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it(step, () =>
      recordStep(scenario, step, async generator => {
        await generator.put(`${emails()}/${verifiedId}`, { default: true });
        await readList(generator);
      })
    );
  });

  describe("Filtering narrows the collection", () => {
    const scenario = "Filtering narrows the collection";
    const step = "the client filters to unverified addresses only";

    beforeAll(async () => {
      await arrangeAddress("client-email-unverified@example.com");
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it(step, () =>
      recordStep(scenario, step, generator =>
        generator.get(`${emails()}?filter[verified|eq]=0`)
      )
    );
  });

  // --- manager (per-email editor) scenarios --------------------------------

  describe("A client saves a new address in the editor", () => {
    const scenario = "A client saves a new address in the editor";
    const step =
      'I enter "client-email-editor-new@example.com" and save it in the editor';

    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it(step, () =>
      recordStep(scenario, step, async generator => {
        await readList(generator);
        await generator.post(emails(), {
          email: "client-email-editor-new@example.com"
        });
        await readList(generator);
      })
    );
  });

  describe("A client opens one of their saved addresses in the editor", () => {
    const scenario =
      "A client opens one of their saved addresses in the editor";
    const step = "I open one of my saved addresses in the editor";
    let openId: string;

    beforeAll(async () => {
      openId = await arrangeAddress("client-email-editor-open@example.com");
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it(step, () =>
      recordStep(scenario, step, generator =>
        generator.get(`${emails()}/${openId}`)
      )
    );
  });

  describe("A client saves a change to one of their addresses", () => {
    const scenario = "A client saves a change to one of their addresses";
    const openStep = "I open my saved address for a change in the editor";
    const saveStep =
      'I change the address to "client-email-editor-edited@example.com" and save it';
    let editId: string;

    beforeAll(async () => {
      editId = await arrangeAddress("client-email-editor-change@example.com");
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it(openStep, () =>
      recordStep(scenario, openStep, generator =>
        generator.get(`${emails()}/${editId}`)
      )
    );
    it(saveStep, () =>
      recordStep(scenario, saveStep, async generator => {
        await generator.put(`${emails()}/${editId}`, {
          email: "client-email-editor-edited@example.com",
          verified: 0
        });
        await readList(generator);
      })
    );
  });

  // AC-3 — the list read is issued for real, its response forced to a 500, so the
  // collection settles errored on a genuine request the recording overrides.
  describe("When my list cannot be read, the collection tells me it errored", () => {
    const scenario =
      "When my list cannot be read, the collection tells me it errored";

    it(ERRORED_OPEN, () =>
      recordStep(scenario, ERRORED_OPEN, generator =>
        generator.get(
          emails(),
          undefined,
          ForcedErrorCode.Internal_Server_Error
        )
      )
    );
  });

  // AC-20 — the collection AND the editor live together: the editor saves a real
  // change and the collection re-reads it. The re-read row carries the saved
  // value because staging really applied the PUT; restoreStaging reverts it.
  describe("Saving in the editor updates my list", () => {
    const scenario = "Saving in the editor updates my list";
    const openEditorStep =
      "my email addresses are open in one place and the editor in another";
    const saveStep = "I save a change in the editor";
    let listEditorId: string;

    beforeAll(async () => {
      listEditorId = await arrangeAddress(
        "client-email-list-editor-src@example.com"
      );
    });
    afterAll(restoreStaging);

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it(openEditorStep, () =>
      recordStep(scenario, openEditorStep, generator =>
        generator.get(`${emails()}/${listEditorId}`)
      )
    );
    it(saveStep, () =>
      recordStep(scenario, saveStep, async generator => {
        await generator.put(`${emails()}/${listEditorId}`, {
          email: "client-email-list-editor@example.com"
        });
        await readList(generator);
      })
    );
  });
});
