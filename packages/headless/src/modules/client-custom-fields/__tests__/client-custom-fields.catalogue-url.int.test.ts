// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields — the declared catalogue reaches the wire
 * (AC-32, integration)
 *
 * ## Job To Be Done
 * A catalogue context names WHICH catalogue is read, and the type IS the whole
 * answer (`client-custom-fields.types.ts`, `ClientCustomFieldsContextTypes`).
 * Prove that each catalogue a consumer declares with `.for(...)` leaves as that
 * catalogue's own `filter[object_type]`, that a consumer declaring nothing still
 * reads the client catalogue, and that no catalogue can be reached through the
 * criteria model instead.
 *
 * Only the OUTBOUND request is read back here: the recording brand carries no
 * `contract_request` field, so that catalogue's response rows are an open
 * capture (`docs/sdd/FE-3034/review-notes.md`, 2026-09-16) and nothing is
 * asserted about them.
 *
 * ## What Breaks If These Fail
 * Every scope silently reads the client catalogue however it was declared — the
 * catalogue axis is advertised on the matrix and absent on the wire — or the
 * default consumer's catalogue goes empty and the API answers whatever it
 * defaults to.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientCustomFieldsContextTypes, useClientCustomFields } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCatalogueAwareDefinitionsHandler,
  observeRequests,
  recordedIds,
  resetClientCustomFieldsScopes,
  seedClientSession
} from "./client-custom-fields.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

afterEach(() => {
  resetClientCustomFieldsScopes();
});

/** The wire value each catalogue member carries, per `review-scope-axis.md` §4. */
const CATALOGUE_WIRE = {
  client: "client",
  invoice: "invoice",
  cancelRequest: "contract_request"
} as const;

async function seedCorpusSession(): Promise<void> {
  const { brandId: corpusBrandId } = recordedIds();
  const { brandId } = await seedClientSession({ brandId: corpusBrandId });
  installCatalogueAwareDefinitionsHandler(server, brandId);
}

async function catalogueParamOf(boot: () => void): Promise<(string | null)[]> {
  const observed = observeRequests("/custom_fields");
  boot();
  await vi.waitFor(() => expect(observed.count()).toBeGreaterThan(0));
  observed.stop();
  return observed
    .all()
    .map(request =>
      new URL(request.url).searchParams.get("filter[object_type]")
    );
}

// -----------------------------------------------------------------------------

describe("client-custom-fields — the declared catalogue is what the wire asks for (AC-32)", () => {
  it("AC-32 a consumer declaring no catalogue reads the client catalogue", async () => {
    await seedCorpusSession();

    const observedTypes = await catalogueParamOf(() => {
      void useClientCustomFields()
        .as(ScopeActorTypes.CLIENT)
        .useActions()
        .isReady();
    });

    expect(observedTypes).toContain(CATALOGUE_WIRE.client);
    expect(observedTypes).not.toContain(null);
    expect(observedTypes).not.toContain("");
  });

  it("AC-32 .for(INVOICE) reads the invoice catalogue, never the client one", async () => {
    await seedCorpusSession();

    const observedTypes = await catalogueParamOf(() => {
      void useClientCustomFields()
        .as(ScopeActorTypes.CLIENT)
        .for(ClientCustomFieldsContextTypes.INVOICE)
        .useActions()
        .isReady();
    });

    expect(observedTypes).toContain(CATALOGUE_WIRE.invoice);
    expect(observedTypes).not.toContain(CATALOGUE_WIRE.client);
  });

  it("AC-32 .for(CANCEL_REQUEST) reads the cancellation-request catalogue, never the client one", async () => {
    await seedCorpusSession();

    const observedTypes = await catalogueParamOf(() => {
      void useClientCustomFields()
        .as(ScopeActorTypes.CLIENT)
        .for(ClientCustomFieldsContextTypes.CANCEL_REQUEST)
        .useActions()
        .isReady();
    });

    expect(observedTypes).toContain(CATALOGUE_WIRE.cancelRequest);
    expect(observedTypes).not.toContain(CATALOGUE_WIRE.client);
  });

  it("AC-32 a catalogue scope still carries the client's own brand, and offers no way to name a catalogue through the criteria", async () => {
    await seedCorpusSession();
    const { brandId: corpusBrandId } = recordedIds();

    const observed = observeRequests("/custom_fields");
    const fields = useClientCustomFields()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientCustomFieldsContextTypes.INVOICE);
    await fields.useActions().isReady();
    await vi.waitFor(() => expect(observed.count()).toBeGreaterThan(0));
    observed.stop();

    for (const request of observed.all()) {
      expect(new URL(request.url).searchParams.get("brand_id")).toBe(
        corpusBrandId
      );
    }
    expect(
      Object.keys(fields.useContext().query.value.filters ?? {})
    ).not.toContain("object_type");
  });
});
