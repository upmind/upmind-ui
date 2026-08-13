/**
 * @fileoverview Unified billing `add()` integration — once-only phone POST (FE-2711)
 *
 * ## Job To Be Done
 * Pin the network invariant FE-2711 fixed: `useUnifiedServices().add()` must
 * POST the phone exactly once. On the BUSINESS path the phone rides along inside
 * the single `ensureCompany` POST and NO standalone phone POST fires; on the
 * PERSONAL path `ensurePhone` fires exactly once standalone and no company POST
 * fires. The `unified` module crosses into `client-phone` / `client-company` /
 * `client-address`, so this is an integration seam, not pure logic — we drive
 * the real `add()` orchestration and spy on the collaborator service functions.
 *
 * ## What Breaks If These Fail
 * FE-2711 was a one-character constant bug that double-POSTed the phone on the
 * BUSINESS checkout path. A regression to that comparison would silently create
 * a duplicate phone record on every business billing-detail save — no
 * user-visible symptom, only a corrupted data trail. These tests are the guard.
 *
 * ## Why spies, not MSW fixtures
 * The invariant under test is a call-pattern / payload contract between `unified`
 * and its collaborator services — not an HTTP response shape. Per the FE-2711
 * scope we drive the real `add()` with the collaborator `ensure` seams replaced
 * by spies and assert which fired and with what payload; there is no HTTP under
 * test to record, so no recorded fixture applies here. Assertions derive from the
 * FE-2711 fix spec (once-only phone POST), not from the implementation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useUnifiedServices } from "../services";
import { UnifiedType } from "../types";
import type { PhoneModel } from "../../../client-phone";
import type { UnifiedContext, UnifiedModel } from "../types";

// -----------------------------------------------------------------------------

// The collaborator `ensure` seams `add()` orchestrates. Hoisted so the module
// mocks below can bind them; each returns a minimal Phone/Company/Address-shaped
// object so `add()`'s result mapping resolves. We assert on the CALLS, never the
// returned values.
const spies = vi.hoisted(() => ({
  ensurePhone: vi.fn().mockResolvedValue({ id: "ensured-phone", phone: {} }),
  ensureCompany: vi
    .fn()
    .mockResolvedValue({ id: "ensured-company", phone: {} }),
  ensureAddress: vi.fn().mockResolvedValue({ id: "ensured-address" })
}));

// Replace only the `*Services` factories on each barrel; every other export
// (types, managers, query composables `add()` never touches) stays real.
vi.mock("../../../client-phone", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useClientPhones: () => ({
      as: () => ({
        useActions: () => ({
          ensure: spies.ensurePhone,
          isReady: () => Promise.resolve(true)
        }),
        useContext: () => ({ default: () => undefined, data: { value: [] } })
      })
    })
  };
});

vi.mock("../../../client-company", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useClientCompanyServices: () => ({ ensure: spies.ensureCompany })
  };
});

vi.mock("../../../client-address", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useClientAddressServices: () => ({ ensure: spies.ensureAddress })
  };
});

// -----------------------------------------------------------------------------

const phone: PhoneModel = {
  id: "phone-abc",
  phone: {
    number: "+441632960001",
    nationalNumber: "1632960001",
    countryCallingCode: "44",
    country: "GB"
  }
};

/** `add()` reads only `type` + `model`; the rest of UnifiedContext is unused. */
function callAdd(type: UnifiedType, model: UnifiedModel): Promise<unknown> {
  return useUnifiedServices().add({ type, model } as UnifiedContext);
}

// -----------------------------------------------------------------------------

describe("useUnifiedServices().add — once-only phone POST (FE-2711)", () => {
  beforeEach(() => {
    // Reset call history; mockResolvedValue implementations survive a clear.
    vi.clearAllMocks();
  });

  it("BUSINESS: folds the phone into the single company POST, fires no standalone phone POST", async () => {
    const model: UnifiedModel = {
      company: { name: "Acme Ltd", addressId: "addr-1", emailId: "email-1" },
      phone
    };

    await callAdd(UnifiedType.BUSINESS, model);

    // FE-2711: the standalone phone POST must NOT fire on the business path.
    expect(spies.ensurePhone).not.toHaveBeenCalled();

    // The phone travels exactly once, folded into the single company POST —
    // carrying both the phone id and the phone payload.
    expect(spies.ensureCompany).toHaveBeenCalledTimes(1);
    expect(spies.ensureCompany).toHaveBeenCalledWith({
      model: expect.objectContaining({
        name: "Acme Ltd",
        phoneId: phone.id,
        phone: phone.phone
      })
    });
  });

  it("PERSONAL: fires the standalone phone POST exactly once and no company POST", async () => {
    const model: UnifiedModel = { phone };

    await callAdd(UnifiedType.PERSONAL, model);

    // Personal is the ONLY path where the phone is POSTed standalone — once.
    expect(spies.ensurePhone).toHaveBeenCalledTimes(1);
    expect(spies.ensurePhone).toHaveBeenCalledWith(phone);

    // No company is created on the personal path.
    expect(spies.ensureCompany).not.toHaveBeenCalled();
  });
});
