// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the lane corpus serves the recorded list pages
 *
 * ## Job To Be Done
 * Prove the adapted `recorded-corpus.ts` serves orders data (design
 * 8.12, T02a). With the orders list pins installed, a `GET
 * api/invoices` sent from inside the page with the recorded criteria of the
 * default capture and of the page-2 capture is answered with the non-empty
 * rows of that capture. And no two pooled list captures ask the same
 * criteria, because the resolver answers with the first capture that does.
 *
 * ## What Breaks If These Fail
 * The lane pages draw no orders, or draw the rows of another capture, and the
 * `bdd` and lane checks read a corpus nobody recorded for them.
 */

import { expect, test } from "@playwright/test";
import { ORDERS_PINS, clientEmailsRoute } from "./catalogs.pins";
import {
  endpointShape,
  installRecordedCorpus,
  moduleCorpus,
  seedRecordedClientSession
} from "./recorded-corpus";
import {
  countBy,
  filter,
  includes,
  map,
  pickBy,
  sortBy,
  split,
  startsWith,
  values
} from "lodash-es";

// -----------------------------------------------------------------------------

type ListBody = { data: { id: string }[]; total: number };

const corpus = moduleCorpus("orders", ORDERS_PINS);

/** A capture's recorded query string, without the capture run's `case` label. */
function recordedQuery(name: string): string {
  const [, search = ""] = split(corpus[name].request.path, "?");
  const query = new URLSearchParams(search);
  query.delete("case");
  return query.toString();
}

/** The criteria a capture asked: every key but its label, relations and first offset. */
function criteria(path: string): string {
  const [, search = ""] = split(path, "?");
  const stated = filter(
    [...new URLSearchParams(search).entries()],
    ([key, value]) =>
      !includes(["case", "with", "keys", "lang"], key) &&
      !startsWith(key, "with_") &&
      !(key === "offset" && value === "0")
  );
  return sortBy(map(stated, ([key, value]) => `${key}=${value}`)).join("&");
}

test.describe.configure({ timeout: 240000 });

// -----------------------------------------------------------------------------

test("no two pooled list captures ask the same criteria", () => {
  const lists = pickBy(
    corpus,
    fixture =>
      endpointShape(fixture.request.method, fixture.request.path) ===
      "GET api/invoices"
  );
  const asked = countBy(values(lists), fixture =>
    criteria(fixture.request.path)
  );

  expect(pickBy(asked, count => count > 1)).toEqual({});
});

for (const name of [
  "get-invoices-case-orders-default",
  "get-invoices-case-orders-page-2"
]) {
  test(`the recorded criteria of ${name} are answered with its own non-empty rows`, async ({
    page
  }) => {
    await installRecordedCorpus(page, "orders", ORDERS_PINS);
    await seedRecordedClientSession(page);
    await page.goto(clientEmailsRoute);

    const served = await page.evaluate(
      async query =>
        (await (
          await fetch(`https://api.staging.upmind.io/api/invoices?${query}`)
        ).json()) as ListBody,
      recordedQuery(name)
    );
    const recorded = corpus[name].response.body as ListBody;

    expect(recorded.data.length).toBeGreaterThan(0);
    expect(map(served.data, "id")).toEqual(map(recorded.data, "id"));
    expect(served.total).toBe(recorded.total);
  });
}
