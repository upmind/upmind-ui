// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.programme-gate — the programme opens only when
 * both brand settings are on (@AC1)
 *
 * ## Job To Be Done
 * Protect the AND of the two `config/brand/values` gate keys
 * (`UPMIND_AFFILIATES_ENABLED`, `UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED`,
 * design.md §8.1, §10.1 P7): a client must see the programme as available
 * only when BOTH settings are on, never on one alone.
 *
 * ## What Breaks If These Fail
 * A brand with only one of the two settings on would show the affiliate
 * area as available when the oracle's AND gate says it should not be.
 *
 * ## Capture gap — CLOSED this pass (config-key fixture fix)
 * A prior pass's fixture generator sent the `keys` parameter as the
 * TypeScript `BrandConfigKeys` enum MEMBER NAMES
 * (`UPMIND_AFFILIATES_ENABLED`) instead of the enum's real dotted wire
 * VALUES, so staging answered `data: []` on every gate request regardless of
 * the brand's actual setting — a fixture bug, not the brand's real state.
 * `affiliate.fixtures.ts` now imports `BrandConfigKeys` and sends its real
 * values, and the re-recorded capture shows BOTH gate keys ON
 * (`affiliate_systems.upmind.enabled: true`,
 * `affiliate_systems.upmind.customer_controls_enabled: true`). The "both
 * gate keys on" cell below is now a REAL, unmodified recorded proof, not a
 * `@todo`. ADR-025 decision 5 still bars building this from ANOTHER unit's
 * capture — this is this unit's own re-recorded envelope.
 *
 * ## Named gap — the one-on/one-off combination (honestly disclosed)
 * Proving the AND rather than an OR needs a real capture with exactly one of
 * the two gate keys set. No known staging brand has that combination.
 * ADR-035's ARRANGE-RECORD-RESET convention (a staff account temporarily
 * toggles the brand's own config, records, then resets it) could build one,
 * but toggling `config/brand/values` goes through a staff-authenticated
 * admin-path write, and this story's run constraints bar admin paths. Stays
 * `@todo` in `affiliate.feature`, named there rather than silently dropped.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec sends no write, so
 * it carries no 4xx/5xx/401 case of its own — `affiliate.error-reload`
 * proves the gate-settings-read failure.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useClientAffiliate } from "../useClientAffiliate";
import { seedRealClient } from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("affiliate.programme-gate — the programme opens only when both brand settings are on", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  // Named for what it proves, not the full AND gate: the one real capture
  // this unit can seed now carries BOTH keys on, so this proves the true
  // positive cell. It does not, on its own, rule out an OR (a mutant that
  // returns true on either key alone would still pass here) — the
  // one-on/one-off combination stays `@todo` (no known staging brand has it).
  it("A brand with both gate keys on opens the programme", async () => {
    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    expect(affiliate.useMeta().isProgrammeEnabled.value).toBe(true);
  });

  it("the gate request carries the two keys and no brand_id", async () => {
    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/config/brand/values")) seen.push(url.search);
    });

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();

    // The real wire query carries the `BrandConfigKeys` enum's dotted VALUE
    // strings, not its TS-identifier name — confirmed against the actual
    // observed request, not the symbolic name design.md's prose uses.
    const gateRequest = seen.find(search =>
      search.includes("affiliate_systems.upmind.enabled")
    );
    expect(gateRequest).toBeDefined();
    expect(gateRequest).toContain(
      "affiliate_systems.upmind.customer_controls_enabled"
    );
    expect(gateRequest).not.toContain("brand_id");
  });
});
