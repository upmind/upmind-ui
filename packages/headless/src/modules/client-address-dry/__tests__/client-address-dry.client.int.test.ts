/**
 * @fileoverview client-address-dry — client (`.as('self')`) integration —
 * real collection + MSW replay
 *
 * ## Job To Be Done
 * Drive the REAL `useClientAddressesDry().as('self')` collection over a
 * seeded client session against the `clients/:id/addresses` endpoint
 * (`docs/sdd/client-address-dry-smoke/design.md` AC-A1/A2/S1/REGION/STAGED/
 * CART; `parity.yaml` cell 1): the list request targets the session client's
 * own URL, a non-deletable address's `remove()` never issues the DELETE
 * (AC-A2 — correction over the `client-address` baseline), a submitted
 * `type` round-trips into the write body (D-ADDR-3/AC-S1), the list carries
 * `with_staged_imports=1` and a staged row still surfaces in `data`
 * (D-ADDR-4/AC-STAGED — no per-row lockout, unlike client-phone-dry), and the
 * cart-coupling shape (`default`/`data`) stays contract-compatible
 * (Preserve-invariant #16/AC-CART).
 *
 * Journey bodies are RECORDED fixtures (client-address-dry.fixtures.ts →
 * ./fixtures, captured live against staging) — never hand-rolled.
 *
 * ## What Breaks If These Fail
 * A client sees another client's addresses (wrong URL); a non-deletable
 * address gets deleted anyway (can_delete regression); an add/edit form
 * silently drops `type`, a field legacy requires; a staged (still-importing)
 * row disappears from the list; the checkout default-address picker breaks
 * because the DRY surface stopped matching what `basket-billing` consumes.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
// `session-store` MUST load before the `..` barrel below — a pre-existing,
// load-order-sensitive circular dependency between `scope` and `client-email`
// (unrelated to client-address-dry, reproduces for any module's isolated
// integration file; see `client-phone-dry.client.int.test.ts`'s identical
// note) throws on a cold module graph otherwise.
// eslint-disable-next-line import/order
import {
  useSessionStore,
  useActiveSession,
  mapSessionUser
} from "../../session-store";
import { useClientAddressesDry, useAddressSchema } from "..";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { ScopeActorTypes } from "../../scope";
import { server } from "./setup.integration";
import type { ISelf, IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// Recorded journey fixtures (this module's own co-located pool, captured
// live against staging by `client-address-dry.fixtures.ts`).

const LOCAL_FIXTURES = join(import.meta.dirname, "fixtures");

type AddressRow = Record<string, unknown> & { id: string };
type AddressListBody = { status: string; data: AddressRow[]; total: number };

const listBody = getFixtureBody<AddressListBody>(
  "get-clients-id-addresses-with-staged-imports-1",
  { recordingsDir: LOCAL_FIXTURES }
);
const addBody = getFixtureBody("post-clients-id-addresses", {
  recordingsDir: LOCAL_FIXTURES
});

// A real recorded row — the shape every derived scenario row inherits.
const recordedRow = listBody.data[0];

/**
 * The AC-B5 read-back shape (`canList`/`canCreate`/`canUpdate`/`canDelete`)
 * — declared locally (never imported from the module's own implementation
 * files) so this test asserts the public runtime shape, not a type this
 * seat is withheld from reading.
 */
interface StaffMetaCapabilities {
  canList?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

/** A recorded-list body carrying exactly the given rows (real envelope shape). */
const listOf = (rows: AddressRow[]): AddressListBody => ({
  ...listBody,
  data: rows,
  total: rows.length
});

// -----------------------------------------------------------------------------
// Cross-module input (never asserted on): a client grant + profile to put an
// authenticated client-scoped session in place, reused from session-store's
// own fixture capture (no client-address-dry oauth capture exists, nor
// should this module own one).
const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);

type SelfResponse = { data: ISelf };

const SESSION_CLIENT_ID = "mock-uuid-1";

async function seedClientSession(): Promise<void> {
  const clientToken = getFixtureBody<IToken>("post-oauth-access-token-client", {
    recordingsDir: sessionStoreRecordingsDir
  });
  const selfResponse = getFixtureBody<SelfResponse>("get-self", {
    recordingsDir: sessionStoreRecordingsDir
  });

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(selfResponse.data));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });
}

// -----------------------------------------------------------------------------

