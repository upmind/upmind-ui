// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields — a cache verb reaches one catalogue only
 * (AC-7, integration)
 *
 * ## Job To Be Done
 * `invalidate()` re-reads MY definitions and nothing else (AC-7). With a second
 * catalogue open in the same session, "nothing else" includes the sibling
 * catalogue: the key the verb scopes onto names which catalogue it holds, so
 * pressing invalidate on one never drops the other's warm rows
 * (`client-custom-fields.types.ts`, `ClientCustomFieldsServices.queryKey`).
 *
 * ## What Breaks If These Fail
 * One invalidate press refetches every catalogue a page has open — a prefix
 * match with nothing to narrow it — so a consumer's untouched catalogue blanks
 * and re-reads behind them.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientCustomFieldsContextTypes, useClientCustomFields } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCatalogueAwareDefinitionsHandler,
  recordedIds,
  resetClientCustomFieldsScopes,
  seedClientSession
} from "./client-custom-fields.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

afterEach(() => {
  resetClientCustomFieldsScopes();
});

/** Both catalogues open on one session, each already read once. */
async function bootBothCatalogues(): Promise<{
  clientCatalogue: ReturnType<ReturnType<typeof useClientCustomFields>["as"]>;
  cancelCatalogue: ReturnType<ReturnType<typeof useClientCustomFields>["as"]>;
  reads: (objectType: string) => number;
}> {
  const { brandId: corpusBrandId } = recordedIds();
  const { brandId } = await seedClientSession({ brandId: corpusBrandId });
  const handler = installCatalogueAwareDefinitionsHandler(server, brandId);

  const clientCatalogue = useClientCustomFields().as(ScopeActorTypes.CLIENT);
  await clientCatalogue.useActions().isReady();
  const cancelCatalogue = useClientCustomFields()
    .as(ScopeActorTypes.CLIENT)
    .for(ClientCustomFieldsContextTypes.CANCEL_REQUEST);
  await cancelCatalogue.useActions().isReady();

  await vi.waitFor(() => {
    expect(handler.reads("client")).toBeGreaterThan(0);
    expect(handler.reads("contract_request")).toBeGreaterThan(0);
  });

  return { clientCatalogue, cancelCatalogue, reads: handler.reads };
}

// -----------------------------------------------------------------------------

describe("client-custom-fields — invalidate reaches one catalogue only (AC-7)", () => {
  it("AC-7 invalidating the cancellation-request catalogue re-reads it and leaves the client catalogue alone", async () => {
    const { cancelCatalogue, reads } = await bootBothCatalogues();
    const clientReadsBefore = reads("client");
    const cancelReadsBefore = reads("contract_request");

    await cancelCatalogue.useActions().invalidate();

    await vi.waitFor(() =>
      expect(reads("contract_request")).toBeGreaterThan(cancelReadsBefore)
    );
    await new Promise(resolve => setTimeout(resolve, 250));
    expect(reads("client")).toBe(clientReadsBefore);
  });

  it("AC-7 invalidating the client catalogue re-reads it and leaves the cancellation-request catalogue alone", async () => {
    const { clientCatalogue, reads } = await bootBothCatalogues();
    const clientReadsBefore = reads("client");
    const cancelReadsBefore = reads("contract_request");

    await clientCatalogue.useActions().invalidate();

    await vi.waitFor(() =>
      expect(reads("client")).toBeGreaterThan(clientReadsBefore)
    );
    await new Promise(resolve => setTimeout(resolve, 250));
    expect(reads("contract_request")).toBe(cancelReadsBefore);
  });
});
