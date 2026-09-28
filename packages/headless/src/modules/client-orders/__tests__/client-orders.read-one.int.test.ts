// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the manager reads one order (AC-13)
 *
 * ## Job To Be Done
 * Prove `useClientOrder().as('self').withId(id)` reads `GET api/invoices/{id}`
 * with `with_staged_imports=1` and exactly the 13 legacy relations of design
 * 8.1, and never `client.parent_client_config` (D-2). An identifier that
 * staging refuses publishes no record, an error and `isEmpty`. The reload
 * control sends the read again.
 *
 * ## Provenance
 * The recorded `order-paid` single read, served on its own id. The recorded
 * `order-not-found` 404, served verbatim with its recorded status on its own
 * id.
 *
 * ## What Breaks If These Fail
 * An opened order loses detail fields, reads a relation that breaks the
 * delegated rules, or a refused identifier leaves a blank page with no error.
 */

import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientOrder } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  capture,
  capturedOrder,
  observeOrderRequests,
  seedClientSession,
  serveRecordedOrder
} from "./client-orders.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const RELATIONS = [
  "account.affiliate_referral.affiliate_account.account.client",
  "affiliate_commissions",
  "brand",
  "client",
  "client.tags",
  "contract",
  "contract_product_tags",
  "custom_fields.field",
  "payments",
  "promotions",
  "status",
  "taxes",
  "taxes.tax_tag_data"
];

const PAID = capturedOrder("get-invoices-id-case-order-paid");
const PAID_ID = PAID.data.id as string;

let observer: ReturnType<typeof observeOrderRequests>;

const singleReads = () =>
  observer
    .all()
    .filter(request =>
      /\/api\/invoices\/[^/?]+/.test(new URL(request.url).pathname)
    );

async function bootOn(id: string) {
  const manager = useClientOrder().as(ScopeActorTypes.SELF).withId(id);
  await vi.waitFor(() => expect(manager.useMeta().isLoading.value).toBe(false));
  return manager;
}

async function bootOnNotFound() {
  const notFound = capture("get-invoices-id-case-order-not-found");
  const missingId = new URL(notFound.request.path, "http://x").pathname
    .split("/")
    .at(-1)!;
  server?.use(
    http.get("*/api/invoices/:id", ({ params }) =>
      params.id === missingId
        ? HttpResponse.json(notFound.response.body as object, {
            status: notFound.response.status
          })
        : HttpResponse.error()
    )
  );
  const manager = useClientOrder().as(ScopeActorTypes.SELF).withId(missingId);
  await vi.waitFor(() => expect(manager.useMeta().hasError.value).toBe(true));
  return manager;
}

describe("client-orders — the manager reads one order (AC-13)", () => {
  beforeEach(async () => {
    await seedClientSession();
    observer = observeOrderRequests();
  }, 30000);

  it("reads api/invoices/{id} with with_staged_imports=1 and the legacy relation set", async () => {
    serveRecordedOrder(PAID);
    const manager = await bootOn(PAID_ID);

    const [first] = singleReads();
    const url = new URL(first.url);
    expect(url.pathname).toBe(`/api/invoices/${PAID_ID}`);
    expect(url.searchParams.get("with_staged_imports")).toBe("1");
    expect((url.searchParams.get("with") ?? "").split(",").sort()).toEqual(
      RELATIONS
    );
    expect(url.searchParams.get("with")).not.toContain("parent_client_config");
    expect(manager.useContext().data.value?.id).toBe(PAID_ID);
  });

  it("an identifier that does not resolve publishes an error after one read", async () => {
    const manager = await bootOnNotFound();

    expect(manager.useContext().error.value).toBeTruthy();
    expect(singleReads()).toHaveLength(1);
  });

  it("an identifier that does not resolve publishes no record, and isEmpty (design 8.11)", async () => {
    const manager = await bootOnNotFound();

    expect(manager.useContext().data.value).toBeUndefined();
    expect(manager.useMeta().isEmpty.value).toBe(true);
  });

  it("the reload control sends the read again", async () => {
    serveRecordedOrder(PAID);
    const manager = await bootOn(PAID_ID);
    const before = singleReads().length;

    await manager.useActions().refresh();

    expect(singleReads()).toHaveLength(before + 1);
    expect(
      new URL(singleReads().at(-1)!.url).searchParams.get("with_staged_imports")
    ).toBe("1");
  });
});
