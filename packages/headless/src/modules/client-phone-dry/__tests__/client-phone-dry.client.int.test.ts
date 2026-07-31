/**
 * @fileoverview client-phone-dry — client (`.as('self')`) integration — real
 * collection + MSW replay
 *
 * ## Job To Be Done
 * Drive the REAL `useClientPhonesDry().as('self')` collection over a seeded
 * client session against a `clients/:id/phones` phones endpoint
 * (`docs/sdd/client-phone-dry-smoke/design.md` AC-A1/A2/S1/S2/12a/12b/CART;
 * `parity.yaml` cell A): the list request targets the session client's own
 * URL, a non-deletable phone's `remove()` never issues the DELETE
 * (AC-A2 — correction over the `client-phone` baseline), a submitted `type`
 * round-trips into the write body (D2/AC-S1), a staged-import row is
 * surfaced read-only and locked against mutation (D4/AC-12a/AC-12b), and the
 * cart-coupling shape (`default`/`data`/`usePhoneSchema`) stays
 * contract-compatible (Preserve-invariant #13/AC-CART).
 *
 * Journey bodies are RECORDED fixtures (client-phone-dry.fixtures.ts →
 * ./fixtures) — never hand-rolled. Scenario-specific tests (a locked row, a
 * staged row) derive their one controlled flag from a REAL recorded row's
 * shape; control responses (delete acks) are not journey data.
 *
 * ## What Breaks If These Fail
 * A client sees another client's numbers (wrong URL); a non-deletable phone
 * gets deleted anyway (can_delete regression); an add/edit form silently
 * drops `type`, a field legacy requires; a staged (still-importing) row gets
 * edited/deleted before reconciliation; the checkout default-phone picker
 * breaks because the DRY surface stopped matching what
 * `basket-billing/unified/services.ts` consumes.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
// `session-store` MUST load before the `..` barrel below — a pre-existing,
// load-order-sensitive circular dependency between `scope` and `client-email`
// (unrelated to client-phone-dry, reproduces for any module's isolated
// integration file; see test-report.md) throws on a cold module graph
// otherwise.
// eslint-disable-next-line import/order
import {
  useSessionStore,
  useActiveSession,
  mapSessionUser
} from "../../session-store";
import { useClientPhonesDry, usePhoneSchema } from "..";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { ScopeActorTypes } from "../../scope";
import { server } from "./setup.integration";
import type { ISelf, IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// D3 (ADR-021 "mock settings not data" — account.int.test.ts precedent):
// brand country-seed stub for AC-S2. Real `useBrand()` machinery stays live;
// only its resolved `countryId` is overridden per test.
const brandStub = vi.hoisted(() => ({
  countryId: { value: undefined as string | undefined }
}));

vi.mock("../../brand", async importOriginal => {
  const actual = await importOriginal<{
    useBrand: () => Record<string, unknown>;
  }>();
  return {
    ...actual,
    useBrand: () => ({ ...actual.useBrand(), ...brandStub })
  };
});

// -----------------------------------------------------------------------------
// Recorded journey fixtures (this module's own co-located pool).

const LOCAL_FIXTURES = join(import.meta.dirname, "fixtures");

type PhoneRow = Record<string, unknown> & { id: string };
type PhoneListBody = { status: string; data: PhoneRow[]; total: number };

const listBody = getFixtureBody<PhoneListBody>(
  "get-clients-id-phones-with-staged-imports-1",
  { recordingsDir: LOCAL_FIXTURES }
);
const addBody = getFixtureBody("post-clients-id-phones", {
  recordingsDir: LOCAL_FIXTURES
});

// A real recorded row — the shape every derived scenario row inherits.
const recordedRow = listBody.data[0];

/** A recorded-list body carrying exactly the given rows (real envelope shape). */
const listOf = (rows: PhoneRow[]): PhoneListBody => ({
  ...listBody,
  data: rows,
  total: rows.length
});

// -----------------------------------------------------------------------------

// Cross-module input (never asserted on): a client grant + profile to put an
// authenticated client-scoped session in place, reused from session-store's
// own fixture capture (no client-phone-dry oauth capture exists, nor should
// this module own one).
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

