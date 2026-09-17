// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields — two catalogues, two cache entries
 * (AC-40/AC-39/AC-35, integration)
 *
 * ## Job To Be Done
 * Reopening a catalogue must not fetch it again (AC-35), and the entry it is
 * served from is the CATALOGUE's own: the list key carries which catalogue it
 * holds, so a sibling catalogue's read never lands on it (AC-40). The client
 * default is the one catalogue that carries NO such segment — its key stays the
 * one a catalogue-blind reader built, so every consumer that names no catalogue
 * keeps the entry it always had (AC-39, plan Correction 2).
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
import { queryClient } from "../../query/client";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCatalogueAwareDefinitionsHandler,
  recordedDefinitions,
  recordedIds,
  resetClientCustomFieldsScopes,
  seedClientSession
} from "./client-custom-fields.int-helpers";
import { server } from "./setup.integration";
import { filter, first, includes, isEqual, map, reject, take } from "lodash-es";

// -----------------------------------------------------------------------------

afterEach(() => {
  resetClientCustomFieldsScopes();
});

/**
 * The identity prefix the plan's Correction 2 is written against — the
 * catalogue-blind head every consumer that names no catalogue held before the
 * axis existed. The tail segment is the criteria model, which no catalogue
 * touches.
 */
const preAxisKeyHead = (clientId: string, brandId: string): unknown[] => [
  "client",
  "customFields",
  { client: clientId, brand: brandId }
];

/**
 * The definitions-list keys this module holds in the shared cache, once the
 * brand has resolved — the transient key a boot holds while `brand` is still
 * `undefined` is not an entry any consumer is ever served from.
 */
function settledListKeys(brandId: string): unknown[][] {
  return map(
    filter(queryClient.getQueryCache().getAll(), query => {
      const key = JSON.stringify(query.queryKey);
      return includes(key, "customFields") && includes(key, brandId);
    }),
    query => query.queryKey as unknown[]
  );
}

async function seedCorpusSession(): Promise<{
  reads: (objectType: string) => number;
  clientId: string;
  brandId: string;
}> {
  const { brandId: corpusBrandId } = recordedIds();
  const session = await seedClientSession({ brandId: corpusBrandId });
  return {
    ...installCatalogueAwareDefinitionsHandler(server, session.brandId),
    clientId: session.clientId,
    brandId: session.brandId
  };
}

// -----------------------------------------------------------------------------

describe("client-custom-fields — a catalogue's cache entry is its own (AC-40/AC-35)", () => {
  it("AC-40 reading a second catalogue leaves the first catalogue's rows where they were", async () => {
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

  it("AC-40 each catalogue is read once — neither is served from the other's entry", async () => {
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

describe("client-custom-fields — the client default keeps the key it always had (AC-39)", () => {
  it("AC-39 a consumer naming no catalogue holds the catalogue-blind key, with no object-type axis in it", async () => {
    const { clientId, brandId } = await seedCorpusSession();

    await useClientCustomFields()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
    await vi.waitFor(() => expect(settledListKeys(brandId)).toHaveLength(1));

    const [key] = settledListKeys(brandId);
    expect(take(key, 3)).toEqual(preAxisKeyHead(clientId, brandId));
    expect(JSON.stringify(key)).not.toContain("object_type");
    expect(JSON.stringify(key)).not.toContain(
      ClientCustomFieldsContextTypes.INVOICE
    );
    expect(JSON.stringify(key)).not.toContain(
      ClientCustomFieldsContextTypes.CANCEL_REQUEST
    );
  });

  it("AC-39 naming a catalogue opens a second entry beside the default's and rewrites neither", async () => {
    const { clientId, brandId } = await seedCorpusSession();

    await useClientCustomFields()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .isReady();
    await vi.waitFor(() => expect(settledListKeys(brandId)).toHaveLength(1));
    const defaultKey = first(settledListKeys(brandId)) as unknown[];
    expect(take(defaultKey, 3)).toEqual(preAxisKeyHead(clientId, brandId));

    await useClientCustomFields()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientCustomFieldsContextTypes.INVOICE)
      .useActions()
      .isReady();
    await vi.waitFor(() => expect(settledListKeys(brandId)).toHaveLength(2));

    expect(settledListKeys(brandId)).toContainEqual(defaultKey);
    const added = reject(settledListKeys(brandId), key =>
      isEqual(key, defaultKey)
    );
    expect(added).toHaveLength(1);
    expect(JSON.stringify(first(added))).toContain(
      ClientCustomFieldsContextTypes.INVOICE
    );
  });
});
