// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview useQuery().query() count read integration tests (fixture-replayed)
 *
 * ## Job To Be Done
 * A count is a plain `query()`: a `limit=count` url and a `select` that reads
 * the envelope `total` (the second argument `select` receives). The url's
 * `limit=count` reaches the wire unchanged, and `data` resolves to the recorded
 * envelope's `total`. Each answer is the staging recording of that exact request
 * (`get-countries-limit-count`).
 *
 * ## What Breaks If These Fail
 * `select` loses the envelope, so a count cannot be read without a second query
 * API; or the wire drops `limit=count` and a "how many" read pays for a page.
 */

import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";
import { useQuery } from "..";
import { observeRequests } from "../../../__tests__/criteria-int-kit";
import { queryClient } from "../client";
import { useUrl } from "../../../utils";
import { filter } from "lodash-es";
import type { Envelope } from "../../../__tests__/criteria-int-kit";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");
const server = startReplayServer({ recordingsDir });

const COUNT = getFixtureBody<Envelope<unknown[]>>("get-countries-limit-count", {
  recordingsDir
});

const isCountRead = ({ url }: { url: string }) =>
  new URL(url).pathname.endsWith("/countries");

function countUrl() {
  const url = useUrl("countries");
  url.searchParams.set("limit", "count");
  return url;
}

let sent: ReturnType<typeof observeRequests> | undefined;

afterEach(() => {
  sent?.stop();
  queryClient.clear();
});

// -----------------------------------------------------------------------------

describe("useQuery().query() — a count read is a query with a select", () => {
  it("resolves its data to the recorded envelope total via select", async () => {
    const counter = useQuery().query<unknown[], number>({
      url: countUrl(),
      queryKey: ["count", "countries"],
      select: (_data, envelope) => envelope.total ?? 0
    });

    await vi.waitFor(() => expect(counter.data.value).toBe(COUNT.total));
  });

  it("sends the url's limit=count on the wire", async () => {
    sent = observeRequests(server, "/api/");

    const counter = useQuery().query<unknown[], number>({
      url: countUrl(),
      queryKey: ["count", "countries"],
      select: (_data, envelope) => envelope.total ?? 0
    });
    await vi.waitFor(() => expect(counter.data.value).toBe(COUNT.total));

    const [request] = filter(sent.all(), isCountRead);
    expect(new URL(request.url).searchParams.get("limit")).toBe("count");
  });
});
