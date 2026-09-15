// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Notifications API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the real `notifications/topics`, `notifications/channels` and
 * `notifications/opt-outs` endpoints for this module's ONE recordable cell
 * (`client x self` — ADR-001) into this module's OWN co-located `fixtures/`
 * dir, replayed by the integration suite through MSW. Run on demand:
 *
 *   pnpm fixtures:generate client-notifications
 *
 * `guest x self` ships NO capture here (operator ruling C, `design.md`
 * §Ruling C / `parity.yaml` `guest x self`.`declared_limit`) — no recorded
 * oracle exists for the emailed link token and nothing in this repo can mint
 * one. That cell is proven request-side against a stub in the integration
 * suite, never against a hand-authored guest response fixture.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from `*.test.ts` / `*.int.test.ts` by the
 * `*.fixtures.ts` suffix. `save()` in `afterAll` writes every capture once.
 *
 * ## Captures (design.md §D2/§D2a, parity.yaml capabilities read-topics /
 * read-channels / read-opt-outs / editor-save-full-set-put)
 * `get-notifications-topics` (limit=0) · `get-notifications-channels`
 * (limit=0, `filter[recipient_types.code]=client`) ·
 * `get-notifications-opt-outs` (limit=0, the pre-write state) ·
 * `put-notifications-opt-outs` (the full-set write — AC-3/AC-7).
 *
 * ## Staging hygiene
 * The PUT capture toggles ONE additional pair on top of the account's real
 * current opt-out set (never removes an existing row), and the run restores
 * the account's original opt-out set afterwards with an UNCAPTURED plain
 * call, so a re-record cannot leave the shared staging client's preferences
 * permanently altered.
 *
 * ## Recording limits (surfaced, not papered over)
 * - Whether any captured topic has `can_opt_out === false` (the locked-topic
 *   case, AC-6) depends on the real account's current topic catalogue — not
 *   forced. If none is present, the locked-topic unit/integration tests
 *   override the `can_opt_out` FIELD on one recorded row (the client-phone
 *   `verified:0`/`can_delete:false` precedent) rather than hand-writing a
 *   wire body from nothing.
 * - Whether the recorded opt-out set exceeds one server default page (the
 *   literal edge AC-2 names) depends on how many pairs this account already
 *   has opted out of — not forced, and not synthesised by duplicating rows
 *   that were never really returned. If the real capture does not exceed one
 *   page, AC-2 is still proven on the two limbs the capture DOES settle
 *   (every request carries `limit=0`; the full recorded set is never
 *   truncated by this module's own code) and the page-boundary literal is
 *   reported as a data-availability limitation, not a fabricated fixture.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
import { find } from "lodash-es";
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

type WireTopic = { id: string; code?: string; can_opt_out?: boolean | number };
type WireChannel = { id: string; name?: string };
type WireOptOut = { id: string; topic_id: string; channel_id: string };

// -----------------------------------------------------------------------------

/** Plain, UNCAPTURED authed call — used for state discovery and restore. */
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

// -----------------------------------------------------------------------------

describe("Client-Notifications API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let originalOptOuts: WireOptOut[] = [];

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-notifications"
    });

    clientToken = await mintClientToken();

    // Discover the account's CURRENT opt-out set (uncaptured) so the write
    // capture can restore it afterwards.
    const { status, body } = await call(
      "GET",
      "/api/notifications/opt-outs?limit=0",
      clientToken.access_token
    );
    if (status !== 200) {
      throw new Error(
        `Could not read the account's current opt-out set (status ${status}) ` +
          "— refusing to write anything without a known restore point."
      );
    }
    originalOptOuts = ((body as { data?: WireOptOut[] })?.data ??
      []) as WireOptOut[];
  }, 30000);

  afterAll(async () => {
    generator.save();

    // Staging hygiene: restore the account's original opt-out set exactly,
    // via an UNCAPTURED plain call — never left as this run's toggled state.
    if (clientToken) {
      await call(
        "PUT",
        "/api/notifications/opt-outs",
        clientToken.access_token,
        {
          opt_outs: originalOptOuts.map(row => ({
            topic_id: row.topic_id,
            channel_id: row.channel_id
          }))
        }
      );
    }
  });

  it("captures GET /api/notifications/topics?limit=0 (AC-1/AC-2/AC-6/AC-12)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/notifications/topics?limit=0");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `Topics capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
  });

  it("captures GET /api/notifications/channels?filter[recipient_types.code]=client&limit=0 (AC-1/AC-2/AC-12)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/notifications/channels?filter[recipient_types.code]=client&limit=0"
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `Channels capture returned ${status} — refusing to ship a fixture ` +
          "that does not represent a readable collection."
      );
    }
  });

  it("captures GET /api/notifications/opt-outs?limit=0 (AC-1/AC-2/AC-8's inherited response shape)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/notifications/opt-outs?limit=0"
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `Opt-outs capture returned ${status} — refusing to ship a fixture ` +
          "that does not represent a readable collection. This is also the " +
          "response shape `guest x self` inherits (operator ruling C) — a " +
          "failed capture here strands that cell with no shape to inherit."
      );
    }
  });

  it("captures PUT /api/notifications/opt-outs — the full-set write (AC-3/AC-7)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status: topicsStatus, body: topicsBody } = await generator.get(
      "/api/notifications/topics?limit=0&case=for-write-selection"
    );
    const { status: channelsStatus, body: channelsBody } = await generator.get(
      "/api/notifications/channels?filter[recipient_types.code]=client&limit=0&case=for-write-selection"
    );
    if (topicsStatus !== 200 || channelsStatus !== 200) {
      generator.clearBearerToken();
      throw new Error(
        `Could not read topics/channels to select a pair to toggle ` +
          `(status ${topicsStatus}/${channelsStatus}).`
      );
    }

    const topics = ((topicsBody as { data?: WireTopic[] })?.data ??
      []) as WireTopic[];
    const optOutableTopic = topics.find(
      topic => topic.can_opt_out === true || topic.can_opt_out === 1
    );
    const channels = ((channelsBody as { data?: { id: string }[] })?.data ??
      []) as { id: string }[];

    if (!optOutableTopic || channels.length === 0) {
      generator.clearBearerToken();
      throw new Error(
        "No opt-outable topic or no channel found — cannot build a real " +
          "full-set PUT body to capture."
      );
    }

    const alreadyOptedOutPairs = originalOptOuts.map(row => ({
      topic_id: row.topic_id,
      channel_id: row.channel_id
    }));
    const newPair = {
      topic_id: optOutableTopic.id,
      channel_id: channels[0].id
    };
    const alreadyPresent = alreadyOptedOutPairs.some(
      pair =>
        pair.topic_id === newPair.topic_id &&
        pair.channel_id === newPair.channel_id
    );
    const fullSet = alreadyPresent
      ? alreadyOptedOutPairs
      : [...alreadyOptedOutPairs, newPair];

    const { status } = await generator.put("/api/notifications/opt-outs", {
      opt_outs: fullSet
    });
    generator.clearBearerToken();

    if (status >= 400) {
      throw new Error(
        `Opt-outs PUT capture returned ${status} — AC-3/AC-7 have no ` +
          "recorded success to replay."
      );
    }
  });

  it("captures GET /api/notifications/opt-outs?limit=0&case=after-save — the read that follows a save (AC-3/AC-7 outcome)", async () => {
    const { status: topicsStatus, body: topicsBody } = await call(
      "GET",
      "/api/notifications/topics?limit=0",
      clientToken.access_token
    );
    const { status: channelsStatus, body: channelsBody } = await call(
      "GET",
      "/api/notifications/channels?filter[recipient_types.code]=client&limit=0",
      clientToken.access_token
    );
    if (topicsStatus !== 200 || channelsStatus !== 200) {
      throw new Error(
        `Could not read topics/channels to select the pair to save ` +
          `(status ${topicsStatus}/${channelsStatus}).`
      );
    }

    const topics = ((topicsBody as { data?: WireTopic[] })?.data ??
      []) as WireTopic[];
    const channels = ((channelsBody as { data?: WireChannel[] })?.data ??
      []) as WireChannel[];
    const topic =
      find(topics, { code: "marketing" }) ??
      find(
        topics,
        candidate =>
          candidate.can_opt_out === true || candidate.can_opt_out === 1
      );
    const channel = find(channels, { name: "Email" }) ?? channels[0];
    if (!topic || !channel) {
      throw new Error(
        "No opt-outable topic or no channel on this account — the after-save " +
          "read has no real save to follow."
      );
    }

    // The save itself is uncaptured here; the captured PUT above already
    // records that response. What this case records is the read AFTER it.
    const saved = await call(
      "PUT",
      "/api/notifications/opt-outs",
      clientToken.access_token,
      {
        opt_outs: [
          ...originalOptOuts.map(row => ({
            topic_id: row.topic_id,
            channel_id: row.channel_id
          })),
          { topic_id: topic.id, channel_id: channel.id }
        ]
      }
    );
    if (saved.status >= 400) {
      throw new Error(
        `The save before the after-save read returned ${saved.status} — ` +
          "no post-save state exists to record."
      );
    }

    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/notifications/opt-outs?limit=0&case=after-save"
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `After-save opt-outs read returned ${status} — refusing to ship a ` +
          "fixture that does not represent the saved collection."
      );
    }
  });

  it("captures the locked-topic refusal — PUT /api/notifications/opt-outs?case=locked-topic-refusal (AC-6 @guard)", async () => {
    const { status: topicsStatus, body: topicsBody } = await call(
      "GET",
      "/api/notifications/topics?limit=0",
      clientToken.access_token
    );
    const { status: channelsStatus, body: channelsBody } = await call(
      "GET",
      "/api/notifications/channels?filter[recipient_types.code]=client&limit=0",
      clientToken.access_token
    );
    if (topicsStatus !== 200 || channelsStatus !== 200) {
      throw new Error(
        `Could not read topics/channels to select a locked pair ` +
          `(status ${topicsStatus}/${channelsStatus}).`
      );
    }

    const topics = ((topicsBody as { data?: WireTopic[] })?.data ??
      []) as WireTopic[];
    const lockedTopic = topics.find(
      topic => topic.can_opt_out === false || topic.can_opt_out === 0
    );
    const channels = ((channelsBody as { data?: { id: string }[] })?.data ??
      []) as { id: string }[];

    if (!lockedTopic || channels.length === 0) {
      throw new Error(
        "No locked topic (can_opt_out=false) or no channel on this account — " +
          "AC-6's staging refusal cannot be captured, and no fixture may be " +
          "authored to stand in for it."
      );
    }

    // Full current set plus one opt-out for the locked topic — the save the
    // editor fires when the operator turns a locked topic off. The wire refuses
    // the whole PUT (409), so the account's real set is untouched; the afterAll
    // restore covers the write even so.
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      "/api/notifications/opt-outs?case=locked-topic-refusal",
      {
        opt_outs: [
          ...originalOptOuts.map(row => ({
            topic_id: row.topic_id,
            channel_id: row.channel_id
          })),
          { topic_id: lockedTopic.id, channel_id: channels[0].id }
        ]
      }
    );
    generator.clearBearerToken();

    if (status < 400) {
      throw new Error(
        `Locked-topic opt-out PUT returned ${status}, not a refusal — the ` +
          "topic is not locked on this account, so AC-6's refusal has no real " +
          "response to record."
      );
    }
  });
});
