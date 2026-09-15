// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/corpus-read-answers
 * @description A replayed READ is answered by the recording that asked the SAME
 * question. `client-email-history` recorded its plain read only under a
 * `case=` label, and held an unlabelled zero-row filter capture beside it; the
 * unlabelled-first tie-break let that empty page answer the plain read, so Live
 * drew nothing (2026-09-12). Every value here is the module's own recording.
 */

import { describe, expect, it } from "vitest";
import {
  armCorpusModule,
  resolveCorpusRequest,
  runtimeCorpus
} from "../corpus";
import { get, size } from "lodash-es";
import type { CorpusBodies } from "../corpus.source.types";

// -----------------------------------------------------------------------------

const MODULE = "client-email-history";

await armCorpusModule(MODULE);

const bodies: CorpusBodies = runtimeCorpus(MODULE)!;

const read = (search: string) =>
  resolveCorpusRequest(
    bodies,
    "GET",
    new URL(`https://api.test/api/self/email_history?${search}`)
  );

describe("a replayed read is answered by the capture that asked the same question", () => {
  it("answers the plain first page with rows, from the labelled capture of that very read", () => {
    const answer = read(
      "with=recipient,recipient_type,recipient.image&order=-created_at&limit=10"
    );

    expect(answer?.status).toBe(200);
    expect(size(get(answer, ["body", "data"]))).toBe(10);
    expect(get(answer, ["body", "total"])).toBeGreaterThan(10);
  });

  it("answers the second page with its own rows", () => {
    const first = read("order=-created_at&limit=10&offset=0");
    const second = read("order=-created_at&limit=10&offset=10");

    expect(size(get(second, ["body", "data"]))).toBe(10);
    expect(get(second, ["body", "data", 0, "id"])).not.toBe(
      get(first, ["body", "data", 0, "id"])
    );
  });

  it("still answers a filter that recorded nothing with nothing", () => {
    const answer = read("filter[bounced]=true&limit=10");

    expect(get(answer, ["body", "data"])).toEqual([]);
  });
});
