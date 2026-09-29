// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Phone API Fixtures Generator (ADR 025 §A1.3, ADR 035)
 *
 * ## Job To Be Done
 * Record, against real staging, the TWO fixture families the `client-phone`
 * suite replays — no third kind (operator ruling, FE-3145):
 *
 * 1. FLAT captures (`fixtures/*.json`) — ONE file per request, read by the pure
 *    unit tests that transform a recorded wire row (the mapper suite). No
 *    integration test reads them: every module capability is a driven scenario.
 * 2. SCENARIO recordings (`scenarios/<slug>/<NN>/`) — one folder per step of
 *    each DRIVEN `client-phone.feature` scenario, for a flow that asks the SAME
 *    request again after something changes (a refresh, a delete then re-read, a
 *    set-default then re-read, a page walk, a re-sort, a filter). Replayed by
 *    `client-phone.replay.int.test.ts` against the real composable.
 *
 *   pnpm fixtures:generate client-phone
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — EXCLUDED from the normal suites by the `*.fixtures.ts` suffix.
 * It has no assertions: an `it()` succeeds when the capture completes.
 *
 * ## Boot reads are the owning modules' recordings
 * The brand-readiness bootstrap and `/countries` the editor resolves against are
 * answered in the suite by the `brand`, `system` and `basket` modules' OWN
 * recordings (`installBackgroundStubs`), so this generator captures none of them.
 *
 * ## Staging hygiene
 * Every mutation targets a phone number this run CREATES (prefix `770`), and the
 * run deletes every such throwaway before it snapshots the account and again
 * after, so a re-record cannot accumulate rows on the shared staging client. The
 * account's own default is set back onto itself.
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
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
import { find, forEach } from "lodash-es";
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

/**
 * The free-text needle the filter scenario searches by. The account's real
 * numbers cluster on `7111…`, so `111` narrows a genuine subset staging
 * returns (`filter[phone|like]=%111%`).
 */
const NEEDLE = "111";

type WirePhone = {
  id: string;
  phone: string;
  default?: boolean | number;
};

/**
 * The module's real collection read — the schema's declared window (unpaged,
 * `created_at` ascending) plus the staged-imports scoping legacy always sent.
 * `with_staged_imports` IS fixture identity (`fixture-naming.mjs` EXCLUDE_PARAMS
 * omits it) and the module sends it on every collection read, so a scenario's
 * recorded read must carry it or it would never match the wire; `order`/`limit`/
 * `offset` are excluded from identity, so they are fidelity, not matching.
 */
const LIST = "?order=created_at&limit=0&offset=0&with_staged_imports=1";

/** A well-formed GB mobile shape (10 digits) unique per run and sequence. */
const NUMBER_BASE = Date.now();
const uniquePhone = (seq: number): string =>
  `770${String((NUMBER_BASE % 10000000) + seq)
    .padStart(7, "0")
    .slice(-7)}`;

const THROWAWAY_PREFIX = "770";

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

const phonePayload = (phone: string): Record<string, unknown> => ({
  phone,
  phone_code: "+44",
  phone_country_code: "GB"
});

/** Deletes every throwaway number the generator has ever left on the account. */
async function healStaging(
  accessToken: string,
  clientId: string
): Promise<void> {
  const { body } = await call(
    "GET",
    `/api/clients/${clientId}/phones?limit=0`,
    accessToken
  );
  const rows = ((body as { data?: WirePhone[] })?.data ?? []) as WirePhone[];
  for (const row of rows)
    if (String(row.phone ?? "").startsWith(THROWAWAY_PREFIX))
      await call(
        "DELETE",
        `/api/clients/${clientId}/phones/${row.id}`,
        accessToken
      );
}

// -----------------------------------------------------------------------------
// FILE-LEVEL SELF-HEAL — remove any throwaway a prior interrupted run left on
// the shared staging client, so every describe below snapshots the account's
// TRUE contents and every recording reflects it, not a polluted collection.
// -----------------------------------------------------------------------------

