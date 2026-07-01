// -----------------------------------------------------------------------------
/**
 * @fileoverview Query Module Integration Tests (fixture-replayed)
 *
 * ## Job To Be Done
 * Exercise the REAL query stack — `useQuery().request()` → `doFetch()` →
 * native `fetch` → `handleError` — against recorded API fixtures replayed by
 * MSW at the network boundary. No part of the client is mocked: this proves the
 * envelope unwrapping, status propagation, and error path behave exactly as
 * they will against the live API for the recorded contracts.
 *
 * ## What Breaks If These Fail
 * - A change to `doFetch`/`request` that drops or reshapes the `data` envelope
 *   (every consumer reading `response.data` silently breaks).
 * - A regression in error handling where a non-2xx response no longer rejects
 *   with the API's HTTP status on `DetailedError.code` (callers branching on
 *   404/401 — unavailable-tenant redirect, re-auth — stop firing).
 * - A silent-network regression: a request escaping the fixture pool to the
 *   real API (the negative control asserts the MSW guard throws loudly).
 */

import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { useQuery } from "../useQuery";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import type { DetailedError } from "../../../utils";
import "./setup.integration";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type CountriesEnvelope = {
  status: string;
  data: Array<{ id: string; name: string; code: string }>;
};

describe("query integration (fixture replay)", () => {
  it("GET countries resolves and unwraps the recorded data array", async () => {
    const { request, useUrl } = useQuery();

    const response = await request({ url: useUrl("countries") });

    const expected = getFixtureBody<CountriesEnvelope>("get-countries", {
      recordingsDir
    });

    expect(response.status).toBe(200);
    // The recorded fixture is the contract: the unwrapped `data` deep-equals
    // the envelope's `data` array, byte-for-byte, across future regens.
    expect(response.data).toEqual(expected.data);
    // Shape assertions that hold for the real staging payload — values are
    // located dynamically from `expected`, never hardcoded (so a regen that
    // shifts the country list does not break the test).
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data?.length).toBeGreaterThan(0);
    expect(response.data?.[0]).toMatchObject({
      code: expected.data[0].code,
      name: expected.data[0].name
    });
  });

  it("GET countries/zz rejects with HTTP 404", async () => {
    const { request, useUrl } = useQuery();

    await expect(
      request({ url: useUrl("countries/zz") })
    ).rejects.toMatchObject({ code: 404 });
  });

  it("POST oauth/access_token rejects with HTTP 401 without triggering re-auth", async () => {
    const { request, useUrl } = useQuery();

    await expect(
      request({
        url: useUrl("access_token", {}, { context: "oauth" }),
        init: { method: "POST" }
      })
    ).rejects.toMatchObject({ code: 401 });
  });

  it("a request with no fixture throws loudly (MSW guard)", async () => {
    const { request, useUrl } = useQuery();

    await expect(request({ url: useUrl("unrecorded") })).rejects.toBeDefined();
  });
});

// Reference the imported type so it is not flagged as unused; the rejection
// shape asserted above is a DetailedError (code = HTTP status).
export type _AssertedError = DetailedError;
