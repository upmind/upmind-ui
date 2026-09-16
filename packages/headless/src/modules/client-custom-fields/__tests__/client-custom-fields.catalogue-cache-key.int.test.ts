// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields — two catalogues, two cache entries
 * (AC-35, integration)
 *
 * ## Job To Be Done
 * Reopening a catalogue must not fetch it again (AC-35), and the entry it is
 * served from is the CATALOGUE's own: the list key carries which catalogue it
 * holds, so a sibling catalogue's read never lands on it. Prove two catalogues
 * read in the same session each keep their own rows, and that returning to one
 * already read is still a cache hit.
 *
 * The client catalogue's rows are this module's RECORDED corpus; the
 * cancellation-request catalogue answers zero rows for the recording brand,
 * which is what staging itself returns (`docs/sdd/FE-3034/review-notes.md`,
 * 2026-09-16). Neither row set is authored.
 *
 * ## What Breaks If These Fail
 * Two catalogues collide on one cache entry: opening the cancellation-request
 * catalogue blanks the client catalogue a consumer is already rendering, and
 * whichever catalogue read last wins for every consumer of either.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientCustomFieldsContextTypes, useClientCustomFields } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCatalogueAwareDefinitionsHandler,
  recordedDefinitions,
  recordedIds,
  resetClientCustomFieldsScopes,
  seedClientSession
} from "./client-custom-fields.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

afterEach(() => {
  resetClientCustomFieldsScopes();
});

async function seedCorpusSession(): Promise<{
  reads: (objectType: string) => number;
}> {
  const { brandId: corpusBrandId } = recordedIds();
  const { brandId } = await seedClientSession({ brandId: corpusBrandId });
  return installCatalogueAwareDefinitionsHandler(server, brandId);
}

// -----------------------------------------------------------------------------

describe("client-custom-fields — a catalogue's cache entry is its own (AC-35)", () => {
  it("AC-35 reading a second catalogue leaves the first catalogue's rows where they were", async () => {
    await seedCorpusSession();
    const expectedClientRows = recordedDefinitions().length;

    const clientCatalogue = useClientCustomFields().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(clientCatalogue.useContext().data.value).toHaveLength(
        expectedClientRows
      )
    );

    const cancelCatalogue = useClientCustomFields()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientCustomFieldsContextTypes.CANCEL_REQUEST);
    await cancelCatalogue.useActions().isReady();

    await vi.waitFor(() =>
      expect(cancelCatalogue.useContext().data.value).toHaveLength(0)
    );
    expect(clientCatalogue.useContext().data.value).toHaveLength(
      expectedClientRows
    );
  });

  it("AC-35 each catalogue is read once — neither is served from the other's entry", async () => {
    const handler = await seedCorpusSession();

    const clientCatalogue = useClientCustomFields().as(ScopeActorTypes.CLIENT);
    await clientCatalogue.useActions().isReady();
    const cancelCatalogue = useClientCustomFields()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientCustomFieldsContextTypes.CANCEL_REQUEST);
    await cancelCatalogue.useActions().isReady();

    await vi.waitFor(() => expect(handler.reads("contract_request")).toBe(1));
    expect(handler.reads("client")).toBe(1);
  });

  it("AC-35 returning to a catalogue already read fetches nothing further", async () => {
    const handler = await seedCorpusSession();

    await useClientCustomFields()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientCustomFieldsContextTypes.CANCEL_REQUEST)
      .useActions()
      .isReady();
    await vi.waitFor(() => expect(handler.reads("contract_request")).toBe(1));

    await useClientCustomFields()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientCustomFieldsContextTypes.CANCEL_REQUEST)
      .useActions()
      .isReady();

    await new Promise(resolve => setTimeout(resolve, 250));
    expect(handler.reads("contract_request")).toBe(1);
  });
});
