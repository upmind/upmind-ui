// -----------------------------------------------------------------------------
/**
 * @module contract/__tests__/contract.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * DRIVEN `contract.feature` scenarios use. Engine-free: it imports
 * `defineSteps`, the module's vocabulary, lodash and the scenario recordings,
 * so the same catalog runs in vitest and in the labs playground.
 *
 * Two scenario keys: `contracts` boots the COLLECTION (`useContracts`),
 * `contract` boots the MANAGER (`useContract`) by id — `world.boot(key,
 * { actor, id })` resolves to `.as(actor).withId(id)`.
 *
 * Every id, total, status and card a step fires or expects is READ from the
 * scenario recording that addressed it (FE-3145, ADR 035 §6). The manager
 * scenarios act on one arranged subscription (recorded together, see
 * `contract.fixtures.ts`), so a Given they share addresses the contract their
 * recordings hold.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ContractStatusCodes } from "@upmind-automation/types";
import { SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import orderedGivenRecording from "./scenarios/an-order-i-empty-falls-back-to-oldest-first/02/get-contracts.json";
import emptiedRecording from "./scenarios/an-order-i-empty-falls-back-to-oldest-first/03/get-contracts.json";
import cardlessReadRecording from "./scenarios/choose-a-stored-payment-method-for-a-contract-that-has-none/02/get-contracts-id-with-staged-imports-1.json";
import chosenSizeRecording from "./scenarios/choose-how-many-of-my-contracts-come-on-one-page/03/get-contracts.json";
import narrowedRecording from "./scenarios/clear-my-narrowing-to-see-my-whole-list-again/02/get-contracts-filter-status-code-contract-active.json";
import clearedRecording from "./scenarios/clear-my-narrowing-to-see-my-whole-list-again/03/get-contracts.json";
import oneOffReadRecording from "./scenarios/i-am-not-offered-a-payment-method-change-on-a-one-off-purchase/02/get-contracts-id-with-staged-imports-1.json";
import delegatedReadRecording from "./scenarios/i-am-not-offered-a-payment-method-change-on-a-subscription-delegated-to-me/02/get-contracts-id-with-staged-imports-1.json";
import lastPageRecording from "./scenarios/jump-to-the-last-page-of-my-contracts/03/get-contracts.json";
import secondPageRecording from "./scenarios/move-back-to-the-previous-page-of-my-contracts/03/get-contracts.json";
import backPageRecording from "./scenarios/move-back-to-the-previous-page-of-my-contracts/04/get-contracts.json";
import nextPageRecording from "./scenarios/move-forward-to-the-next-page-of-my-contracts/03/get-contracts.json";
import activeOnlyRecording from "./scenarios/narrow-my-contracts-to-the-ones-in-one-state/03/get-contracts-filter-status-code-contract-active.json";
import openedCardsRecording from "./scenarios/open-one-of-my-contracts-with-everything-the-account-area-needs/03/get-clients-id-payment-details-active-true-brand-id.json";
import openedRecording from "./scenarios/open-one-of-my-contracts-with-everything-the-account-area-needs/03/get-contracts-id-with-staged-imports-1.json";
import orderedRecording from "./scenarios/order-my-contracts-by-when-they-next-bill-latest-first/03/get-contracts.json";
import activeReadRecording from "./scenarios/point-my-active-subscription-at-a-different-stored-payment-method/02/get-contracts-id-with-staged-imports-1.json";
import activeChangeRecording from "./scenarios/point-my-active-subscription-at-a-different-stored-payment-method/04/patch-contracts-id-payment-details.json";
import suspendedBeforeRecording from "./scenarios/read-my-contracts-again-to-see-how-they-stand-now/02/get-contracts-filter-status-code-contract-suspended.json";
import suspendedAfterRecording from "./scenarios/read-my-contracts-again-to-see-how-they-stand-now/03/get-contracts-filter-status-code-contract-suspended.json";
import resetReadRecording from "./scenarios/reset-my-contract-to-read-it-again-as-it-now-stands/03/get-contracts-id-with-staged-imports-1.json";
import firstPageRecording from "./scenarios/see-the-first-page-of-my-contracts/01/get-contracts.json";
import failedReadRecording from "./scenarios/when-reading-a-contract-fails-i-am-shown-why-instead-of-the-contract-i-had-open/03/get-contracts-id-with-staged-imports-1.json";
import {
  difference,
  find,
  findLast,
  first,
  map,
  split,
  uniq,
  values
} from "lodash-es";
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
  sortBy: "sortBy",
  refresh: "refresh"
} as const;

/** The `useContract` action ids these steps fire. */
export const CONTRACT_COVERED_ACTIONS = {
  isReady: "isReady",
  reset: "reset",
  openPaymentMethod: "openPaymentMethod",
  input: "input",
  update: "update",
  clear: "clear",
  onDone: "onDone"
} as const;