let healToken: IToken | undefined;
let healClientId: string | undefined;

beforeAll(async () => {
  healToken = await mintClientToken();
  healClientId = await fetchClientId(healToken.access_token);
  if (healToken && healClientId)
    await healStaging(healToken.access_token, healClientId);
}, 30000);

afterAll(async () => {
  if (healToken && healClientId)
    await healStaging(healToken.access_token, healClientId);
});

// -----------------------------------------------------------------------------
// FLAT CAPTURES — the account's real collection, the ONE flat file the mapper
// unit suite reads to transform a recorded wire row.
// -----------------------------------------------------------------------------

describe("Client-Phone API Fixtures Generator — flat captures", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-phone"
    });
    clientToken = await mintClientToken();
    const id = await fetchClientId(clientToken.access_token);
    if (!id) throw new Error("Could not resolve the client id from /self.");
    clientId = id;
    await healStaging(clientToken.access_token, clientId);
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/clients/{id}/phones (the account's real collection)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(`/api/clients/${clientId}/phones`);
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`List capture returned ${status}.`);
  });

  // The collection read exactly as the labs page's boot issues it (the module's
  // own `LIST` window), so the forced-state corpus answers the page's real read
  // by identity — `order`/`limit`/`offset` are excluded from the fixture name,
  // `with_staged_imports` is its identity (FE-3145, ADR 035).
  it("captures GET /api/clients/{id}/phones (labs page boot read)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}/phones${LIST}`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Boot-read capture returned ${status}.`);
  });
});

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145) — one recording per DRIVEN `client-phone.feature`
// scenario, one fixtures folder per step, named from the feature by
// `recordedStepDir`. Only the `@scenario-include` page-driven scenarios have
// full step coverage in `client-phone.steps.ts`; the rest are spec-only.
// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-phone.feature"),
  "utf-8"
);

/** The Background step every scenario opens with — it reads the collection. */
const BG_OPEN = "I am an authenticated client managing my own phone numbers";
/** The page-driven boot Given — it opens the collection again. */
const PAGE_BOOT = "the client-phone playground boots for the active client";

