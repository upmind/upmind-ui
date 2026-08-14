// -----------------------------------------------------------------------------
/**
 * @fileoverview collection row actions — delete and set-default
 * (integration, AC-10/AC-12/AC-15)
 *
 * ## Job To Be Done
 * Prove the two collection mutations at the wire: `remove` issues a DELETE for
 * that row, as that client, and the row leaves the list; `setDefault` issues a
 * PUT whose body is EXACTLY `{ default: true }` — nothing else — and the list
 * reflects the new default. Both then invalidate, so the collection re-reads
 * itself with no consumer-side refresh (AC-15).
 *
 * Every response body is a fixture captured by
 * `pnpm fixtures:generate client-address`; the list handler's post-mutation
 * rows are the server-side effect the replay harness stands in for, never a
 * hand-typed body.
 *
 * ## What Breaks If These Fail
 * A delete that does not delete, or a set-default that sends a whole address
 * payload and moves fields the user never touched.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  installAddressesListHandler,
  recorded,
  recordedRows,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";
import type { ObservedRequest } from "./client-address.int-helpers";

// -----------------------------------------------------------------------------

type Captured = { request?: ObservedRequest; body?: unknown };

function capture(request: Request, into: Captured): void {
  into.request = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  };
}

/** Opens the collection over the two real rows and waits for it to settle. */
async function openCollection() {
  const { clientId, accessToken } = await seedClientSession();
  const { primary, secondary } = recordedRows();
  const list = installAddressesListHandler(server, clientId, [
    primary,
    secondary
  ]);
  const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
  await vi.waitFor(() =>
    expect(addresses.useContext().data.value).toHaveLength(2)
  );
  return { addresses, list, primary, secondary, clientId, accessToken };
}

// -----------------------------------------------------------------------------

describe("collection row actions — I delete an address I no longer use (AC-10)", () => {
  it("AC-10 issues the DELETE for that row as that client, and the row leaves my list", async () => {
    const { addresses, list, primary, secondary, clientId, accessToken } =
      await openCollection();
    const captured: Captured = {};
    server?.use(
      http.delete(
        `*/clients/${clientId}/addresses/${secondary.id}`,
        ({ request }) => {
          capture(request, captured);
          list.setRows([primary]);
          return HttpResponse.json(recorded.removed(), { status: 200 });
        }
      )
    );

    await addresses.useActions().remove(secondary.id);

    expect(captured.request).toBeDefined();
    expect(captured.request!.method).toBe("DELETE");
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    await vi.waitFor(() =>
      expect(
        addresses.useContext().data.value.some(row => row.id === secondary.id)
      ).toBe(false)
    );
  });

  it("AC-10/AC-15 re-reads the collection off the delete, with no consumer-side refresh", async () => {
    const { addresses, list, primary, secondary, clientId } =
      await openCollection();
    const before = list.reads();
    server?.use(
      http.delete(`*/clients/${clientId}/addresses/${secondary.id}`, () => {
        list.setRows([primary]);
        return HttpResponse.json(recorded.removed(), { status: 200 });
      })
    );

    await addresses.useActions().remove(secondary.id);

    await vi.waitFor(() => expect(list.reads()).toBeGreaterThan(before));
  });
});

describe("collection row actions — I choose which address is my default (AC-12)", () => {
  it("AC-12 puts EXACTLY { default: true } — nothing else goes on the wire", async () => {
    const { addresses, list, primary, secondary, clientId, accessToken } =
      await openCollection();
    const captured: Captured = {};
    server?.use(
      http.put(
        `*/clients/${clientId}/addresses/${secondary.id}`,
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

    await addresses.useActions().setDefault(secondary.id);

    expect(captured.request).toBeDefined();
    expect(captured.request!.method).toBe("PUT");
    assertClientIdentityTransport(captured.request!, clientId, accessToken);
    expect(captured.body).toEqual({ default: true });
  });

  it("AC-12 moves the default in my list — the old one stops being it", async () => {
    const { addresses, list, primary, secondary, clientId } =
      await openCollection();
    server?.use(
      http.put(`*/clients/${clientId}/addresses/${secondary.id}`, () => {
        list.setRows([
          { ...primary, default: false },
          { ...secondary, default: true }
        ]);
        return HttpResponse.json(recorded.defaulted(), { status: 200 });
      })
    );

    await addresses.useActions().setDefault(secondary.id);

    await vi.waitFor(() => {
      const rows = addresses.useContext().data.value;
      expect(rows.find(row => row.id === secondary.id)?.meta.isDefault).toBe(
        true
      );
      expect(rows.find(row => row.id === primary.id)?.meta.isDefault).toBe(
        false
      );
    });
    expect(addresses.useContext().default()).toBe(secondary.id);
  });
});