/** Both keys' covered sets as ONE list; the two share names by name only. */
export const coveredActionIds: readonly string[] = uniq([
  ...values(CONTRACTS_COVERED_ACTIONS),
  ...values(CONTRACT_COVERED_ACTIONS)
]);

// -----------------------------------------------------------------------------

type WireContract = {
  id: string;
  name: string | null;
  main_invoice_number: string;
  payment_details_id: string | null;
  billing_cycle_months: number;
  next_due_date: string | null;
  start_date: string;
  total_amount_formatted: string;
  status: { code: string; name?: string; name_translated?: string | null };
  client?: { image?: unknown };
  cancellation_request?: { id: string; status: { code: string } } | null;
  products: {
    id: string;
    name: string;
    is_delegated_object?: boolean;
    tags: unknown[];
    status: { code: string };
    product: {
      name: string;
      image?: unknown;
      brand: { currency: { code: string } };
    };
  }[];
};

type Recording<T> = {
  request: { path: string; body?: Record<string, unknown> };
  response: {
    status: number;
    body: {
      data: T;
      total: number | null;
      error: { message: string } | null;
    };
  };
};

type ListRecording = Recording<WireContract[]>;
type ReadRecording = Recording<WireContract>;

const asList = (recording: unknown) => recording as ListRecording;
const asRead = (recording: unknown) => recording as ReadRecording;

/** The rows a list recording returned, as the membership a context check reads. */
const rowsOf = (recording: unknown) =>
  map(asList(recording).response.body.data, ({ id }) => ({ id }));

const totalOf = (recording: unknown) =>
  Number(asList(recording).response.body.total);

/** One query-string value off a recorded request path. */
const paramOf = (recording: unknown, key: string): string =>
  new URLSearchParams(
    split((recording as ListRecording).request.path, "?")[1] ?? ""
  ).get(key) ?? "";

const RECORD_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The contract id a read addressed — the last uuid segment of its path. */
const addressedId = (recording: unknown): string =>
  findLast(
    split(first(split(asRead(recording).request.path, "?")), "/"),
    segment => RECORD_ID.test(segment)
  ) ?? "";

const opened = asRead(openedRecording).response.body.data;
const activeRead = asRead(activeReadRecording).response.body.data;

/** The arranged subscription every shared manager Given addresses. */
const SUBSCRIPTION_ID = addressedId(activeReadRecording);

/** The stored card the subscription pays with before a scenario changes it. */
const ORIGINAL_CARD = activeRead.payment_details_id ?? "";

/** The different stored card every recorded change sends. */
const CHOSEN_CARD = String(
  asRead(activeChangeRecording).request.body?.payment_details_id ?? ""
);

const OLDEST_FIRST = [{ field: "created_at", dir: SortDirection.ASC }];
const BILLS_LATEST_FIRST = [
  { field: "next_due_date", dir: SortDirection.DESC }
];
const NEWEST_FIRST = [{ field: "created_at", dir: SortDirection.DESC }];

