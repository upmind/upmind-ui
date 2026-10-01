// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.cell-boundary — the module never reaches an
 * administrator path (@AC35, matrix-loop half)
 *
 * ## Job To Be Done
 * Protect the actor boundary at run time (design.md §5.2, §5.2 "What a
 * matrix cell means"): over a CLIENT session, every actor key other than
 * CLIENT and SELF — STAFF and GUEST — gets `isAvailable` false and sends
 * zero requests on each client composable, because each composable's own
 * scope-actor check refuses any resolved actor other than CLIENT. This is
 * the run-time half of the refusal the compile-time `.for()` probe
 * (`affiliate.types.test.ts`) proves cannot even be spelled.
 *
 * ## What Breaks If These Fail
 * A STAFF or GUEST actor over a live client session could read or change
 * that client's affiliate data — an on-behalf capability the oracle never
 * grants (parity.yaml: client×self and guest×self are the only two cells).
 *
 * ## Carry-in fix applied (plan-carry-in.md W3)
 * "AC35 matrix loop says 'zero requests' without the module-path exclusion.
 * Building `useClientAffiliate` ... calls `useBrand()` in the factory, which
 * starts four singleton reads ... count only the module paths ... leave out
 * the four `useBrand()` reads." This spec's zero-request assertion filters
 * to `/accounts/`, `/affiliate`, `self` and `affiliate_link/visit` paths —
 * never `/brand/settings`, `/org/modules` or `/config/organisation/values`.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write and
 * asserts no failure branch of its own.
 *
 * ## i18n-namespace proof (code-review blocker, REVISE pass 17)
 * Each manager's own scope-actor guard also sets a real, translated error —
 * `errors.value` holds `t('error.affiliate_link_not_available')` /
 * `t('error.affiliate_payout_destination_not_available')`, never the bare
 * key — discovered by probing this exact path before either key was loaded
 * into `setup.integration.ts`'s `error` namespace (the untranslated run
 * printed the literal key string). History: `__tests__/CONTROLS.md`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateCommissions } from "../useAffiliateCommissions";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import { useAffiliateLinks } from "../useAffiliateLinks";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
import { useAffiliatePayouts } from "../useAffiliatePayouts";
import { useAffiliateReferrals } from "../useAffiliateReferrals";
import { useClientAffiliate } from "../useClientAffiliate";
import { seedRealClient } from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/**
 * `@workspace/no-cross-package-path-imports` bars a relative path reaching
 * across a package boundary — `packages/i18n` publishes no subpath specifier
 * for its locale source JSON. `readFileSync(join(...))` is the sibling
 * pattern this repo already uses for the SAME class of file
 * (`client-company.manager.int.test.ts`), resolved off `import.meta.dirname`
 * — never `process.cwd()`, which breaks if vitest runs from a cwd other than
 * `packages/headless` (pseudo-Nathan review pass 20). A scratch probe this
 * pass confirmed `import.meta.dirname` resolves a real, correct absolute path
 * in this exact happy-dom integration project; only the OTHER construction,
 * `new URL(relative, import.meta.url).pathname`, is the broken one
 * `setup.integration.ts`'s own `recordingsDir` comment names.
 */
const errorEn = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "../../../../../i18n/src/core/error-en.json"),
    "utf-8"
  )
) as Record<string, string>;

/** design.md §8.1 "The module paths are the reads of the table above and the writes of §8.2." */
function isModulePath(path: string): boolean {
  return (
    path.includes("/accounts/") ||
    path.endsWith("/self") ||
    path.includes("/affiliate_link/")
  );
}

describe("affiliate.cell-boundary — the module never reaches an administrator path", () => {
  beforeEach(async () => {
    await seedRealClient();
    // Settle the resolver before any manager is built — an unsettled
    // `activeAccountId` (still `undefined`) refuses a STAFF/GUEST manager for
    // that reason alone, not because of its own scope-actor guard, and would
    // stay green under a mutant that drops that guard entirely
    // (useAffiliateLinkManager.int.test.ts:54 uses the same settle).
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
  });

  async function assertActorDenied(actor: ScopeActorTypes): Promise<void> {
    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const path = new URL(request.url).pathname;
      if (isModulePath(path)) seen.push(`${request.method} ${path}`);
    });

    const affiliate = useClientAffiliate().as(actor);
    const links = useAffiliateLinks().as(actor);
    // Extends the loop to both managers — a mutant that drops either
    // manager's own scope-actor guard
    // (useAffiliateLinkManager.link-manager-any-actor.must-fail.patch,
    // useAffiliatePayoutDestinationManager.payout-manager-any-actor.must-fail.patch)
    // has no other spec in this file that can flip it. History: CONTROLS.md.
    const linkManager = useAffiliateLinkManager().as(actor).fresh();
    const payoutManager = useAffiliatePayoutDestinationManager()
      .as(actor)
      .fresh();

    try {
      // Settle each composable's own boot work before reading `seen` — a
      // mutant that drops the scope-actor check still sends its request
      // asynchronously, and a same-tick read would stay green over it.
      await Promise.all([
        affiliate.useActions().isReady(),
        links.useActions().isReady(),
        linkManager.useActions().isReady(),
        payoutManager.useActions().isReady()
      ]);

      expect(affiliate.useMeta().isAvailable.value).toBe(false);
      expect(links.useMeta().isAvailable.value).toBe(false);
      expect(linkManager.useMeta().isAvailable.value).toBe(false);
      expect(payoutManager.useMeta().isAvailable.value).toBe(false);
      expect(seen).toEqual([]);

      // A real, translated error — never the bare i18n key — because
      // setup.integration.ts loads these two real `error-en.json` key values
      // (confirmed present by this exact unprefixed-key probe: the untranslated
      // run printed the literal key strings below, verbatim, before this
      // file's own error namespace was loaded). A mutant that drops the
      // `error.` prefix (the i18n-namespace control) leaves `t()` unable to
      // resolve the key, so the bare key string surfaces instead of either
      // real sentence.
      expect(linkManager.useContext().errors.value).toBe(
        errorEn.affiliate_link_not_available
      );
      expect(payoutManager.useContext().errors.value).toBe(
        errorEn.affiliate_payout_destination_not_available
      );
    } finally {
      linkManager.useActions().destroy();
      payoutManager.useActions().destroy();
    }
  }

  // Two static `it()` titles, not `it.each` — the traceability gate reads
  // static title strings only (design.md §8.11 AC37 row: "The spec uses no
  // it.each and no template-literal title").
  it("over a client session, STAFF gets isAvailable false and sends zero module-path requests", async () => {
    await assertActorDenied(ScopeActorTypes.STAFF);
  });

  it("over a client session, GUEST gets isAvailable false and sends zero module-path requests", async () => {
    await assertActorDenied(ScopeActorTypes.GUEST);
  });

  it("none of the observed paths of a CLIENT session contains 'admin'", async () => {
    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      seen.push(new URL(request.url).pathname);
    });

    // bdd.md AC35 "Paths: run each composable" — not one alone.
    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    const referrals = useAffiliateReferrals().as(ScopeActorTypes.CLIENT);
    const commissions = useAffiliateCommissions().as(ScopeActorTypes.CLIENT);
    const payouts = useAffiliatePayouts().as(ScopeActorTypes.CLIENT);

    await Promise.all([
      affiliate.useActions().isReady(),
      links.useActions().isReady(),
      referrals.useActions().isReady(),
      commissions.useActions().isReady(),
      payouts.useActions().isReady()
    ]);

    expect(seen.length).toBeGreaterThan(0);
    for (const path of seen) {
      expect(path, path).not.toContain("admin");
    }
  });
});
