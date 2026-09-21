/**
 * @fileoverview useContractProducts / useContractProduct — the paged products
 * collection (AC-1) and the single-product read (AC-4)
 *
 * ## Job To Be Done
 * Drive the REAL `useContractProducts()` collection and `useContractProduct()`
 * manager against RECORDED production captures (`contract-product.fixtures.ts`)
 * and prove: AC-1 — a client sees the reactive page of contract products on
 * their own account, each one arriving with its status; and AC-4 — opening
 * one product sends the real 35-member `with` list design.md §8.1 states
 * (the 18 `contract.*` members plus the 17 own members of the legacy detail
 * read [o10]), under the client's own identity. `contract-product.mutations.int.test.ts`
 * proves the manager's writes; this file proves the two reads.
 *
 * ## What Breaks If These Fail
 * A client's products page renders empty, or with rows missing the status a
 * client needs to tell an active subscription from a cancelled one; or
 * opening one product silently drops a member its detail view needs (the
 * account it belongs to, the pending contract request, the catalogue
 * product) — with no integration coverage able to catch it.
 */

import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import {
  ContractProductContextTypes,
  useContractProduct,
  useContractProducts
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** design.md §8.1's 35-member client product detail read [o10]: the 18
 * `contract.*` members plus the 17 own members. */
const PRODUCT_WITH_MEMBERS = [
  "contract",
  "contract.account",
  "contract.address",
  "contract.brand.currency",
  "contract.cancellation_request.status",
  "contract.cancellation_request.custom_fields.field",
  "contract.client",
  "contract.client.tags",
  "contract.client.image",
  "contract.gateway",
  "contract.import.credentials",
  "contract.import.source",
  "contract.moved_to_contract",
  "contract.moved_to_contract.products",
  "contract.payment_details",
  "contract.payment_details.gateway",
  "contract.promotions",
  "contract.status",
  "allowed_migrations",
  "attributes.product.image",
  "brand",
  "contract_request",
  "contract_request.custom_fields.field",
  "future_cancellation_request",
  "options.product.image",
  "product",
  "product.brand.currency",
  "product.image",
  "product.images",
  "product.provision_blueprint",
  "product.provision_category",
  "scheduled_actions",
  "status",
  "tags",
  "unpaid_recurring_invoices"
].sort();

describe("useContractProduct — I open one of my products with what its detail view needs (AC-4)", () => {
  it("AC-4 GETs contract_products/{id} with exactly the 35-member client with-list, read under my own identity", async () => {
    const { accessToken } = await seedClientSession();
    const row = recorded.one().data;
    let capturedUrl: string | undefined;
    let capturedAuth: string | null | undefined;

    server?.use(
      http.get(`*/contract_products/:id`, ({ request, params }) => {
        if (String(params.id) !== row.id) return undefined;
        capturedUrl = request.url;
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.json(recorded.one(), { status: 200 });
      })
    );

    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
    await manager.useActions().isReady();

    expect(capturedUrl).toBeDefined();
    expect(capturedAuth).toBe(`Bearer ${accessToken}`);
    const withParam = new URL(capturedUrl!).searchParams.get("with") ?? "";
    const requestedMembers = withParam.split(",").filter(Boolean).sort();
    expect(requestedMembers).toEqual(PRODUCT_WITH_MEMBERS);
  });
});

describe("useContractProducts — I see the products on my own account (AC-1)", () => {
  it("AC-1 the reactive page arrives from the RECORDED production list capture, each row carrying a mapped status", async () => {
    await seedClientSession();
    installBackgroundStubs();
    server?.use(
      http.get("*/contracts_products", () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const context = collection.useContext();
    const meta = collection.useMeta();

    await vi.waitFor(() => {
      expect(context.data.value.length).toBeGreaterThan(0);
    });

    expect(meta.hasError.value).toBe(false);
    for (const product of context.data.value) {
      expect(product.id).toBeTruthy();
      expect(product.status?.code).toBeTruthy();
    }
  });
});