const PAGE_LIMIT = Number(paramOf(firstPageRecording, "limit"));

/**
 * The billing cycle a list row draws, named in words — "One time" for a one-off
 * and the adverb for a monthly cycle (R38 item 10, GAP-02), as the test
 * environment's translator renders each word: its key.
 */
const CYCLE_LABELS: Record<number, string> = {
  0: "term.one_time",
  1: "term.monthly"
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

/** A recorded `YYYY-MM-DD` as the account area shows a date: `Jun 4th, 2025`. */
function shownDate(isoDay: string): string {
  const [year, month, day] = map(split(isoDay, "-"), Number);
  const suffix =
    day % 100 >= 11 && day % 100 <= 13
      ? "th"
      : (({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] ??
        "th");
  return `${MONTHS[month - 1]} ${day}${suffix}, ${year}`;
}

/** The contract the refresh read newly lists — in the second recording, not the first. */
const NEWLY_SUSPENDED_ID = first(
  difference(
    map(asList(suspendedAfterRecording).response.body.data, "id"),
    map(asList(suspendedBeforeRecording).response.body.data, "id")
  )
);

// -----------------------------------------------------------------------------

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

const ignoreRefusal = () => undefined;

async function bootCollection(world: World): Promise<void> {
  await world.boot(CONTRACTS_SCENARIO, { actor: ScopeActorTypes.CLIENT });
}

async function openCollection(world: World): Promise<void> {
  await world.fire(
    CONTRACTS_COVERED_ACTIONS.isReady,
    undefined,
    CONTRACTS_SCENARIO
  );
  await settles(() =>
    world.expectMeta({ isLoading: false }, CONTRACTS_SCENARIO)
  );
}

const expectList = (world: World, expected: Record<string, unknown>) =>
  settles(() => world.expectContext!(expected, CONTRACTS_SCENARIO));

const expectListMeta = (
  world: World,
  expected: Record<string, boolean | number>
) => settles(() => world.expectMeta(expected, CONTRACTS_SCENARIO));

async function openManager(world: World, id: string): Promise<void> {
  await world.boot(CONTRACT_SCENARIO, { actor: ScopeActorTypes.CLIENT, id });
}

async function readManager(world: World): Promise<void> {
  await world.fire(
    CONTRACT_COVERED_ACTIONS.isReady,
    undefined,
    CONTRACT_SCENARIO
  );
  await settles(() =>
    world.expectMeta({ isLoading: false }, CONTRACT_SCENARIO)
  );
}

const expectManager = (world: World, expected: Record<string, unknown>) =>
  settles(() => world.expectContext!(expected, CONTRACT_SCENARIO));

const expectManagerMeta = (
  world: World,
  expected: Record<string, boolean | number>
) => settles(() => world.expectMeta(expected, CONTRACT_SCENARIO));

/** Opens the arranged subscription and confirms the standing and card it was read with. */
const openSubscription =
  (standing: Record<string, boolean>) =>
  async (world: World): Promise<void> => {
    await openManager(world, SUBSCRIPTION_ID);
    await readManager(world);
    await expectManagerMeta(world, { hasError: false, ...standing });
    await expectManager(world, {
      contract: { id: SUBSCRIPTION_ID, paymentDetailsId: ORIGINAL_CARD }
    });
  };

const fireManager = (world: World, actionId: string, input?: unknown) =>
  world.fire(actionId, input, CONTRACT_SCENARIO);

async function openPaymentMethodForm(world: World): Promise<void> {
  await fireManager(world, CONTRACT_COVERED_ACTIONS.openPaymentMethod);
  await expectManagerMeta(world, { isPaymentMethodOpen: true });
  await expectManager(world, {
    paymentMethod: {
      model: { paymentDetailsId: ORIGINAL_CARD },
      schema: {
        properties: {
          paymentDetailsId: { enum: [ORIGINAL_CARD, CHOSEN_CARD] }
        }
      }
    }
  });
}

async function chooseCard(world: World): Promise<void> {
  await fireManager(world, CONTRACT_COVERED_ACTIONS.input, {
    paymentDetailsId: CHOSEN_CARD
  });
  await expectManager(world, {
    paymentMethod: { model: { paymentDetailsId: CHOSEN_CARD } }
  });
  await expectManagerMeta(world, { isValid: true });
}

const billsAgainst = (card: string) => (world: World) =>
  expectManager(world, { contract: { paymentDetailsId: card } });

/** Asks for the payment-method form — the one place legacy offers the change. */
const tryToChange = (world: World) =>
  fireManager(world, CONTRACT_COVERED_ACTIONS.openPaymentMethod).catch(
    ignoreRefusal
  );

const submitRefused = (paymentDetailsId: string | null) => (world: World) =>
  fireManager(world, CONTRACT_COVERED_ACTIONS.update, {
    paymentDetailsId
  }).catch(ignoreRefusal);

// -----------------------------------------------------------------------------

export const contractSteps = defineSteps(({ Given, When, Then }) => {
  // === SIGNED OUT =============================================================

  Given(
    "my client session has ended and I am signed out of my contracts",
    async world => {
      await bootCollection(world);
      await expectListMeta(world, { isAvailable: false });
    }
  );

  When("I ask for my contracts", world =>
    world
      .fire(CONTRACTS_COVERED_ACTIONS.isReady, undefined, CONTRACTS_SCENARIO)
      .catch(ignoreRefusal)
  );

  Then("my contracts report themselves unavailable to me", world =>
    expectListMeta(world, { isAvailable: false })
  );

  Then("no request is made for my contracts", async world => {
    await expectList(world, { data: [], pagination: { total: 0, to: 0 } });
    await expectListMeta(world, { hasError: false });
  });

  When("I open one of my contracts while signed out", async world => {
    await openManager(world, SUBSCRIPTION_ID);
    await world.fireHold!(
      CONTRACT_COVERED_ACTIONS.isReady,
      undefined,
      CONTRACT_SCENARIO
    );
  });

  When("I force a change to my contract's payment method", async world => {
    await openManager(world, SUBSCRIPTION_ID);
    await fireManager(world, CONTRACT_COVERED_ACTIONS.update, {
      paymentDetailsId: CHOSEN_CARD
    }).catch(ignoreRefusal);
  });

  Then("the contract reports itself unavailable to me", world =>
    expectManagerMeta(world, { isAvailable: false })
  );

  Then("no request is made for that contract", world =>
    expectManager(world, { contract: null, rawContract: null })
  );

  // === BACKGROUND =============================================================

  Given(
    "I am an authenticated client acting on my own contracts",
    async world => {
      await bootCollection(world);
      await expectListMeta(world, { isAvailable: true });
    }
  );

  // === AC-14 · THE COLLECTION ================================================

  When("I open my contracts", openCollection);

  Then("I see the first page of my contracts, oldest first", world =>
    expectList(world, {
      query: { sort: OLDEST_FIRST },
      data: rowsOf(firstPageRecording),
      pagination: { page: 1 }
    })
  );

  Then(
    "I am told which page I am on and how many contracts I have",
    async world => {
      await expectList(world, {
        pagination: { page: 1, total: totalOf(firstPageRecording) }
      });
      await expectListMeta(world, { hasPrevPage: false, hasNextPage: true });
    }
  );

  Then(
    "my list asks for one page of contracts, assuming no page position of its own",
    world =>
      expectList(world, {
        query: { pagination: { limit: PAGE_LIMIT, offset: null } }
      })
  );

  Then(
    "each contract shows when it next bills, its billing cycle, when I bought it and its price, as it was read",
    world =>
      expectList(world, {
        data: map(asList(firstPageRecording).response.body.data, row => ({
          id: row.id,
          nextDueDate: row.next_due_date,
          billingCycleMonths: row.billing_cycle_months,
          purchaseDate: row.start_date,
          datePurchased: { date: shownDate(row.start_date) },
          totalAmountFormatted: row.total_amount_formatted,
          ...(CYCLE_LABELS[row.billing_cycle_months]
            ? { billingCycleLabel: CYCLE_LABELS[row.billing_cycle_months] }
            : {})
        }))
      })
  );

  Given(
    "I have opened my contracts, and they run to more than one page",
    async world => {
      await openCollection(world);
      await expectListMeta(world, { hasNextPage: true, hasPrevPage: false });
    }
  );

  When("I move forward to the next page", world =>
    world.fire(
      CONTRACTS_COVERED_ACTIONS.nextPage,
      undefined,
      CONTRACTS_SCENARIO
    )
  );

  Then("the next page of my contracts comes back", async world => {
    await expectList(world, {
      data: rowsOf(nextPageRecording),
      pagination: { page: 2 }
    });
    await expectListMeta(world, { hasPrevPage: true });
  });

  Given("I have moved on to the second page of them", async world => {
    await world.fire(
      CONTRACTS_COVERED_ACTIONS.nextPage,
      undefined,
      CONTRACTS_SCENARIO
    );
    await expectList(world, {
      data: rowsOf(secondPageRecording),
      pagination: { page: 2 }
    });
  });

  When("I move back to the previous page", world =>
    world.fire(
      CONTRACTS_COVERED_ACTIONS.prevPage,
      undefined,
      CONTRACTS_SCENARIO
    )
  );

  Then("the first page of my contracts comes back", async world => {
    await expectList(world, {
      data: rowsOf(backPageRecording),
      pagination: { page: 1 }
    });
    await expectListMeta(world, { hasPrevPage: false });
  });

  When("I move forward to the last page", world =>
    world.fire(
      CONTRACTS_COVERED_ACTIONS.setCriteria,
      {
        pagination: {
          limit: Number(paramOf(lastPageRecording, "limit")),
          offset: Number(paramOf(lastPageRecording, "offset"))
        }
      },
      CONTRACTS_SCENARIO
    )
  );

  Then(
    "the last page of my contracts comes back, and I am told there is no further page to go to",
    async world => {
      await expectList(world, { data: rowsOf(lastPageRecording) });
      await expectListMeta(world, { hasNextPage: false, hasPrevPage: true });
    }
  );

  When("I choose how many of my contracts come on one page", world =>
    world.fire(
      CONTRACTS_COVERED_ACTIONS.setCriteria,
      { pagination: { limit: Number(paramOf(chosenSizeRecording, "limit")) } },
      CONTRACTS_SCENARIO
    )
  );

  Then("my contracts come that many at a time", world =>
    expectList(world, {
      query: {
        pagination: { limit: Number(paramOf(chosenSizeRecording, "limit")) }
      },
      data: rowsOf(chosenSizeRecording),
      pagination: { to: asList(chosenSizeRecording).response.body.data.length }
    })
  );

  const narrowToActive = (world: World) =>
    world.fire(
      CONTRACTS_COVERED_ACTIONS.filterBy,
      { "status.code": [ContractStatusCodes.ACTIVE] },
      CONTRACTS_SCENARIO
    );

  When("I narrow my contracts to the active ones", narrowToActive);

  Then("only my active contracts come back", world =>
    expectList(world, {
      data: map(asList(activeOnlyRecording).response.body.data, ({ id }) => ({
        id,
        meta: { isActive: true }
      })),
      pagination: { total: totalOf(activeOnlyRecording) }
    })
  );

  Then("I am told my list is narrowed", world =>
    expectListMeta(world, { isFiltered: true })
  );

  Given("I have narrowed my contracts to the active ones", async world => {
    await narrowToActive(world);
    await openCollection(world);
    await expectList(world, {
      data: rowsOf(narrowedRecording),
      pagination: { total: totalOf(narrowedRecording) }
    });
    await expectListMeta(world, { isFiltered: true });
  });

  When("I clear the narrowing", world =>
    world.fire(CONTRACTS_COVERED_ACTIONS.filterBy, {}, CONTRACTS_SCENARIO)
  );

  Then("I am no longer told my list is narrowed", world =>
    expectListMeta(world, { isFiltered: false })
  );

  Then("my whole list of contracts comes back", world =>
    expectList(world, {
      data: rowsOf(clearedRecording),
      pagination: { total: totalOf(clearedRecording) }
    })
  );

  const orderByNextBill = (world: World) =>
    world.fire(
      CONTRACTS_COVERED_ACTIONS.sortBy,
      BILLS_LATEST_FIRST,
      CONTRACTS_SCENARIO
    );

  When(
    "I order my contracts by when they next bill, latest first",
    orderByNextBill
  );

  Then("my contracts come back in that order", world =>
    expectList(world, {
      query: { sort: BILLS_LATEST_FIRST },
      data: rowsOf(orderedRecording)
    })
  );

  Given(
    "I have ordered my contracts by when they next bill, latest first",
    async world => {
      await orderByNextBill(world);
      await openCollection(world);
      await expectList(world, {
        query: { sort: BILLS_LATEST_FIRST },
        data: rowsOf(orderedGivenRecording)
      });
    }
  );

  When("I empty the order", world =>
    world.fire(CONTRACTS_COVERED_ACTIONS.sortBy, [], CONTRACTS_SCENARIO)
  );

  Then("my contracts come back oldest first again", world =>
    expectList(world, {
      query: { sort: OLDEST_FIRST },
      data: rowsOf(emptiedRecording)
    })
  );

  Given(
    "I have narrowed my contracts to the suspended ones, newest first",
    async world => {
      await world.fire(
        CONTRACTS_COVERED_ACTIONS.setCriteria,
        {
          filters: { "status.code": [ContractStatusCodes.SUSPENDED] },
          sort: NEWEST_FIRST
        },
        CONTRACTS_SCENARIO
      );
      await openCollection(world);
      await expectList(world, {
        pagination: { total: totalOf(suspendedBeforeRecording) }
      });
    }
  );

  When("I read my contracts again after one more of them is suspended", world =>
    world.fire(CONTRACTS_COVERED_ACTIONS.refresh, undefined, CONTRACTS_SCENARIO)
  );

  Then(
    "my list shows the contract that was suspended since I last read it",
    world =>
      expectList(world, {
        data: [{ id: NEWLY_SUSPENDED_ID, meta: { isSuspended: true } }],
        pagination: { total: totalOf(suspendedAfterRecording) }
      })
  );

  // === AC-3 / AC-12 · ONE CONTRACT, READ IN FULL ============================

  Given("one of my contracts has a cancellation request on it", world =>
    openManager(world, addressedId(openedRecording))
  );

  When("I open that contract", readManager);

  Then(
    "it names the very contract I opened, titled by the order it was bought under",
    world =>
      expectManager(world, {
        context: { contractId: opened.id, contract: { id: opened.id } },
        contract: { id: opened.id },
        title: opened.name ?? `#${opened.main_invoice_number}`
      })
  );

  Then("it arrives with the cancellation request on it", world =>
    expectManager(world, {
      rawContract: {
        cancellation_request: { id: opened.cancellation_request?.id }
      },
      contract: {
        cancellationRequest: {
          status: { code: opened.cancellation_request?.status.code }
        }
      }
    })
  );

  Then(
    "it arrives with the contract's own status and my account's image",
    world =>
      expectManager(world, {
        contract: {
          status: {
            code: opened.status.code,
            name: opened.status.name_translated ?? opened.status.name
          }
        },
        rawContract: { client: { image: opened.client?.image ?? null } }
      })
  );

  Then(
    "it lists each of its products by name and id, with its status, its tags, its catalogue image and its brand's currency",
    world =>
      expectManager(world, {
        contract: {
          products: map(opened.products, ({ id, name, product }) => ({
            id,
            name,
            product: { name: product.name }
          }))
        },
        rawContract: {
          products: map(opened.products, product => ({
            id: product.id,
            status: { code: product.status.code },
            tags: product.tags,
            product: {
              image: product.product.image ?? null,
              brand: {
                currency: { code: product.product.brand.currency.code }
              }
            }
          }))
        }
      })
  );

  Then(
    "my stored payment methods are loaded ready for the payment-method form",
    world =>
      expectManager(world, {
        lookups: {
          storedPaymentMethods: rowsOf(openedCardsRecording)
        }
      })
  );

  Then(
    "its lifecycle state is named in the platform's own contract vocabulary",
    async world => {
      const { status } = asRead(openedRecording).response.body.data;
      await expectManager(world, {
        contractStatusCode: status.code,
        contract: { status: { code: status.code } }
      });
      await expectManagerMeta(world, { isCancelling: true });
    }
  );

  Then(
    "the state of the cancellation request on it is named in the platform's own cancellation vocabulary",
    world =>
      expectManager(world, {
        cancellationRequestStatusCode:
          asRead(openedRecording).response.body.data.cancellation_request
            ?.status.code
      })
  );

  Given("I have one of my contracts open in the manager", async world => {
    await openManager(world, SUBSCRIPTION_ID);
    await readManager(world);
    await expectManager(world, { contract: { id: SUBSCRIPTION_ID } });
  });

  When(
    "I open the manager on a contract that is not one of mine",
    async world => {
      await openManager(world, addressedId(failedReadRecording));
      await fireManager(world, CONTRACT_COVERED_ACTIONS.isReady);
    }
  );

  Then("I am shown the reason the failed read returned", world =>
    expectManager(world, {
      errors: asRead(failedReadRecording).response.body.error?.message
    })
  );

  Then(
    "the manager has stopped loading, reports an error and tells me at once the contract is not ready",
    world => expectManagerMeta(world, { isLoading: false, hasError: true })
  );

  Then("it does not hold the contract I had open", world =>
    expectManager(world, { contract: null })
  );

  When("I reset my contract after it has been suspended", world =>
    fireManager(world, CONTRACT_COVERED_ACTIONS.reset)
  );

  Then(
    "my contract is shown to me as suspended, with no error",
    async world => {
      await expectManagerMeta(world, { isSuspended: true, hasError: false });
      await expectManager(world, {
        contract: {
          id: SUBSCRIPTION_ID,
          status: {
            code: asRead(resetReadRecording).response.body.data.status.code
          }
        }
      });
    }
  );

  // === AC-8 · CHANGING HOW A CONTRACT IS PAID FOR ===========================

  Given(
    "I have my active subscription open in the manager, paying by one of my stored methods",
    openSubscription({ isActive: true })
  );

  Given(
    "I have my suspended subscription open in the manager, paying by one of my stored methods",
    openSubscription({ isSuspended: true })
  );

  Given(
    "I have my cancelled subscription open in the manager, paying by one of my stored methods",
    openSubscription({ isCancelled: true })
  );

  Given(
    "I have my lapsed subscription open in the manager, paying by one of my stored methods",
    openSubscription({ isLapsed: true })
  );

  Given(
    "I have my one-off purchase open in the manager, paying by one of my stored methods",
    async world => {
      const oneOff = asRead(oneOffReadRecording).response.body.data;
      await openManager(world, oneOff.id);
      await readManager(world);
      await expectManager(world, {
        contract: {
          id: oneOff.id,
          billingCycleMonths: oneOff.billing_cycle_months,
          paymentDetailsId: oneOff.payment_details_id
        }
      });
    }
  );

  Given(
    "I have a subscription delegated to me open in the manager, paying by one of its owner's stored methods",
    async world => {
      const delegated = asRead(delegatedReadRecording).response.body.data;
      await openManager(world, delegated.id);
      await readManager(world);
      await expectManager(world, {
        contract: { id: delegated.id, paymentDetailsId: ORIGINAL_CARD },
        rawContract: {
          products: [
            {
              id: find(delegated.products, "is_delegated_object")?.id,
              is_delegated_object: true
            }
          ]
        }
      });
    }
  );

  Given(
    "I have a subscription of mine open in the manager that pays by no stored method",
    async world => {
      const cardless = asRead(cardlessReadRecording).response.body.data;
      await openManager(world, cardless.id);
      await readManager(world);
      await expectManager(world, {
        contract: { id: cardless.id, paymentDetailsId: null }
      });
    }
  );

  Given(
    "I have opened the payment-method form, which starts with no method chosen",
    async world => {
      await fireManager(world, CONTRACT_COVERED_ACTIONS.openPaymentMethod);
      await expectManagerMeta(world, { isPaymentMethodOpen: true });
      await expectManager(world, {
        paymentMethod: {
          model: { paymentDetailsId: null },
          schema: {
            properties: { paymentDetailsId: { enum: [CHOSEN_CARD] } }
          }
        }
      });
    }
  );

  Given("I have opened the payment-method form", openPaymentMethodForm);

  Given(
    "I have opened the payment-method form, with a different stored card chosen",
    async world => {
      await openPaymentMethodForm(world);
      await chooseCard(world);
    }
  );

  When(
    "I choose a different stored card and submit the payment-method form",
    async world => {
      await chooseCard(world);
      await fireManager(world, CONTRACT_COVERED_ACTIONS.update);
    }
  );

  Then("the change is saved and the form closes with no error", world =>
    expectManagerMeta(world, { isPaymentMethodOpen: false, hasError: false })
  );

  Then(
    "that contract now bills against the method I chose, and the change reached only my own contract",
    world =>
      expectManager(world, {
        contract: { id: SUBSCRIPTION_ID, paymentDetailsId: CHOSEN_CARD }
      })
  );

  Then(
    "that contract now bills against the method I chose",
    billsAgainst(CHOSEN_CARD)
  );

  When("I try to change how it is paid for", tryToChange);

  Then("the payment-method form does not open", world =>
    expectManagerMeta(world, { isPaymentMethodOpen: false })
  );

  Then(
    "that contract still bills against the method it had",
    billsAgainst(ORIGINAL_CARD)
  );

  When(
    "I submit the payment-method form with no method chosen",
    submitRefused(null)
  );

  When(
    "I submit the payment-method form with the method my contract already uses",
    submitRefused(ORIGINAL_CARD)
  );

  When("I close the payment-method form", world =>
    fireManager(world, CONTRACT_COVERED_ACTIONS.clear)
  );

  Then(
    "the payment-method form is closed and that contract still bills against the method it had",
    async world => {
      await expectManagerMeta(world, { isPaymentMethodOpen: false });
      await billsAgainst(ORIGINAL_CARD)(world);
    }
  );

  Then(
    "the next time I open the payment-method form it starts on the method my contract pays with",
    openPaymentMethodForm
  );

  When(
    "I submit the payment-method form and the change has not landed yet",
    world =>
      world.fireHold!(
        CONTRACT_COVERED_ACTIONS.update,
        undefined,
        CONTRACT_SCENARIO
      )
  );

  Then("I am told the change is in progress", world =>
    expectManagerMeta(world, { isProcessing: true })
  );

  Then(
    "once it lands I am told it is done, and that contract bills against the method I chose",
    async world => {
      await fireManager(world, CONTRACT_COVERED_ACTIONS.onDone);
      await world.expectMeta({ isProcessing: false }, CONTRACT_SCENARIO);
      await world.settle!(CONTRACT_SCENARIO);
      await billsAgainst(CHOSEN_CARD)(world);
    }
  );
});

export default contractSteps;
