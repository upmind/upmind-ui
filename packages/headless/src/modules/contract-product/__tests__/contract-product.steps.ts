// -----------------------------------------------------------------------------
/**
 * @module contract-product/__tests__/contract-product.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * sibling `contract-product.feature`'s DRIVEABLE scenarios use. Engine-free by
 * construction: it imports `defineSteps` and `World`, the module's scope and
 * form vocabulary and lodash, and nothing else, so the same catalog
 * re-registers against any runner and a browser can carry it.
 *
 * ## THE TWO KEYS THIS CATALOG BOOTS
 *
 * `stepCatalogs` is keyed by MODULE, so this one file serves both pages:
 *
 *   - `contract_products` (`scenarios/useContractProducts`) — the COLLECTION,
 *     `useList: useContractProducts`.
 *   - `contract_product` (`scenarios/useContractProduct`) — the self-drawn
 *     MANAGER, `useManage: useContractProduct`, addressed `.withId(id)` by
 *     the page's own url. {@link openManager} names the actor only; the world
 *     completes the record from the url, so a track drives the product on
 *     screen rather than a second one.
 *
 * ## ADR-020 Amendment 5 — what stays spec
 *
 * A scenario earns steps ONLY where a real step drives every line of it. The
 * rest stay spec-only, and the spec that proves each one is named:
 *
 *   - REQUEST READS — which `with` members, filters, routes, headers or bodies
 *     a request carried, and that no request was made (`@AC-1` open and
 *     `@negative-control`, `@AC-4`, `@AC-5`, `@AC-6`, `@AC-11` guards,
 *     `@AC-16`, `@AC-20`, `@AC-22`, `@AC-24`). A `World` step cannot read a
 *     request. Proven by `contract-product.reads.int.test.ts`,
 *     `contract-product.mutations.int.test.ts`,
 *     `contract-product.auth-guard.int.test.ts` and
 *     `contract-product.scope-identity` / `staff-route` mutants.
 *   - A SHARED `Then` OVER PER-ROW ASKS (`@AC-1` narrow and order outlines) —
 *     "only the products matching what I asked for" names no value a
 *     stateless step can check, and `expectContext` is an unordered subset
 *     match, so no order is observable. Proven by
 *     `contract-product.reads.int.test.ts`; the page's own narrowing and
 *     paging are driven by the `@FE-3029 @collection` tracks below.
 *   - PAGING TO THE LAST PAGE (`@AC-1` paging outline) — the collection has
 *     no last-page action, so one row cannot be fired and the outline is
 *     spec, never half-matched.
 *   - A RECORD THE CORPUS DOES NOT HOLD — delegated products and the
 *     remembered preference (`@AC-2`, `@AC-18`, `@AC-19` outline), the brand
 *     hide-one-off flag (`@brand`), a scheduled action, an unpaid invoice, a
 *     pending, staged, cancelled, expiring or scheduled-cancellation product
 *     (`@AC-10`, `@AC-15`, `@AC-17` expiring, `@AC-21` off, `@AC-23`, the
 *     `@AC-7` withdraw, the `@AC-9` / `@AC-11` `@meta` outlines' other rows).
 *     The corpus holds one active subscription read, and a recorded write
 *     does not re-shape that read: `modify_renew` and `schedule-cancel` are
 *     answered at their own route while the product is re-read at
 *     `contract_products/{id}`, so the next read is the recorded active
 *     record again. The hard cancellation POST and the withdraw DELETE were
 *     recorded under the contract module, outside this corpus.
 *   - THE `@AC-9` CONSOLIDATION VALUES — one of the three rows has a recorded
 *     write (`INHERIT`), so the outline cannot run whole.
 *   - IN-FLIGHT STATE (`@AC-25`) — `World.fire` resolves once the action
 *     settles, so "busy while in flight" is never observable through it.
 *   - REPLACEMENT OF THE GROUPED COUNTS (`@AC-19` "again") — "never a second
 *     copy" is an exact-length claim a subset match cannot make. Proven by
 *     `contract-product.grouped-counts-channel.int.test.ts`.
 *   - SUBMITTING A COMPLETED FORM — `set(form, model)` takes two arguments
 *     and `World.fire` passes one, so a track cannot fill a form. The direct
 *     writes are proven by `contract-product.mutations.int.test.ts`.
 *
 * ## What the DRIVEN steps stand on
 *
 * Every value a step fires or expects is read off the module's own committed
 * recordings under `fixtures/`, cited at {@link RECORDED}. Nothing here is
 * hand-authored.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { InvoiceConsolidationTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  ContractProductCancelOption,
  ContractProductFormTypes
} from "../contract-product.types";
import { uniq, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The COLLECTION page's key, declared by `scenarios/useContractProducts`. */
export const CONTRACT_PRODUCTS_SCENARIO = "contract_products";

/** The MANAGER page's key, declared by `scenarios/useContractProduct`. */
export const CONTRACT_PRODUCT_SCENARIO = "contract_product";

