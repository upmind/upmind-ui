// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications scenario fixtures generator (FE-3145, ADR 035)
 *
 * ## Job To Be Done
 * Record ONE per-step recording per DRIVEN `client-notifications.feature`
 * scenario against real staging, into `scenarios/<slug>/<NN>/`, so
 * `client-notifications.replay.int.test.ts` replays each scenario over its own
 * captured answers. Run on demand:
 *
 *   pnpm fixtures:generate client-notifications
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal suites by the `*.fixtures.ts`
 * suffix. It has no assertions: an `it()` succeeds when the capture completes.
 * `generator.save()` per step writes that step's captures once.
 *
 * ## What each step records
 * The whole-set read the collection AND the editor make is three GETs, all
 * `limit=0` (the whole grid, never a page):
 *   GET notifications/topics
 *   GET notifications/channels?filter[recipient_types.code]=client
 *   GET notifications/opt-outs
 * A collection scenario's Background boots only (no request); its first read
 * step carries the three GETs. An EDITOR scenario boots the aggregate manager on
 * its "open in the editor" step (the same three GETs) and, where it saves,
 * carries the full-set `PUT notifications/opt-outs` plus the post-save re-read on
 * its mutation step.
 *
 * ## Staging hygiene
 * Every editor mutation targets the account's own opt-out aggregate, and the run
 * PUTs the original opt-out set back after each mutation and verifies the account
 * ends exactly as found (`afterAll`). The emailed-link scenarios (AC-8/10/18)
 * mint a REAL link token in plain node — the labs recipe replicated as direct
 * HTTP (POST clients/password_reset → poll self/email_history → read the
 * unsubscribe_link token) — and record the token-carried reads/writes: a real
 * staging token and its real answers, never a fabricated provenance. That
 * recording run is auto-mode-classifier-refused ("Credential Exploration"); the
 * operator runs `pnpm fixtures:generate client-notifications`.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { ForcedErrorCode } from "@upmind-automation/test-fixtures/types";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintGuestToken
} from "../../auth/__tests__/auth.tokens";
import { every, filter, find, kebabCase, map, sortBy } from "lodash-es";
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
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (set it in " +
          ".env.recording). The API resolves the brand from the Origin header."
      );
    })();

const feature = readFileSync(
  join(import.meta.dirname, "client-notifications.feature"),
  "utf-8"
);

const CHANNELS_PATH =
  "/api/notifications/channels?filter[recipient_types.code]=client&limit=0";
const TOPICS_PATH = "/api/notifications/topics?limit=0";
const OPT_OUTS_PATH = "/api/notifications/opt-outs?limit=0";
const OPT_OUTS_WRITE_PATH = "/api/notifications/opt-outs";

type WireTopic = { id: string; can_opt_out: boolean };
type WireChannel = { id: string };
type OptOutRow = { topic_id: string; channel_id: string };

/**
 * Plain, UNCAPTURED call — for arrangement, restore and id lookup. An empty
 * `accessToken` omits the Authorization header: the password-reset trigger and
 * the `?token=` link reads are unauthenticated, exactly as the module issues them.
 */
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
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: body == null ? undefined : JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null)
  };
}

/** The two whole-set reads that carry no per-scenario identity (topics, channels). */
const READ_SCENARIOS: { scenario: string; readStep: string }[] = [
  {
    scenario: "See every topic, every channel, and the state of each pair",
    readStep: "I open my notification preferences"
  },
  {
    scenario: "See the whole grid, never a first page of it",
    readStep: "my whole notification grid is ready to read"
  },
  {
    scenario:
      "See my preferences settle, rather than wait on a check that never ends",
    readStep: "I wait for my notification preferences to be ready"
  },
  {
    scenario: "See which of my topics are locked",
    readStep: "one of my topics is locked and another is not"
  },
  {
    scenario:
      "Find no filter or sort on my grid, because all of it is always shown",
    readStep: "my notification preferences are ready to read"
  }
];

/** The step every editor scenario opens the aggregate manager on. */
const EDITOR_OPEN_STEP = "my preferences are open in the editor";

