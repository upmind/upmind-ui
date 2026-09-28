// -----------------------------------------------------------------------------
/**
 * @module brand/__tests__/brand.one-time-purchases.int-helpers
 * @description Boots `useBrand()` on the recorded `get-brand-settings`
 * capture with `meta.portal["@context.oneTimePurchases"]` set to one value or
 * removed — the design 8.8 "one-time purchases" construction (FE-3237 D-17).
 * The brand reads are static singleton queries, so each brand state lives in
 * its own vitest file.
 */

import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { useBrand } from "..";
import { seedClientSession } from "../../../__tests__/criteria-int-kit";
import { recordingsDir, server } from "./setup.integration";

// -----------------------------------------------------------------------------

type SettingsEnvelope = {
  data: { id: string; meta?: Record<string, unknown> } & Record<
    string,
    unknown
  >;
} & Record<string, unknown>;

/**
 * Serves the recorded brand settings with the one-time-purchases key set to
 * `value`, or removed when `value` is `undefined`, then resolves `useBrand()`
 * once the settings have settled.
 */
export async function bootBrandWithOneTimePurchases(
  value: "hidden" | "shown" | undefined
): Promise<ReturnType<typeof useBrand>> {
  const recorded = getFixtureBody<SettingsEnvelope>("get-brand-settings", {
    recordingsDir
  });
  const meta = { ...(recorded.data.meta ?? {}) };
  if (value === undefined) delete meta.portal;
  else meta.portal = { "@context.oneTimePurchases": value };
  const body: SettingsEnvelope = {
    ...recorded,
    data: { ...recorded.data, meta }
  };
  server?.use(http.get("*/brand/settings", () => HttpResponse.json(body)));

  await seedClientSession(server, { withBrandConfig: false });
  const brand = useBrand();
  await vi.waitFor(() => expect(brand.brandId.value).toBe(recorded.data.id));
  return brand;
}
