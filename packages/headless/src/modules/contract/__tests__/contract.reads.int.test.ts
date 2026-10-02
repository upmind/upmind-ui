// -----------------------------------------------------------------------------
/**
 * @module contract/__tests__/contract.reads
 * @description Pins the client contract read (`useContract`) against its own
 * recorded reality (ADR 035): the EXACT `with` set the module sends, and the
 * full `ContractProduct` map plus `contract.paymentMethod` the account area
 * reads off `contract.products[]`. Every expected value is read from the
 * recording, never a copied production expression.
 *
 * ## What Breaks If These Fail
 * The contract read drops a `with` member the account area needs, or the mapper
 * stops carrying a product reading (title, status, price, dates, cancellation
 * state, delegating clients) or the paid-with method — and the UI shows a blank
 * where a value belongs.
 */

import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { replayStep } from "@upmind-automation/test-fixtures/replay-server";
import { useContract } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { resetContractScopes, seedClientSession } from "./contract.int-helpers";
import { server } from "./setup.integration";
import { find, map } from "lodash-es";
import type { IContract } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const FIXTURES_DIR = join(import.meta.dirname, "fixtures");

function recordedContract(): IContract {
  return getFixtureBody<{ data: IContract }>(
    "get-contracts-id-with-staged-imports-1",
    { recordingsDir: FIXTURES_DIR }
  ).data;
}

const CONTRACT_ID = recordedContract().id;

/** The exact `with` members the contract read must send (`CONTRACT_WITH`). */
const CONTRACT_WITH_MEMBERS = [
  "products.clients",
  "products.clients.image",
  "products.clients.brand",
  "products.status",
  "products.product.image",
  "products.product.brand.currency",
  "products.brand.currency",
  "products.product.provision_blueprint",
  "products.product.provision_blueprint.category",
  "products.contract_request",
  "products.future_cancellation_request",
  "products.moved_to_contract_product",
  "products.moved_to_contract_product.clients",
  "products.tags",
  "cancellation_request",
  "client.image",
  "status",
  "cancellation_request.status",
  "payment_details"
];

/** The translated billing-cycle label the term catalogue (`i18n/.../term-en.json`) carries per cycle length — `term.<key>` in this replay env, where i18n returns the key. */
const TERM_LABEL: Record<number, string> = {
  1: "term.monthly",
  12: "term.annually"
};

let sentWith: string[] | undefined;

beforeEach(async () => {
  sentWith = undefined;
  server.events.on("request:start", ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith(`/contracts/${CONTRACT_ID}`)) {
      const value = url.searchParams.get("with");
      if (value) sentWith = value.split(",");
    }
  });
  await seedClientSession();
  replayStep(server, FIXTURES_DIR);
});

afterEach(() => {
  server.events.removeAllListeners();
  resetContractScopes();
});

async function readContract() {
  const manager = useContract().as(ScopeActorTypes.CLIENT).withId(CONTRACT_ID);
  await manager.useActions().isReady();
  const context = manager.useContext();
  await vi.waitFor(() => {
    expect(context.contract.value?.products.length).toBeGreaterThan(0);
  });
  return context.contract.value!;
}

// -----------------------------------------------------------------------------

describe("useContract — the with set the read sends", () => {
  it("sends exactly the mapped CONTRACT_WITH members, payment_details included", async () => {
    await readContract();
    expect([...(sentWith ?? [])].sort()).toEqual(
      [...CONTRACT_WITH_MEMBERS].sort()
    );
  });
});

type RawProduct = IContract["products"][number] & {
  future_cancellation_request?: { id?: string };
  clients?: { id: string }[];
};

function mappedById(
  products: Awaited<ReturnType<typeof readContract>>["products"],
  id: string
) {
  const product = find(products, { id });
  if (!product) throw new Error(`mapped product ${id} missing`);
  return product;
}