describe("client-address-dry — client (.as('self'))", () => {
  beforeEach(() => {
    clearSessionCookies();
    sessionStorage.clear();
    useClientAddressesDry().as(ScopeActorTypes.CLIENT).useActions().destroy();
    useClientAddressesDry().as(ScopeActorTypes.SELF).useActions().destroy();
  });

  it("AC-A1: the list request targets the session client's own URL", async () => {
    await seedClientSession();

    const seen: string[] = [];
    server?.use(
      http.get("*/clients/*/addresses", ({ request }) => {
        seen.push(new URL(request.url).pathname);
        return HttpResponse.json(listBody, { status: 200 });
      })
    );

    const addresses = useClientAddressesDry().as(ScopeActorTypes.SELF);
    await addresses
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBe(
        listBody.data.length
      )
    );

    expect(seen.length).toBeGreaterThan(0);
    expect(seen[0]).toContain(`/clients/${SESSION_CLIENT_ID}/addresses`);
    expect(seen[0]).not.toContain("/admin/");
  });

  it("AC-A2: remove() respects can_delete — blocks a locked address, allows a deletable one", async () => {
    await seedClientSession();

    const lockedList = listOf([
      { ...recordedRow, id: "address-locked", can_delete: false },
      { ...recordedRow, id: "address-free", can_delete: true, default: 0 }
    ]);
    server?.use(
      http.get("*/clients/*/addresses", () =>
        HttpResponse.json(lockedList, { status: 200 })
      )
    );

    const deleted: string[] = [];
    server?.use(
      http.delete("*/clients/*/addresses/*", ({ request }) => {
        deleted.push(new URL(request.url).pathname);
        return HttpResponse.json({ status: "ok", data: null }, { status: 200 });
      })
    );

    const addresses = useClientAddressesDry().as(ScopeActorTypes.SELF);
    await addresses
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBe(2)
    );

    addresses.useActions().remove?.("address-locked");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(deleted).toHaveLength(0);

    addresses.useActions().remove?.("address-free");
    await vi.waitFor(() => expect(deleted).toHaveLength(1));
    expect(deleted[0]).toContain("/address-free");
  });

  it("AC-S1: a submitted `type` round-trips into the create write body (never forced to a fixed value)", async () => {
    await seedClientSession();

    server?.use(
      http.get("*/clients/*/addresses", () =>
        HttpResponse.json(listOf([]), { status: 200 })
      )
    );

    let capturedBody: Record<string, unknown> | undefined;
    server?.use(
      http.post("*/clients/*/addresses", async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(addBody, { status: 200 });
      })
    );

    const addresses = useClientAddressesDry().as(ScopeActorTypes.SELF);
    await addresses.useActions().add?.({
      type: 2,
      address: {
        address1: "1 Test Street",
        city: "Testville",
        postcode: "TE5 7ST",
        countryId: "country-1"
      }
    });

    await vi.waitFor(() => expect(capturedBody).toBeDefined());
    expect(capturedBody).toHaveProperty("type", 2);
    expect(capturedBody?.type).not.toBe(1);
  });

  it("AC-STAGED: the list request carries with_staged_imports=1 and a staged row is included in the results", async () => {
    await seedClientSession();

    const stagedList = listOf([
      { ...recordedRow, id: "staged-1", staged_import: true },
      { ...recordedRow, id: "normal-1", staged_import: false, default: 0 }
    ]);
    const seenQueries: string[] = [];
    server?.use(
      http.get("*/clients/*/addresses", ({ request }) => {
        seenQueries.push(new URL(request.url).search);
        return HttpResponse.json(stagedList, { status: 200 });
      })
    );

    const addresses = useClientAddressesDry().as(ScopeActorTypes.SELF);
    await addresses
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBe(2)
    );

    expect(seenQueries.some(q => q.includes("with_staged_imports=1"))).toBe(
      true
    );
    const ids = addresses.useContext().data.value.map(a => a.id);
    expect(ids).toContain("staged-1");
    expect(ids).toContain("normal-1");
  });

  it("AC-B5: a client acting on their own addresses is never shown the staff capability flags", async () => {
    await seedClientSession();
    server?.use(
      http.get("*/clients/*/addresses", () =>
        HttpResponse.json(listBody, { status: 200 })
      )
    );

    const addresses = useClientAddressesDry().as(ScopeActorTypes.SELF);
    await addresses
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBe(
        listBody.data.length
      )
    );

    const meta = addresses.useMeta() as unknown as StaffMetaCapabilities;
    expect(meta.canList).toBeUndefined();
    expect(meta.canCreate).toBeUndefined();
    expect(meta.canUpdate).toBeUndefined();
    expect(meta.canDelete).toBeUndefined();
  });

  it("AC-CART: the .as('self') surface exposes {default, data} + useAddressSchema billing-compatible", async () => {
    await seedClientSession();
    server?.use(
      http.get("*/clients/*/addresses", () =>
        HttpResponse.json(listBody, { status: 200 })
      )
    );

    const addresses = useClientAddressesDry().as(ScopeActorTypes.SELF);
    await addresses
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBe(
        listBody.data.length
      )
    );

    const context = addresses.useContext();
    expect(context).toHaveProperty("default");
    expect(context).toHaveProperty("data");

    const schema = useAddressSchema({});
    expect(schema.required).toContain("type");
  });
});
