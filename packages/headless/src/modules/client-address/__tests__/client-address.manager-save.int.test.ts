// -----------------------------------------------------------------------------
/**
 * @fileoverview saving an address — the diff-only update, the create, and the
 * save that must never leave the browser (integration, AC-15/AC-23/AC-24/AC-25)
 *
 * ## Job To Be Done
 * Prove what goes ON THE WIRE when a form is saved. AC-23's read-back is the
 * request BODY: a city-only edit sends `city` and does NOT re-send an unchanged
 * `country_id` — under `CLIENT_ALLOW_ADDRESS_UPDATE === false` a full-payload
 * PUT re-sends a country the API then rejects, which is why a "the save
 * succeeded" assertion does not discriminate (parity row L3). AC-24's is the
 * `POST` — the model that goes out, the KEYS the serialised body carries, and
 * the id the editor adopts afterwards. AC-25's is an EMPTY capture
 * log — an invalid model must reject before anything leaves. AC-15's is the
 * collection refetching off the save with no consumer-side refresh.
 *
 * A save is also read back at the EDITOR, not only on the wire: what the save
 * resolves, and what `useContext()` still shows once the save's own refetch has
 * landed, must be the SAVED address rather than the snapshot the form opened
 * on. A wire-only suite cannot see a successful save reverting the form.
 *
 * ## What Breaks If These Fail
 * A save re-sends fields the brand forbids changing and is rejected where
 * legacy succeeded; a created address is saved but the editor keeps thinking
 * it is new; or an incomplete address reaches the API.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ClientAddressContextTypes, useClientAddressManager } from "..";
import { useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installAddressHandler,
  installAddressesListHandler,
  installLookupHandlers,
  observeAllRequests,
  recorded,
  regionCountryId,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";
import type { WireAddress } from "./client-address.int-helpers";

// -----------------------------------------------------------------------------

/** Captures every PUT body sent to the address under edit. */
function capturePuts(clientId: string): {
  bodies: () => unknown[];
  urls: () => string[];
} {
  const bodies: unknown[] = [];
  const urls: string[] = [];
  server?.use(
    http.put(`*/clients/${clientId}/addresses/*`, async ({ request }) => {
      urls.push(request.url);
      bodies.push(await request.json());
      return HttpResponse.json(recorded.updated(), { status: 200 });
    })
  );
  return { bodies: () => bodies, urls: () => urls };
}

/**
 * Captures every POST sent to the address collection as the RAW serialised
 * body. `texts()` is what a key-absence read-back needs: a parsed body compared
 * with `toMatchObject` is structurally blind to an ADDED key, so an extra
 * `"region_id": null` on the wire passes it (review blocker B3).
 */
function capturePosts(clientId: string): {
  bodies: () => unknown[];
  texts: () => string[];
} {
  const texts: string[] = [];
  server?.use(
    http.post(`*/clients/${clientId}/addresses`, async ({ request }) => {
      texts.push(await request.text());
      return HttpResponse.json(recorded.created(), { status: 200 });
    })
  );
  return {
    bodies: () => texts.map(text => JSON.parse(text) as unknown),
    texts: () => texts
  };
}

/**
 * A recorded country that is neither the lookup list's first row nor the
 * recorded row's own country, so a POST carrying it can only have come from the
 * model the caller filled in — never from a seeded default or a first-row
 * fallback.
 */
function discriminatingCountryId(): string {
  const rows = recorded.countries().data;
  const excluded = new Set([rows[0]?.id, recorded.one().data.country_id]);
  const pick = rows.find(row => !excluded.has(row.id));
  if (!pick) {
    throw new Error(
      "The countries recording carries no country outside the default and the " +
        "fallback — AC-24 cannot tell a filled-in country from a seeded one. " +
        "Re-record with `pnpm fixtures:generate client-address`."
    );
  }
  return pick.id;
}

/** One create body exactly as the pre-migration oracle recorded it. */
type OracleCreate = {
  name: string;
  type: number;
  address_1: string;
  address_2: string;
  city: string;
  postcode: string;
  country_id: string;
  region_id?: string;
};

/**
 * The oracle's own create PAIR on one country: the POST that carries a region
 * and the POST that carries no `region_id` KEY AT ALL — plus the union of every
 * key its creates use. The pair is the recording's own discrimination: same
 * country, one region picked and one not, so "the user chose no region" is
 * tellable apart from "that country has no regions to choose".
 */
