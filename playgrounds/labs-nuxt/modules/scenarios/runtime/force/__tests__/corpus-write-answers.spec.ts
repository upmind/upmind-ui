// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/corpus-write-answers
 * @description A replayed WRITE is answered by the recording of the SAME write,
 * and lands on the single record a form re-reads. Before this, a save of `0`
 * was answered by whichever of thirteen PUT recordings sorted first, and the
 * re-read served the untouched baseline — a form that saved "off" and showed
 * "on" (client-billing-settings, 2026-09-12). Every value below is read off the
 * module's own recordings; nothing is authored.
 */

import { describe, expect, it } from "vitest";
import {
  armCorpusModule,
  createCorpusSession,
  resolveCorpusRequest,
  runtimeCorpus
} from "../corpus";
import { get } from "lodash-es";
import type { CorpusBodies } from "../corpus.source.types";

// -----------------------------------------------------------------------------

const MODULE = "client-billing-settings";
const ENABLED = "invoice_consolidation_enabled";

await armCorpusModule(MODULE);

const bodies: CorpusBodies = runtimeCorpus(MODULE)!;
const baseline = bodies["get-clients-id"];
const clientId = get(baseline, ["response", "body", "data", "id"]) as string;
const recordedEnabled = get(baseline, ["response", "body", "data", ENABLED]);
const memberUrl = new URL(
  `https://api.test/api/clients/${clientId}?with=custom_fields,custom_fields.field`
);

const answerOf = (sent: unknown, from: CorpusBodies = bodies) =>
  resolveCorpusRequest(from, "PUT", memberUrl, sent);

describe("a replayed write is answered by the recording of the same write", () => {
  it.each([
    ["enabled-off", 0],
    ["enabled-on", 1],
    ["enabled-inherit", 2]
  ])("answers a %s save with its own recording", (_case, value) => {
    const answer = answerOf({ [ENABLED]: value });

    expect(answer?.status).toBe(200);
    expect(get(answer, ["body", "data", ENABLED])).toBe(value);
  });

  it("answers a save the recording extends — the case's own keys, plus more", () => {
    const answer = answerOf({
      invoice_consolidation_base_rule: "day_of_week",
      unrelated_key_the_case_never_sent: true
    });

    expect(
      get(answer, ["body", "data", "invoice_consolidation_base_rule"])
    ).toBe("day_of_week");
  });
});

describe("a served write lands on the single record the form re-reads", () => {
  it("re-reads the saved value, and only after the save", () => {
    const session = createCorpusSession(bodies);
    const readBefore = resolveCorpusRequest(session.bodies(), "GET", memberUrl);

    expect(get(readBefore, ["body", "data", ENABLED])).toBe(recordedEnabled);
    expect(recordedEnabled).not.toBe(0);

    const saved = answerOf({ [ENABLED]: 0 }, session.bodies());
    session.apply("PUT", memberUrl, { [ENABLED]: 0 }, saved?.body);

    const readAfter = resolveCorpusRequest(session.bodies(), "GET", memberUrl);

    expect(get(readAfter, ["body", "data", ENABLED])).toBe(0);
    // The record re-read is the one staging RETURNED for the write, whole.
    expect(get(readAfter, ["body", "data"])).toEqual(
      get(saved, ["body", "data"])
    );
    // Everything the write did not name is still the recording's own.
    expect(get(readAfter, ["body", "data", "id"])).toBe(clientId);
  });

  it("answers the exact write with its own recorded refusal, and lands nothing", () => {
    const session = createCorpusSession(bodies);
    const accountsUrl = new URL(`https://api.test/api/accounts/${clientId}`);
    const refused = resolveCorpusRequest(session.bodies(), "PUT", accountsUrl, {
      preferred_payment_currency_id: "2785d26e-9678-3d16-40f3-14502e70439d"
    });

    // The recording of this exact write IS a refusal — this brand's closed
    // gate — and the page saving it is told so, as the capture run was.
    expect(refused?.status).toBe(409);
    expect(
      get(resolveCorpusRequest(session.bodies(), "GET", memberUrl), [
        "body",
        "data",
        ENABLED
      ])
    ).toBe(recordedEnabled);
  });
});
