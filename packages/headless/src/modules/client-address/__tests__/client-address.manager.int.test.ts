// -----------------------------------------------------------------------------
/**
 * @fileoverview client address manager — opening, abandoning and isolating an
 * editor (integration, AC-16/AC-17/AC-28/AC-29)
 *
 * ## Job To Be Done
 * Prove the editor half against RECORDED staging responses: opening an
 * existing address seeds the form from the mapped row and issues its per-address
 * read; opening a blank one issues NO per-address read and seeds the brand's
 * default country; `clear()` puts the form back exactly as it opened; two
 * concurrent drafts are two independent editors under two scope keys.
 *
 * AC-26's bounded readiness lives in its OWN file
 * (`client-address.manager-readiness.int.test.ts`): `useBrand` and `useSystem`
 * are module-level singletons that stay warm for the whole file, so a stall
 * installed after any earlier test in this file would never be reached and the
 * assertion would pass on a cache hit rather than on the bound.
 *
 * ## What Breaks If These Fail
 * A consumer opens the wrong address, or loses a user's abandoned edit into
 * the next form.
 */

import { describe, expect, it, vi } from "vitest";
import { ClientAddressContextTypes, useClientAddressManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  clientAddressScopeKeys,
  installAddressHandler,
  installLookupHandlers,
  observeAllRequests,
  recorded,
  recordedRows,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** Opens an editor over a chosen recorded row and waits for it to settle. */
async function openEditor(row = recorded.one().data) {
  const { clientId } = await seedClientSession();
  installLookupHandlers(server);
  installAddressHandler(server, clientId, row);
  const manager = useClientAddressManager()
    .as(ScopeActorTypes.CLIENT)
    .for(ClientAddressContextTypes.ADDRESS, row.id);
  await manager.useActions().isReady();
  return { manager, clientId, row };
}

/** Lands a partial model on an open editor through the debounced input. */
async function type(
  manager: { useActions: () => { input: (model: never) => unknown } },
  patch: unknown
): Promise<void> {
  manager.useActions().input(patch as never);
  await new Promise(resolve => setTimeout(resolve, 900));
}

// -----------------------------------------------------------------------------

describe("client address manager — I open one of my addresses to change it (AC-17)", () => {
  it("AC-17 seeds the form from the recorded row and reads that address by id", async () => {
    const { clientId } = await seedClientSession();
    installLookupHandlers(server);
    const row = recorded.one().data;
    const reads = installAddressHandler(server, clientId, row);
    const observed = observeAllRequests();

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressContextTypes.ADDRESS, row.id);
    await manager.useActions().isReady();
    observed.stop();

    expect(reads.reads()).toBe(1);
    expect(
      observed
        .all()
        .some(request =>
          request.url.includes(`/clients/${clientId}/addresses/${row.id}`)
        )
    ).toBe(true);
    const model = manager.useContext().model.value;
    expect(model.id).toBe(row.id);
    expect(model.name).toBe(row.name);
    expect(model.type).toBe(row.type);
    expect(model.address.address1).toBe(row.address_1);
    expect(model.address.city).toBe(row.city);
    expect(model.address.postcode).toBe(row.postcode);
    expect(model.address.countryId).toBe(row.country_id);
  });

  it("AC-17 reports the editor as NOT new and names the address it carries", async () => {
    const { manager, row } = await openEditor();

    expect(manager.useMeta().isNew.value).toBe(false);
    expect(manager.useContext().id.value).toBe(row.id);
  });

  it("AC-17 opens with baseModel deep-equal to the model and nothing dirty", async () => {
    const { manager } = await openEditor();

    expect(manager.useContext().baseModel.value).toEqual(
      manager.useContext().model.value
    );
    expect(manager.useMeta().isDirty.value).toBe(false);
  });
});

