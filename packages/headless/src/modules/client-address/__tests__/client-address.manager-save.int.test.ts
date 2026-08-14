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
 * `POST` and the id the editor adopts afterwards. AC-25's is an EMPTY capture
 * log — an invalid model must reject before anything leaves. AC-15's is the
 * collection refetching off the save with no consumer-side refresh.
 *
 * ## What Breaks If These Fail
 * A save re-sends fields the brand forbids changing and is rejected where
 * legacy succeeded; a created address is saved but the editor keeps thinking
 * it is new; or an incomplete address reaches the API.
 */

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
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";

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

/** Captures every POST body sent to the address collection. */
function capturePosts(clientId: string): { bodies: () => unknown[] } {
  const bodies: unknown[] = [];
  server?.use(
    http.post(`*/clients/${clientId}/addresses`, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(recorded.created(), { status: 200 });
    })
  );
  return { bodies: () => bodies };
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
