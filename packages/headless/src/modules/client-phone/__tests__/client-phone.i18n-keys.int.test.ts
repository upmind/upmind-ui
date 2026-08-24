// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone — i18n catalogue keys resolve (AC-36, AC-41)
 *
 * ## Job To Be Done
 * `client-phone.schemas.ts`'s `useQueryUischema()` cites `i18n:
 * "form.phone_search"` and `useSortUischema()` cites `i18n: "form.phone_sort"`.
 * Prove both keys are real catalogue entries in the upload SOURCE
 * (`packages/i18n/src/core/form-en.json`) rather than key strings a
 * renderer would show raw. `packages/i18n/CLAUDE.md` marks `public/locales`
 * a Localazy DOWNLOAD target, so it lags the source by a sync this spec
 * cannot trigger — reading the source proves the fix today.
 *
 * ## What Breaks If This Fails
 * The filter-bar search placeholder and the order-control's "Date added"
 * label render as raw i18n key strings instead of copy.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FORM_EN = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "../../../../../i18n/src/core/form-en.json"),
    "utf-8"
  )
) as Record<string, unknown>;

// -----------------------------------------------------------------------------

describe("client-phone — the i18n keys the schema cites resolve to real copy", () => {
  it("declares form.phone_search", () => {
    expect(FORM_EN.phone_search).toBeDefined();
  });

  it("declares form.phone_sort.created_at", () => {
    expect(
      (FORM_EN.phone_sort as Record<string, unknown> | undefined)?.created_at
    ).toBeDefined();
  });
});
