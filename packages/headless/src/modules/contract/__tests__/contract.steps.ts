// -----------------------------------------------------------------------------
/**
 * @module contract/__tests__/contract.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * sibling `contract.feature`'s DRIVEABLE scenarios use. Engine-free by
 * construction: it imports `defineSteps` and `World`, the module's scope, query
 * and status vocabulary and lodash, and nothing else, so the same catalog
 * re-registers against any runner and a browser can carry it.
 *
 * ## THE TWO KEYS THIS CATALOG BOOTS
 *
 * `stepCatalogs` is keyed by MODULE, so this one file serves both pages:
 *
 *   - `contracts` (`scenarios/useContracts`) — the COLLECTION,
 *     `useList: useContracts`.
 *   - `contract` (`scenarios/useContract`) — the self-drawn MANAGER,
 *     `useManage: useContract`, addressed `.withId(id)` by the page's own url.
 *     {@link openManager} names the actor only; the world completes the record.
 *
 * ## ADR-020 Amendment 5 — what stays spec
 *
 * A scenario earns steps ONLY where a real step drives every line of it. The
 * rest stay spec-only, and the spec that proves each one is named:
 *
 *   - REQUEST READS — which `with` members, headers or routes a request
 *     carried, and that no request was sent (`@AC-3`, `@AC-8` "nothing is
 *     sent", every `@AC-16` guard, the payment-method form's "no request is
 *     sent" lines). A `World` step cannot read a request. Proven by
 *     `contract.reads.int.test.ts`, `contract.mutations.int.test.ts`,
 *     `contract.auth-guard.int.test.ts` and `contract.manager-members.int.test.ts`.
 *   - A SPEC-ONLY LINE (`@AC-12`) — "a state neither vocabulary knows" cannot
 *     be recorded, so the scenario cannot run whole. Proven by
 *     `contract.utils.test.ts`.
 *   - A FAILED READ (`reading … fails` in the collection and the manager, and
 *     the unknown-status read) — `WorldScope.seed` is honoured by no executor,
 *     and the corpus answers every `contracts/{id}` read with its one recorded
 *     active contract. Proven by `contract.criteria.int.test.ts`,
 *     `contract.manager-members.int.test.ts` and
 *     `contract.manager-unrecognised-status.test.ts`.
 *   - THE PAYMENT-METHOD CHANGE IS A DRIVEN TRACK. "Change my open contract to
 *     a different stored card" opens the form, picks a DIFFERENT stored card and
 *     submits it live in the World replay. The form's stored-card enum populates
 *     from the corpus's own recorded stored-cards read
 *     (`get-clients-id-payment-details-active-true.json`, ten cards) — the same
 *     fake API the labs page arms serves the brand seam, so no per-scenario
 *     module mock is needed — and the different-card PATCH is selected by its
 *     request body (`corpus-replay.ts`'s `answersWrite`, matched on the sent
 *     `payment_details_id`), so the submit lands the real different-card 200.
 *     The EXACT PATCH body and the 200 that bills against the chosen card are
 *     pinned at integration by `contract.payment-method-change.int.test.ts`
 *     (a World step cannot read a request body — D22).
 *   - The OTHER payment-method form scenarios stay spec-only for their own
 *     reasons: the no-op refusals assert that NO request is sent (a request
 *     read), the AC-8 Outline varies the product state and the delegated row has
 *     no capture, the enum-reject asserts a 422 the form keeps, and the
 *     in-progress / done timing reads mid-write state. Proven by
 *     `contract.payment-method-enum.int.test.ts`,
 *     `contract.manager-members.int.test.ts`,
 *     `contract.payment-method-standing.int.test.ts` and
 *     `contract.mutations.int.test.ts`.
 *   - A CONTRACT THE CORPUS DOES NOT HOLD — cancelled, lapsed or fraud reads,
 *     a product of each kind (`@AC-8` outlines, the standing outline, fraud).
 *   - A SECOND ID — the picker and "a manager I open on another id": the replay
 *     binds ONE recorded id, and the corpus answers any id with it.
 *   - SCHEMA DEFAULTS AND REFUSALS (the unpicked page, the undeclared
 *     criterion) — a compiled schema, not a page action. Proven by
 *     `contract.criteria.int.test.ts`.
 *
 * ## What the DRIVEN steps stand on
 *
 * Every value a step fires or expects is read off the module's own committed
 * recordings under `fixtures/`, cited at {@link RECORDED}. Nothing here is
 * hand-authored.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ContractStatusCodes } from "@upmind-automation/types";
import { SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import { uniq, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The COLLECTION page's key, declared by `scenarios/useContracts`. */
export const CONTRACTS_SCENARIO = "contracts";