/** The `useContractProducts` action ids these steps fire. */
export const CONTRACT_PRODUCTS_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  filterBy: "filterBy",
  nextPage: "nextPage",
  prevPage: "prevPage",
  loadGroupedCounts: "loadGroupedCounts"
} as const;

/** The `useContractProduct` action ids these steps fire. */
export const CONTRACT_PRODUCT_COVERED_ACTIONS = {
  isReady: "isReady",
  openCancellation: "openCancellation",
  submitCancellation: "submitCancellation",
  cancelForm: "cancelForm",
  openConsolidation: "openConsolidation",
  reset: "reset"
} as const;

/** Both keys' covered sets as ONE list; the two share `isReady` by name only. */
export const coveredActionIds: readonly string[] = uniq([
  ...values(CONTRACT_PRODUCTS_COVERED_ACTIONS),
  ...values(CONTRACT_PRODUCT_COVERED_ACTIONS)
]);

/**
 * Values the recorded corpus carries.
 *
 * @see fixtures/get-contracts-products-split-count-1.json — `total: 993`, a
 * page of 10, and the one row priced `total_amount: 4`.
 * @see fixtures/get-clients-id-contracts-products-e94263b1.json — the grouped
 * counts, carried on `total`.
 * @see fixtures/get-contract-products-id.json — the one product read: an
 * active monthly subscription.
 */
const RECORDED = {
  list: {
    total: 993,
    pageSize: 10,
    pricedAt: { id: "d6325079-8065-d1e3-5e9c-8174e234e98d", amount: 4 }
  },
  groupedCounts: [
    { category_id: "5952098d-3de4-0917-e65c-31578626e347", total: 103 },
    { category_id: "78985742-6489-7012-0e4c-21e325d0ed36", total: 9 },
    { category_id: "2785d26e-9678-3d16-7d7a-314502e70439", total: 16 }
  ],
  product: { id: "de78642d-e539-7147-e37a-21208469530d" }
} as const;

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    const err = await assertion()
      .then(() => undefined)
      .catch((e: unknown) => e);
    if (!err) return;
    await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
  }
  return assertion();
}

async function openCollection(world: World) {
  await world.boot(CONTRACT_PRODUCTS_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

async function openProducts(world: World) {
  await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.refresh);
  await settles(() =>
    world.expectContext({
      pagination: { total: RECORDED.list.total, page: 1 }
    })
  );
}

async function narrowToPrice(world: World) {
  await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
    total_amount: RECORDED.list.pricedAt.amount
  });
  await settles(() =>
    world.expectContext({
      pagination: { total: 1 },
      data: [{ id: RECORDED.list.pricedAt.id }]
    })
  );
}

async function nextPage(world: World) {
  await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.nextPage);
  await settles(() =>
    world.expectContext({
      pagination: { page: 2, from: RECORDED.list.pageSize + 1 }
    })
  );
}

async function openManager(world: World) {
  await world.boot(CONTRACT_PRODUCT_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isAvailable: true, hasError: false, isLoading: false })
  );
}

async function openActiveSubscription(world: World) {
  await openManager(world);
  await settles(() =>
    world.expectMeta({
      isActive: true,
      isSubscription: true,
      hasCancellationOptions: true,
      canConsolidate: true
    })
  );
}

async function openCancellationForm(world: World) {
  await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openCancellation);
  await settles(() => world.expectMeta({ isCancellationOpen: true }));
}

// -----------------------------------------------------------------------------

