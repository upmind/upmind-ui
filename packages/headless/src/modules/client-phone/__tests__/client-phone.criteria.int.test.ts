// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone — the criteria wire, cache law and surface
 *
 * ## Job To Be Done
 * Drive the REAL `useClientPhones()` against MSW-replayed staging recordings
 * and prove the migration off the raw options arm: the collection boots on the
 * unpaged window its SCHEMA declares, its free-text search leaves as a
 * `filter[col|like]=%…%` key the API ACCEPTS rather than the legacy bare
 * `query=`, a repeated combination is served from cache, and the handle
 * publishes the criteria surface with no `sort()`/`filter()` setters beside it.
 *
 * ## The recorded disagreement, and how it was settled
 * The model key stays `number` — the consumer's contract — while the schema's
 * free-text branch BINDS the wire column to `phone`, because the two captures
 * disagree: staging answers `filter[number|like]` with HTTP 500 "A critical
 * database error occurred" (`fixtures/…-case-number-like-…json`) while
 * `filter[phone|like]` narrows 4 of 10 (`…-case-phone-like-…json`). Both are
 * verbatim captures, and the handler still 500s any `filter[number|` key — so
 * a collection that stays readable after a search is proof the wire moved.
 *
 * ## What Breaks If These Fail
 * A free-text search on the client's phone list 500s the whole collection —
 * the user types into the search box and the list disappears.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientPhones } from "..";
import {
  distinctCombinations,
  observeRequests,
  seedClientSession
} from "../../../__tests__/criteria-int-kit";
import {
  installPhonesHandler,
  recordedNeedle
} from "./client-phone.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** The `pagination.limit` default `useQuerySchema()` declares — unpaged. */
const DECLARED_LIMIT = "0";

/** Every legacy free-text spelling the migration replaced. */
const LEGACY_KEYS = ["query", "q", "search"];

/** The ONE free-text key staging answers 200 — model `number`, column `phone`. */
const ACCEPTED_FILTER_KEY = "filter[phone|like]";

type Collection = ReturnType<typeof useClientPhones>;

async function bootCollection(
  initial?: Parameters<typeof useClientPhones>[0]
): Promise<{ phones: Collection; clientId: string }> {
  const { clientId } = await seedClientSession(server);
  installPhonesHandler(server, clientId);
  const phones = useClientPhones(initial);
  await phones.isReady();
  return { phones, clientId };
}

// -----------------------------------------------------------------------------

describe("client-phone — the declared window boots the collection", () => {
  it("asks for the unpaged window its schema declares, with no legacy free-text key", async () => {
    const { clientId } = await seedClientSession(server);
    installPhonesHandler(server, clientId);
    const observed = observeRequests(server, "/phones");

    const phones = useClientPhones();
    await phones.isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("limit")).toBe(DECLARED_LIMIT);
    for (const key of LEGACY_KEYS) expect(params.get(key)).toBeNull();
    expect(observed.first().url).toContain(`/clients/${clientId}/phones`);
  });
});

describe("client-phone — the free-text filter on the wire", () => {
  it("leaves as filter[phone|like] wrapped in the translator's % wildcards, never the model key or a legacy one", async () => {
    const { phones } = await bootCollection();
    const needle = recordedNeedle();
    const observed = observeRequests(server, "/phones");

    phones.setCriteria({ filters: { number: { like: needle } } } as never);

    await vi.waitFor(() =>
      expect(observed.lastParam(ACCEPTED_FILTER_KEY)).toBe(`%${needle}%`)
    );
    observed.stop();

    expect(observed.filterKeys()).toEqual([ACCEPTED_FILTER_KEY]);
    expect(phones.criteria.value.filters).toEqual({ number: { like: needle } });
    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      for (const legacy of LEGACY_KEYS) expect(params.get(legacy)).toBeNull();
    }
  });
});

describe("client-phone — the cache law", () => {
  it("issues exactly one request per DISTINCT criteria combination", async () => {
    const { phones } = await bootCollection();
    const observed = observeRequests(server, "/phones");

    phones.setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() => expect(observed.lastParam("limit")).toBe("2"));

    phones.setCriteria({ pagination: { limit: 0 } });
    await vi.waitFor(() =>
      expect(phones.criteria.value.pagination?.limit).toBe(0)
    );

    phones.setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(phones.criteria.value.pagination?.limit).toBe(2)
    );
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().length).toBe(
      distinctCombinations(observed.all()).length
    );
  });
});

describe("client-phone — the criteria surface the filter bar consumes", () => {
  it("publishes the declared schema, the live model and the write verb", async () => {
    const { phones } = await bootCollection();

    expect(phones.schema).toMatchObject({
      properties: { filters: { properties: {} } }
    });
    expect(phones.isFiltered.value).toBe(false);
    expect(typeof phones.setCriteria).toBe("function");
    expect(phones.criteriaError.value).toBeUndefined();
  });

  it("has no raw sort()/filter() setters beside setCriteria", async () => {
    const { phones } = await bootCollection();

    expect(phones).not.toHaveProperty("sort");
    expect(phones).not.toHaveProperty("filter");
  });

  it("cannot spell a column the schema does not declare — nothing reaches the wire", async () => {
    const { phones } = await bootCollection();
    const observed = observeRequests(server, "/phones");

    phones.setCriteria({ filters: { country: { eq: "GB" } } } as never);

    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();
    expect(
      observed
        .all()
        .flatMap(request =>
          [...new URL(request.url).searchParams.keys()].filter(key =>
            key.startsWith("filter[country")
          )
        )
    ).toEqual([]);
    expect(phones.criteria.value.filters).toBeUndefined();
  });
});
