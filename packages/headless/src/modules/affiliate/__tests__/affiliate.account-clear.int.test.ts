// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.account-clear — a loaded listing drops its rows and
 * goes unavailable when the account leaves the client's own account list
 * (design.md §8.4 "Switch" rule 4, clear edge; unnumbered after R-NO-SWITCH)
 *
 * ## Job To Be Done
 * Protect the clear edge: when the active account leaves `activeUser.accounts`,
 * the resolver clears, the listing reports `isAvailable` false and publishes
 * zero rows, and a later criteria write sends no request for the account that
 * left. A listing that kept its previous key would go on showing and reading
 * the rows of an account the client no longer holds.
 *
 * ## How the clear is reached
 * The SAME real client session `seedRealClient()` seeds, with its account
 * removed from `accounts` by a second real `useSessionStore().useActions().add()`
 * for the identical session, as `affiliate.account-member-guard.int.test.ts`
 * does. No hand-written membership shortcut.
 *
 * ## What Breaks If These Fail
 * A client whose account disappears keeps seeing, and querying, the old
 * account's referral links.
 */
import { describe, expect, it } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import { mapSessionUser, useSessionStore } from "../../session-store";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinks } from "../useAffiliateLinks";
import {
  observeRequests,
  recordedSelf,
  seedRealClient
} from "./affiliate.int-helpers";
import type { ISelf } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

async function removeAccountFromSession(): Promise<void> {
  const self = recordedSelf();
  const emptied: ISelf = { ...self, accounts: [] };

  await useSessionStore()
    .useActions()
    .add(
      {
        access_token: "affiliate-int-test-session-token",
        actor_id: self.actor_id,
        actor_type: AccessRoleTypes.CLIENT,
        expires_in: 3600,
        refresh_expires_in: 36000,
        refresh_token: "affiliate-int-test-refresh-token",
        second_factor_required: false,
        token_type: "Bearer",
        twofa_provider: undefined as never
      },
      true,
      mapSessionUser(emptied)
    );
}

describe("affiliate.account-clear — a listing follows its account leaving the client's account list", () => {
  it("A loaded listing publishes zero rows, goes unavailable and sends nothing once its account leaves the client's own account list", async () => {
    await seedRealClient();

    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();
    await expect.poll(() => links.useMeta().isAvailable.value).toBe(true);
    await expect
      .poll(() => links.useContext().data.value?.length ?? 0)
      .toBeGreaterThan(0);

    await removeAccountFromSession();

    await expect.poll(() => links.useMeta().isAvailable.value).toBe(false);
    expect(links.useContext().data.value ?? []).toHaveLength(0);

    const seen = observeRequests();
    links.useActions().setCriteria({
      sort: [{ field: "visit_count", dir: "desc" }]
    } as never);
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(
      seen.filter(request => request.url.includes("/affiliate/links"))
    ).toEqual([]);
  });
});