/** The MANAGER page's key, declared by `scenarios/useContract`. */
export const CONTRACT_SCENARIO = "contract";

/** The `useContracts` action ids these steps fire. */
export const CONTRACTS_COVERED_ACTIONS = {
  isReady: "isReady",
  nextPage: "nextPage",
  prevPage: "prevPage",
  setCriteria: "setCriteria",
  filterBy: "filterBy",
  sortBy: "sortBy"
} as const;

/** The `useContract` action ids these steps fire. */
export const CONTRACT_COVERED_ACTIONS = {
  isReady: "isReady",
  openPaymentMethod: "openPaymentMethod",
  input: "input",
  update: "update"
} as const;

/** Both keys' covered sets as ONE list; the two share `isReady` by name only. */
export const coveredActionIds: readonly string[] = uniq([
  ...values(CONTRACTS_COVERED_ACTIONS),
  ...values(CONTRACT_COVERED_ACTIONS)
]);

/**
 * Values the recorded corpus carries.
 *
 * @see fixtures/get-contracts-pagination-limit-10.json — `total: 879` at a page
 * of 10; its first row is the oldest recorded contract, and its rows carry the
 * dates, billing cycles and formatted prices below.
 * @see fixtures/get-contracts-case-named-first.json — the contract that next
 * bills latest (`next_due_date: 2028-09-21`), outside the oldest-first page.
 * @see fixtures/get-contracts-id-with-staged-imports-1.json — the one contract
 * read: `#QAT-INV-03585`, active, holding two products.
 */
export const RECORDED = {
  list: {
    total: 879,
    pageSize: 10,
    lastPage: 88,
    lastOffset: 870,
    oldest: { id: "20403869-6e54-721d-dd2b-518d9305e7d2" },
    billsLatest: { id: "03679424-d0e7-1099-d6dc-3153698d582e" },
    rows: [
      {
        id: "20403869-6e54-721d-dd2b-518d9305e7d2",
        nextDueDate: null,
        billingCycleMonths: 0,
        // The billing cycle draws a TRANSLATED LABEL, never the raw month count
        // (R38 item 10, GAP-02): a one-time contract's label names the one-time
        // cycle (`t("term.one_time")`, its key in the fixture env), never "0".
        // The `date*` display descriptors and every row's label are asserted
        // with flexible matchers in `contract.view-model.int.test.ts` — the
        // subset-match here cannot express them.
        billingCycleLabel: "term.one_time",
        purchaseDate: "2025-06-04",
        totalAmountFormatted: "£60.00"
      },
      {
        id: "825d96e7-63ed-0913-ee4a-417482528340",
        nextDueDate: "2025-07-04",
        billingCycleMonths: 1,
        purchaseDate: "2025-06-04",
        totalAmountFormatted: "£4.00"
      },
      {
        id: "5d085e69-d562-3719-993f-218e940d4237",
        nextDueDate: "2027-06-04",
        billingCycleMonths: 24,
        purchaseDate: "2025-06-04",
        totalAmountFormatted: "£60.00"
      }
    ]
  },
  contract: {
    id: "89857426-4897-0122-24ef-21e325d0ed36",
    title: "#QAT-INV-03585",
    status: ContractStatusCodes.ACTIVE,
    // The client's SECOND stored card — the id the recorded different-card PATCH
    // (`patch-contracts-id-payment-details-case-different-card.json`) selected;
    // one of the ten cards the recorded stored-cards read offers the form.
    differentCardId: "20e43579-5e78-d187-432c-31643202d986",
    // R34: a contract carries its products as LIST ITEMS — id, own name and the
    // catalogue product's name — never a full `ContractProduct` view model (no
    // status, meta or contractId). Each product loads itself through
    // `useContractProduct`.
    products: [
      {
        id: "785d26e9-6783-d169-497f-314502e70439",
        name: "Single Use Promo",
        product: { name: "Single Use Promo" }
      },
      {
        id: "25d96e76-3ed0-9137-576a-417482528340",
        name: " Starter Hosting",
        product: { name: " Starter Hosting" }
      }
    ]
  }
} as const;

const PAGE_SIZE_CHOSEN = 5;
const NAME_SEARCHED = "QAT";
const OLDEST_FIRST = [{ field: "created_at", dir: SortDirection.ASC }];
const BILLS_LATEST_FIRST = [
  { field: "next_due_date", dir: SortDirection.DESC }
];

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

