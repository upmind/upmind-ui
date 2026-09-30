// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Email-History API Fixtures Generator (ADR 025 §A1.3, NFR-2)
 *
 * ## Job To Be Done
 * Capture the real `self/email_history` and `emails/{id}` endpoints this
 * module's ONE in-scope cell (client × self) reads, and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir —
 * the same files the integration tests replay through MSW. Run on demand:
 *
 *   pnpm fixtures:generate client-email-history
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from `*.test.ts` / `*.int.test.ts` by the
 * `*.fixtures.ts` suffix. No assertions beyond "the capture recorded what the
 * case exists to record"; `save()` in `afterAll` writes every capture once —
 * which is why a case that did NOT record its subject must drop its own
 * buffered capture before it throws (`dropCapture` below).
 *
 * ## The real wire shape (query-platform revert, 2026-08-07)
 * `useQuery().request()` never sends `sort=` — it maps a composable's `sort`
 * ref to **`order=`** (`useQuery.ts` request(), e.g. `order=-created_at`).
 * The module's `loadList` no longer sets `withSplitCount` — that platform
 * option, `skip_count=1` on the wire, and the separate `?limit=count`
 * side-channel request are ALL gone. `total` now arrives inline on the SAME
 * main list response every other field does — there is exactly ONE request
 * per list read, never two.
 *
 * `case=<label>` is added to several list captures purely to keep their
 * fixture filenames/identity distinct — `order`, `limit` and `offset` are all
 * excluded from a fixture's identity (`fixture-naming.mjs` `EXCLUDE_PARAMS`,
 * because they never change WHICH response comes back over the wire), so two
 * captures that differ ONLY in sort or offset need a `case` label to avoid
 * colliding on one fixture file — the SAME device the page-1/page-2 walk
 * already used. `case` is never sent by production code; it exists solely so
 * this capture step writes one file per distinct response.
 *
 * ## Read-only module — no seeded state
 * Unlike `client-email` (which creates/edits/deletes throwaway addresses so
 * every case is deterministic), this module has NO mutation surface (NFR-1:
 * `client-email-history.services.ts`'s `// MUTATIONS` section is empty). Every
 * capture below reads whatever the staging client's REAL, pre-existing history
 * contains — nothing here is seeded or shaped.
 *
 * ## The errored read is CAPTURED, never authored
 * AC-4 and AC-15 declare the errored state, and AC-18 names the exact condition
 * under which it occurs: "any forced read is refused as not-authenticated".
 * That refusal is a REAL server decision, not a shaped one — `self/email_history`
 * resolves the caller purely from the bearer, so an unusable bearer leaves no
 * `self` to read and the API refuses at the OAuth layer, before routing.
 * `?case=refused` below records whatever staging actually answers. If staging
 * answers < 400 the case drops its own capture and fails the run: a success
 * filed under a refusal's name is fabricated evidence, not a fixture. Nothing
 * here hand-writes a status or an error body.
 *
 * ## An auth refusal is not a failed read (FE-3113 §S2/§T2)
 * AC-18's 401 above answers ONE state — "refreshing without a signed-in client
 * is refused". AC-4's errored collection is a DIFFERENT state, and replaying the
 * 401 for it signs the reader out, because the app's auth layer cannot tell a
 * replayed 401 from an expired session. So this module records a second, non-auth
 * read failure: `?case=unreadable` reads the same subject endpoint with a VALID
 * bearer and a column the API cannot order by. The case drops its own capture and
 * fails the run when the answer is < 400 or is itself an auth refusal, so the two
 * states can never collapse back onto one recording.
 *
 * ## Capture-limitation disclosure (required by NFR-2 / the 2026-08-05 receipt)
 * The staging client (`API_CREDENTIALS.client`) has a real history of ~2885
 * emails at capture time, and the overwhelming majority carry an `error_id`.
 * Two whole-history filters — not page samples — measure what it does NOT
 * hold: `filter[bounced]=true` returns `total: 0`, and `filter[error_id]=null`
 * returns `total: 1`, that single row already `sent: true`. Three AC-3 cases
 * are therefore **NOT captured here, on purpose, rather than hand-authored**:
 *
 *   1. A BOUNCED row (`bounced: true`) — none exists anywhere in this
 *      account's history.
 *   2. The bounced+error precedence row (`bounced: true` AND `error_id` set)
 *      — depends on (1).
 *   3. A SENDING row (neither `sent`, `bounced` nor errored) — an earlier
 *      capture held a handful; this account's in-flight emails have since
 *      sent, and the whole-history `filter[error_id]=null` read above is the
 *      recorded proof that none remains.
 *
 * All three are pure-mapper branches, proven at the unit layer from a REAL
 * recorded row with exactly ONE field toggled and the toggle named in the test
 * — `client-email-history.mappers.test.ts`. None is replayed through the wire,
 * because replaying one would mean inventing the body `no-hand-rolled-int-fixture`
 * exists to catch.
 *
 * A separate staff credential check (`API_CREDENTIALS.staff`) to source a
 * bounced row from a different real account failed with a real 401 (staging
 * credential mismatch) — recorded, not worked around. This is a halted
 * sub-case, escalated in the prover's hand-off, never papered over with an
 * authored `bounced: true` row.
 *
 * The single-read endpoint's full body lives at the row's NESTED `data.body`
 * (the `with=data` relation) — every real row checked (36+, across every
 * subject category present) carried a POPULATED nested `data.body`; none with
 * an empty one turned up. `get-emails-id` below is therefore a genuine "body
 * present" capture; a real "no body" capture is the disclosed gap.
 *
 * ## Captures
 * `get-self-email-history?case=default` (default list, REAL `total` inline —
 * AC-1/AC-2, and must exceed one page for AC-9's walk) ·
 * `get-self-email-history?case=page-1` / `case=page-2` (real 2-page walk,
 * AC-9) · `get-self-email-history?filter[bounced]=true` (real EMPTY result,
 * genuine `total:0` inline — AC-4/AC-8) ·
 * `get-self-email-history?case=refused` (the REAL not-authenticated refusal —
 * AC-18's guard, and that state alone) ·
 * `get-self-email-history?case=unreadable` (the REAL non-auth read failure —
 * AC-4's errored collection) ·
 * `get-self-email-history?filter[error_id|neq]=null` (ERROR rows, AC-3) ·
 * `get-self-email-history?filter[sent]=true` (the one real SENT row, AC-3) ·
 * `get-self-email-history?filter[error_id]=null` (every error-free row this
 * account holds, and the recorded proof none is still in flight — AC-3) ·
 * `get-self-email-history?case=subject-sort` (real subject sort,
 * AC-6) · `get-self-email-history?query=invoice` (AC-7) ·
 * `get-self-email-history?query=invoice&subject=Invoice` (AC-7) ·
 * `get-emails-id` (single read, real populated body, AC-13).
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
const WITH_PARAM = "with=recipient,recipient_type,recipient.image";

// -----------------------------------------------------------------------------

/**
 * Drop every buffered capture whose recorded path carries the given fragment.
 * `save()` in `afterAll` writes the whole buffer whatever each case did, so a
 * case that did not record its subject must remove its own capture before it
 * throws — otherwise a run that failed still ships the file it failed over.
 * The fragment is the path itself, so a case with no `case=` label of its own
 * identifies its capture the same way one with a label does.
 */
function dropCapture(generator: Generator, fragment: string): void {
  const captures = generator.getCapturedFixtures();
  for (const [key, { fixture }] of captures) {
    if (fixture.request.path.includes(fragment)) captures.delete(key);
  }
}

// -----------------------------------------------------------------------------

describe("Client-Email-History API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let sentEmailId: string | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-email-history"
    });

    const token = await mintClientToken();
    clientToken = token;
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET self/email_history (default list, REAL total inline — AC-1/AC-2/AC-9)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&order=-created_at&limit=10&case=default`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `List capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
    const total = (body as { total?: number | null })?.total ?? 0;
    if (total <= 10) {
      throw new Error(
        `The default list capture reports total ${total}; AC-9 needs more ` +
          "than one page of REAL history to walk."
      );
    }
  });

  it("captures GET self/email_history page 1/2 of the REAL history (AC-9)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const pageOne = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&order=-created_at&limit=10&offset=0&case=page-1`
    );
    const pageTwo = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&order=-created_at&limit=10&offset=10&case=page-2`
    );
    generator.clearBearerToken();
    if (pageOne.status !== 200 || pageTwo.status !== 200) {
      throw new Error(
        `Paged capture returned ${pageOne.status}/${pageTwo.status} — ` +
          "refusing to ship a fixture that does not represent a real page."
      );
    }
  });

  it("captures GET self/email_history filter[bounced]=true — the REAL empty case, total:0 inline (AC-4/AC-8)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&filter[bounced]=true&limit=10`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Empty-case capture returned ${status}.`);
    }
    const total = (body as { total?: number })?.total;
    if (total !== 0) {
      throw new Error(
        `Expected the REAL bounced-filter total to be 0 for this staging ` +
          `client (documented capture-limitation basis) but got ${total} — ` +
          "the disclosed gap above needs re-checking, not silent replacement."
      );
    }
  });

  it("captures GET self/email_history ?case=refused — the REAL not-authenticated refusal (AC-4/AC-18)", async () => {
    generator.setBearerToken("fixturegen-invalid-token");
    const { status } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&order=-created_at&limit=10&case=refused`
    );
    generator.clearBearerToken();
    if (status < 400) {
      dropCapture(generator, "case=refused");
      throw new Error(
        `An unusable bearer read of self/email_history returned ${status}, ` +
          "which is not a refusal — AC-4's errored state has no recorded " +
          "refusal to replay, and this capture was DROPPED rather than " +
          "shipped under a refusal's name. Re-check what staging does with " +
          "an unusable bearer; never author the refusal by hand."
      );
    }
  });

  it("captures GET self/email_history ?case=unreadable — the REAL non-auth read failure (AC-4)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&order=-fixturegen_no_such_column&limit=10&case=unreadable`
    );
    generator.clearBearerToken();
    if (status < 400 || status === 401 || status === 403) {
      dropCapture(generator, "case=unreadable");
      throw new Error(
        `A signed-in read of self/email_history ordered by a column the API ` +
          `does not have returned ${status} — that is not a non-auth read ` +
          "failure, so AC-4's errored collection has nothing of its own to " +
          "replay and this capture was DROPPED rather than shipped under one's " +
          "name. Re-check what staging rejects for a signed-in caller; never " +
          "reuse AC-18's 401, which signs the reader out."
      );
    }
  });

  it("captures GET self/email_history filter[error_id|neq]=null — REAL error rows (AC-3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&filter[error_id|neq]=null&limit=3`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Error-status capture returned ${status}.`);
    }
  });

  it("captures GET self/email_history filter[sent]=true — the ONE REAL sent row (AC-3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&filter[sent]=true&limit=1`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Sent-status capture returned ${status}.`);
    }
    const rows = (body as { data?: Array<{ id?: string }> })?.data ?? [];
    sentEmailId = rows[0]?.id;
  });

  it("captures GET self/email_history filter[error_id]=null — every REAL error-free row, including the in-flight SENDING one (AC-3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&filter[error_id]=null&limit=10`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      dropCapture(generator, "filter[error_id]=null");
      throw new Error(
        `Error-free capture returned ${status}, which is not a readable ` +
          "collection — DROPPED rather than shipped under one's name."
      );
    }
    const rows =
      (body as { data?: Array<{ sent?: boolean; bounced?: boolean }> })?.data ??
      [];
    if (!rows.length) {
      dropCapture(generator, "filter[error_id]=null");
      throw new Error(
        "The error-free capture recorded no rows at all, so it evidences " +
          "neither the SENT row AC-3 replays nor the absence of a SENDING " +
          "one — its subject is missing, and the capture was DROPPED rather " +
          "than shipped as an AC-3 fixture."
      );
    }
    // AC-3's SENDING branch is now REAL wire evidence, not a stand-in. This
    // client carries a stuck in-flight row (neither sent nor bounced), stable
    // across runs, so the recorded page carries the SENDING case itself. The
    // guard is inverted from its original form: it used to prove the row was
    // ABSENT and justify a unit-layer toggle standing in for it. If the row
    // ever clears, this fails loudly rather than quietly reverting to a fake.
    const inFlight = rows.filter(row => !row.sent && !row.bounced);
    if (!inFlight.length) {
      throw new Error(
        "The error-free capture recorded no in-flight row, so AC-3's SENDING " +
          "branch has NO real response to replay. The stuck row this fixture " +
          "relies on has cleared — re-check whether SENDING is still " +
          "capturable before falling back to an edited row."
      );
    }
  });

  it("captures GET self/email_history order=-subject — REAL subject sort (AC-6)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&order=-subject&limit=10&case=subject-sort`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Subject-sort capture returned ${status}.`);
    }
  });

  it("captures GET self/email_history query=invoice — REAL free-text search (AC-7)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&query=invoice&limit=10`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Free-text search capture returned ${status}.`);
    }
  });

  it("captures GET self/email_history query=invoice&subject=Invoice — REAL combined search (AC-7)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/self/email_history?${WITH_PARAM}&query=invoice&subject=Invoice&limit=10`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Combined search capture returned ${status}.`);
    }
  });

  it("captures GET emails/{id} — a REAL single read (AC-13, real populated body)", async () => {
    if (!sentEmailId) {
      throw new Error(
        "No sent-email id resolved from the filter[sent]=true capture — " +
          "cannot capture the single-read fixture."
      );
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/emails/${sentEmailId}?with=data`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Single-read capture returned ${status}.`);
    }
  });
});

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145, ADR 035) — one recording per driveable
// `client-email-history.feature` scenario, one fixtures folder per step, named
// from the feature by `recordedStepDir`. Each scenario records the requests its
// steps make, in step order. This is a read-only module (no mutations,
// parity M6), so no scenario arranges or restores staging — every step reads the
// staging client's real, pre-existing history.
// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-email-history.feature"),
  "utf-8"
);