export const contractProductSteps = defineSteps(({ Given, When, Then }) => {
  // === BACKGROUND ============================================================

  Given(
    "I am an authenticated client acting on my own account, unless a scenario says otherwise",
    openCollection
  );

  // === AC-17 · MY PRODUCT'S OWN STATE (the recorded active subscription) =====

  When("I look at one of my products", openManager);

  Then("I am told whether it is pending", world =>
    world.expectMeta({ isPending: false })
  );
  Then("whether it is awaiting activation", world =>
    world.expectMeta({ isInactive: false })
  );
  Then("whether it is active", world => world.expectMeta({ isActive: true }));
  Then("whether it is suspended", world =>
    world.expectMeta({ isSuspended: false })
  );
  Then("whether it is expiring", world =>
    world.expectMeta({ isExpiring: false })
  );
  Then("whether it is being cancelled", world =>
    world.expectMeta({ isCancelling: false })
  );
  Then("whether it is awaiting setup", world =>
    world.expectMeta({ isSetupIncomplete: false })
  );
  Then("whether it is on trial", world =>
    world.expectMeta({ isOnTrial: false })
  );
  Then("whether that trial is about to end", world =>
    world.expectMeta({ isOnTerminatingTrial: false })
  );
  Then("whether it is still being imported", world =>
    world.expectMeta({ isStaged: false })
  );
  Then("whether it is cancelled", world =>
    world.expectMeta({ isCancelled: false })
  );
  Then("whether it has lapsed", world => world.expectMeta({ isLapsed: false }));
  Then("whether it is flagged for fraud", world =>
    world.expectMeta({ isFraud: false })
  );
  Then("whether it was imported", world =>
    world.expectMeta({ isImported: false })
  );
  Then("whether it was moved to another product", world =>
    world.expectMeta({ hasMoved: false })
  );
  Then("whether it has unpaid recurring invoices", world =>
    world.expectMeta({ hasUnpaidRecurringInvoices: false })
  );

  // === AC-19 · THE GROUPED COUNTS THE PAGE SHOWS =============================

  Given("I have opened my products", openProducts);

  When("I ask for my grouped counts", world =>
    world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.loadGroupedCounts)
  );

  Then(
    "my products surface holds the entries I was given, one per category, each with its count",
    world =>
      settles(() =>
        world.expectContext({ groupedCounts: RECORDED.groupedCounts })
      )
  );

  // === THE LIST PAGE · NARROW, CLEAR, PAGE ===================================

  When("I narrow my products to the price one of them costs", world =>
    world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
      total_amount: RECORDED.list.pricedAt.amount
    })
  );

  Then("only the product at that price is listed", world =>
    settles(async () => {
      await world.expectContext({
        pagination: { total: 1 },
        data: [{ id: RECORDED.list.pricedAt.id }]
      });
      await world.expectMeta({ isFiltered: true });
    })
  );

  Given(
    "I have narrowed my products to the price one of them costs",
    narrowToPrice
  );

  When("I clear my price narrowing", world =>
    world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {})
  );

  Then("every one of my products is listed again", world =>
    settles(async () => {
      await world.expectContext({
        pagination: { total: RECORDED.list.total }
      });
      await world.expectMeta({ isFiltered: false });
    })
  );

  When("I move to the next page of my products", world =>
    world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.nextPage)
  );

  Then("I am on the second page of my products", world =>
    settles(() =>
      world.expectContext({
        pagination: { page: 2, from: RECORDED.list.pageSize + 1 }
      })
    )
  );

  Given("I have moved to the next page of my products", nextPage);

  When("I move back to the previous page of my products", world =>
    world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.prevPage)
  );

  Then("I am on the first page of my products", world =>
    settles(() => world.expectContext({ pagination: { page: 1, from: 1 } }))
  );

  // === THE MANAGER PAGE · THE FORMS AND THE FORCE HANDLE =====================

  Given("I have one of my active subscriptions open", openActiveSubscription);

  When("I open the cancellation form", world =>
    world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openCancellation)
  );

  Then("the cancellation form is open", world =>
    settles(() => world.expectMeta({ isCancellationOpen: true }))
  );

  Then(
    "it offers cancelling at the end of the term, cancelling immediately, and cancelling on a future date I choose",
    world =>
      settles(() =>
        world.expectContext({
          cancellation: {
            schema: {
              properties: {
                option: {
                  enum: [
                    ContractProductCancelOption.SOFT,
                    ContractProductCancelOption.HARD,
                    ContractProductCancelOption.SCHEDULE_FUTURE
                  ]
                }
              }
            }
          }
        })
      )
  );

  Given(
    "I have the cancellation form open on one of my products",
    async world => {
      await openActiveSubscription(world);
      await openCancellationForm(world);
    }
  );

  When("I submit the cancellation form without choosing an option", world =>
    world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.submitCancellation)
  );

  Then("the cancellation form stays open and is not valid", world =>
    settles(() =>
      world.expectMeta({ isCancellationOpen: true, isCancellationValid: false })
    )
  );

  Then("I am shown that an option is required", world =>
    settles(() =>
      world.expectContext({
        validationErrors: [{ params: { missingProperty: "option" } }]
      })
    )
  );

  When("I close the cancellation form", world =>
    world.fire(
      CONTRACT_PRODUCT_COVERED_ACTIONS.cancelForm,
      ContractProductFormTypes.CANCELLATION
    )
  );

  Then("the cancellation form is closed", world =>
    settles(() => world.expectMeta({ isCancellationOpen: false }))
  );

  Then("my product is still active", world =>
    world.expectMeta({ isActive: true, isCancelling: false })
  );

  When("I open the consolidation form", world =>
    world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openConsolidation)
  );

  Then("the consolidation form is open", world =>
    settles(() => world.expectMeta({ isConsolidationOpen: true }))
  );

  Then("it offers opting in, opting out, or following my account", world =>
    settles(() =>
      world.expectContext({
        consolidation: {
          schema: {
            properties: {
              invoiceConsolidationEnabled: {
                enum: [
                  InvoiceConsolidationTypes.ENABLED,
                  InvoiceConsolidationTypes.DISABLED,
                  InvoiceConsolidationTypes.INHERIT
                ]
              }
            }
          }
        }
      })
    )
  );

  When("I reset my product", world =>
    world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.reset)
  );

  Then("my product is read again and shown as active", world =>
    settles(async () => {
      await world.expectMeta({
        isAvailable: true,
        isLoading: false,
        hasError: false,
        isActive: true
      });
      await world.expectContext({
        contractProduct: { id: RECORDED.product.id }
      });
    })
  );
});

export default contractProductSteps;
