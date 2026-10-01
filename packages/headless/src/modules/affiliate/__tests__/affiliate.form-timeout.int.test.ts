// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate — each manager's readiness wait is BOUNDED against a
 * lookup chain that never returns (design.md §8.4 rule 6, §8.6 "loading")
 *
 * ## Job To Be Done
 * Prove each manager's `isReady()` rejects with a CATCHABLE, real, translated
 * form-timeout error once its own bound passes — never hangs forever, and
 * never surfaces the bare i18n key (pseudo-Nathan review pass 19, cardinal
 * call 2: "a timeout you never waited for has not been shown unreachable").
 * Same shape as `client-address.manager-readiness.int.test.ts`'s own proven
 * bound.
 *
 * ## Why this is its OWN file, and ONE test
 * Each manager is built fresh with `.fresh()`, but the stalled handler must be
 * the first lookup this process sends on that route — a prior test's warm
 * cache would answer from it instead of reaching the stall. Both managers
 * stall on disjoint routes, so their ~15s bounds run in parallel inside one
 * test (about 15s of wall time, not 30s); `expect.soft` keeps each manager's
 * assertion independent so a per-site control flips only its own.
 *
 * ## What Breaks If These Fail
 * A client who opens an editor behind a lookup that never answers sees no
 * error, ever — the form stays "loading" with nothing a consumer can show or
 * catch (hazard class: client-address AC-26's `timeout: Infinity` precedent).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateLinkManager } from "../useAffiliateLinkManager";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
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

/**
 * The real ceiling discovered by a scratch, never-committed probe exercising
 * each manager's own readiness wait against a lookup that never returns —
 * both managers rejected at ~15.0-15.1s under a 16s race and a 20s wait
 * never hung. Set above that measured ceiling, well under vitest's own
 * 30000ms per-test timeout.
 */
const FORM_TIMEOUT_BOUND_MS = 20000;

async function raceReady(
  isReady: () => Promise<boolean>
): Promise<{ kind: "resolved" | "rejected" | "hung"; error?: unknown }> {
  return Promise.race([
    isReady().then(
      () => ({ kind: "resolved" as const }),
      error => ({ kind: "rejected" as const, error })
    ),
    new Promise<{ kind: "hung" }>(resolve =>
      setTimeout(() => resolve({ kind: "hung" }), FORM_TIMEOUT_BOUND_MS)
    )
  ]);
}

describe("affiliate managers — every readiness wait is bounded (pseudo-Nathan review pass 19, cardinal call 2)", () => {
  it("both managers' readiness waits reject with their real translated form-timeout text once their lookups never return", async () => {
    await seedRealClient();
    server?.use(
      http.get("*/self*", () => new Promise<never>(() => {})),
      http.get(
        "*/affiliate_payout_destination*",
        () => new Promise<never>(() => {})
      ),
      http.get("*/emails*", () => new Promise<never>(() => {}))
    );

    const linkManager = useAffiliateLinkManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    const payoutManager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      const [linkOutcome, payoutOutcome] = await Promise.all([
        raceReady(() => linkManager.useActions().isReady()),
        raceReady(() => payoutManager.useActions().isReady())
      ]);

      expect.soft(linkOutcome.kind).toBe("rejected");
      expect
        .soft(String((linkOutcome.error as Error)?.message))
        .toBe(errorEn.affiliate_link_form_timeout);
      expect.soft(payoutOutcome.kind).toBe("rejected");
      expect
        .soft(String((payoutOutcome.error as Error)?.message))
        .toBe(errorEn.affiliate_payout_destination_form_timeout);
    } finally {
      linkManager.useActions().destroy();
      payoutManager.useActions().destroy();
    }
  }, 30000);
});
