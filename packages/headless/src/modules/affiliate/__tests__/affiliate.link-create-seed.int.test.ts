// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.link-create-seed — a new-link editor opens already
 * changed (@AC10, design.md §8.6 "Create", bdd.md AC10 "`isDirty` true on open")
 *
 * ## Job To Be Done
 * Protect that `useAffiliateLinkManager().as(CLIENT).fresh()` reports
 * `isDirty` true from the moment it opens, with no input from the client. A
 * create form carries the brand's default redirect the client never typed, so
 * leaving it unsaved must count as a pending change.
 *
 * ## What Breaks If These Fail
 * A create editor that opens clean lets a consumer treat the pre-filled form as
 * untouched, so the client's save control stays off and a pre-filled link can
 * never be saved without a keystroke.
 *
 * ## Recordings used
 * The real recorded account, balance, self and area-settings captures, served
 * by the replay pool. No body is edited.
 *
 * Control: `useAffiliateLinkManager.create-clean-on-open` makes a create editor
 * open clean, and flips the `isDirty` assertion.
 *
 * The pre-filled value itself is asserted in `affiliate.link-create`. Since the
 * recorded brand carries a default redirect (R-DATA-9) the editor differs from
 * an empty form on open for that reason alone, so a second case serves the REAL
 * area-settings capture recorded before the backend served `default_redirect`
 * (`get-config-brand-values-case-no-default-redirect`, restored byte-identical
 * from commit c48b1d0902, R-NO-DEFAULT-CAPTURE) and asserts the editor is still
 * changed on open. No recording is edited.
 */
import { describe, expect, it } from "vitest";
import { BrandConfigKeys } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import { seedRealClient, serveCapture } from "./affiliate.int-helpers";

// -----------------------------------------------------------------------------

const BRAND_CONFIG_ROUTE = "*/api/config/brand/values";
const AREA_KEYS = [
  BrandConfigKeys.AFFILIATES_DEFAULT_REDIRECT_LINK,
  BrandConfigKeys.AFFILIATES_WITHDRAW_REQUEST
].join(",");
const NO_DEFAULT_REDIRECT_CAPTURE =
  "get-config-brand-values-case-no-default-redirect";

describe("affiliate.link-create-seed — a new-link editor opens already changed", () => {
  it("A new-link editor for a brand with no default redirect is already counted as changed when it opens", async () => {
    serveCapture("get", BRAND_CONFIG_ROUTE, NO_DEFAULT_REDIRECT_CAPTURE, {
      match: { keys: AREA_KEYS }
    });
    await seedRealClient();
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const manager = useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      expect(manager.useContext().defaultRedirectUrl.value).toBe("");
      expect(manager.useMeta().isDirty.value).toBe(true);
    } finally {
      manager.useActions().destroy();
    }
  });

  it("A new-link editor is already counted as changed when it opens, before the client types anything", async () => {
    await seedRealClient();
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const manager = useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      expect(manager.useMeta().isAvailable.value).toBe(true);
      expect(manager.useMeta().isDirty.value).toBe(true);
    } finally {
      manager.useActions().destroy();
    }
  });
});