describe("useContract — contract.products[] carries the full ContractProduct map", () => {
  it("titles the product by its shared product name", async () => {
    const contract = await readContract();
    const raw = recordedContract().products[0];
    expect(mappedById(contract.products, raw.id).title).toContain(
      (raw.name ?? "").trim()
    );
  });

  it("titles the product by its service identifier where it has one", async () => {
    const contract = await readContract();
    const raw = find(
      recordedContract().products,
      product => !!product.service_identifier
    );
    expect(
      raw,
      "re-record: no recorded product carries a service_identifier"
    ).toBeTruthy();
    expect(mappedById(contract.products, raw!.id).title).toContain(
      raw!.service_identifier!
    );
  });

  it("carries the product status and its translated-badge meta", async () => {
    const contract = await readContract();
    const raw = recordedContract().products[0];
    const product = mappedById(contract.products, raw.id);
    expect(product.status?.code).toBe(raw.status?.code);
    expect(product.meta.isActive).toBe(raw.status?.code === "contract_active");
  });

  it("carries the formatted price and billing cycle", async () => {
    const contract = await readContract();
    const raw = recordedContract().products[0];
    const product = mappedById(contract.products, raw.id);
    const rawPrice = raw as typeof raw & { selling_price_formatted?: string };
    expect(product.priceFormatted).toBe(rawPrice.selling_price_formatted);
    expect(product.billingCycleMonths).toBe(raw.billing_cycle_months);
    expect(product.billingCycle).toBe(TERM_LABEL[raw.billing_cycle_months]);
  });

  it("carries the purchase and next-due dates as the recorded wire ISO", async () => {
    const contract = await readContract();
    const raw = recordedContract().products[0];
    const product = mappedById(contract.products, raw.id);
    expect(product.createdAt).toBe(raw.created_at);
    expect(product.nextDueDate).toBe(raw.next_due_date);
    expect(product.dateCreated).toBeTruthy();
    expect(product.dateNextDue).toBeTruthy();
  });

  it("carries the product cancellation request and its status", async () => {
    const contract = await readContract();
    const raw = find(
      recordedContract().products,
      product => !!product.contract_request
    );
    expect(
      raw,
      "re-record: no recorded product carries a contract_request"
    ).toBeTruthy();
    const product = mappedById(contract.products, raw!.id);
    expect(product.contractRequest?.id).toBe(raw!.contract_request!.id);
    expect(product.contractRequest?.status?.code).toBe(
      raw!.contract_request!.status?.code
    );
  });

  it("carries the future cancellation request (awaits re-record)", async () => {
    const contract = await readContract();
    const raw = find(
      recordedContract().products as RawProduct[],
      product => !!product.future_cancellation_request
    );
    expect(
      raw,
      "re-record: products.future_cancellation_request must be captured on a product that has one"
    ).toBeTruthy();
    expect(
      mappedById(contract.products, raw!.id).futureCancellationRequest?.id
    ).toBe(raw!.future_cancellation_request!.id);
  });

  it("carries the delegating clients where present (awaits re-record)", async () => {
    const contract = await readContract();
    const raw = find(
      recordedContract().products as RawProduct[],
      product => !!product.clients?.length
    );
    expect(
      raw,
      "re-record: products.clients must be captured on a delegated product"
    ).toBeTruthy();
    expect(
      map(mappedById(contract.products, raw!.id).delegatingClients, "id")
    ).toEqual(map(raw!.clients, "id"));
  });
});

describe("useContract — contract.paymentMethod is the paid-with stored method", () => {
  it("labels the method the contract pays with (awaits re-record)", async () => {
    const contract = await readContract();
    const raw = recordedContract() as IContract & {
      payment_details?: { id: string; name?: string };
    };
    expect(
      raw.payment_details,
      "re-record: payment_details relation must be captured so paymentMethod can label it"
    ).toBeTruthy();
    expect(contract.paymentMethod?.id).toBe(raw.payment_details_id);
    expect(contract.paymentMethod?.label).toBe(raw.payment_details?.name);
  });
});
