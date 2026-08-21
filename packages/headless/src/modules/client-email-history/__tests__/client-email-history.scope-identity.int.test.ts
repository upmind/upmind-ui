// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — identity resolved from the scope, never
 * a global flag (AC-19, the FE-2824 shape)
 *
 * ## Job To Be Done
 * `client-email-history.scope-identity.must-fail.patch` reverts
 * `resolveClientId` to branch on the reintroduced global `upmind.admin` flag
 * and re-adds `import upmind from "../../useUpmind"`. Two independent
 * read-backs, per its own "Expected RED" comment:
 *
 * 1. STRUCTURAL — no file in this module references the global flag seam at
 *    all (mirrors T5's own "grep for upmind.admin returns zero hits" done-when,
 *    and `client-email`'s AC-23 "one seam" structural check). This is the
 *    reliable half: it flips red the instant the patch's `import upmind from
 *    "../../useUpmind"` lands, regardless of the flag's runtime value.
 * 2. BEHAVIOURAL — with the flag toggled true (the same public
 *    `upmind.admin = true` switch `Upmind.init({ admin: true })` sets), the
 *    single read's resolved identity must stay the SESSION's own client id,
 *    never drift to the record the scope named with `.withId(id)` (the email
 *    id) — the exact failure the patch's comment names ("for the single read
 *    it resolves to the EMAIL id instead of the session's client id"). The
 *    record id and the identity are two different things, and FE-3095 moving
 *    the id off `config.context` onto `config.id` does not merge them.
 *
 * Per `verify-reality-check.companion.md`'s A7 clause, (2) reads the actual
 * TanStack query cache key the composable minted — never the response payload
 * alone.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientReceivedEmail } from "..";
import upmind from "../../../useUpmind";
import { queryClient } from "../../query/client";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installEmailHistoryHandlers,
  moduleFilesReferencing,
  recorded,
  seedClientSession
} from "./client-email-history.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-email-history — identity resolved from the scope, never a global flag (AC-19)", () => {
  it("AC-19 no module file references the global upmind.admin seam", () => {
    expect(moduleFilesReferencing("useUpmind")).toEqual([]);
  });

  it("AC-19 the single read's identity stays pinned to the session, not the scope-named entity, even with admin toggled true", async () => {
    const { clientId } = await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const fixture = recorded.one();
    handlers.setOneBody(fixture);

    const originalAdmin = upmind.admin;
    upmind.admin = true;
    try {
      const single = useClientReceivedEmail()
        .as(ScopeActorTypes.CLIENT)
        .withId(fixture.data.id);
      await vi.waitFor(() =>
        expect(single.useMeta().isLoading.value).toBe(false)
      );

      const matches = queryClient
        .getQueryCache()
        .getAll()
        .filter(query =>
          JSON.stringify(query.queryKey).includes(fixture.data.id)
        );

      expect(matches.length).toBeGreaterThan(0);
      for (const match of matches) {
        expect(JSON.stringify(match.queryKey)).toContain(clientId);
      }
    } finally {
      upmind.admin = originalAdmin;
    }
  });
});
