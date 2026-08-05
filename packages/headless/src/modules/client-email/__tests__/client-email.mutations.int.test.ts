// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email collection row actions — delete, set-default, resend, find-or-create
 *
 * ## Job To Be Done
 * Drive the REAL `useClientEmails().as('self')` row actions through the barrel
 * and prove each one reaches the wire as the contract states: addressed to the
 * SCOPE-RESOLVED client's own resource (AC-4/5/6/7), carrying that client
 * session's token and no acting-as headers, with the documented body, and with
 * the collection reflecting the result afterwards.
 *
 * Every response body replayed here is a staging recording. Where a test
 * changes what the NEXT list read returns, it is standing in for the server's
 * own post-effect — the rows themselves are never authored, only re-served.
 *
 * ## What Breaks If These Fail
 * A row action firing against the wrong client id is FE-2824 for writes. A
 * wrong body (a stray `type` on create, a missing `default:true` on
 * set-primary) silently drifts from the legacy wire contract.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  installEmailsListHandler,
  recorded,
  recordedRows,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";
import type { ObservedRequest, WireEmail } from "./client-email.int-helpers";

// -----------------------------------------------------------------------------

/** Opens the collection over the two recorded rows and waits for it to settle. */
async function openCollection(clientId: string) {
  const { primary, secondary } = recordedRows();
  const list = installEmailsListHandler(server, clientId, [primary, secondary]);
  const emails = useClientEmails().as(ScopeActorTypes.SELF);
  await vi.waitFor(() =>
    expect(emails.useContext().data.value).toHaveLength(2)
  );
  return { emails, list, primary, secondary };
}

type Captured = { request?: ObservedRequest; body?: unknown };

/** Records the request an override handler receives, for the A7 read-back. */
function capture(request: Request, into: Captured): void {
  into.request = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  };
}

// -----------------------------------------------------------------------------

describe("client-email row actions", () => {
  it("AC-4 deletes a deletable address from my own collection and it leaves my list", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { emails, list, primary, secondary } = await openCollection(clientId);
    const captured: Captured = {};

    server?.use(
      http.delete(
        `*/clients/${clientId}/emails/${secondary.id}`,
        ({ request }) => {
          capture(request, captured);
          list.setRows([primary]);
          return HttpResponse.json(recorded.removed(), { status: 200 });
        }
      )
    );

    await emails.useActions().remove(secondary.id);

    await vi.waitFor(() => expect(captured.request).toBeDefined());
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("DELETE");
    expect(captured.request!.url).toContain(`/emails/${secondary.id}`);

    await vi.waitFor(() => {
      expect(
        emails.useContext().data.value.some(email => email.id === secondary.id)
      ).toBe(false);
    });
  });

  it("AC-4 surfaces the server's deletability verdict on each row", async () => {
    const { clientId } = await seedClientSession();
    const { emails, primary, secondary } = await openCollection(clientId);

    const rows = emails.useContext().data.value;
    expect(rows.find(row => row.id === primary.id)?.meta.canDelete).toBe(
      primary.can_delete
    );
    expect(rows.find(row => row.id === secondary.id)?.meta.canDelete).toBe(
      secondary.can_delete
    );
  });

  it("AC-5 makes an address my default — PUT {default:true} — and my previous default stops being it", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { emails, list, primary, secondary } = await openCollection(clientId);
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/clients/${clientId}/emails/${secondary.id}`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          // The server's own post-effect, replayed: the default moves.
          list.setRows([
            { ...primary, default: false } as WireEmail,
            { ...secondary, default: true } as WireEmail
          ]);
          return HttpResponse.json(recorded.defaulted(), { status: 200 });
        }
      )
    );

    await emails.useActions().setDefault(secondary.id);

    await vi.waitFor(() => expect(captured.request).toBeDefined());
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("PUT");
    expect(captured.body).toEqual({ default: true });

    await vi.waitFor(() => {
      const rows = emails.useContext().data.value;
      expect(rows.find(row => row.id === secondary.id)?.meta.isDefault).toBe(
        true
      );
      expect(rows.find(row => row.id === primary.id)?.meta.isDefault).toBe(
        false
      );
    });
  });

  it("AC-6 requests a fresh verification email — PATCH .../send_verify", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { emails, list, secondary } = await openCollection(clientId);
    const captured: Captured = {};
    const readsBefore = list.reads();

    server?.use(
      http.patch(
        `*/clients/${clientId}/emails/${secondary.id}/send_verify`,
        ({ request }) => {
          capture(request, captured);
          return HttpResponse.json(recorded.verified(), { status: 200 });
        }
      )
    );

    await emails.useActions().verify(secondary.id);

    await vi.waitFor(() => expect(captured.request).toBeDefined());
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("PATCH");
    expect(captured.request!.url).toContain(
      `/emails/${secondary.id}/send_verify`
    );
    await vi.waitFor(() => expect(list.reads()).toBeGreaterThan(readsBefore));
    expect(emails.useContext().error.value).toBeFalsy();
  });

  it("AC-7 adding an address I already hold returns that address and creates nothing", async () => {
    const { clientId } = await seedClientSession();
    const { emails, primary } = await openCollection(clientId);
    let posted = false;

    server?.use(
      http.post(`*/clients/${clientId}/emails`, () => {
        posted = true;
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const result = await emails.useActions().ensure({ email: primary.email });

    expect(posted).toBe(false);
    expect(result.id).toBe(primary.id);
  });

  it("AC-7 adding an address I do not hold POSTs {email} to my own collection and returns the created address", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { primary } = recordedRows();
    // Only the account's own address is held, so the recorded creation is
    // genuinely absent — `secondary` IS that created record.
    const list = installEmailsListHandler(server, clientId, [primary]);
    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(1)
    );
    const created = recorded.created().data;
    const captured: Captured = {};

    server?.use(
      http.post(`*/clients/${clientId}/emails`, async ({ request }) => {
        capture(request, captured);
        captured.body = await request.json();
        list.setRows([primary, created]);
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const result = await emails.useActions().ensure({ email: created.email });

    await vi.waitFor(() => expect(captured.request).toBeDefined());
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.request!.method).toBe("POST");
    expect(captured.body).toEqual({ email: created.email });
    expect(result.email).toBe(created.email);
  });
});
