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
 * Named gap (CONTROLS.md, row 19): the recorded area settings carry no
 * `default_redirect` value, so the pre-filled value itself is not asserted here.
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import { seedRealClient } from "./affiliate.int-helpers";

// -----------------------------------------------------------------------------

describe("affiliate.link-create-seed — a new-link editor opens already changed", () => {
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