function oracleCreates(): {
  withRegion: OracleCreate;
  withoutRegion: OracleCreate;
  vocabulary: string[];
} {
  const recording = JSON.parse(
    readFileSync(
      join(import.meta.dirname, "client-address.e2e-oracle.pre-migration.json"),
      "utf-8"
    )
  ) as {
    specs: Array<{
      requests: Array<{ method: string; body: OracleCreate | null }>;
    }>;
  };
  const creates = recording.specs
    .flatMap(spec => spec.requests)
    .filter(request => request.method === "POST" && request.body)
    .map(request => request.body as OracleCreate);

  const withRegion = creates.find(body => body.region_id);
  const withoutRegion = creates.find(
    body =>
      withRegion &&
      body.country_id === withRegion.country_id &&
      !Object.keys(body).includes("region_id")
  );
  if (!withRegion || !withoutRegion) {
    throw new Error(
      "The pre-migration oracle no longer records two creates on one country, " +
        "one with a region and one without — AC-24 cannot tell an unpicked " +
        "region apart from a country that has none. Re-capture the oracle."
    );
  }

  return {
    withRegion,
    withoutRegion,
    vocabulary: [...new Set(creates.flatMap(body => Object.keys(body)))]
  };
}

/**
 * The oracle's create pair, checked against the recorded lookup pool: the
 * country really is one `/countries/{id}/regions` answers rows for, and the
 * region the oracle picked is one of those rows. Without both, a region-less
 * POST proves nothing about an unpicked region.
 */
function oracleRegionCase(): {
  withRegion: OracleCreate;
  withoutRegion: OracleCreate;
} {
  const { withRegion, withoutRegion } = oracleCreates();
  const regions = recorded.regionsB();
  if (
    regionCountryId(regions) !== withRegion.country_id ||
    !regions.data.some(region => region.id === withRegion.region_id)
  ) {
    throw new Error(
      "The recorded regions capture does not answer the oracle's create " +
        "country, so the form cannot offer a region for the draft to decline. " +
        "Re-record with `pnpm fixtures:generate client-address`."
    );
  }
  return { withRegion, withoutRegion };
}

/** Fills a fresh draft from a RECORDED create body, optionally with its region. */
async function fillDraftFrom(
  manager: { useActions: () => { input: (model: never) => unknown } },
  create: OracleCreate,
  options?: { withRegion?: boolean }
): Promise<void> {
  await type(manager, {
    name: create.name,
    type: create.type,
    address: {
      address1: create.address_1,
      city: create.city,
      postcode: create.postcode,
      countryId: create.country_id,
      ...(options?.withRegion ? { regionId: create.region_id } : {})
    }
  });
}

/** What a settled save resolves to its caller, read structurally. */
type SavedValue =
  | {
      id?: string;
      name?: string | null;
      title?: string;
      description?: string;
      address?: { city?: string | null };
    }
  | undefined;

/**
 * The recorded PUT response — the row as the API really answered it AFTER the
 * edit — checked to be tellable apart from every row the editor could be
 * showing instead. Its city is neither the row the form opens on nor the
 * created row, so a read-back against it cannot be satisfied by a pre-edit
 * snapshot or by a seeded default.
 */
function savedAddress(): WireAddress {
  const saved = recorded.updated().data;
  const excluded = [recorded.one().data.city, recorded.created().data.city];
  if (!saved.city || excluded.includes(saved.city)) {
    throw new Error(
      "The recorded update answers with the same city the form opens on — a " +
        "post-save read-back cannot tell the SAVED address from the pre-edit " +
        "snapshot. Re-record with `pnpm fixtures:generate client-address`."
    );
  }
  return saved;
}

/**
 * A per-address server that answers a read with what the last PUT saved: the
 * recorded pre-edit row before the save, the recorded post-edit row after.
 * Both bodies are captures; only the transition between them is staged, and it
 * is what stops a post-save read-back passing (or failing) on a double that
 * serves the form-open snapshot forever.
 */
function installSavingAddressServer(
  clientId: string,
  id: string
): { bodies: () => unknown[]; readsAfterSave: () => number } {
  const bodies: unknown[] = [];
  let current = recorded.one();
  let readsAfterSave = 0;

  server?.use(
    http.get(`*/clients/${clientId}/addresses/${id}`, () => {
      if (bodies.length > 0) readsAfterSave += 1;
      return HttpResponse.json(current, { status: 200 });
    }),
    http.put(`*/clients/${clientId}/addresses/${id}`, async ({ request }) => {
      bodies.push(await request.json());
      current = recorded.updated();
      return HttpResponse.json(current, { status: 200 });
    })
  );

  return { bodies: () => bodies, readsAfterSave: () => readsAfterSave };
}