/** Every editor scenario — each opens the manager (the three GETs). */
const EDITOR_SCENARIOS = [
  "Turn one channel off for one topic and save",
  "My saved change survives the save settling",
  "Turn every channel back on for a topic at once",
  "Abandon my unsaved changes",
  "The editor refuses to opt out of an essential topic"
];

// -----------------------------------------------------------------------------

describe("Client-Notifications scenario recordings", () => {
  let clientToken: IToken;
  let topics: WireTopic[];
  let channels: WireChannel[];
  let originalOptOuts: OptOutRow[];

  // Once per scenario, before its first step records — `prepareScenarioDirs`
  // clears every step folder, so calling it per-step would wipe an earlier
  // step's recording (the open step, for a scenario that also mutates).
  const prepared = new Set<string>();
  function prepareOnce(scenario: string): void {
    if (prepared.has(scenario)) return;
    prepareScenarioDirs(import.meta.dirname, feature, scenario);
    prepared.add(scenario);
  }

  const toRow = (row: OptOutRow): OptOutRow => ({
    topic_id: row.topic_id,
    channel_id: row.channel_id
  });

  async function readOptOuts(): Promise<OptOutRow[]> {
    const { body } = await call("GET", OPT_OUTS_PATH, clientToken.access_token);
    return map((body as { data: OptOutRow[] }).data, toRow);
  }

  /** Staging back to exactly the opt-out set found at the start of the run. */
  async function restoreOptOuts(): Promise<void> {
    await call("PUT", OPT_OUTS_WRITE_PATH, clientToken.access_token, {
      opt_outs: originalOptOuts
    });
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();

    const topicsBody = await call("GET", TOPICS_PATH, clientToken.access_token);
    topics = (topicsBody.body as { data: WireTopic[] }).data;
    const channelsBody = await call(
      "GET",
      CHANNELS_PATH,
      clientToken.access_token
    );
    channels = (channelsBody.body as { data: WireChannel[] }).data;
    originalOptOuts = await readOptOuts();
  }, 30000);

  afterAll(async () => {
    await restoreOptOuts();
    const ended = await readOptOuts();
    expect(
      sortBy(ended, ["topic_id", "channel_id"]),
      "staging opt-outs did not end as found"
    ).toEqual(sortBy(originalOptOuts, ["topic_id", "channel_id"]));
  }, 30000);

  /** The three whole-set reads, into one step's own folder. */
  async function recordGridRead(scenario: string, step: string): Promise<void> {
    prepareOnce(scenario);
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
    await generator.get(TOPICS_PATH);
    await generator.get(CHANNELS_PATH);
    await generator.get(OPT_OUTS_PATH);
    generator.clearBearerToken();
    generator.save();
  }

  /**
   * The full-set PUT and the post-save re-read, into the mutation step's folder.
   * `restore` PUTs the original set back after the capture; a multi-save sequence
   * (AC-3 second save) leaves it OFF on the intermediate save so the next save's
   * re-read reflects the set the prior save left, then restores once at the end.
   */
  async function recordMutation(
    scenario: string,
    step: string,
    nextOptOuts: OptOutRow[],
    restore = true
  ): Promise<void> {
    prepareOnce(scenario);
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
    await generator.put(OPT_OUTS_WRITE_PATH, { opt_outs: nextOptOuts });
    await generator.get(OPT_OUTS_PATH);
    generator.clearBearerToken();
    generator.save();
    if (restore) await restoreOptOuts();
  }

  /**
   * A save the server rejects — AC-7. The REAL PUT is sent (so it must be
   * restored), but a forced status overrides only the recorded response: a
   * control response, exempt from the recorded-only law (code-tests.companion.md).
   */
  async function recordForcedSaveFailure(
    scenario: string,
    step: string,
    forcedStatus: ForcedErrorCode
  ): Promise<void> {
    prepareOnce(scenario);
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
    await generator.put(
      OPT_OUTS_WRITE_PATH,
      { opt_outs: [...originalOptOuts, offPair()] },
      undefined,
      forcedStatus
    );
    generator.clearBearerToken();
    generator.save();
    await restoreOptOuts();
  }

  // --- collection reads ------------------------------------------------------

  for (const { scenario, readStep } of READ_SCENARIOS) {
    it(
      `${scenario} — ${readStep}`,
      () => recordGridRead(scenario, readStep),
      30000
    );
  }

  // --- editor: open the aggregate manager (the three GETs) --------------------

  for (const scenario of EDITOR_SCENARIOS) {
    it(
      `${scenario} — ${EDITOR_OPEN_STEP}`,
      () => recordGridRead(scenario, EDITOR_OPEN_STEP),
      30000
    );
  }

  // --- editor: the mutating save steps ---------------------------------------

  /** An unlocked topic with no opt-out on the target channel — a pair to turn OFF. */
  const offPair = (): OptOutRow => {
    const channelId = channels[0].id;
    const topic = find(
      topics,
      t =>
        t.can_opt_out &&
        !find(
          originalOptOuts,
          r => r.topic_id === t.id && r.channel_id === channelId
        )
    );
    if (!topic)
      throw new Error(
        "No unlocked topic with an enabled first channel to turn off."
      );
    return { topic_id: topic.id, channel_id: channelId };
  };

  /** A SECOND unlocked, first-channel-on pair distinct from `offPair` — AC-3's second save. */
  const secondOffPair = (): OptOutRow => {
    const channelId = channels[0].id;
    const firstId = offPair().topic_id;
    const topic = find(
      topics,
      t =>
        t.can_opt_out &&
        t.id !== firstId &&
        !find(
          originalOptOuts,
          r => r.topic_id === t.id && r.channel_id === channelId
        )
    );
    if (!topic)
      throw new Error(
        "No second unlocked topic with an enabled first channel for AC-3's second save."
      );
    return { topic_id: topic.id, channel_id: channelId };
  };

  /** A topic whose EVERY channel is already opted out — the fully-off topic to turn back ON. */
  const fullyOffTopicId = (): string => {
    const topic = find(topics, t =>
      every(channels, c =>
        find(originalOptOuts, r => r.topic_id === t.id && r.channel_id === c.id)
      )
    );
    if (!topic)
      throw new Error(
        "No topic is fully opted out — nothing to turn back on for AC-4."
      );
    return topic.id;
  };

  it(
    "Turn one channel off for one topic and save — I turn one channel off for an unlocked topic and save",
    () =>
      recordMutation(
        "Turn one channel off for one topic and save",
        "I turn one channel off for an unlocked topic and save",
        [...originalOptOuts, offPair()]
      ),
    30000
  );

  it(
    "My saved change survives the save settling — I turn one channel off for an unlocked topic, save, and let it settle",
    () =>
      recordMutation(
        "My saved change survives the save settling",
        "I turn one channel off for an unlocked topic, save, and let it settle",
        [...originalOptOuts, offPair()]
      ),
    30000
  );

  it(
    "Turn every channel back on for a topic at once — I turn every channel back on for a topic that was fully off and save",
    () =>
      recordMutation(
        "Turn every channel back on for a topic at once",
        "I turn every channel back on for a topic that was fully off and save",
        filter(originalOptOuts, r => r.topic_id !== fullyOffTopicId())
      ),
    30000
  );

  // --- AC-7: a save the server rejects (open, then the forced-fault PUT) ------

  const AC7 = "Be told when my save fails, and keep the work to retry";

  it(
    `${AC7} — my preferences are open in the editor`,
    () => recordGridRead(AC7, "my preferences are open in the editor"),
    30000
  );

  it(
    `${AC7} — my save of the aggregate is rejected by the server`,
    () =>
      recordForcedSaveFailure(
        AC7,
        "my save of the aggregate is rejected by the server",
        ForcedErrorCode.Internal_Server_Error
      ),
    30000
  );

  // --- AC-3: a second save carries the whole current set ----------------------
  // Recorded in order: open (S0), save#1 (-> S1, kept), save#2 (-> S2, restored).

  const AC3_SECOND =
    "A second save always carries my whole current set, never an empty one";

  it(
    `${AC3_SECOND} — my preferences are open in the editor`,
    () => recordGridRead(AC3_SECOND, "my preferences are open in the editor"),
    30000
  );

  it(
    `${AC3_SECOND} — I have turned one channel off for an unlocked topic and saved`,
    () =>
      recordMutation(
        AC3_SECOND,
        "I have turned one channel off for an unlocked topic and saved",
        [...originalOptOuts, offPair()],
        false
      ),
    30000
  );

  it(
    `${AC3_SECOND} — I turn a different channel off for another unlocked topic and save again`,
    () =>
      recordMutation(
        AC3_SECOND,
        "I turn a different channel off for another unlocked topic and save again",
        [...originalOptOuts, offPair(), secondOffPair()],
        true
      ),
    30000
  );

  // --- AC-16: opened signed-out, the grid reads fire once the session resolves.
  // The recording is the three bearer whole-set reads on that step; the
  // signed-out-first boot and the mid-scenario session top-up are replay-time
  // concerns (client-notifications.replay.int.test.ts), not recorded values.
  const AC16 =
    "Open my preferences before I am signed in, and edit them once I am";

  it(
    `${AC16} — my session later resolves my identity`,
    () => recordGridRead(AC16, "my session later resolves my identity"),
    30000
  );

  // The module's flat one-off captures of the three whole-set reads, co-located
  // in `fixtures/` — the canonical single-request recordings a pure unit test or
  // a labs forced state reads, and the provenance the replay harness is graded
  // against (`no-hand-rolled-int-fixture`).
  it("captures the three whole-set reads as flat one-off fixtures", async () => {
    const generator = new Generator(API_URL, {
      recordingsDir: join(import.meta.dirname, "fixtures"),
      origin: ORIGIN,
      source: "case",
      name: "client-notifications"
    });
    generator.setBearerToken(clientToken.access_token);
    await generator.get(TOPICS_PATH);
    await generator.get(CHANNELS_PATH);
    await generator.get(OPT_OUTS_PATH);
    generator.clearBearerToken();
    generator.save();
  }, 30000);
});