describe("client address manager — I start a new address from a blank form (AC-16)", () => {
  it("AC-16 issues NO per-address read for a draft and reports itself new", async () => {
    await seedClientSession();
    installLookupHandlers(server);
    const observed = observeAllRequests();

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();
    observed.stop();

    expect(
      observed.all().filter(request => /\/addresses\/[^/?]+/.test(request.url))
    ).toEqual([]);
    expect(manager.useMeta().isNew.value).toBe(true);
    expect(manager.useContext().id.value).toBeUndefined();
  });

  it("AC-16 seeds the blank form with a country the recorded lookup actually carries, and leaves the other address fields empty", async () => {
    await seedClientSession();
    installLookupHandlers(server);

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();

    const { address } = manager.useContext().model.value;
    expect(address.countryId).toBeTruthy();
    expect(
      recorded
        .countries()
        .data.some(country => country.id === address.countryId)
    ).toBe(true);
    expect(address.address1 ?? null).toBeNull();
    expect(address.city ?? null).toBeNull();
    expect(address.postcode ?? null).toBeNull();
  });
});

describe("client address manager — I abandon my changes (AC-28)", () => {
  it("AC-28 puts the model back to the form as it opened and clears the dirty flag", async () => {
    const { manager } = await openEditor();
    const opened = structuredClone(manager.useContext().baseModel.value);

    await type(manager, { address: { city: "Somewhere Else" } });
    expect(manager.useMeta().isDirty.value).toBe(true);

    manager.useActions().clear();

    await vi.waitFor(() =>
      expect(manager.useContext().model.value).toEqual(opened)
    );
    expect(manager.useMeta().isDirty.value).toBe(false);
  });

  it("AC-28 leaves baseModel untouched by an edit — it is the baseline, not a mirror of the model", async () => {
    const { manager, row } = await openEditor();

    await type(manager, { address: { city: "Somewhere Else" } });

    expect(manager.useContext().model.value.address.city).toBe(
      "Somewhere Else"
    );
    expect(manager.useContext().baseModel.value.address.city).toBe(row.city);
  });
});

describe("client address manager — two editors at once do not interfere (AC-29)", () => {
  it("AC-29 gives two drafts two scope keys and two independent models", async () => {
    await seedClientSession();
    installLookupHandlers(server);

    const first = useClientAddressManager().as(ScopeActorTypes.CLIENT).fresh();
    const second = useClientAddressManager().as(ScopeActorTypes.CLIENT).fresh();
    await first.useActions().isReady();
    await second.useActions().isReady();

    expect(new Set(clientAddressScopeKeys()).size).toBe(
      clientAddressScopeKeys().length
    );
    expect(clientAddressScopeKeys().length).toBeGreaterThanOrEqual(2);
    expect(first.useContext().model).not.toBe(second.useContext().model);
  });

  it("AC-29 editing one open address leaves the other untouched", async () => {
    const { clientId } = await seedClientSession();
    installLookupHandlers(server);
    const { primary, secondary } = recordedRows();
    installAddressHandler(server, clientId, primary);
    installAddressHandler(server, clientId, secondary);

    const one = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressContextTypes.ADDRESS, primary.id);
    const other = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressContextTypes.ADDRESS, secondary.id);
    await one.useActions().isReady();
    await other.useActions().isReady();
    // isReady() resolves on entering `available`, which is before the parse
    // settles — cloning here without waiting captures a half-parsed model and
    // compares the edited editor against a baseline that was never the row.
    await vi.waitFor(() =>
      expect(other.useContext().model.value.address.address1).toBe(
        secondary.address_1
      )
    );
    const otherBefore = structuredClone(other.useContext().model.value);

    await type(one, { address: { city: "Only Mine Changed" } });

    expect(one.useContext().model.value.address.city).toBe("Only Mine Changed");
    expect(other.useContext().model.value).toEqual(otherBefore);
  });

  it("AC-29 destroy() deregisters the editor's scope entry", async () => {
    const { manager } = await openEditor();
    const before = clientAddressScopeKeys().length;

    manager.useActions().destroy();

    expect(clientAddressScopeKeys().length).toBeLessThan(before);
  });
});