/** Opens an editor over the recorded row, against a server that keeps what it saves. */
async function openAgainstSavingServer() {
  const { clientId } = await seedClientSession();
  installLookupHandlers(server);
  const row = recorded.one().data;
  const api = installSavingAddressServer(clientId, row.id);
  const manager = useClientAddressManager()
    .as(ScopeActorTypes.CLIENT)
    .for(ClientAddressContextTypes.ADDRESS, row.id);
  await manager.useActions().isReady();
  return { manager, api, row };
}

/**
 * Waits for the save's OWN post-effects — the invalidate and the per-address
 * refetch it triggers — to land. A post-save read taken before them samples the
 * few milliseconds between the save writing the model and anything re-seeding
 * it, and so passes on a value the editor does not keep.
 */
async function whenPostSaveEffectsLand(api: {
  readsAfterSave: () => number;
}): Promise<void> {
  await vi.waitFor(() => expect(api.readsAfterSave()).toBeGreaterThan(0));
  await new Promise(resolve => setTimeout(resolve, 250));
}

/** Opens an editor over the recorded single-read row. */
async function openExisting() {
  const { clientId } = await seedClientSession();
  installLookupHandlers(server);
  const row = recorded.one().data;
  installAddressHandler(server, clientId, row);
  const manager = useClientAddressManager()
    .as(ScopeActorTypes.CLIENT)
    .for(ClientAddressContextTypes.ADDRESS, row.id);
  await manager.useActions().isReady();
  return { manager, clientId, row };
}

/** Lands a partial model through the debounced input and lets it settle. */
async function type(
  manager: { useActions: () => { input: (model: never) => unknown } },
  patch: unknown
): Promise<void> {
  manager.useActions().input(patch as never);
  await new Promise(resolve => setTimeout(resolve, 900));
}

/** Settles a save without letting an unbounded one hang the whole file. */
async function settle<T>(
  work: Promise<T>,
  ms = 8000
): Promise<
  | { kind: "resolved"; value: T }
  | { kind: "rejected"; error: unknown }
  | { kind: "hung" }
> {
  return Promise.race([
    work.then(
      value => ({ kind: "resolved" as const, value }),
      error => ({ kind: "rejected" as const, error })
    ),
    new Promise<{ kind: "hung" }>(resolve =>
      setTimeout(() => resolve({ kind: "hung" }), ms)
    )
  ]);
}

// -----------------------------------------------------------------------------

describe("saving an edit sends only what I changed (AC-23)", () => {
  it("AC-23 puts ONLY the changed field and does NOT re-send the unchanged country", async () => {
    const { manager, clientId, row } = await openExisting();
    const puts = capturePuts(clientId);

    await type(manager, { address: { city: "Manchester" } });
    const outcome = await settle(manager.useActions().update());

    expect(outcome.kind).toBe("resolved");
    expect(puts.bodies()).toHaveLength(1);
    const body = puts.bodies()[0] as Record<string, unknown>;
    expect(body).toEqual({ city: "Manchester" });
    expect(body).not.toHaveProperty("country_id");
    expect(body).not.toHaveProperty("address_1");
    expect(body).not.toHaveProperty("postcode");
    expect(puts.urls()[0]).toContain(
      `/clients/${clientId}/addresses/${row.id}`
    );
  });

  it("AC-23 sends nothing at all beyond the fields that actually moved", async () => {
    const { manager, clientId, row } = await openExisting();
    const puts = capturePuts(clientId);

    await type(manager, {
      address: { city: "Manchester", postcode: "M1 1AA" }
    });
    await settle(manager.useActions().update());

    const body = puts.bodies()[0] as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(["city", "postcode"]);
    expect(body).not.toHaveProperty("region_id");
    expect(body.city).not.toBe(row.city);
  });

  it("AC-22/AC-23 puts the chosen address type on the wire when the type is what changed", async () => {
    const { manager, clientId, row } = await openExisting();
    const puts = capturePuts(clientId);
    const nextType = row.type === 3 ? 2 : 3;

    await type(manager, { type: nextType });
    await settle(manager.useActions().update());

    expect(puts.bodies()[0]).toEqual({ type: nextType });
  });
});