async function bootCollection(world: World) {
  await world.boot(CONTRACTS_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await settles(() => world.expectMeta({ isAvailable: true }));
}

async function openCollection(world: World) {
  await world.fire(CONTRACTS_COVERED_ACTIONS.isReady);
  await settles(() =>
    world.expectMeta({ isLoading: false, hasError: false, isEmpty: false })
  );
}

async function openMoreThanAPage(world: World) {
  await openCollection(world);
  await settles(async () => {
    await world.expectMeta({ hasNextPage: true, hasPrevPage: false });
    await world.expectContext({
      pagination: {
        total: RECORDED.list.total,
        limit: RECORDED.list.pageSize,
        page: 1
      }
    });
  });
}

async function openManager(world: World) {
  await world.boot(CONTRACT_SCENARIO, { actor: ScopeActorTypes.CLIENT });
  await settles(() => world.expectMeta({ isAvailable: true }));
}

async function managerReads(world: World) {
  await world.fire(CONTRACT_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isLoading: false, hasError: false }));
}

function listedOldestFirst(world: World) {
  return settles(() =>
    world.expectContext({
      query: { sort: OLDEST_FIRST },
      data: [{ id: RECORDED.list.oldest.id }]
    })
  );
}

// -----------------------------------------------------------------------------

export const contractSteps = defineSteps(({ Given, When, Then }) => {
  // === BACKGROUND ============================================================

  Given(
    "I am an authenticated client acting on my own contracts, unless a scenario says otherwise",
    bootCollection
  );

  // === AC-14 · SEEING AND PAGING MY CONTRACTS ================================

  Given("I have more contracts than fit on one page", openMoreThanAPage);

  Given("I have contracts on my own account", openCollection);

  When("I open my contracts", openCollection);

  Then(
    "I see the first page of my contracts, and it updates as my contracts change",
    world =>
      settles(() =>
        world.expectContext({
          pagination: { page: 1, from: 1, to: RECORDED.list.pageSize },
          data: [{ id: RECORDED.list.oldest.id }]
        })
      )
  );

  Then("I am told which page I am on and how many there are", world =>
    settles(() =>
      world.expectContext({
        pagination: {
          page: 1,
          pages: RECORDED.list.lastPage,
          total: RECORDED.list.total
        }
      })
    )
  );

  Given("I am on the first page of them", world =>
    settles(() => world.expectContext({ pagination: { page: 1, from: 1 } }))
  );

  Given("I am on the second page of them", async world => {
    await world.fire(CONTRACTS_COVERED_ACTIONS.nextPage);
    await settles(() => world.expectContext({ pagination: { page: 2 } }));
  });

  When("I move forward to the next page", world =>
    world.fire(CONTRACTS_COVERED_ACTIONS.nextPage)
  );

  When("I move back to the previous page", world =>
    world.fire(CONTRACTS_COVERED_ACTIONS.prevPage)
  );

  When("I move forward to the last page", world =>
    world.fire(CONTRACTS_COVERED_ACTIONS.setCriteria, {
      pagination: {
        limit: RECORDED.list.pageSize,
        offset: RECORDED.list.lastOffset
      }
    })
  );

  Then("the next page comes back", world =>
    settles(async () => {
      await world.expectContext({
        pagination: { page: 2, from: RECORDED.list.pageSize + 1 }
      });
      await world.expectMeta({ hasPrevPage: true });
    })
  );

  Then("the previous page comes back", world =>
    settles(async () => {
      await world.expectContext({ pagination: { page: 1, from: 1 } });
      await world.expectMeta({ hasPrevPage: false });
    })
  );

  Then(
    "the last page comes back and I am told there is no further page to go to",
    world =>
      settles(async () => {
        await world.expectContext({
          pagination: { page: RECORDED.list.lastPage }
        });
        await world.expectMeta({ hasNextPage: false, hasPrevPage: true });
      })
  );

  When("I choose how many of my contracts come on one page", world =>
    world.fire(CONTRACTS_COVERED_ACTIONS.setCriteria, {
      pagination: { limit: PAGE_SIZE_CHOSEN }
    })
  );

  Then("my contracts are asked for that many at a time", world =>
    settles(() =>
      world.expectContext({
        query: { pagination: { limit: PAGE_SIZE_CHOSEN } },
        pagination: { limit: PAGE_SIZE_CHOSEN, to: PAGE_SIZE_CHOSEN }
      })
    )
  );

  // === AC-14 · NARROWING MY CONTRACTS ========================================

  When("I narrow my contracts by their name and their state", world =>
    world.fire(CONTRACTS_COVERED_ACTIONS.filterBy, {
      name: { like: NAME_SEARCHED },
      "status.code": [ContractStatusCodes.ACTIVE]
    })
  );

  Then("my contracts are asked for with that narrowing", world =>
    settles(() =>
      world.expectContext({
        query: {
          filters: {
            name: { like: NAME_SEARCHED },
            "status.code": [ContractStatusCodes.ACTIVE]
          }
        }
      })
    )
  );

  Then("I am told my list is narrowed", world =>
    settles(() => world.expectMeta({ isFiltered: true }))
  );

  Given("I have narrowed my contracts", async world => {
    await openCollection(world);
    await world.fire(CONTRACTS_COVERED_ACTIONS.filterBy, {
      "status.code": [ContractStatusCodes.ACTIVE]
    });
    await settles(() => world.expectMeta({ isFiltered: true }));
  });

  When("I clear the narrowing", world =>
    world.fire(CONTRACTS_COVERED_ACTIONS.filterBy, {})
  );

  Then("I am no longer told my list is narrowed", world =>
    settles(() => world.expectMeta({ isFiltered: false }))
  );

  // The oldest recorded contract is closed, so the active-only narrowing
  // cannot list it: its return is what "no narrowing" looks like.
  Then("no narrowing is asked for", world =>
    settles(() =>
      world.expectContext({
        pagination: { total: RECORDED.list.total },
        data: [{ id: RECORDED.list.oldest.id, meta: { isClosed: true } }]
      })
    )
  );

  // === AC-14 · ORDERING MY CONTRACTS =========================================

  When("I order my contracts by when they next bill, latest first", world =>
    world.fire(CONTRACTS_COVERED_ACTIONS.sortBy, BILLS_LATEST_FIRST)
  );

  Then("my contracts are asked for in that order", world =>
    settles(() =>
      world.expectContext({
        query: { sort: BILLS_LATEST_FIRST },
        data: [{ id: RECORDED.list.billsLatest.id }]
      })
    )
  );

  Given("I have not chosen an order", openCollection);

  Then("my contracts are asked for oldest first", listedOldestFirst);

  Given("I have ordered my contracts by when they next bill", async world => {
    await openCollection(world);
    await world.fire(CONTRACTS_COVERED_ACTIONS.sortBy, BILLS_LATEST_FIRST);
    await settles(() =>
      world.expectContext({ query: { sort: BILLS_LATEST_FIRST } })
    );
  });

  When("I empty the order", world =>
    world.fire(CONTRACTS_COVERED_ACTIONS.sortBy, [])
  );

  Then("my contracts are ordered oldest first again", listedOldestFirst);

  // === THE LIST'S COLUMNS ====================================================

  Then(
    "each contract shows when it next bills, its billing cycle, when I bought it and its price, as it was read",
    world =>
      settles(() => world.expectContext({ data: [...RECORDED.list.rows] }))
  );

  // === THE MANAGER · THE CONTRACT I HAVE OPEN ===============================
  // The manager read-backs — "carries everything the manager read", "titled by
  // the order it was bought under", "lists its products, each by its own id" —
  // are CHECKS, not journeys a client takes (R38 item 4), so they get no step
  // here and stay SPEC-ONLY: the player never lists them. Each is proven at
  // integration — `contract.manager-members.int.test.ts` for the read-back and
  // title, `contract.view-model.int.test.ts` for the products list (R34 shape).
  // The only manager JOURNEY the player drives is the payment-method change
  // below.

  // === THE MANAGER · CHANGING THE PAYMENT METHOD (a driven write) ===========

  Given(
    "I have a contract of mine open in the manager, with the payment-method form open",
    async world => {
      await openManager(world);
      await managerReads(world);
      await world.fire(CONTRACT_COVERED_ACTIONS.openPaymentMethod);
      await settles(() =>
        world.expectMeta({ isPaymentMethodOpen: true, hasError: false })
      );
    }
  );

  When(
    "I choose a different stored card and submit the payment-method form",
    async world => {
      await world.fire(CONTRACT_COVERED_ACTIONS.input, {
        paymentDetailsId: RECORDED.contract.differentCardId
      });
      await settles(() =>
        world.expectContext({
          paymentMethod: {
            model: { paymentDetailsId: RECORDED.contract.differentCardId }
          }
        })
      );
      await world.fire(CONTRACT_COVERED_ACTIONS.update);
    }
  );

  Then(
    "my payment-method change is saved and the form closes with no error",
    world =>
      settles(() =>
        world.expectMeta({ isPaymentMethodOpen: false, hasError: false })
      )
  );
});

export default contractSteps;