describe("client-phone-dry — client (.as('self'))", () => {
  beforeEach(() => {
    clearSessionCookies();
    sessionStorage.clear();
    brandStub.countryId.value = undefined;
    useClientPhonesDry().as(ScopeActorTypes.CLIENT).useActions().destroy();
    useClientPhonesDry().as(ScopeActorTypes.SELF).useActions().destroy();
  });

  it("AC-A1: the list request targets the session client's own URL", async () => {
    await seedClientSession();

    const seen: string[] = [];
    server?.use(
      http.get("*/clients/*/phones", ({ request }) => {
        seen.push(new URL(request.url).pathname);
        return HttpResponse.json(listBody, { status: 200 });
      })
    );

    const phones = useClientPhonesDry().as(ScopeActorTypes.SELF);
    await phones
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value.length).toBe(listBody.data.length)
    );

    expect(seen.length).toBeGreaterThan(0);
    expect(seen[0]).toContain(`/clients/${SESSION_CLIENT_ID}/phones`);
    expect(seen[0]).not.toContain("/admin/");
  });

  it("AC-A2: remove() respects can_delete — blocks a locked phone, allows a deletable one", async () => {
    await seedClientSession();

    const lockedList = listOf([
      { ...recordedRow, id: "phone-locked", can_delete: false },
      { ...recordedRow, id: "phone-free", can_delete: true, default: 0 }
    ]);
    server?.use(
      http.get("*/clients/*/phones", () =>
        HttpResponse.json(lockedList, { status: 200 })
      )
    );

    const deleted: string[] = [];
    server?.use(
      http.delete("*/clients/*/phones/*", ({ request }) => {
        deleted.push(new URL(request.url).pathname);
        return HttpResponse.json({ status: "ok", data: null }, { status: 200 });
      })
    );

    const phones = useClientPhonesDry().as(ScopeActorTypes.SELF);
    await phones
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value.length).toBe(2)
    );

    phones.useActions().remove?.("phone-locked");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(deleted).toHaveLength(0);

    phones.useActions().remove?.("phone-free");
    await vi.waitFor(() => expect(deleted).toHaveLength(1));
    expect(deleted[0]).toContain("/phone-free");
  });

  it("AC-S1: a submitted `type` round-trips into the create write body", async () => {
    await seedClientSession();

    server?.use(
      http.get("*/clients/*/phones", () =>
        HttpResponse.json(listOf([]), { status: 200 })
      )
    );

    let capturedBody: Record<string, unknown> | undefined;
    server?.use(
      http.post("*/clients/*/phones", async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(addBody, { status: 200 });
      })
    );

    const phones = useClientPhonesDry().as(ScopeActorTypes.SELF);
    await phones.useActions().add?.({
      type: 2,
      phone: {
        number: "+15559876543",
        nationalNumber: "5559876543",
        countryCallingCode: "1",
        country: "US"
      }
    });

    await vi.waitFor(() => expect(capturedBody).toBeDefined());
    expect(capturedBody).toHaveProperty("type", 2);
  });

  /**
   * AC-S2 (D3 brand-country default seed) — NOT completed. `useContext().model`
   * is a real `ComputedRef` and stays `phone.country === null` regardless of
   * a `vi.mock("../../brand")` stub (`useBrand().countryId`) and regardless of
   * `.inBrand(id)`, with no additional network request observed (ruled out via
   * a temporary catch-all MSW probe). Either the seed reads a different
   * boundary than `useBrand()` (design.md §4 does not name the exact
   * id-\>country-code resolution path) or requires a fixture this seat cannot
   * derive from the public surface alone. Recorded per the prover contract's
   * "record explicitly, never silently skip" clause — see
   * `docs/sdd/client-phone-dry-smoke/evidence/test-report.md` "AC-S2 gap".
   */
  it.todo(
    "AC-S2: .inBrand(BRAND) seeds the new-phone country from the brand's country — resolution boundary undetermined, see test-report.md"
  );

  it("AC-12a/AC-12b: a staged row is surfaced read-only and locked; a non-staged row still mutates", async () => {
    await seedClientSession();

    const stagedList = listOf([
      { ...recordedRow, id: "staged-1", staged_import: true, can_delete: true },
      {
        ...recordedRow,
        id: "normal-1",
        staged_import: false,
        can_delete: true,
        default: 0
      }
    ]);
    const seenQueries: string[] = [];
    server?.use(
      http.get("*/clients/*/phones", ({ request }) => {
        seenQueries.push(new URL(request.url).search);
        return HttpResponse.json(stagedList, { status: 200 });
      })
    );

    const deleted: string[] = [];
    server?.use(
      http.delete("*/clients/*/phones/*", ({ request }) => {
        deleted.push(new URL(request.url).pathname);
        return HttpResponse.json({ status: "ok", data: null }, { status: 200 });
      })
    );

    const phones = useClientPhonesDry().as(ScopeActorTypes.SELF);
    await phones
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value.length).toBe(2)
    );

    expect(seenQueries.some(q => q.includes("with_staged_imports=1"))).toBe(
      true
    );

    const staged = phones
      .useContext()
      .data.value.find(p => p.id === "staged-1");
    const normal = phones
      .useContext()
      .data.value.find(p => p.id === "normal-1");
    expect(staged?.meta.isStaged).toBe(true);
    expect(normal?.meta.isStaged).toBe(false);
    expect(phones.useContext().canEdit?.(staged)).toBe(false);
    expect(phones.useContext().canEdit?.(normal)).toBe(true);

    phones.useActions().remove?.("staged-1");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(deleted).toHaveLength(0);

    phones.useActions().remove?.("normal-1");
    await vi.waitFor(() => expect(deleted).toHaveLength(1));
    expect(deleted[0]).toContain("/normal-1");
  });

  it("AC-CART: the .as('self') surface exposes {default, data} + usePhoneSchema billing-compatible", async () => {
    await seedClientSession();
    server?.use(
      http.get("*/clients/*/phones", () =>
        HttpResponse.json(listBody, { status: 200 })
      )
    );

    const phones = useClientPhonesDry().as(ScopeActorTypes.SELF);
    await phones
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value.length).toBe(listBody.data.length)
    );

    const context = phones.useContext();
    expect(context).toHaveProperty("default");
    expect(context).toHaveProperty("data");

    const schema = usePhoneSchema({});
    expect(schema.required).toContain("type");
  });
});
