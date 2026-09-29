/**
 * @fileoverview useContractProduct — the template context/action members ruling
 * R37 restores, and the failed-load settlement decisions D43/D44 (integration)
 *
 * ## Job To Be Done
 * Prove that the per-product manager publishes each template member over the
 * recorded corpus: `useContext().id` names the product it addresses,
 * `.title` its name, `.description` its description, `.lookups` the brand's
 * CANCEL_REQUEST custom-field catalogue, read when the product opens; that a failed load settles on the top-level
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

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { useContractProduct } from "..";
import { getRegistry, remove } from "../../scope/scope.registry";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCancelRequestCatalogueHandler,
  installProductHandler,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";

const clientCustomFieldsRecordingsDir = join(
  import.meta.dirname,
  "../../client-custom-fields/__tests__/fixtures"
);

// The catalogue scope outlives the contract-product evictions, so without
// this a sibling test's read would satisfy the next test's catalogue count.
function evictCatalogueScopes() {
  for (const key of [...getRegistry().keys()]) {
    if (key.startsWith("client-custom-fields:")) remove(key);
  }
}

async function openManager() {
  await seedClientSession();
  evictCatalogueScopes();
  installProductHandler(server);
  server?.use(
    http.get("*/clients/:id", () =>
      HttpResponse.json(
        getFixtureBody<Record<string, unknown>>("get-clients-id", {
          recordingsDir: clientCustomFieldsRecordingsDir
        }),
        { status: 200 }
      )
    )
  );
  const catalogue = installCancelRequestCatalogueHandler(server);
  const product = recorded.one().data;
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(product.id);
  await manager.useActions().isReady();
  return { manager, product, catalogue };
}

async function openFailingManager() {
  await seedClientSession();
  const productId = recorded.one().data.id;
  const failure = recorded.readNotFound().response;
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
  // @proves contract-product.feature:888
  it("The product I have open tells me which product it is", async () => {
    const { manager, product } = await openManager();
    expect(manager.useContext().id.value).toBe(product.id);
  });

  // @proves contract-product.feature:894
  it("The product I have open shows me its name", async () => {
    const { manager, product } = await openManager();
    expect(manager.useContext().title.value).toBe(product.name);
  });

  // @proves contract-product.feature:900
  it("The product I have open shows me its description", async () => {
    const { manager, product } = await openManager();
    expect(manager.useContext().description.value).toBe(product.description);
  });

  // @proves contract-product.feature:906
  it("The cancellation custom fields my brand defines are loaded ready for the form", async () => {
    const { manager, catalogue } = await openManager();

    await vi.waitFor(() => expect(catalogue.reads()).toBeGreaterThan(0));
    expect(manager.useContext().lookups.value).toEqual({
      customFields: recorded.cancelRequestCatalogue().data
    });
  });
});

/**
 * KNOWN GAP — `@gap contract-product.feature:910`. The recorded CANCEL_REQUEST
 * catalogue for this brand holds zero definitions
 * (`contract/__tests__/fixtures/get-custom-fields-brand-id-filter-object-type-contract-request-sort-order-asc.json`),
 * so no recorded field can be shown among the loaded lookups, and a
 * fabricated definition is barred. Same disposition as the cancellation
 * form's present-when-defined `customFields` branch in
 * `contract-product.action-schemas.int.test.ts`.
 */

describe("useContractProduct — a read that fails settles on the error node (D43/errors)", () => {
  // @proves contract-product.feature:913
  it("When reading my product fails I am shown why", async () => {
    const { manager, message } = await openFailingManager();
    await vi.waitFor(() => expect(manager.useMeta().hasError.value).toBe(true));
    expect(manager.useContext().errors.value).toBe(message);
  });

  // @proves contract-product.feature:919
  it("A failed read stops loading and settles on an error instead of hanging", async () => {
    const { manager } = await openFailingManager();
    await vi.waitFor(() => expect(manager.useMeta().hasError.value).toBe(true));
    expect(manager.useMeta().isLoading.value).toBe(false);
  });

  // @proves contract-product.feature:925
  it("A failed read tells me at once that my product is not ready", async () => {
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
  // @proves contract-product.feature:931
  it("When a change I make finishes I am told it is done", async () => {
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