describe("Client-Phone scenario recordings", () => {
  let clientToken: IToken;
  let clientId: string;
  let originalDefaultId: string | undefined;
  const prepared = new Set<string>();

  const phones = () => `/api/clients/${clientId}/phones`;

  async function arrangePhone(seq: number): Promise<string> {
    const { body } = await call(
      "POST",
      phones(),
      clientToken.access_token,
      phonePayload(uniquePhone(seq))
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
      name: "client-phone"
    });
    generator.setBearerToken(clientToken.access_token);
    await requests(generator);
    generator.save();
  }

  const readList = (generator: Generator) =>
    generator.get(`${phones()}${LIST}`);

  /** Staging back as it was: the original default, every throwaway removed. */
  async function restoreStaging(): Promise<void> {
    if (originalDefaultId)
      await call(
        "PUT",
        `${phones()}/${originalDefaultId}`,
        clientToken.access_token,
        { default: true }
      );
    await healStaging(clientToken.access_token, clientId);
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();
    clientId = (await fetchClientId(clientToken.access_token)) ?? "";
    await healStaging(clientToken.access_token, clientId);
    const { body } = await call("GET", phones(), clientToken.access_token);
    const rows = (body as { data: WirePhone[] }).data;
    originalDefaultId = find(rows, row => isTruthyFlag(row.default))?.id;
  }, 30000);

  afterAll(restoreStaging);

  describe("Refresh the phone collection from the playground", () => {
    const scenario = "Refresh the phone collection from the playground";

    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it(PAGE_BOOT, () => recordStep(scenario, PAGE_BOOT, readList));
    it("the client refreshes the phone collection", () =>
      recordStep(
        scenario,
        "the client refreshes the phone collection",
        readList
      ));
  });

  describe("Remove a non-default phone from the playground", () => {
    const scenario = "Remove a non-default phone from the playground";
    let removableId: string;

    beforeAll(async () => {
      removableId = await arrangePhone(10);
    });
    afterAll(restoreStaging);

    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it(PAGE_BOOT, () => recordStep(scenario, PAGE_BOOT, readList));
    it("the client removes a non-default phone", () =>
      recordStep(
        scenario,
        "the client removes a non-default phone",
        async generator => {
          await generator.delete(`${phones()}/${removableId}`);
          await readList(generator);
        }
      ));
  });

  describe("Promote a phone to default from the playground", () => {
    const scenario = "Promote a phone to default from the playground";
    let promotableId: string;

    beforeAll(async () => {
      promotableId = await arrangePhone(11);
    });
    afterAll(restoreStaging);

    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it(PAGE_BOOT, () => recordStep(scenario, PAGE_BOOT, readList));
    it("the client makes a non-default phone the default", () =>
      recordStep(
        scenario,
        "the client makes a non-default phone the default",
        async generator => {
          await generator.put(`${phones()}/${promotableId}`, {
            default: true
          });
          await readList(generator);
        }
      ));
  });

  describe("Page through my phone numbers from the playground", () => {
    const scenario = "Page through my phone numbers from the playground";

    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it(PAGE_BOOT, () => recordStep(scenario, PAGE_BOOT, readList));
    it("the client sets a page size of two", () =>
      recordStep(scenario, "the client sets a page size of two", generator =>
        generator.get(
          `${phones()}?order=created_at&limit=2&offset=0&with_staged_imports=1`
        )
      ));
    it("the client advances to the next page", () =>
      recordStep(scenario, "the client advances to the next page", generator =>
        generator.get(
          `${phones()}?order=created_at&limit=2&offset=2&with_staged_imports=1`
        )
      ));
  });

  describe("Order my phone numbers from the playground", () => {
    const scenario = "Order my phone numbers from the playground";

    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it(PAGE_BOOT, () => recordStep(scenario, PAGE_BOOT, readList));
    it("the client orders by created_at descending", () =>
      recordStep(
        scenario,
        "the client orders by created_at descending",
        generator =>
          generator.get(
            `${phones()}?order=-created_at&limit=0&with_staged_imports=1`
          )
      ));
    it("the client reverses the order to ascending", () =>
      recordStep(
        scenario,
        "the client reverses the order to ascending",
        generator =>
          generator.get(
            `${phones()}?order=created_at&limit=0&with_staged_imports=1`
          )
      ));
  });

  describe("Filter my phone numbers from the playground", () => {
    const scenario = "Filter my phone numbers from the playground";

    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it(PAGE_BOOT, () => recordStep(scenario, PAGE_BOOT, readList));
    it("the client filters by the free-text needle", () =>
      recordStep(
        scenario,
        "the client filters by the free-text needle",
        generator =>
          generator.get(
            `${phones()}?filter[phone|like]=${encodeURIComponent(
              `%${NEEDLE}%`
            )}&order=created_at&limit=0&with_staged_imports=1`
          )
      ));
  });

  describe("List my own phone numbers", () => {
    const scenario = "List my own phone numbers";
    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it(PAGE_BOOT, () => recordStep(scenario, PAGE_BOOT, readList));
  });

  describe("Read my default phone number", () => {
    const scenario = "Read my default phone number";
    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it(PAGE_BOOT, () => recordStep(scenario, PAGE_BOOT, readList));
  });

  describe("A refused request never narrows my list and never reaches the wire", () => {
    const scenario =
      "A refused request never narrows my list and never reaches the wire";
    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it(PAGE_BOOT, () => recordStep(scenario, PAGE_BOOT, readList));
  });

  describe("A new filter sends me back to the first page", () => {
    const scenario = "A new filter sends me back to the first page";
    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it(PAGE_BOOT, () => recordStep(scenario, PAGE_BOOT, readList));
    it("the client sets a page size of two", () =>
      recordStep(scenario, "the client sets a page size of two", generator =>
        generator.get(
          `${phones()}?order=created_at&limit=2&offset=0&with_staged_imports=1`
        )
      ));
    it("the client advances to the next page", () =>
      recordStep(scenario, "the client advances to the next page", generator =>
        generator.get(
          `${phones()}?order=created_at&limit=2&offset=2&with_staged_imports=1`
        )
      ));
    it("I apply a new filter", () =>
      recordStep(scenario, "I apply a new filter", generator =>
        generator.get(
          `${phones()}?filter[phone|like]=${encodeURIComponent(
            `%${NEEDLE}%`
          )}&order=created_at&limit=2&offset=0&with_staged_imports=1`
        )
      ));
  });

  describe("A misspelled filter reaches no wire and leaves my list alone", () => {
    const scenario =
      "A misspelled filter reaches no wire and leaves my list alone";
    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it(PAGE_BOOT, () => recordStep(scenario, PAGE_BOOT, readList));
  });

  // --- editor scenarios: one arranged number, opened by id ------------------
  // Booted through the manager composable in replay. This is the last describe,
  // so its throwaway is fresh (no earlier heal) and stable across its scenarios.

  describe("editor", () => {
    let editorId: string;
    const OPEN_EDITOR = "the phone editor opens one of my existing numbers";
    const openOne = (generator: Generator) =>
      generator.get(`${phones()}/${editorId}`);

    beforeAll(async () => {
      editorId = await arrangePhone(60);
    });
    afterAll(restoreStaging);

    forEach(
      [
        "Open one of my phone numbers in the editor",
        "A mistyped number is flagged in the editor before anything is sent",
        "The editor resolves my country before it is usable",
        "The editor gives me the form's schema and UI definition",
        "Typing a number parses it against my resolved country",
        "The editor reports its progress as I work"
      ],
      scenario => {
        it(`${scenario} — ${BG_OPEN}`, () =>
          recordStep(scenario, BG_OPEN, readList));
        it(`${scenario} — ${OPEN_EDITOR}`, () =>
          recordStep(scenario, OPEN_EDITOR, openOne));
      }
    );

    describe("Save a change to a phone number from the editor", () => {
      const scenario = "Save a change to a phone number from the editor";
      it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
      it(OPEN_EDITOR, () => recordStep(scenario, OPEN_EDITOR, openOne));
      it("I change the number in the editor and save", () =>
        recordStep(
          scenario,
          "I change the number in the editor and save",
          async generator => {
            // A fresh throwaway number, not one the account already holds (that
            // would 422 "already exists") — and still `770*` so the heal cleans
            // it. The step reads it back from this recording, never a literal.
            await generator.put(
              `${phones()}/${editorId}`,
              phonePayload(uniquePhone(62))
            );
            await readList(generator);
            await openOne(generator);
          }
        ));
    });

    describe("Save a brand-new phone number from the editor", () => {
      const scenario = "Save a brand-new phone number from the editor";
      // A fresh editor makes no per-record read; only the create POST is on the
      // wire. The created number is a fresh `770*` throwaway the heal cleans.
      it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
      it("I enter a new number in the editor and save", () =>
        recordStep(
          scenario,
          "I enter a new number in the editor and save",
          generator => generator.post(phones(), phonePayload(uniquePhone(63)))
        ));
    });

    // AC-24 — the collection AND the editor together: the editor saves a real
    // change and the collection re-reads it. The list re-read carries the saved
    // number because staging really applied the PUT; the heal cleans the `770*`.
    describe("Saving in the editor updates my list", () => {
      const scenario = "Saving in the editor updates my list";
      let listEditorId: string;
      const openListEditor = (generator: Generator) =>
        generator.get(`${phones()}/${listEditorId}`);

      beforeAll(async () => {
        listEditorId = await arrangePhone(70);
      });
      afterAll(restoreStaging);

      it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
      it("my phone numbers are open in one place and the editor in another", () =>
        recordStep(
          scenario,
          "my phone numbers are open in one place and the editor in another",
          openListEditor
        ));
      it("I save a change in the editor", () =>
        recordStep(
          scenario,
          "I save a change in the editor",
          async generator => {
            await generator.put(
              `${phones()}/${listEditorId}`,
              phonePayload(uniquePhone(71))
            );
            await readList(generator);
            await openListEditor(generator);
          }
        ));
    });
  });

  // AC-3 / AC-4 — the list read is issued for real, its response forced to a
  // 500, so the collection settles errored on a genuine request.
  describe("When my phone list cannot be read, I am told it failed", () => {
    const scenario = "When my phone list cannot be read, I am told it failed";
    it(BG_OPEN, () =>
      recordStep(scenario, BG_OPEN, generator =>
        generator.get(
          `${phones()}${LIST}`,
          undefined,
          ForcedErrorCode.Internal_Server_Error
        )
      )
    );
  });

  // AC-9 — a real DELETE against an arranged phone, its response forced to a
  // 500, so the collection lands the failure. The real request DOES remove the
  // phone on staging; the heal cleans the `770*` throwaway after.
  describe("A failed delete shows up in the collection error state", () => {
    const scenario = "A failed delete shows up in the collection error state";
    let faultId: string;
    beforeAll(async () => {
      faultId = await arrangePhone(80);
    });
    afterAll(restoreStaging);

    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it("I delete a phone and the server refuses", () =>
      recordStep(
        scenario,
        "I delete a phone and the server refuses",
        generator =>
          generator.delete(
            `${phones()}/${faultId}`,
            undefined,
            ForcedErrorCode.Internal_Server_Error
          )
      ));
  });

  // AC-20 — debounced input: open, type several values, then save. Only the
  // settled value is parsed and saved; the PUT re-read carries it.
  describe("I enter a number and it is checked once I stop, not on every keystroke", () => {
    const scenario =
      "I enter a number and it is checked once I stop, not on every keystroke";
    let ac20Id: string;
    const openAc20 = (generator: Generator) =>
      generator.get(`${phones()}/${ac20Id}`);
    beforeAll(async () => {
      ac20Id = await arrangePhone(90);
    });
    afterAll(restoreStaging);

    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it("I am typing a phone number into the editor", () =>
      recordStep(
        scenario,
        "I am typing a phone number into the editor",
        openAc20
      ));
    it("saving right after typing uses what I actually typed, never a stale value", () =>
      recordStep(
        scenario,
        "saving right after typing uses what I actually typed, never a stale value",
        async generator => {
          await generator.put(
            `${phones()}/${ac20Id}`,
            phonePayload(uniquePhone(91))
          );
          await readList(generator);
          await openAc20(generator);
        }
      ));
  });

  // AC-23 — save straight after typing: the flush settles the typed value into
  // the model before the save, so the PUT carries the just-typed number.
  describe("Save a change to an existing phone number without losing what I just typed", () => {
    const scenario =
      "Save a change to an existing phone number without losing what I just typed";
    let ac23Id: string;
    const openAc23 = (generator: Generator) =>
      generator.get(`${phones()}/${ac23Id}`);
    beforeAll(async () => {
      ac23Id = await arrangePhone(93);
    });
    afterAll(restoreStaging);

    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
    it("I have opened one of my phone numbers in the editor", () =>
      recordStep(
        scenario,
        "I have opened one of my phone numbers in the editor",
        openAc23
      ));
    it("I change it and save straight away, before any pause in my typing", () =>
      recordStep(
        scenario,
        "I change it and save straight away, before any pause in my typing",
        async generator => {
          await generator.put(
            `${phones()}/${ac23Id}`,
            phonePayload(uniquePhone(94))
          );
          await readList(generator);
          await openAc23(generator);
        }
      ));
  });

  // AC-27 — a fresh draft cleared back to empty: no per-record read, only the
  // collection's Background list read.
  describe("Clear the form back to where it started", () => {
    const scenario = "Clear the form back to where it started";
    it(BG_OPEN, () => recordStep(scenario, BG_OPEN, readList));
  });
});
