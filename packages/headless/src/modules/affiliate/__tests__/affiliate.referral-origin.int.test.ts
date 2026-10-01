// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.referral-origin — an account with no brand relation
 * takes the client's own brand (@AC13, P81, D-24)
 *
 * ## Job To Be Done
 * Protect design.md §8.5: `brand` is `data.account.brand`, and when that
 * relation is absent it is the client brand of the module-owned self read.
 * `referralOrigin` reads `brand`, so a client whose account carries no brand
 * relation must still get a brand from their own self record, and the module
 * must send that self read itself.
 *
 * ## What Breaks If These Fail
 * A client whose account response carries no brand relation sees no brand at
 * all, so no referral origin can ever be derived for them.
 *
 * ## Recordings used
 * `otherClient`'s own recorded `self` seeds the session, and its real recorded
 * enrolled-account read (`case=enrolled-otherclient`), whose body carries no
 * `account` relation (so no `account.brand`), is served on the account route.
 * The module's own self read is served that same client's recorded `self`.
 * Everything is served verbatim, nothing is edited.
 *
 * Named gap (W3, CONTROLS.md): that account capture was recorded for a request
 * that did not ask for the `account` relation, and the module's own read does
 * ask for it. Staging always returns the relation it is asked for, so the
 * module's exact request cannot be recorded read-only for any client whose
 * account omits its brand, and no other recording omits it.
 *
 * Stated omissions: the recorded self brand carries no `oauth_clients`, so the
 * published origin itself is `""` under the fallback and under its absence.
 * `brand` is the observable that tells the two apart.
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useClientAffiliate } from "../useClientAffiliate";
import {
  OTHER_CLIENT_SELF_CAPTURE,
  recordedSelf,
  seedRecordedClient,
  serveCapture
} from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("affiliate.referral-origin — the brand falls back to the client's own brand", () => {
  it("A client whose account carries no brand relation gets the brand of their own self record, read by the module", async () => {
    await seedRecordedClient(OTHER_CLIENT_SELF_CAPTURE);
    serveCapture(
      "get",
      "*/api/accounts/:accountId/affiliate",
      "get-accounts-id-affiliate-case-enrolled-otherclient-with-staged-imports-1"
    );
    serveCapture("get", "*/api/self", OTHER_CLIENT_SELF_CAPTURE);

    const selfReads: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (request.method === "GET" && url.pathname.endsWith("/self"))
        selfReads.push(url.search);
    });

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    const expectedBrand = recordedSelf(OTHER_CLIENT_SELF_CAPTURE).actor?.brand;
    expect(expectedBrand?.id).toBeTruthy();

    await expect
      .poll(() => affiliate.useContext().brand.value?.id)
      .toBe(expectedBrand?.id);
    expect(selfReads.length).toBeGreaterThan(0);
  });
});