describe("changing the country CLEARS the region on the wire (AC-19/AC-23)", () => {
  it("AC-19/AC-23 puts region_id: null beside the new country_id when the region no longer belongs", async () => {
    const { manager, clientId, row } = await openExisting();
    const puts = capturePuts(clientId);
    const otherCountryId = regionCountryId(recorded.regionsB());
    expect(row.region_id).toBeTruthy();
    expect(
      recorded.regionsB().data.some(region => region.id === row.region_id)
    ).toBe(false);

    await type(manager, { address: { countryId: otherCountryId } });
    const outcome = await settle(manager.useActions().update());

    expect(outcome.kind).toBe("resolved");
    const body = puts.bodies()[0] as Record<string, unknown>;
    expect(body).toEqual({ region_id: null, country_id: otherCountryId });
    expect(Object.keys(body)).toContain("region_id");
    expect(body.region_id).toBeNull();
  });
});

describe("a saved edit is what the editor then shows (AC-23/AC-17)", () => {
  it("AC-23 resolves the SAVED address to its caller, not the form-open snapshot", async () => {
    const { manager, api } = await openAgainstSavingServer();
    const saved = savedAddress();

    await type(manager, { address: { city: saved.city } });
    const outcome = await settle(manager.useActions().update());

    expect(outcome.kind).toBe("resolved");
    expect(api.bodies()).toEqual([{ city: saved.city }]);
    const value = (
      outcome.kind === "resolved" ? outcome.value : undefined
    ) as SavedValue;
    expect(value?.address?.city).toBe(saved.city);
    expect(value?.id).toBe(saved.id);
  });

  it("AC-23 resolves a description composed from the SAVED address, not the pre-edit one", async () => {
    const { manager } = await openAgainstSavingServer();
    const saved = savedAddress();

    await type(manager, { address: { city: saved.city } });
    const outcome = await settle(manager.useActions().update());

    const value = (
      outcome.kind === "resolved" ? outcome.value : undefined
    ) as SavedValue;
    expect(value?.description).toContain(saved.city);
    expect(value?.description).not.toContain(recorded.one().data.city);
    expect(value?.title).toBe(saved.address_1);
  });

  it("AC-23/AC-17 keeps the SAVED city on the model once the save's own refetch has landed", async () => {
    const { manager, api } = await openAgainstSavingServer();
    const saved = savedAddress();

    await type(manager, { address: { city: saved.city } });
    await settle(manager.useActions().update());
    await whenPostSaveEffectsLand(api);

    expect(manager.useContext().model.value.address.city).toBe(saved.city);
    // baseModel stays the clone taken at form-open — what the diff is measured
    // against (parity L3) — so a model that KEEPS the saved value is dirty.
    expect(manager.useContext().baseModel.value.address.city).toBe(
      recorded.one().data.city
    );
    expect(manager.useMeta().isDirty.value).toBe(true);
  });

  it("AC-23/AC-17 keeps a description composed from the SAVED address once the refetch has landed", async () => {
    const { manager, api } = await openAgainstSavingServer();
    const saved = savedAddress();

    await type(manager, { address: { city: saved.city } });
    await settle(manager.useActions().update());
    await whenPostSaveEffectsLand(api);

    expect(manager.useContext().description.value).toContain(saved.city);
    expect(manager.useContext().description.value).not.toContain(
      recorded.one().data.city
    );
    expect(manager.useContext().title.value).toBe(saved.name);
  });
});

describe("an incomplete address is not saved (AC-25)", () => {
  it("AC-25 rejects the save, names the missing postcode, and leaves the capture log EMPTY", async () => {
    const { manager, clientId } = await openExisting();
    capturePuts(clientId);
    const observed = observeAllRequests();

    await type(manager, { address: { postcode: "" } });
    expect(manager.useMeta().isValid.value).toBe(false);
    const outcome = await settle(manager.useActions().update());
    observed.stop();

    expect(outcome.kind).toBe("rejected");
    expect(
      observed
        .all()
        .filter(
          request => request.method === "PUT" || request.method === "POST"
        )
    ).toEqual([]);
    const errors = manager.useContext().validationErrors.value ?? [];
    expect(
      errors.some(error => JSON.stringify(error).includes("postcode"))
    ).toBe(true);
  });

  it("AC-25 reads the validation error rather than raising it — the form stays open", async () => {
    const { manager, clientId } = await openExisting();
    capturePuts(clientId);

    await type(manager, { address: { postcode: "" } });
    await settle(manager.useActions().update());

    expect(manager.useMeta().isValid.value).toBe(false);
    expect(manager.useContext().validationErrors.value?.length).toBeGreaterThan(
      0
    );
  });
});

