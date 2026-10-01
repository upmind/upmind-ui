// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.divergences — DV1, the links name column carries
 * no STARTS_WITH branch (@AC36)
 *
 * ## Job To Be Done
 * Protect design.md §8.7 DV1: the links listing's `name` filter column
 * declares `eq` / `neq` / `like` only (design.md §5.2
 * `AffiliateLinksQueryModel`) — a caller that forces a `startsWith`-shaped
 * write past the type must see it refused on the wire, never silently
 * accepted as a new operator branch.
 *
 * ## Scope note (design.md §8.13 prohibition 1, operator ruling R1)
 * DV1 is the only divergence of this row with a negative control owed this
 * pass — it mutates THIS module's own criteria declaration, not
 * `modules/query` (query-core stays off-limits, `FE-3230 OD5`). DV2-DV5 are
 * characterisation scenarios outside SC-005 (operator ruling R1,
 * 2026-09-28) and carry no control here.
 *
 * ## Control
 * `affiliate.divergences.starts-with.must-fail.patch` retargets the module's
 * own `name` column declaration. The field-level assertion on
 * `filter[name` flips under it: blind-run pass 22, RED, reverted GREEN.
 */
import { describe, expect, it, vi } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateActiveAccount } from "../useAffiliateActiveAccount";
import { useAffiliateLinks } from "../useAffiliateLinks";
import { recordedAccountId, seedRealClient } from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("affiliate.divergences — each recorded divergence behaves as recorded (DV1)", () => {
  it("DV1: a startsWith-shaped write on the links name column is refused, not accepted as a new operator branch", async () => {
    await seedRealClient();
    await useAffiliateActiveAccount()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();

    const accountId = recordedAccountId();
    const links = useAffiliateLinks().as(ScopeActorTypes.CLIENT);
    await links.useActions().isReady();

    const seen: URL[] = [];
    server?.events.on("request:end", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/affiliate/links")) seen.push(url);
    });

    // `AffiliateLinksQueryModel.filters.name` (affiliate.types.ts) declares
    // `eq` / `neq` / `like` only — forced past the type to prove the RUNTIME
    // refusal, not merely a compile-time one. A real `sort` change rides
    // alongside it so the query key changes for a legitimate reason too —
    // an invalid-only filter key can be normalised away with no key change
    // at all, which would leave `seen` empty for a reason unrelated to DV1.
    links.useActions().setCriteria({
      sort: [{ field: "visit_count", dir: "desc" }],
      filters: { name: { startsWith: "Affiliate" } }
    } as never);

    await vi.waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    await links.useActions().isReady();

    expect(seen[0].pathname).toBe(`/api/accounts/${accountId}/affiliate/links`);
    for (const [key] of seen[0].searchParams.entries()) {
      expect(key.startsWith("filter[name")).toBe(false);
    }
    // Characterisation, not a discriminating control (same as
    // `affiliate.links-criteria.int.test.ts`'s row checks): only one real
    // row exists for this route, served for any query string, so this pins
    // that a refused branch never blocks the read itself — it cannot tell a
    // fresh filtered response apart from the stale first-load response.
    expect(links.useContext().data.value).toHaveLength(1);
  });
});
