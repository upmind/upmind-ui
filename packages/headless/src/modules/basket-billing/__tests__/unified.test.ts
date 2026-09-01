/**
 * @fileoverview useUnified — the unified billing-detail lifecycle (unit)
 *
 * ## Job To Be Done
 * Prove the composable a checkout form uses to build a personal/business billing
 * detail: opening defaults to a personal detail, input runs the model through
 * validation and hands back the checked model, save returns the saved model, an
 * invalid save rejects with an error, clearing resets the detail, and stopping
 * tears the service down. The real data-manager machine + unified actions/guards
 * /schemas run; only the service boundary is doubled. Assertions derive from
 * basket-billing.feature @layer-unit AC-8..AC-13.
 *
 * ## What Breaks If These Fail
 * A guest gets a business form by default, typed details never validate, a save
 * silently succeeds on invalid data, cleared details persist, or stopped
 * services leak and keep mutating a torn-down checkout.
 */

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnifiedType } from "../unified/types";
import { useUnified } from "../unified/useUnified";
import { stopService } from "../../../utils";
import type { UnifiedContext, UnifiedModel } from "../unified/types";

const services = vi.hoisted(() => ({
  loadLookups: vi.fn(),
  parse: vi.fn(),
  validate: vi.fn(),
  add: vi.fn(),
  invalidate: vi.fn()
}));

vi.mock("../unified/services", () => ({
  useUnifiedServices: () => services
}));
vi.mock("../../session-store", () => ({
  useActiveSession: () => ({
    useActions: () => ({ isReady: vi.fn(async () => true) }),
    useContext: () => ({ activeUser: { value: { id: "client-1" } } })
  })
}));
vi.mock("../../system-localisation", () => ({
  useI18n: () => ({ t: (key: string) => key })
}));
vi.mock("../../../utils", async () => {
  const actual =
    await vi.importActual<Record<string, unknown>>("../../../utils");
  return { ...actual, stopService: vi.fn() };
});

// -----------------------------------------------------------------------------

const PERSONAL_MODEL: UnifiedModel = {
  address: {
    address1: "1 Prover Street",
    city: "Leeds",
    postcode: "LS1 1AA",
    countryId: "country-1"
  }
};

const SAVED_MODEL: UnifiedModel = {
  address: {
    address1: "1 Prover Street",
    city: "Leeds",
    postcode: "LS1 1AA",
    countryId: "country-1"
  }
};

async function open(
  type: UnifiedType = UnifiedType.PERSONAL
): Promise<ReturnType<typeof useUnified>> {
  const detail = useUnified(type);
  await flushPromises();
  await detail.isReady();
  return detail;
}

// -----------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  services.loadLookups.mockImplementation(async (context: UnifiedContext) => ({
    ...context,
    countries: [],
    regions: [],
    addresses: [],
    companies: [],
    phones: [],
    emails: []
  }));
  services.parse.mockImplementation(async (context: UnifiedContext) => ({
    ...context,
    model: PERSONAL_MODEL
  }));
  services.validate.mockImplementation(async () => true);
  services.add.mockImplementation(async () => SAVED_MODEL);
  services.invalidate.mockImplementation(async () => undefined);
});

// -----------------------------------------------------------------------------

describe("useUnified — opening a billing detail", () => {
  it("AC-8 prepares a personal billing detail when no type is specified", async () => {
    const detail = await open();

    expect(detail.meta.value.isAvailable).toBe(true);
    expect(detail.context.value?.type).toBe(UnifiedType.PERSONAL);
    expect(detail.schema.value).toBeTypeOf("object");
  });

  it("prepares a business billing detail when the business type is specified", async () => {
    const detail = await open(UnifiedType.BUSINESS);

    expect(detail.meta.value.isAvailable).toBe(true);
    expect(detail.context.value?.type).toBe(UnifiedType.BUSINESS);
  });
});

describe("useUnified — validating and saving a billing detail", () => {
  it("AC-9 validates an input model and hands back the checked model", async () => {
    const detail = await open();

    detail.input(PERSONAL_MODEL);
    const checked = await (
      detail.input as unknown as { flush: () => Promise<UnifiedModel> }
    ).flush();

    expect(services.validate).toHaveBeenCalled();
    expect(checked).toEqual(PERSONAL_MODEL);
  });

  it("AC-10 saves the detail and returns the saved model", async () => {
    const detail = await open();

    const saved = await detail.update(SAVED_MODEL);

    expect(services.add).toHaveBeenCalledTimes(1);
    expect(saved).toEqual(SAVED_MODEL);
  });

  it("AC-11 rejects the save with an error when the detail will not validate", async () => {
    services.validate.mockImplementation(async () =>
      Promise.reject({ message: "postcode invalid" })
    );
    const detail = await open();

    await expect(detail.update(SAVED_MODEL)).rejects.toBeDefined();
  });
});

describe("useUnified — clearing and stopping a billing detail", () => {
  it("AC-12 resets the billing-detail context on clear", async () => {
    const detail = await open();
    expect(detail.model.value).toEqual(PERSONAL_MODEL);

    detail.clear();

    expect(detail.model.value).toBeUndefined();
  });

  it("AC-13 tears the service down on stop", async () => {
    const detail = await open();

    detail.stop();

    expect(stopService).toHaveBeenCalledTimes(1);
  });
});