// -----------------------------------------------------------------------------
// AC-8 / AC-10 / AC-18 — the emailed preferences link (FE-3145, ADR 035). Only
// the account-specific reads carry the link token: the module tokenises the
// opt-outs READ and the opt-outs WRITE (`?token=`, no bearer —
// client-notifications.services.ts:150-199,226-247), while topics and channels
// are brand-global and go out in their NORMAL shape on whatever session is active
// (the GUEST session when signed out). So the recorder records topics/channels
// untokenised under a guest token, and opt-outs tokenised with no bearer. This
// recorder runs in PLAIN NODE — no app composables — replicating the labs recipe
// (usePreferencesLink.ts): sign in with mintClientToken(), POST the password reset
// (sends the preferences email), poll the client's email history, read the footer
// token from the email's `unsubscribe_link`. Nothing is hand-authored.
// -----------------------------------------------------------------------------

const EMAIL_HISTORY_PATH =
  "/api/self/email_history?with=recipient,recipient_type,recipient.image&order=-created_at&limit=10";
const PASSWORD_RESET_PATH = "/api/clients/password_reset";

async function readRecentEmailIds(accessToken: string): Promise<string[]> {
  const { body } = await call("GET", EMAIL_HISTORY_PATH, accessToken);
  return map((body as { data?: { id: string }[] }).data ?? [], "id");
}

