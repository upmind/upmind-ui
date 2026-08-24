// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields — the paging door writes through to the
 * wire, not around it (AC-34)
 *
 * ## Job To Be Done
 * Colocated proof for `client-custom-fields.paging-door.must-fail.patch`:
 * `useActions().setCriteria` is the platform's generic criteria door
 * (`useClientCustomFields.actions.ts:248`) that lets a consumer set a page
 * size despite AC-33's mandatory `pagination.limit.default: 0`. This proves
 * the call actually reaches `query.setCriteria` — not a stub that accepts
 * the call and writes nowhere (the FE-2824 shape, reproduced for this one
 * door).
 *
 * ## What Breaks If This Fails
 * A consumer calls `setCriteria({ pagination: { limit: N } })`, the model
 * and the wire never move off the declared `limit=0`, and paging stays
 * silently inert — AC-34 regresses to the disclosed "structurally blocked by
 * AC-33" gap this dispatch closed.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientCustomFields } from "..";
import { observeRequests } from "../../../__tests__/criteria-int-kit";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCriteriaAwareDefinitionsHandler,
  seedClientSession
} from "./client-custom-fields.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-custom-fields — the paging door writes through to the wire (AC-34)", () => {
  it("AC-34 setCriteria({ pagination: { limit: 5 } }) moves the model AND the outbound limit off the declared 0", async () => {
    const { brandId } = await seedClientSession();
    installCriteriaAwareDefinitionsHandler(server, brandId);

    const fields = useClientCustomFields().as(ScopeActorTypes.CLIENT);
    await fields.useActions().isReady();

    const observed = observeRequests(server, "/custom_fields");
    fields.useActions().setCriteria({ pagination: { limit: 5 } });

    await vi.waitFor(() =>
      expect(fields.useContext().query.value.pagination?.limit).toBe(5)
    );
    await vi.waitFor(() => expect(observed.lastParam("limit")).toBe("5"));
    observed.stop();
  });
});
