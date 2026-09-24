/**
 * @fileoverview useContractProduct — the template context/action members ruling
 * R37 restores, and the failed-load settlement decisions D43/D44 (integration)
 *
 * ## Job To Be Done
 * Prove that the per-product manager publishes each template member over the
 * recorded corpus: `useContext().id` names the product it addresses,
 * `.title` its name, `.description` its description, `.lookups` its loaded
 * CANCEL_REQUEST custom fields; that a failed load settles on the top-level
 * error node (D43) so `useMeta().hasError` is true and `.isLoading` false at
 * once, `useContext().errors` carries the failed read's message, and
 * `useActions().isReady()` resolves false without waiting out the load timeout;
 * and that `useActions().onDone()` resolves true once a write settles (D44).
 *
 * ## What Breaks If These Fail
 * A page cannot name, title or describe the product a client has open, cannot
 * draw the cancellation form's custom fields, hangs on a read that failed
 * instead of showing the error, or never learns a change finished.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useContractProduct } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installProductHandler,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";

async function openManager() {
  await seedClientSession();
  installProductHandler(server);
  const product = recorded.one().data;
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(product.id);
  await manager.useActions().isReady();
  return { manager, product };
}

async function openFailingManager() {
  await seedClientSession();
  const productId = recorded.one().data.id;
  const failure = recorded.withdrawRejected().response;
  server?.use(
    http.get("*/contract_products/:id", () =>
      HttpResponse.json(failure.body as Record<string, unknown>, {
        status: failure.status
      })
    )
  );
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(productId);
  const message = (failure.body as { error: { message: string } }).error
    .message;
  return { manager, message };
}

async function settledWithin<T>(
  work: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

describe("useContractProduct — the product I have open (context members, R37)", () => {
  it("names the product it addresses through useContext().id", async () => {
    const { manager, product } = await openManager();
    expect(manager.useContext().id.value).toBe(product.id);
  });

  it("shows the product's name through useContext().title", async () => {
    const { manager, product } = await openManager();
    expect(manager.useContext().title.value).toBe(product.name);
  });

  it("shows the product's description through useContext().description", async () => {
    const { manager, product } = await openManager();
    expect(manager.useContext().description.value).toBe(product.description);
  });

  it("loads the CANCEL_REQUEST custom fields through useContext().lookups", async () => {
    const { manager, product } = await openManager();
    const customFields =
      (
        product as {
          contract?: { cancellation_request?: { custom_fields?: unknown[] } };
        }
      ).contract?.cancellation_request?.custom_fields ?? [];
    expect(manager.useContext().lookups.value).toEqual({ customFields });
  });
});

describe("useContractProduct — a read that fails settles on the error node (D43/errors)", () => {
  it("carries the failed read's message through useContext().errors", async () => {
    const { manager, message } = await openFailingManager();
    await vi.waitFor(() => expect(manager.useMeta().hasError.value).toBe(true));
    expect(manager.useContext().errors.value).toBe(message);
  });

  it("stops loading and reports an error instead of hanging (D43)", async () => {
    const { manager } = await openFailingManager();
    await vi.waitFor(() => expect(manager.useMeta().hasError.value).toBe(true));
    expect(manager.useMeta().isLoading.value).toBe(false);
  });

  it("resolves isReady() false at once on the error node (D43)", async () => {
    const { manager } = await openFailingManager();
    const ready = await settledWithin(
      manager.useActions().isReady(),
      5000,
      "never-settled" as unknown as boolean
    );
    expect(ready).toBe(false);
  });
});

describe("useContractProduct — a settled write reports done through onDone() (D44)", () => {
  it("resolves onDone() true once a change settles", async () => {
    const { manager, product } = await openManager();
    const row = product as { id: string; contract_id: string };
    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        () => HttpResponse.json(recorded.softCancelled(), { status: 200 })
      )
    );

    const done = manager.useActions().onDone();
    await manager.useActions().stopRenewing();

    expect(await settledWithin(done, 5000, false)).toBe(true);
  });
});