/** Read the `?token=` a preferences email carries in its `unsubscribe_link`. */
async function readEmailLinkToken(
  accessToken: string,
  emailId: string
): Promise<string | undefined> {
  const { body } = await call(
    "GET",
    `/api/emails/${emailId}?with=data`,
    accessToken
  );
  const link = (body as { data?: { data?: { unsubscribe_link?: string } } })
    .data?.data?.unsubscribe_link;
  if (!link) return undefined;
  return (
    new URLSearchParams(link.split("?")[1] ?? "").get("token") ?? undefined
  );
}

describe("Client-Notifications emailed-link scenarios", () => {
  let clientToken: IToken;
  let guestToken: IToken | undefined;
  let linkToken: string;
  let originalOptOuts: { topic_id: string; channel_id: string }[] = [];
  const prepared = new Set<string>();

  function prepareOnce(scenario: string): void {
    if (prepared.has(scenario)) return;
    prepareScenarioDirs(import.meta.dirname, feature, scenario);
    prepared.add(scenario);
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();
    guestToken = await mintGuestToken();
    const self = await call(
      "GET",
      "/api/self?with=actor",
      clientToken.access_token
    );
    const selfData = (self.body as { data?: Record<string, unknown> }).data;
    const username = (selfData?.actor as { email?: string })?.email as
      | string
      | undefined;
    if (!username)
      throw new Error("Could not resolve the client email from /self.");

    const seen = new Set<string>(
      await readRecentEmailIds(clientToken.access_token)
    );

    const reset = await call("POST", PASSWORD_RESET_PATH, "", { username });
    if (reset.status >= 400)
      throw new Error(
        `The password-reset request failed (${reset.status}) — no preferences email sent.`
      );

    let emailId: string | undefined;
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const ids = await readRecentEmailIds(clientToken.access_token);
      const fresh = find(ids, id => !seen.has(id));
      if (fresh) {
        emailId = fresh;
        break;
      }
    }
    if (!emailId)
      throw new Error(
        "No preferences email arrived within 60s to read a token from."
      );

    const token = await readEmailLinkToken(clientToken.access_token, emailId);
    if (!token) throw new Error("The email carried no preferences-link token.");
    linkToken = token;

    const optOuts = await call(
      "GET",
      `${OPT_OUTS_PATH}&token=${linkToken}`,
      ""
    );
    originalOptOuts = map(
      (optOuts.body as { data?: { topic_id: string; channel_id: string }[] })
        .data ?? [],
      row => ({ topic_id: row.topic_id, channel_id: row.channel_id })
    );
  }, 120_000);

  async function recordTokenStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    prepareOnce(scenario);
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
    await requests(generator);
    generator.save();
  }

  /**
   * The grid reads a link boot makes: topics and channels UNTOKENISED on the
   * active (guest) session, then the opt-outs read TOKENISED with no bearer.
   * Sequential because the bearer is set for the brand-global reads and cleared
   * for the token-addressed one.
   */
  async function gridReads(generator: Generator): Promise<void> {
    if (guestToken?.access_token)
      generator.setBearerToken(guestToken.access_token);
    await generator.get(TOPICS_PATH);
    await generator.get(CHANNELS_PATH);
    generator.clearBearerToken();
    await generator.get(`${OPT_OUTS_PATH}&token=${linkToken}`);
  }

  // --- AC-10: read the grid via the link ------------------------------------

  it(
    "See the topics and channels on offer when following an emailed link — I open my preferences from that link to read the grid",
    () =>
      recordTokenStep(
        "See the topics and channels on offer when following an emailed link",
        "I open my preferences from that link to read the grid",
        gridReads
      ),
    30000
  );

  // --- AC-18: the link is never exposed — boot reads only --------------------

  it(
    "My emailed link is never exposed anywhere else on the page — anything else on the page reads what this module publishes about me",
    () =>
      recordTokenStep(
        "My emailed link is never exposed anywhere else on the page",
        "anything else on the page reads what this module publishes about me",
        gridReads
      ),
    30000
  );

  // --- AC-8: read then save via the link ------------------------------------

  it(
    "Manage my preferences from an emailed link without signing in — I open my preferences from that link and save a change",
    () =>
      recordTokenStep(
        "Manage my preferences from an emailed link without signing in",
        "I open my preferences from that link and save a change",
        async generator => {
          await gridReads(generator);
          await generator.put(`${OPT_OUTS_WRITE_PATH}?token=${linkToken}`, {
            opt_outs: originalOptOuts
          });
          await generator.get(`${OPT_OUTS_PATH}&token=${linkToken}`);
        }
      ),
    30000
  );
});
