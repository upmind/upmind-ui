// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.links-list — the links read for the active account
 * (@AC7 read/failure half; AC8/AC9/AC12/AC13's filter/sort/paginate/create/
 * edit/delete halves stay `@todo` in affiliate.feature — this account carries
 * exactly one real recorded link, so a real pagination boundary cannot be
 * captured; see the module hand-off)
 *
 * ## Job To Be Done
 * Protect that `useAffiliateLinks` reads the active account's own referral
 * links, with `with_staged_imports=1` on the wire, and reports the read
 * failure honestly (design.md §8.1, §8.2 Failure surface, AC7 row). Each row
 * carries its shareable `referral_url`, `{referralOrigin}/aff/{hash}`.
 *
 * ## What Breaks If These Fail
 * A client would see no referral link at all (or someone else's), or a
 * transient API failure would look like "you have never created a link", or
 * a listed link would carry no URL the client can share.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec's failure case is the
 * documented 500-only 4xx/5xx surface for the four listing reads — no other
 * 4xx is a module code path for a read with no body.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { referralOrigin } from "../affiliate.utils";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinks } from "../useAffiliateLinks";
import {
  recordedAccountId,
  seedRealClient,
  serveFailure
} from "./affiliate.int-helpers";
import {
  installGuestTokenLangTolerance,
  recorded,
  server
} from "./setup.integration";
import type { IBrand } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const LINKS_ROUTE = "*/api/accounts/:accountId/affiliate/links";

describe("affiliate.links-list — the links read for the active account", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("reads the active account's own links, with with_staged_imports=1 on the wire", async () => {
    // The resolver must publish the active account BEFORE this collection is
    // built — a collection's own `isReady()` settles at once, with zero rows
    // and zero requests, while `keyAccountId` is still undefined (design.md
    // §8.4 Consumers: "Its `isAvailable` is false, and it sends no request,
    // while the id is undefined"), exactly as the landed
    // `affiliate.no-account` spec awaits the resolver first.
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/links")) {
        seen.push(`${url.pathname}${url.search}`);
      }
    });

    const accountId = recordedAccountId();
    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();

    // Read from the recorded links capture itself, never a hand-copied
    // literal — `visit_count` is live traffic on this real link (a guest
    // visit spec in this same unit increments it), so it drifts on every
    // re-record too.
    const rawLinks = recorded<{
      data?: { id?: string; hash?: string; visit_count?: number }[];
    }>("get-accounts-id-affiliate-links-with-staged-imports-1").data;
    const rows = links.useContext().data.value;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(rawLinks?.[0]?.id);
    expect(rows[0].name).toBe("Affiliate Starter Hosting");
    expect(rows[0].hash).toBe(rawLinks?.[0]?.hash);
    expect(rows[0].redirect_url).toBe(
      "http://kn6x1dzbtcgb.staging.upmind.dev/order/product?pid=3de78642-de53-9714-76df-21208469530d"
    );
    expect(rows[0].visit_count).toBe(rawLinks?.[0]?.visit_count);
    expect(rows[0].referral_count).toBe(0);

    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain(`/accounts/${accountId}/affiliate/links`);
    expect(seen[0]).toContain("with_staged_imports=1");
  });

  it("reports a failed links read, and a refresh asks again", async () => {
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
    serveFailure("get", LINKS_ROUTE);

    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();

    expect(links.useMeta().hasError.value).toBe(true);
    expect(links.useContext().error.value).toBeTruthy();
    expect(links.useContext().data.value).toEqual([]);

    // Remove the failure override before the refresh — bdd.md AC7 asks a
    // refresh again, of the real read, not of the same forced failure.
    // `resetHandlers()` also strips the guest-token lang-tolerance handler
    // `setup.integration.ts`'s own `beforeEach` installed for this test —
    // reinstall it so a later guest-token exchange in this same test cannot
    // hang on the pre-existing environment defect that handler works around.
    server?.resetHandlers();
    installGuestTokenLangTolerance();

    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/links")) seen.push(url.pathname);
    });

    await links.useActions().refresh();

    expect(seen).toHaveLength(1);
    expect(links.useMeta().hasError.value).toBe(false);
    expect(links.useContext().data.value).toHaveLength(1);
  });

  it("each listed referral link carries its shareable referral URL", async () => {
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();

    const accountBrand = recorded<{ data?: { account?: { brand?: IBrand } } }>(
      "get-accounts-id-affiliate-with-staged-imports-1"
    ).data?.account?.brand;
    const defaultClientOrigin = accountBrand?.oauth_clients?.find(
      client => client.default
    )?.origin;
    const origin = referralOrigin(accountBrand);
    expect(defaultClientOrigin).toBeTruthy();
    expect(origin).toContain(defaultClientOrigin);

    const rawLinks = recorded<{ data?: { id?: string; hash?: string }[] }>(
      "get-accounts-id-affiliate-links-with-staged-imports-1"
    ).data;
    const hash = rawLinks?.[0]?.hash;
    expect(hash).toBeTruthy();

    await expect
      .poll(() => links.useContext().data.value[0]?.referral_url)
      .toBe(`${origin}/aff/${hash}`);
    expect(links.useContext().data.value[0]?.id).toBe(rawLinks?.[0]?.id);
  });
});

// The page-mount-order race (F-2) is proven generically, for this
// composable, by affiliate.boot-order.int.test.ts's own bootFreshRealm
// scenario — not restated here.
