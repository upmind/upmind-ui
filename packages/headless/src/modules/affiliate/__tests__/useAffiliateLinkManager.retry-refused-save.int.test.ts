// -----------------------------------------------------------------------------
/**
 * @fileoverview useAffiliateLinkManager — a client retries a save the server
 * refused (@AC11)
 *
 * ## Job To Be Done
 * Protect the retry edge of a link save: after a refused `update()` (a 422
 * that leaves the manager in `available` with `errors` filled, design.md §8.6
 * "A failed POST or PUT ... goes back to `available`"), a second `update()`
 * sends a second PUT. A manager that goes back to `available` but ignores the
 * next `update()` leaves the client unable to save until the editor is closed
 * and opened again.
 *
 * ## Real captures used
 * The first PUT is answered by the recorded 422 capture
 * `put-accounts-id-affiliate-links-id-case-rejected` (empty name and redirect
 * URL). The second PUT is answered by the recorded edit-success capture
 * `put-accounts-id-affiliate-links-id`. Both are served in that order on the
 * one-link route.
 *
 * ## What Breaks If These Fail
 * A client who fixes a refused link and presses save again sees nothing
 * happen, or saves the old values: no request leaves, or the fix is dropped.
 *
 * In the second test the client types the fix between the two saves (the name and redirect URL of
 * the recorded edit-success capture). The second PUT body must carry that fix:
 * a retry that resends the stale values is a dropped edit.
 *
 * Stated omissions (ADR-021, design.md §8.2): the first PUT body is `{}`
 * (the empty strings are dropped from the model), so the recorded 422 answers
 * it by route, not by body. The 5xx refusal takes the same error-state path
 * (design.md §8.2 note 3) and is not repeated here.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import {
  inputAndSettle,
  seedRealClient,
  serveSequence,
  withBound
} from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

type LinkBody = {
  data?: { id?: string; name?: string; redirect_url?: string };
};

const THROWAWAY_LINK_ID = recorded<LinkBody>(
  "get-accounts-id-affiliate-links-id"
).data?.id as string;
const FIXED_LINK = recorded<LinkBody>(
  "put-accounts-id-affiliate-links-id"
).data;
const LINK_ROUTE = "*/api/accounts/:accountId/affiliate/links/:linkId";

async function refuseThenRetry(fixBetween: boolean): Promise<{
  putBodies: string[];
  hasErrorAfterRetry: boolean;
}> {
  await useAffiliateActiveAccount()
    .as(ScopeActorTypes.CLIENT)
    .useActions()
    .isReady();

  const putBodies: string[] = [];
  server?.events.on("request:start", async ({ request }) => {
    if (
      request.method === "PUT" &&
      new URL(request.url).pathname.endsWith(`/links/${THROWAWAY_LINK_ID}`)
    ) {
      putBodies.push(await request.clone().text());
    }
  });

  const manager = useAffiliateLinkManager()
    .as(ScopeActorTypes.CLIENT)
    .withId(THROWAWAY_LINK_ID);
  try {
    await manager.useActions().isReady();
    await inputAndSettle(manager, { name: "", redirectUrl: "" });

    serveSequence("put", LINK_ROUTE, [
      "put-accounts-id-affiliate-links-id-case-rejected",
      "put-accounts-id-affiliate-links-id"
    ]);

    await withBound(
      manager.useActions().update(),
      3000,
      "[retry-refused-save] first update()"
    );
    expect(manager.useMeta().hasError.value).toBe(true);
    expect(putBodies).toHaveLength(1);

    if (fixBetween) {
      await inputAndSettle(manager, {
        name: FIXED_LINK?.name ?? "",
        redirectUrl: FIXED_LINK?.redirect_url ?? ""
      });
    }

    await withBound(
      manager.useActions().update(),
      3000,
      "[retry-refused-save] second update()"
    );
    return {
      putBodies,
      hasErrorAfterRetry: manager.useMeta().hasError.value
    };
  } finally {
    manager.useActions().destroy();
  }
}

describe("useAffiliateLinkManager retry — a client retries a refused link save", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("A client retries a link save after the server refused it, and the second save is sent", async () => {
    const { putBodies, hasErrorAfterRetry } = await refuseThenRetry(false);

    expect(putBodies).toHaveLength(2);
    expect(hasErrorAfterRetry).toBe(false);
  });

  it("A client fixes a refused link and saves again, and the second save carries the fix", async () => {
    const { putBodies, hasErrorAfterRetry } = await refuseThenRetry(true);

    expect(putBodies).toHaveLength(2);
    expect(putBodies[1]).toContain(FIXED_LINK?.name as string);
    expect(putBodies[1]).toContain(
      (FIXED_LINK?.redirect_url as string).split("/").pop() as string
    );
    expect(hasErrorAfterRetry).toBe(false);
  });
});