describe("I add a brand new address (AC-24)", () => {
  it("AC-24 posts the model I filled in, exactly once", async () => {
    const { clientId } = await seedClientSession();
    installLookupHandlers(server);
    const posts = capturePosts(clientId);
    const countryId = discriminatingCountryId();

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();
    await type(manager, {
      name: "Prover Address",
      type: 3,
      address: {
        address1: "1 Prover Street",
        city: "Leeds",
        postcode: "LS1 1AA",
        countryId
      }
    });
    const outcome = await settle(manager.useActions().update());

    expect(outcome.kind).toBe("resolved");
    expect(posts.bodies()).toHaveLength(1);
    const body = posts.bodies()[0] as Record<string, unknown>;
    expect(body).toMatchObject({
      address_1: "1 Prover Street",
      city: "Leeds",
      postcode: "LS1 1AA",
      country_id: countryId,
      type: 3
    });
    expect(body.country_id).not.toBe(recorded.countries().data[0].id);
    expect(body.name).toBe("Prover Address");
    expect(
      Object.keys(body).filter(
        key => !oracleCreates().vocabulary.includes(key)
      ),
      "keys the oracle's own creates never carry"
    ).toEqual([]);
  });

  it("AC-24 leaves region_id OFF the created body when the country HAS regions and none is picked", async () => {
    const { clientId } = await seedClientSession();
    installLookupHandlers(server);
    const posts = capturePosts(clientId);
    const { withoutRegion } = oracleRegionCase();

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();
    await fillDraftFrom(manager, withoutRegion);
    const offered = manager.useContext().regions.value ?? [];
    const outcome = await settle(manager.useActions().update());

    expect(outcome.kind).toBe("resolved");
    expect(withoutRegion.country_id).not.toBe(recorded.countries().data[0].id);
    expect(offered.length).toBeGreaterThan(0);
    expect(posts.texts()).toHaveLength(1);
    const keys = Object.keys(
      JSON.parse(posts.texts()[0]) as Record<string, unknown>
    );
    expect(keys).toContain("country_id");
    expect(keys, `serialised POST body: ${posts.texts()[0]}`).not.toContain(
      "region_id"
    );
  });

  it("AC-24 still puts region_id on the created body when a region IS picked", async () => {
    const { clientId } = await seedClientSession();
    installLookupHandlers(server);
    const posts = capturePosts(clientId);
    const { withRegion } = oracleRegionCase();

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();
    await fillDraftFrom(manager, withRegion, { withRegion: true });
    const outcome = await settle(manager.useActions().update());

    expect(outcome.kind).toBe("resolved");
    expect(posts.texts()).toHaveLength(1);
    const body = JSON.parse(posts.texts()[0]) as Record<string, unknown>;
    expect(Object.keys(body)).toContain("region_id");
    expect(body.region_id).toBe(withRegion.region_id);
    expect(body.country_id).toBe(withRegion.country_id);
  });

  it("AC-24 adopts the created address's id, so the editor stops being new", async () => {
    const { clientId } = await seedClientSession();
    installLookupHandlers(server);
    capturePosts(clientId);
    const countryId = discriminatingCountryId();

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();
    await type(manager, {
      name: "Prover Address",
      address: {
        address1: "1 Prover Street",
        city: "Leeds",
        postcode: "LS1 1AA",
        countryId
      }
    });
    await settle(manager.useActions().update());

    await vi.waitFor(() =>
      expect(manager.useContext().id.value).toBe(recorded.created().data.id)
    );
    expect(manager.useMeta().isNew.value).toBe(false);
  });
});

describe("an address I have just saved shows up in my list (AC-15)", () => {
  it("AC-15 refetches the collection off the save, with no consumer-side refresh", async () => {
    const { clientId } = await seedClientSession();
    installLookupHandlers(server);
    const row = recorded.one().data;
    installAddressHandler(server, clientId, row);
    const list = installAddressesListHandler(server, clientId, [row]);
    const puts = capturePuts(clientId);

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await addresses.useActions().isReady();
    const readsBefore = list.reads();

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressContextTypes.ADDRESS, row.id);
    await manager.useActions().isReady();
    await type(manager, { address: { city: "Manchester" } });
    list.setRows([{ ...row, city: "Manchester" }]);
    await settle(manager.useActions().update());

    expect(puts.bodies()).toHaveLength(1);
    await vi.waitFor(() => expect(list.reads()).toBeGreaterThan(readsBefore));
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value[0].address.city).toBe(
        "Manchester"
      )
    );
  });
});
