// -----------------------------------------------------------------------------
/**
 * @fileoverview useAffiliateLinkManager.machine — the link manager config's
 * ADR-021 unit-spec cases, promoted to integration (G11-EXEC, review-notes.md
 * 2026-09-29).
 *
 * ## Job To Be Done
 * Protect that opening an EDIT seeds BOTH `model` and `baseModel` from the
 * one-link read (design.md §8.6: "`loading` reads the one link ... and seeds
 * `model` and `baseModel`") — not `model` alone, which would make `isDirty`
 * true on open with no user edit — and that a create whose `isReady()`
 * resolves `false` (no published account) goes `unavailable` with no seed
 * and sends no self read (design.md §8.6 "Create", step "the create seed
 * does not run").
 *
 * ## What Breaks If These Fail
 * An edit form would show every field as dirty from the moment it opens
 * (`baseModel` empty), so a client's UNCHANGED link would look editable/save-able
 * with no real change.
 *
 * ## Real capture used
 * The real one-link GET capture this unit recorded
 * (`get-accounts-id-affiliate-links-id.json`, the same throwaway link
 * `affiliate.link-create.int.test.ts`/`affiliate.link-edit.int.test.ts`
 * drive) — never a hand-authored link body.
 *
 * ## Scope narrowed this pass (named, not silently dropped)
 * bdd.md's ADR-021 row also names "a mocked `isReady()` that resolves `false`
 * gives `unavailable` with no seed" as a create-side case. A zero-account
 * client session over `.as(CLIENT).fresh()` left the manager's own
 * `isAvailable` `true` here (the session's actor is genuinely CLIENT; the
 * manager's own unavailable/subscribing distinction for a NEVER-resolving
 * account, vs. one merely not-yet-resolved, is not settled by this pass's
 * public-surface-only contract) — asserting on it without reading
 * `useAffiliateLinkManager.machine.ts` would be a guess dressed as proof.
 * Named here, not worked around by peeking at the implementation.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write of its
 * own; `affiliate.link-create.int.test.ts` and `affiliate.link-edit.int.test.ts`
 * already own the save/refresh/failure surface.
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import { recordedAccountId, seedRealClient } from "./affiliate.int-helpers";
import { recorded } from "./setup.integration";

// -----------------------------------------------------------------------------

// Read from the recorded one-link capture's own `id`, never a hardcoded
// copy of it.
type OneLinkEnvelope = { data: { id: string } };
const REAL_LINK_ID = recorded<OneLinkEnvelope>(
  "get-accounts-id-affiliate-links-id"
).data.id;

describe("useAffiliateLinkManager.machine — the edit seed fills baseModel too, so isDirty is false on an untouched open", () => {
  it("editing a real link seeds baseModel from the one-link capture, not model alone", async () => {
    await seedRealClient();
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const manager = useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .withId(REAL_LINK_ID);
    try {
      await manager.useActions().isReady();

      // Hand-written literal copied from the recorded one-link capture
      // (`get-accounts-id-affiliate-links-id.json`) — never read back from the
      // module's own result. `isDirty` false on an untouched open is only true
      // when `baseModel` was seeded to the SAME values as `model` — the
      // `edit-seed-model-only` mutant leaves `baseModel` empty, so `model`
      // (real link) and `baseModel` ({}) diverge and this reddens.
      expect(manager.useContext().model.value?.name).toBe(
        "FE-3227 fixture throwaway link"
      );
      expect(manager.useMeta().isDirty.value).toBe(false);
      expect(manager.useContext().accountId.value).toBe(recordedAccountId());
    } finally {
      manager.useActions().destroy();
    }
  });
});
