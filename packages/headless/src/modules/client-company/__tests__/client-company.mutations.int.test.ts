// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company collection mutations — delete, set-default, save (AC-10, AC-11, AC-19, AC-20)
 *
 * ## Job To Be Done
 * Drive the REAL `useClientCompanies().as(CLIENT)` row actions and the
 * manager's `update()` through the barrel and prove each reaches the wire as
 * the contract states: addressed to the SCOPE-RESOLVED client's own resource,
 * carrying that client session's token and no acting-as headers, with the
 * documented body, and with the collection reflecting the result afterwards.
 *
 * AC-19's update path is the G3 read-back: an edit's PUT body carries EXACTLY
 * the changed key — asserted by key SET, so a full-payload implementation
 * cannot pass. AC-20's inline-create path is C26: a brand-new email supplied
 * inline is created FIRST, and the company body then carries the id that
 * request returned.
 *
 * Every response body replayed here is a staging recording; the mutation
 * post-effects (a row's default flipping, a row disappearing) are served
 * through `installCompaniesListHandler`'s override, standing in for the
 * server's own effect — never a hand-typed wire body.
 *
 * ## What Breaks If These Fail
 * A row action firing against the wrong client id is FE-2824 for writes. A
 * full-payload update (G3) silently clobbers a concurrent writer's change.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  ClientCompanyContextTypes,
  useClientCompanies,
  useClientCompanyManager
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  installCompaniesListHandler,
  recorded,
  recordedRows,
  seedClientSession
} from "./client-company.int-helpers";
import { server } from "./setup.integration";
import type { ObservedRequest } from "./client-company.int-helpers";

// -----------------------------------------------------------------------------

type Captured = { request?: ObservedRequest; body?: unknown };

function capture(request: Request, into: Captured): void {
  into.request = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  };
}

async function openCollection(clientId: string) {
  const { primary, secondary } = recordedRows();
  const list = installCompaniesListHandler(server, clientId, [
    primary,
    secondary
  ]);
  const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
  await vi.waitFor(() =>
    expect(companies.useContext().data.value).toHaveLength(2)
  );
  return { companies, list, primary, secondary };
}

// -----------------------------------------------------------------------------

describe("client-company collection row actions (AC-10, AC-11)", () => {
  it("AC-10 deletes one of my companies and it leaves my list", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { companies, list, primary, secondary } =
      await openCollection(clientId);
    const captured: Captured = {};

    server?.use(
      http.delete(
        `*/clients/${clientId}/companies/${secondary.id}`,
        ({ request }) => {
          capture(request, captured);
          list.setRows([primary]);
          return HttpResponse.json(recorded.removed(), { status: 200 });
        }
      )
    );

    await companies.useActions().remove(secondary.id);

    await vi.waitFor(() => expect(captured.request).toBeDefined());
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("DELETE");
    expect(captured.request!.url).toContain(`/companies/${secondary.id}`);
    expect(captured.request!.url).not.toContain("companies/undefined");

    await vi.waitFor(() => {
      expect(
        companies
          .useContext()
          .data.value.some(company => company.id === secondary.id)
      ).toBe(false);
    });
  });

  it("AC-11 sets a company as my default — PUT {default:true} — and my list reflects it without reopening", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { companies, list, primary, secondary } =
      await openCollection(clientId);
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/clients/${clientId}/companies/${secondary.id}`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          list.setRows([
            { ...primary, default: false },
            { ...secondary, default: true }
          ]);
          return HttpResponse.json(recorded.defaulted(), { status: 200 });
        }
      )
    );

    await companies.useActions().setDefault(secondary.id);

    await vi.waitFor(() => expect(captured.request).toBeDefined());
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("PUT");
    expect(captured.body).toEqual({ default: true });

    await vi.waitFor(() => {
      expect(companies.useContext().default()).toBe(secondary.id);
    });
  });
});

describe("client-company manager save (AC-19)", () => {
  it("AC-19 creates a brand-new company — one POST carrying the mapped name/reg_number/vat_number/address_id", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const created = recorded.created().data;
    const captured: Captured = {};
    let postCount = 0;

    server?.use(
      http.post(`*/clients/${clientId}/companies`, async ({ request }) => {
        postCount += 1;
        capture(request, captured);
        captured.body = await request.json();
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const manager = useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();

    await manager.useActions().update({
      name: created.name,
      regNumber: created.reg_number,
      tax: { number: created.vat_number },
      addressId: created.address_id
    });

    expect(postCount).toBe(1);
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.body).toMatchObject({
      name: created.name,
      reg_number: created.reg_number,
      address_id: created.address_id
    });
  });

  it("AC-19/G3 updates an existing company sending ONLY the changed key — never the untouched sibling ids", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const target = recorded.one().data;
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/clients/${clientId}/companies/${target.id}`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.updated(), { status: 200 });
        }
      )
    );

    const manager = useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientCompanyContextTypes.COMPANY, target.id);
    await manager.useActions().isReady();

    await manager.useActions().update({ name: "Prover Renamed Co" });

    await vi.waitFor(() => expect(captured.request).toBeDefined());
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("PUT");
    const bodyKeys = Object.keys(captured.body as Record<string, unknown>);
    expect(bodyKeys).toEqual(["name"]);
    expect(bodyKeys).not.toEqual(
      expect.arrayContaining([
        "reg_number",
        "vat_number",
        "address_id",
        "email_id",
        "phone_id"
      ])
    );
  });
});

describe("client-company manager — choosing dependencies (AC-20, C26)", () => {
  it("AC-20 saves against an EXISTING email id supplied directly, with no sibling-create request", async () => {
    const { clientId } = await seedClientSession();
    const emails = recorded.emails().data as { id: string }[];
    const existingEmailId = emails[0].id;
    let emailPosted = false;
    const captured: Captured = {};

    server?.use(
      http.post(`*/clients/${clientId}/emails`, () => {
        emailPosted = true;
        return HttpResponse.json(recorded.inlineEmailCreated(), {
          status: 200
        });
      }),
      http.post(`*/clients/${clientId}/companies`, async ({ request }) => {
        captured.body = await request.json();
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const manager = useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();

    await manager.useActions().update({
      name: "Prover Co",
      addressId: recorded.addresses().data[0].id as string,
      emailId: existingEmailId
    });

    expect(emailPosted).toBe(false);
    expect((captured.body as { email_id?: string }).email_id).toBe(
      existingEmailId
    );
  });

  it("AC-20/C26 creates a brand-new inline email FIRST, then saves the company against the id that request returned", async () => {
    const { clientId } = await seedClientSession();
    const created = recorded.inlineEmailCreated().data as {
      id: string;
      email: string;
    };
    const captured: Captured = {};
    const order: string[] = [];

    server?.use(
      http.post(`*/clients/${clientId}/emails`, async () => {
        order.push("email");
        return HttpResponse.json(recorded.inlineEmailCreated(), {
          status: 200
        });
      }),
      http.post(`*/clients/${clientId}/companies`, async ({ request }) => {
        order.push("company");
        captured.body = await request.json();
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const manager = useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();

    await manager.useActions().update({
      name: "Prover Co",
      addressId: recorded.addresses().data[0].id as string,
      email: created.email
    });

    expect(order).toEqual(["email", "company"]);
    expect((captured.body as { email_id?: string }).email_id).toBe(created.id);
  });
});
