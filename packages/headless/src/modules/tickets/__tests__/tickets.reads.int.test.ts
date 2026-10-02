// -----------------------------------------------------------------------------
/**
 * @module tickets/__tests__/tickets.reads
 * @description Pins the client single ticket read (`useTicket`) against its own
 * recorded reality (ADR 035): the EXACT `with` set the module sends since
 * FE-3206 widened it to the full `contract_product.*` members, and the full
 * `ContractProduct` view model the detail surface reads off the linked
 * `ticket.contract_product`. Every expected value is read from the recording,
 * never a copied production expression.
 *
 * ## Job To Be Done
 * Prove the single read asks the API for the whole `contract_product.*` set and
 * that the linked product arrives mapped through the contract-product module's
 * `mapContractProduct` — the same view model `useContractProduct` serves.
 *
 * ## What Breaks If These Fail
 * The single read drops a `with` member the detail area needs, or the mapper
 * stops carrying a product reading (title, status, price, billing cycle, dates)
 * — and the UI shows a blank where a value belongs.
 *
 * The contract-product cancellation-request, future-cancellation and delegation
 * mapping members are proven at the contract read (`contract.reads.int.test.ts`):
 * the staging ticket-linked product carries none of those states, so they are
 * not re-proven here.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTicket } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  RECORDED_TICKET_ID,
  installTicketsHandlers,
  observeTicketsRequests,
  recorded,
  resetTicketsScopes,
  seedClientSession
} from "./tickets.int-helpers";
import "./setup.integration";
import { find } from "lodash-es";
import type { Ticket } from "..";

// -----------------------------------------------------------------------------

/** The exact `with` members the single ticket read must send (`ONE_WITH`). */
const TICKET_ONE_WITH_MEMBERS = [
  "account",
  "brand",
  "brand.image",
  "client",
  "client.image",
  "contract_product",
  "contract_product.clients",
  "contract_product.clients.image",
  "contract_product.clients.brand",
  "contract_product.status",
  "contract_product.product.image",
  "contract_product.brand.currency",
  "contract_product.product.provision_blueprint",
  "contract_product.product.provision_blueprint.category",
  "contract_product.contract_request",
  "contract_product.future_cancellation_request",
  "contract_product.moved_to_contract_product",
  "contract_product.moved_to_contract_product.clients",
  "contract_product.tags",
  "delegates",
  "delegates.client",
  "delegates.client.image",
  "department",
  "department.brand_ticket_departments",
  "import.credentials",
  "import.source",
  "invoice",
  "invoice.status",
  "lead",
  "lead_user.image",
  "settings",
  "status",
  "user",
  "users",
  "users.image"
];

/** The translated billing-cycle label the term catalogue returns per cycle length — `term.<key>` in this replay env, where i18n returns the key. */
const TERM_LABEL: Record<number, string> = {
  24: "term.biennially"
};

let observer: ReturnType<typeof observeTicketsRequests> | undefined;

beforeEach(async () => {
  await seedClientSession();
  const handlers = installTicketsHandlers();
  handlers.setOneBody(recorded.oneLinked());
  observer = observeTicketsRequests();
});

afterEach(async () => {
  observer?.stop();
  observer = undefined;
  await resetTicketsScopes();
});

async function readLinkedTicket(): Promise<Ticket> {
  const manager = useTicket()
    .as(ScopeActorTypes.CLIENT)
    .withId(RECORDED_TICKET_ID);
  await manager.useActions().isReady();
  const context = manager.useContext() as { data: { value?: Ticket } };
  await vi.waitFor(() => {
    expect(context.data.value?.contract_product).toBeTruthy();
  });
  return context.data.value!;
}

function singleReadWith(): string[] {
  const read = find(observer?.all() ?? [], request => {
    const pathname = new URL(request.url).pathname;
    return (
      request.method === "GET" &&
      pathname.endsWith(`/tickets/${RECORDED_TICKET_ID}`)
    );
  });
  if (!read) throw new Error("no single ticket read observed");
  const value = new URL(read.url).searchParams.get("with");
  return value ? value.split(",") : [];
}

// -----------------------------------------------------------------------------

describe("useTicket — the with set the single read sends", () => {
  it("sends exactly the widened ONE_WITH, full contract_product.* included", async () => {
    await readLinkedTicket();
    expect([...singleReadWith()].sort()).toEqual(
      [...TICKET_ONE_WITH_MEMBERS].sort()
    );
  });
});

describe("useTicket — the linked ticket carries the full ContractProduct map", () => {
  it("titles the product by its name and service identifier", async () => {
    const ticket = await readLinkedTicket();
    expect(ticket.contract_product?.title).toBe(
      "Starter Hosting (testdomain.com)"
    );
  });

  it("carries the product status and its contract-closed badge meta", async () => {
    const ticket = await readLinkedTicket();
    expect(ticket.contract_product?.status?.code).toBe("contract_closed");
    expect(ticket.contract_product?.meta.isClosed).toBe(true);
    expect(ticket.contract_product?.meta.isActive).toBe(false);
  });

  it("carries the formatted price and billing cycle", async () => {
    const ticket = await readLinkedTicket();
    expect(ticket.contract_product?.priceFormatted).toBe("£60.00");
    expect(ticket.contract_product?.billingCycleMonths).toBe(24);
    expect(ticket.contract_product?.billingCycle).toBe(TERM_LABEL[24]);
  });

  it("carries the purchase and next-due dates as the recorded wire values", async () => {
    const ticket = await readLinkedTicket();
    expect(ticket.contract_product?.createdAt).toBe("2025-06-04 09:06:13");
    expect(ticket.contract_product?.nextDueDate).toBeNull();
  });
});