/** The Background step every scenario opens with — it boots the collection read. */
const OPEN = "I am an authenticated client reading my own account";

/** The collection's boot list read — default order, one page. */
const LIST = `/api/self/email_history?${WITH_PARAM}&order=-created_at&limit=10`;

describe("Client-Email-History scenario recordings", () => {
  let clientToken: IToken;
  let singleEmailId: string;
  const prepared = new Set<string>();

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

  /** The collection read the Background and the refresh step both make. */
  const readList = (generator: Generator) => generator.get(LIST);

  beforeAll(async () => {
    clientToken = await mintClientToken();
    // The single read fetches ONE real email by id; take the newest row of the
    // real history so `emails/{id}` returns a genuine record.
    const response = await fetch(
      `${API_URL}/api/self/email_history?order=-created_at&limit=1`,
      {
        headers: {
          Accept: "application/json",
          Origin: ORIGIN,
          Authorization: `Bearer ${clientToken.access_token}`
        }
      }
    );
    const body = (await response.json()) as { data: { id: string }[] };
    singleEmailId = body.data[0].id;
  }, 30000);

  /** The single read the single-email steps make — one email by id, with body. */
  const readOne = (generator: Generator) =>
    generator.get(`/api/emails/${singleEmailId}?with=data`);

  // --- scenarios whose only wire request is the Background list read --------

  forEach(
    ["See my own email history", "Discarding a history collection releases it"],
    scenario => {
      it(`${scenario} — ${OPEN}`, () => recordStep(scenario, OPEN, readList));
    }
  );

  describe("Sort my history by subject", () => {
    const scenario = "Sort my history by subject";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it("I sort my history by subject", () =>
      recordStep(scenario, "I sort my history by subject", generator =>
        generator.get(
          `/api/self/email_history?${WITH_PARAM}&order=-subject&limit=10`
        )
      ));
  });

  describe("Search my history", () => {
    const scenario = "Search my history";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it("I search my history for a word", () =>
      recordStep(scenario, "I search my history for a word", generator =>
        generator.get(
          `/api/self/email_history?${WITH_PARAM}&filter[subject|like]=${encodeURIComponent(
            "%invoice%"
          )}&limit=10`
        )
      ));
  });

  describe("Narrow my history to what happened to each email", () => {
    const scenario = "Narrow my history to what happened to each email";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it("I narrow my history to the emails that were sent", () =>
      recordStep(
        scenario,
        "I narrow my history to the emails that were sent",
        generator =>
          generator.get(
            `/api/self/email_history?${WITH_PARAM}&filter[sent|eq]=1&limit=10`
          )
      ));
  });

  describe("Page through my history", () => {
    const scenario = "Page through my history";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it("I go to the next page of my history", () =>
      recordStep(scenario, "I go to the next page of my history", generator =>
        generator.get(
          `/api/self/email_history?${WITH_PARAM}&order=-created_at&limit=10&offset=10`
        )
      ));
    it("I come back to the previous page", () =>
      recordStep(scenario, "I come back to the previous page", generator =>
        generator.get(
          `/api/self/email_history?${WITH_PARAM}&order=-created_at&limit=10&offset=0`
        )
      ));
  });

  describe("Refresh my history", () => {
    const scenario = "Refresh my history";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it("I refresh my history", () =>
      recordStep(scenario, "I refresh my history", readList));
  });

  // --- single received email scenarios (useClientReceivedEmail) -------------

  describe("See that email's details and whether it reached me", () => {
    const scenario = "See that email's details and whether it reached me";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it("I open one of my emails", () =>
      recordStep(scenario, "I open one of my emails", readOne));
  });

  describe("Know whether that email is loading, empty, or errored, and wait for it", () => {
    const scenario =
      "Know whether that email is loading, empty, or errored, and wait for it";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it("I open one of my emails", () =>
      recordStep(scenario, "I open one of my emails", readOne));
  });

  describe("Refresh one email, and release it when done", () => {
    const scenario = "Refresh one email, and release it when done";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it("I have opened one of my emails", () =>
      recordStep(scenario, "I have opened one of my emails", readOne));
    it("I refresh that email", () =>
      recordStep(scenario, "I refresh that email", readOne));
  });

  // --- the errored collection (AC-4, AC-21) ---------------------------------
  // The boot list read is issued for real, its response forced to a 500, so the
  // collection settles errored on a genuine request the recording overrides. A
  // control response, exempt from the recorded-only law (code-tests.companion.md).

  const readListForced = (generator: Generator): Promise<unknown> =>
    generator.get(LIST, undefined, ForcedErrorCode.Internal_Server_Error);

  describe("Know when my email history has errored", () => {
    const scenario = "Know when my email history has errored";
    it(OPEN, () => recordStep(scenario, OPEN, readListForced));
  });

  describe("A problem with my history is shown to me where I read it, not thrown", () => {
    const scenario =
      "A problem with my history is shown to me where I read it, not thrown";
    it(OPEN, () => recordStep(scenario, OPEN, readListForced));
  });
});
