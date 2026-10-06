// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview contract-product change of plan — the pure rules (unit,
 * FE-3206, AC-26 to AC-33)
 *
 * ## Job To Be Done
 * Pin the rules a client's change of plan rests on, each against staging
 * recordings: the nine clauses of the change rule one at a time (design 8.3,
 * R14), the change body and its option price rule (design 8.2), the cost and
 * the result a dry run and a commit map to, the configurator seed and the
 * child overrides (design 8.5, R10, R12, R16), and the manager flags that
 * publish the pro-rata hold and the payment still due.
 *
 * Every product, plan and invoice below is a staging recording. Where a
 * clause needs a value no recording carries — a plan that allows changes,
 * a staged import, a custom price — the value is a literal argument to a pure
 * function, never a served fixture (bdd.md section 7).
 *
 * ## What Breaks If These Fail
 * A client is offered a change of plan the platform will refuse, or is kept
 * from one it allows; the change sent prices an option at the old price or
 * sends provisioning details; a commit that left an invoice to pay reads as
 * settled; or the chosen plan loads in the basket's currency, with its
 * promotions, through a basket helper that reprices it.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import {
  Interpreter,
  State,
  assign,
  createMachine,
  interpret,
  spawn
} from "xstate";
import {
  replayStep,
  startScenarioReplay
} from "@upmind-automation/test-fixtures/replay-server";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes
} from "@upmind-automation/types";
import { mapContractProduct, useContractProduct } from "..";
import {
  observeRequestBodies,
  observeRequests
} from "../../../__tests__/criteria-int-kit";
import basketRecording from "../../basket/__tests__/fixtures/get-orders-current.json";
import paidInvoiceRecording from "../../invoices/__tests__/fixtures/get-invoices-id-case-paid.json";
import unpaidInvoiceRecording from "../../invoices/__tests__/fixtures/get-invoices-id-case-unpaid.json";
import invoiceListRecording from "../../invoices/__tests__/fixtures/get-invoices.json";
import freeInvoiceRecording from "../../invoices/__tests__/scenarios/read-an-invoice-with-no-charge-as-free/02/get-invoices-id-with-staged-imports-1.json";
import { productMachine } from "../../product";
import catalogueRecording from "../../product-catalogue/__tests__/fixtures/get-basket-products-5c3bdcbe.json";
import { queryClient } from "../../query/client";
import { ScopeActorTypes } from "../../scope/scope.types";
import { contractProductMachine } from "../contract-product.machine";
import {
  mapMigrationPreview,
  mapMigrationResult
} from "../contract-product.mappers";
import {
  omitMigrationSchema,
  omitMigrationUischema
} from "../contract-product.schemas";
import {
  buildChangeProductBody,
  buildMigrationSeed,
  canMigrateProduct,
  migrationTargetConfig
} from "../contract-product.utils";
import { createContractProductMeta } from "../useContractProduct.meta";
import {
  armBootStep,
  resetContractProductScopes,
  seedClientSession
} from "./contract-product.int-helpers";
import pendingRequestRecording from "./scenarios/i-am-told-whether-the-cancellation-form-is-offered-before-i-open-it-a-product-with-a-cancellation-request-already-pending/02/get-contract-products-id.json";
import acceptedRequestRecording from "./scenarios/i-am-told-why-the-cancellation-form-is-not-available-to-me-its-cancellation-request-was-already-accepted/02/get-contract-products-id.json";
import proRataRecording from "./scenarios/i-cannot-ask-to-cancel-a-product-the-platform-holds-back-from-cancelling-has-a-pending-pro-rata-invoice/02/get-contract-products-id.json";
import activeRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-active/02/get-contract-products-id.json";
import cancelledRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-cancelled/02/get-contract-products-id.json";
import expiringRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-expiring/02/get-contract-products-id.json";
import lapsedRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-lapsed/02/get-contract-products-id.json";
import pendingRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-pending/02/get-contract-products-id.json";
import suspendedRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-suspended/02/get-contract-products-id.json";
import { server } from "./setup.integration";
import {
  filter,
  find,
  flatMap,
  isEqual,
  isObject,
  last,
  map,
  some,
  toPairs,
  values
} from "lodash-es";
import type {
  Product,
  ProductConfigContext,
  ProductModel
} from "../../product";
import type {
  ContractProduct,
  ContractProductContext,
  MigrationGateFacts,
  MigrationHolders,
  MigrationTarget
} from "../contract-product.types";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type {
  IContractProduct,
  IInvoice,
  IProduct,
  IProductMigration
} from "@upmind-automation/types";
import type { AnyEventObject, StateSchema } from "xstate";

// -----------------------------------------------------------------------------

type Recording<T> = { response: { body: { data: T } } };

const recorded = <T>(recording: unknown): T =>
  (recording as Recording<T>).response.body.data;

const product = (recording: unknown): ContractProduct =>
  mapContractProduct(recorded<IContractProduct>(recording));

/** The Starter Hosting plan, as the recorded catalogue read returned it, with its options and their prices. */
const PLAN = recorded<IProduct[]>(catalogueRecording)[0];
const TAX_FREE_PLAN = recorded<IProduct[]>(catalogueRecording)[1];

type RawOption = {
  id: string;
  category_id: string;
  prices: { billing_cycle_months: number; price: number }[];
};
const optionNamed = (name: string) =>
  find(
    (PLAN as unknown as { products_options: (RawOption & { name: string })[] })
      .products_options,
    { name }
  ) as RawOption;
const attributeNamed = (name: string) =>
  find(
    (
      PLAN as unknown as {
        products_attributes: {
          id: string;
          name: string;
          category_id: string;
        }[];
      }
    ).products_attributes,
    { name }
  ) as { id: string; category_id: string };

const TOKYO = optionNamed("Tokyo");
const MAILBOX = optionNamed("1 Mailbox");
const WINDOWS = attributeNamed("Windows 11 Professional (Enterprise License)");
const priceOf = (option: RawOption, term: number) =>
  (find(option.prices, { billing_cycle_months: term }) as { price: number })
    .price;

/** The one plan the change rule is told the product's plan allows — a literal argument, no recording carries one (research B5). */
const ALLOWS_A_CHANGE = [
  { migration_product_id: TAX_FREE_PLAN.id } as unknown as IProductMigration
];

/** A product whose plan allows a change, every other fact as its recording read. */
const changeable = (
  recording: unknown,
  facts: Partial<MigrationGateFacts> = {}
): MigrationGateFacts => ({
  ...product(recording),
  allowedMigrations: ALLOWS_A_CHANGE,
  ...facts
});

// -----------------------------------------------------------------------------

describe("AC-26 — the change rule", () => {
  it("an active subscription whose plan allows a change can change plan", () => {
    expect(canMigrateProduct(changeable(activeRecording))).toBe(true);
  });

  it("a suspended subscription whose plan allows a change can change plan", () => {
    expect(canMigrateProduct(changeable(suspendedRecording))).toBe(true);
  });

  it("a plan that allows no change closes it, whatever else is true", () => {
    expect(
      canMigrateProduct(changeable(activeRecording, { allowedMigrations: [] }))
    ).toBe(false);
  });

  it("a product the platform does not let me modify cannot change plan", () => {
    expect(
      canMigrateProduct(changeable(activeRecording, { canModify: false }))
    ).toBe(false);
  });

  it("a pending cancellation request closes it", () => {
    const facts = changeable(pendingRequestRecording);

    expect(facts.contractRequest?.status?.code).toBe(
      CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
    );
    expect(facts.canModify).toBe(true);
    expect(canMigrateProduct(facts)).toBe(false);
  });

  it("an accepted cancellation request closes it", () => {
    const facts = changeable(acceptedRequestRecording, { canModify: true });

    expect(canMigrateProduct(facts)).toBe(false);
  });

  it("a subscription set to expire at the end of its term closes it", () => {
    const facts = changeable(expiringRecording);

    expect(facts.renew).toBe(false);
    expect(facts.canModify).toBe(true);
    expect(canMigrateProduct(facts)).toBe(false);
  });

  it("a product that is not a single product closes it", () => {
    const optionType = (
      PLAN as unknown as { products_options: { product_type: number }[] }
    ).products_options[0].product_type;

    expect(
      canMigrateProduct(
        changeable(activeRecording, {
          productType: optionType as MigrationGateFacts["productType"]
        })
      )
    ).toBe(false);
  });

  it("a staged import closes it", () => {
    expect(
      canMigrateProduct(changeable(activeRecording, { stagedImport: true }))
    ).toBe(false);
  });

  it("a pro-rata invoice still unpaid closes it", () => {
    expect(
      canMigrateProduct(
        changeable(activeRecording, {
          proRataPending: product(proRataRecording).proRataPending
        })
      )
    ).toBe(false);
  });

  for (const [state, recording] of [
    ["pending", pendingRecording],
    ["cancelled", cancelledRecording],
    ["lapsed", lapsedRecording]
  ] as const)
    it(`a ${state} product cannot change plan even when the platform lets me modify it`, () => {
      expect(
        canMigrateProduct(changeable(recording, { canModify: true }))
      ).toBe(false);
    });

  it("an expiring subscription that still renews is read by its raw status, not its node", () => {
    expect(
      canMigrateProduct(
        changeable(expiringRecording, {
          renew: true,
          status: {
            code: ContractStatusCodes.ACTIVE
          } as ContractProduct["status"]
        })
      )
    ).toBe(true);
  });
});

// -----------------------------------------------------------------------------

const CONTRACT = product(activeRecording);

const modelWith = (
  options: Record<
    string,
    Record<string, { productId: string; cycle: number; quantity: number }>
  > = {},
  attributes: ProductModel["attributes"] = {}
): ProductModel => ({
  productId: PLAN.id,
  quantity: 1,
  term: 1,
  options,
  attributes
});

const tokyoOnMonthly = modelWith({
  [TOKYO.category_id]: {
    [TOKYO.id]: { productId: TOKYO.id, cycle: 1, quantity: 1 }
  }
});

const bodyFor = (
  model: ProductModel,
  extra: Partial<Parameters<typeof buildChangeProductBody>[0]> = {}
) =>
  buildChangeProductBody({
    contractId: CONTRACT.contractId,
    contractProductId: CONTRACT.id,
    targetId: PLAN.id,
    model,
    rawProduct: PLAN,
    currencyId: CONTRACT.contractCurrencyId,
    ...extra
  });

describe("AC-32 — the change body", () => {
  it("names my contract, my product, the chosen plan and the current term, with no quantity for the plan", () => {
    const body = bodyFor(tokyoOnMonthly);

    expect(body.contract_id).toBe(CONTRACT.contractId);
    expect(body.contracts_product_id).toBe(CONTRACT.id);
    expect(body.product).toStrictEqual({
      product_id: PLAN.id,
      billing_cycle_months: 1
    });
    expect(body.dry_run).toBeUndefined();
  });

  it("carries each option by its product, term and quantity", () => {
    const [option] = bodyFor(tokyoOnMonthly).options;

    expect(option).toMatchObject({
      product_id: TOKYO.id,
      billing_cycle_months: 1,
      unit_quantity: 1
    });
  });

  it("an option whose price differs from mine carries its new price for the chosen term", () => {
    const [option] = bodyFor(tokyoOnMonthly, {
      currentOptions: [
        { productId: TOKYO.id, sellingPrice: priceOf(TOKYO, 1) + 5 }
      ]
    }).options;

    expect(option.price).toBe(priceOf(TOKYO, 1));
  });

  it("an option I do not hold yet carries its new price", () => {
    const [option] = bodyFor(tokyoOnMonthly, { currentOptions: [] }).options;

    expect(option.price).toBe(priceOf(TOKYO, 1));
  });

  it("an option the plan discounts carries the discounted price, not the list price", () => {
    const term = 1;
    const listPrice = priceOf(TOKYO, term);
    const discountedPrice = listPrice - 3;
    const discountedPlan = {
      ...PLAN,
      products_options: map(
        (PLAN as unknown as { products_options: RawOption[] }).products_options,
        option =>
          option.id === TOKYO.id
            ? {
                ...option,
                prices: map(option.prices, row =>
                  row.billing_cycle_months === term
                    ? { ...row, price_discounted: discountedPrice }
                    : row
                )
              }
            : option
      )
    } as unknown as IProduct;

    const [option] = bodyFor(tokyoOnMonthly, {
      currentOptions: [],
      rawProduct: discountedPlan
    }).options;

    expect(option.price).toBe(discountedPrice);
    expect(option.price).not.toBe(listPrice);
  });

  it("an option whose price equals mine carries no price", () => {
    const [option] = bodyFor(tokyoOnMonthly, {
      currentOptions: [{ productId: TOKYO.id, sellingPrice: priceOf(TOKYO, 1) }]
    }).options;

    expect(option).not.toHaveProperty("price");
  });

  it("a one-time option is priced off its term-0 row", () => {
    const [option] = bodyFor(
      modelWith({
        [MAILBOX.category_id]: {
          [MAILBOX.id]: { productId: MAILBOX.id, cycle: 1, quantity: 1 }
        }
      }),
      { currentOptions: [] }
    ).options;

    expect(option.price).toBe(priceOf(MAILBOX, 0));
  });

  it("a numeric custom price wins", () => {
    const [option] = bodyFor(tokyoOnMonthly, {
      currentOptions: [
        { productId: TOKYO.id, sellingPrice: priceOf(TOKYO, 1) }
      ],
      customPrice: priceOf(TOKYO, 1) + 1
    }).options;

    expect(option.price).toBe(priceOf(TOKYO, 1) + 1);
  });

  it("carries each attribute by its product alone", () => {
    const body = bodyFor(
      modelWith(
        {},
        {
          [WINDOWS.category_id]: {
            [WINDOWS.id]: { productId: WINDOWS.id, cycle: 1, quantity: 1 }
          }
        }
      )
    );

    expect(body.attributes).toStrictEqual([{ product_id: WINDOWS.id }]);
  });

  it("sends no provisioning details, even when the configurator holds some", () => {
    const body = bodyFor({
      ...tokyoOnMonthly,
      provisionFields: { domain: "example.com" }
    });

    expect(JSON.stringify(body)).not.toContain("example.com");
    expect(body).not.toHaveProperty("provision_fields");
    expect(body).not.toHaveProperty("provisionFields");
  });
});

// -----------------------------------------------------------------------------

const invoice = (recording: unknown) => recorded<IInvoice>(recording);
const CREDIT_NOTE = find(
  recorded<IInvoice[]>(invoiceListRecording),
  row => (row.total_amount_converted as number) < 0
) as IInvoice;

describe("AC-30 — the preview", () => {
  it("a dry run with a cost gives its formatted total and is not free", () => {
    const raw = invoice(unpaidInvoiceRecording);
    const preview = mapMigrationPreview(raw);

    expect(preview.total).toBe(raw.total_amount_formatted);
    expect(preview.isFree).toBe(false);
    expect(preview.invoice.id).toBe(raw.id);
  });

  it("a dry run that charges nothing is free", () => {
    expect(mapMigrationPreview(invoice(freeInvoiceRecording)).isFree).toBe(
      true
    );
  });

  it("a dry run that credits me is not free", () => {
    expect(mapMigrationPreview(CREDIT_NOTE).isFree).toBe(false);
  });

  it("a dry run with no converted total is free", () => {
    expect(
      mapMigrationPreview({
        ...invoice(unpaidInvoiceRecording),
        total_amount_converted: null
      } as unknown as IInvoice).isFree
    ).toBe(true);
  });
});

describe("AC-31 — the result of a commit", () => {
  it("a commit that left an amount due must be paid", () => {
    const raw = invoice(unpaidInvoiceRecording);
    const result = mapMigrationResult(raw);

    expect(result.invoiceId).toBe(raw.id);
    expect(result.unpaidAmount).toBe(raw.unpaid_amount);
    expect(result.requiresPayment).toBe(true);
  });

  it("a commit whose invoice is settled asks for nothing", () => {
    const result = mapMigrationResult(invoice(paidInvoiceRecording));

    expect(result.unpaidAmount).toBe(0);
    expect(result.requiresPayment).toBe(false);
  });

  it("a commit that raised no invoice gives no invoice and nothing to pay", () => {
    const result = mapMigrationResult(undefined);

    expect(result.invoiceId).toBeUndefined();
    expect(result.invoice).toBeUndefined();
    expect(result.unpaidAmount).toBe(0);
    expect(result.requiresPayment).toBe(false);
  });
});

// -----------------------------------------------------------------------------

const noHolders = (): MigrationHolders =>
  ({
    count: { value: null },
    list: { value: null },
    config: { value: null },
    isMigrationTargetReady: { value: false },
    dispose: () => undefined
  }) as unknown as MigrationHolders;

const managerOn = (context: Partial<ContractProductContext>) =>
  createContractProductMeta(
    ScopeActorTypes.CLIENT,
    {
      id: "contract-product",
      state: ref(State.from("available", context as ContractProductContext)),
      send: vi.fn(),
      service: {} as never
    } as never,
    noHolders()
  );

describe("AC-31 — the manager publishes the payment still due", () => {
  it("publishes requiresPayment after a commit that left an amount due", () => {
    const meta = managerOn({
      contractProduct: CONTRACT,
      migrationResult: mapMigrationResult(invoice(unpaidInvoiceRecording))
    });

    expect(meta.requiresPayment.value).toBe(true);
  });

  it("publishes no payment due after a commit whose invoice is settled", () => {
    const meta = managerOn({
      contractProduct: CONTRACT,
      migrationResult: mapMigrationResult(invoice(paidInvoiceRecording))
    });

    expect(meta.requiresPayment.value).toBe(false);
  });
});

describe("AC-33 — the pro-rata report", () => {
  it("reports a pro-rata invoice of mine as unpaid, and the change of plan closed", () => {
    const held = product(proRataRecording);
    const meta = managerOn({
      contractProduct: { ...held, allowedMigrations: ALLOWS_A_CHANGE },
      rawContractProduct: recorded<IContractProduct>(proRataRecording)
    });

    expect(held.proRataPending).toBe(true);
    expect(meta.hasPendingProRata.value).toBe(true);
    expect(meta.canMigrate.value).toBe(false);
  });

  it("reports no pro-rata hold on a product with none", () => {
    const meta = managerOn({
      contractProduct: CONTRACT,
      rawContractProduct: recorded<IContractProduct>(activeRecording)
    });

    expect(meta.hasPendingProRata.value).toBe(false);
  });
});

// -----------------------------------------------------------------------------

const TARGET: MigrationTarget = {
  id: TAX_FREE_PLAN.id,
  product: { id: TAX_FREE_PLAN.id } as unknown as Product
};
const SEED = buildMigrationSeed(
  { contractProduct: CONTRACT } as ContractProductContext,
  TARGET
);

describe("AC-29 — the configurator seed", () => {
  it("starts the chosen plan on my subscription's current term", () => {
    expect(SEED.model).toMatchObject({
      productId: TARGET.id,
      term: CONTRACT.billingCycleMonths
    });
  });

  it("loads the chosen plan in my contract's currency", () => {
    expect(SEED.currencyId).toBe(CONTRACT.contractCurrencyId);
  });

  it("loads the chosen plan without promotions or coupons", () => {
    expect((SEED as { promotions?: unknown }).promotions).toBe(false);
    expect(SEED.coupons).toStrictEqual([]);
  });

  it("names no basket, no client and no basket product", () => {
    expect(SEED.basketId).toBeUndefined();
    expect(SEED.clientId).toBeUndefined();
    expect(SEED.rawBasketProduct).toBeUndefined();
  });
});

type OverriddenAction =
  | "setBasketHelper"
  | "calculate"
  | "update"
  | "refreshContext";

/**
 * Runs one action of the stock product machine, as the change-of-plan
 * overrides configure it, on a child seeded with the real seed, under a
 * parent that records what the child sends it.
 */
function childRunning(
  action: OverriddenAction,
  context: ProductConfigContext = SEED
) {
  const heard: AnyEventObject[] = [];
  const configured = productMachine.withConfig(migrationTargetConfig as never)
    .options.actions as Record<string, never>;
  const child = createMachine<ProductConfigContext>(
    {
      id: "migration-target",
      context,
      initial: "idle",
      states: {
        idle: { on: { RUN: { actions: action } } }
      }
    },
    { actions: { [action]: configured[action] } }
  );
  const parent = interpret(
    createMachine<{ ref?: unknown }>({
      context: {},
      initial: "running",
      states: {
        running: {
          entry: assign({ ref: () => spawn(child, "migration-target") }),
          on: { "*": { actions: (_c, event) => heard.push(event) } }
        }
      }
    })
  ).start();
  const ref = parent.getSnapshot().context.ref as {
    send: (event: AnyEventObject) => void;
    getSnapshot: () => { context: ProductConfigContext };
  };
  return { heard, ref, parent };
}

const carries = (event: AnyEventObject, value: unknown): boolean =>
  some(
    values(event),
    member =>
      isEqual(member, value) ||
      (member !== null && typeof member === "object"
        ? carries(member as AnyEventObject, value)
        : false)
  );

describe("AC-30 — the dry-run trigger", () => {
  it("the calculate override hands the child's model to the manager, not a price calculation", () => {
    const { heard, ref } = childRunning("calculate");
    ref.send({ type: "RUN" });

    const [event] = heard;
    expect(event?.type).toBe("MIGRATION.CHANGED");
    expect(carries(event, SEED.model)).toBe(true);
  });

  it("the calculate override hands the model on in silent mode too", () => {
    const { heard, ref } = childRunning("calculate", { ...SEED, silent: true });
    ref.send({ type: "RUN" });

    expect(heard[0]?.type).toBe("MIGRATION.CHANGED");
  });
});

describe("AC-34 — the forced commit", () => {
  it("the update override hands the child's model to the manager to commit", () => {
    const { heard, ref } = childRunning("update");
    ref.send({ type: "RUN" });

    const [event] = heard;
    expect(event?.type).toBe("MIGRATION.COMMIT");
    expect(carries(event, SEED.model)).toBe(true);
  });
});

describe("AC-29 — the currency hold", () => {
  it("a basket refresh keeps the contract currency, the promotions, the coupons and the model", () => {
    const { ref } = childRunning("refreshContext");
    ref.send({
      type: "RUN",
      data: recorded(basketRecording)
    } as AnyEventObject);

    const after = ref.getSnapshot().context;
    expect(after.currencyId).toStrictEqual(SEED.currencyId);
    expect(after.currencyCode).toStrictEqual(SEED.currencyCode);
    expect((after as { promotions?: unknown }).promotions).toBe(false);
    expect(after.coupons).toStrictEqual(SEED.coupons);
    expect(after.baseModel).toStrictEqual(SEED.baseModel);
    expect(after.model).toStrictEqual(SEED.model);
  });
});

describe("AC-29 — no basket helper", () => {
  it("connects nothing to the basket and spawns no helper", () => {
    const { ref } = childRunning("setBasketHelper");
    ref.send({ type: "RUN" });

    const after = ref.getSnapshot() as {
      context: ProductConfigContext;
      children?: Record<string, unknown>;
    };
    expect(after.context.basketHelper).toBeUndefined();
    expect(Object.keys(after.children ?? {})).toStrictEqual([]);
  });
});

// -----------------------------------------------------------------------------

const SCENARIOS = join(import.meta.dirname, "scenarios");

/** One recording a scenario step holds, read as the platform answered it. */
const stepRecording = <T>(slug: string, step: number, file: string): T =>
  JSON.parse(
    readFileSync(
      join(SCENARIOS, slug, String(step).padStart(2, "0"), `${file}.json`),
      "utf-8"
    )
  ) as T;

type WireRecording<T> = {
  request: { path: string };
  response: { status: number; body: { data: T; total?: number } };
};

const recordedData = <T>(slug: string, step: number, file: string): T =>
  stepRecording<WireRecording<T>>(slug, step, file).response.body.data;

const PLAN_LOAD = "get-basket-products-id-currency-id-omit-promotions-1";
const CHANGE = "put-contracts-id-products-id-change";
const PRODUCT_READ = "get-contract-products-id";

const CHOOSE = "choose-a-plan-and-see-what-the-change-costs-before-i-commit";
const SAME_PRICE =
  "i-am-told-a-change-of-plan-to-a-plan-of-the-same-price-costs-nothing";

const SOURCE = recordedData<IContractProduct>(CHOOSE, 2, PRODUCT_READ);
const SOURCE_PLAN = recordedData<IProduct>(CHOOSE, 3, PLAN_LOAD);
const SAME_PRICE_PLAN = recordedData<IProduct>(SAME_PRICE, 3, PLAN_LOAD);
const UNPAID = invoice(unpaidInvoiceRecording);
const PAID = invoice(paidInvoiceRecording);

// -----------------------------------------------------------------------------

const PROVISION =
  "a-plan-that-needs-provisioning-details-can-still-be-changed-to";
const CLOSE = "close-a-change-of-plan-without-changing";
const RELOAD = "a-plan-i-chose-that-did-not-load-can-be-loaded-again";
const SEE_MORE = "see-more-of-the-plans-i-can-change-my-subscription-to";
const REOPEN =
  "a-new-change-of-plan-starts-with-no-invoice-from-the-change-before";

type Wire = {
  replay: ReturnType<typeof startScenarioReplay>;
  sent: ReturnType<typeof observeRequests>;
  bodies: ReturnType<typeof observeRequestBodies>;
};

let wire: Wire | undefined;

afterEach(() => {
  if (!wire) return;
  const { replay, sent, bodies } = wire;
  wire = undefined;
  sent.stop();
  bodies.stop();
  expect(replay.gaps()).toStrictEqual([]);
});

/** Arms the answers `step` of the scenario recorded. */
const armStep = (slug: string, step: number) =>
  replayStep(server, join(SCENARIOS, slug, String(step).padStart(2, "0")));

/**
 * Replays the scenario `slug` as its recording holds it: the session's boot,
 * then the Given's reads. The manager is the real `useContractProduct` on the
 * product the scenario recorded; a request no step recorded fails the test.
 */
async function managerOver(slug: string) {
  wire = {
    replay: startScenarioReplay(server),
    sent: observeRequests(server, "/api/"),
    bodies: observeRequestBodies(server, "/change")
  };
  armBootStep(join(SCENARIOS, slug, "01"));
  await seedClientSession();
  armStep(slug, 2);
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(recordedData<IContractProduct>(slug, 2, PRODUCT_READ).id);
  return {
    actions: manager.useActions(),
    meta: manager.useMeta(),
    context: manager.useContext(),
    internals: manager.useInternals()
  };
}

type Live = Awaited<ReturnType<typeof managerOver>>;

async function openOn(live: Live): Promise<void> {
  await live.actions.isReady();
  await live.actions.openMigration();
  await vi.waitFor(() =>
    expect(live.context.migrationTargets.value).not.toStrictEqual([])
  );
}

/** Opens the change of plan and chooses the plan the scenario recorded loading. */
async function chooseOn(live: Live, slug: string): Promise<void> {
  await openOn(live);
  await live.actions.selectMigrationTarget(planIdOf(slug, 2));
  await vi.waitFor(() =>
    expect(
      live.meta.isMigrationPreviewed.value ||
        live.meta.isMigrationTargetUnavailable.value
    ).toBe(true)
  );
}

const liveConfigOf = (live: Live) => {
  const config = live.context.migrationConfig.value;
  if (!config) throw new Error("No plan is configured for a change.");
  return config;
};

/**
 * The stock configurator's own form, before the change of plan filters it —
 * read through the spawned child, since migrationConfig hides provision and
 * trial (R9/ADR-17).
 */
const childForm = (live: Live) => {
  const ref = childOf(live) as
    | { getSnapshot: () => { context: ProductConfigContext } }
    | undefined;
  if (!ref) throw new Error("No child configurator is spawned.");
  const context = ref.getSnapshot().context;
  if (!context.schema || !context.uischema)
    throw new Error("The child configurator has no form yet.");
  return context as ProductConfigContext & {
    schema: JsonSchema7;
    uischema: UISchemaElement;
  };
};

const scopesOf = (element: unknown): string[] =>
  isObject(element)
    ? [
        ...("scope" in element ? [String(element.scope)] : []),
        ...((element as { elements?: unknown[] }).elements ?? []).flatMap(
          scopesOf
        )
      ]
    : [];

type Subscription = { actor: unknown; unsubscribed: boolean };

/** Each subscription made to a running actor while `body` runs, and whether it was let go. */
async function subscriptionsDuring(body: () => Promise<void>) {
  const made: Subscription[] = [];
  const subscribe = Interpreter.prototype.subscribe;
  const spy = vi
    .spyOn(Interpreter.prototype, "subscribe")
    .mockImplementation(function (this: unknown, ...args: unknown[]) {
      const entry: Subscription = { actor: this, unsubscribed: false };
      made.push(entry);
      const subscription = (
        subscribe as (...a: unknown[]) => {
          unsubscribe: () => void;
        }
      ).apply(this, args);
      const unsubscribe = subscription.unsubscribe.bind(subscription);
      subscription.unsubscribe = () => {
        entry.unsubscribed = true;
        unsubscribe();
      };
      return subscription;
    } as never);
  await body().finally(() => {
    spy.mockRestore();
  });
  return made;
}

const childOf = (live: Live) =>
  (live.internals.state.value.context as ContractProductContext).migration?.ref;

/** Every observer the plan catalogue instances hold on the query cache. */
const catalogueObservers = () =>
  flatMap(
    filter(queryClient.getQueryCache().getAll(), query =>
      isEqual(query.queryKey.slice(0, 2), ["product", "catalogue"])
    ),
    query => (query as unknown as { observers: unknown[] }).observers
  );

const planIdOf = (slug: string, step: number) =>
  (/basket\/products\/([^?/]+)/.exec(
    stepRecording<WireRecording<unknown>>(slug, step, PLAN_LOAD).request.path
  ) ?? [])[1] as string;

const countReads = () =>
  filter(
    wire?.sent.all(),
    ({ url, method }) =>
      method === "GET" &&
      new URL(url).pathname.endsWith("/basket/products") &&
      new URL(url).searchParams.get("limit") === "count"
  );

const listReads = () =>
  filter(
    wire?.sent.all(),
    ({ url, method }) =>
      method === "GET" &&
      new URL(url).pathname.endsWith("/basket/products") &&
      new URL(url).searchParams.get("limit") !== "count"
  );

const recordedTotal = (slug: string, step: number, file: string) =>
  stepRecording<WireRecording<unknown>>(slug, step, file).response.body.total;

const countFileOf = (slug: string, step: number) =>
  `get-basket-products-${
    {
      [REOPEN]: { 2: "0f60fb24", 3: "c10423f6" }
    }[slug]?.[step] ?? "0f60fb24"
  }`;

/** Whether `event` carries `forced: true` at any depth. */
const isForced = (event: unknown): boolean =>
  isObject(event) &&
  some(
    toPairs(event as Record<string, unknown>),
    ([key, value]) => (key === "forced" && value === true) || isForced(value)
  );

describe("AC-28 — the scope holders", () => {
  it("counts nothing before the product read, and counts once the read resolves the plans, the currency and the account", async () => {
    const live = await managerOver(REOPEN);

    expect(countReads()).toStrictEqual([]);
    expect(live.context.migrationsCount.value).toBeFalsy();

    await live.actions.isReady();
    await vi.waitFor(() =>
      expect(live.context.migrationsCount.value).toBe(
        recordedTotal(REOPEN, 2, countFileOf(REOPEN, 2))
      )
    );
    const all = wire!.sent.all();
    const productRead = all.findIndex(({ url }) =>
      new URL(url).pathname.endsWith(
        `/contract_products/${recordedData<IContractProduct>(REOPEN, 2, PRODUCT_READ).id}`
      )
    );
    expect(productRead).toBeGreaterThanOrEqual(0);
    expect(all.indexOf(countReads()[0])).toBeGreaterThan(productRead);
  });

  it("a re-read that changes the plans my plan allows stops the old instances, and counts and lists the new plans", async () => {
    const live = await managerOver(REOPEN);
    await chooseOn(live, REOPEN);
    const reread = recordedData<IContractProduct>(REOPEN, 3, PRODUCT_READ);
    const nowAllowed = map(reread.allowed_migrations, "migration_product_id");
    const oldObservers = catalogueObservers();
    expect(oldObservers).not.toStrictEqual([]);

    armStep(REOPEN, 3);
    await live.actions.migrate();
    await vi.waitFor(() =>
      expect(
        map(live.context.allowedMigrations.value, "migration_product_id")
      ).toStrictEqual(nowAllowed)
    );

    expect(
      filter(catalogueObservers(), observer => oldObservers.includes(observer))
    ).toStrictEqual([]);
    await vi.waitFor(
      () =>
        expect(live.context.migrationsCount.value).toBe(
          recordedTotal(REOPEN, 3, countFileOf(REOPEN, 3))
        ),
      { timeout: 5000 }
    );
    expect(
      new URL(last(countReads())!.url).searchParams.get("filter[id]")
    ).toBe(nowAllowed.join(","));

    armStep(REOPEN, 4);
    await live.actions.openMigration();
    await vi.waitFor(
      () =>
        expect(map(live.context.migrationTargets.value, "id")).toStrictEqual(
          map(
            recordedData<IProduct[]>(REOPEN, 4, "get-basket-products-0aea304a"),
            "id"
          )
        ),
      { timeout: 5000 }
    );
  }, 30000);
});

describe("AC-28 — the next page", () => {
  it("asks for the next page from the number of plans already loaded", async () => {
    const live = await managerOver(SEE_MORE);
    await openOn(live);
    const loaded = live.context.migrationTargets.value?.length ?? 0;
    expect(loaded).toBeGreaterThan(0);

    armStep(SEE_MORE, 3);
    await live.actions.loadMoreMigrationTargets();

    await vi.waitFor(() =>
      expect(live.context.migrationTargets.value?.length).toBeGreaterThan(
        loaded
      )
    );
    expect(new URL(last(listReads())!.url).searchParams.get("offset")).toBe(
      String(loaded)
    );
  });
});

describe("AC-28 — the list load states (P5a)", () => {
  it("reports loading-more only while a load-more is in flight, never on the first page", async () => {
    const live = await managerOver(SEE_MORE);
    await openOn(live);
    expect(live.meta.isMigrationTargetsLoadingMore.value).toBe(false);

    replayStep(server, join(SCENARIOS, SEE_MORE, "03"), {
      delayMs: () => 400
    });
    const more = live.actions.loadMoreMigrationTargets();

    await vi.waitFor(() =>
      expect(live.meta.isMigrationTargetsLoadingMore.value).toBe(true)
    );
    expect(live.meta.isMigrationTargetsLoading.value).toBe(false);
    await more;
    await vi.waitFor(() =>
      expect(live.meta.isMigrationTargetsLoadingMore.value).toBe(false)
    );
  });

  it("reports an error when the plans list fails, and clears it on a retry that loads them", async () => {
    const live = await managerOver(SEE_MORE);
    await live.actions.isReady();
    expect(live.meta.hasMigrationTargetsError.value).toBe(false);

    let failList = true;
    server.use(
      http.get("*/basket/products", ({ request }) => {
        const limit = new URL(request.url).searchParams.get("limit");
        return failList && limit !== "count"
          ? HttpResponse.json(
              { error: { message: "the plans could not be read" } },
              { status: 500 }
            )
          : undefined;
      })
    );

    await live.actions.openMigration();
    await vi.waitFor(
      () => expect(live.meta.hasMigrationTargetsError.value).toBe(true),
      { timeout: 20000 }
    );

    failList = false;
    await live.actions.cancelMigration();
    await live.actions.openMigration();
    await vi.waitFor(
      () => {
        expect(live.meta.hasMigrationTargetsError.value).toBe(false);
        expect(live.context.migrationTargets.value).not.toStrictEqual([]);
      },
      { timeout: 15000 }
    );
  }, 40000);
});

describe("AC-29 — a plan that does not load", () => {
  it("the real watcher closes a fresh configurator that fails too, after a reload", async () => {
    const live = await managerOver(RELOAD);
    await chooseOn(live, RELOAD);
    expect(live.meta.isMigrationTargetUnavailable.value).toBe(true);
    const failed = live.context.migrationConfig.value;

    await live.actions.reloadMigrationTarget();

    await vi.waitFor(() =>
      expect(live.meta.isMigrationTargetUnavailable.value).toBe(true)
    );
    expect(live.context.migrationConfig.value).not.toBeNull();
    expect(live.context.migrationConfig.value).not.toBe(failed);
  });
});

describe("AC-34 — the form field set", () => {
  it("the configurator holds no provision field, though the chosen plan requires one", async () => {
    const live = await managerOver(PROVISION);
    await chooseOn(live, PROVISION);
    const config = liveConfigOf(live);
    const stock = childForm(live);

    expect(some(stock.lookups?.provisionFields ?? [], { required: true })).toBe(
      true
    );
    expect(
      some(scopesOf(stock.uischema), scope =>
        scope.startsWith("#/properties/provisionFields")
      )
    ).toBe(true);

    const schema = config.schema.value as JsonSchema7;
    expect(schema.properties).not.toHaveProperty("provisionFields");
    expect(schema.required ?? []).not.toContain("provisionFields");
    expect(
      filter(scopesOf(config.uischema.value), scope =>
        scope.startsWith("#/properties/provisionFields")
      )
    ).toStrictEqual([]);
  });

  it("the configurator's form is the stock form with the provision fields and the trial choice taken out", async () => {
    const live = await managerOver(PROVISION);
    await chooseOn(live, PROVISION);
    const config = liveConfigOf(live);
    const stock = childForm(live);

    expect(config.schema.value).toStrictEqual(
      omitMigrationSchema(stock.schema)
    );
    expect(config.uischema.value).toStrictEqual(
      omitMigrationUischema(stock.uischema)
    );
  });

  it("a plan that supports a trial gives no startTrial property and no trial control", () => {
    const schema = {
      type: "object",
      properties: { term: { type: "number" }, startTrial: { type: "boolean" } },
      required: ["term", "startTrial"]
    } as JsonSchema7;
    const uischema = {
      type: "VerticalLayout",
      elements: [
        { type: "Terms", scope: "#/properties/term" },
        { type: "Control", scope: "#/properties/startTrial" }
      ]
    } as unknown as UISchemaElement;

    const omitted = omitMigrationSchema(schema);
    expect(omitted?.properties).not.toHaveProperty("startTrial");
    expect(omitted?.required).toStrictEqual(["term"]);
    expect(scopesOf(omitMigrationUischema(uischema))).toStrictEqual([
      "#/properties/term"
    ]);
  });
});

describe("AC-34 — the forced commit", () => {
  it("a reset of the configuration turns the commit off while the cost stays shown, and migrate() then resolves false", async () => {
    const live = await managerOver(CLOSE);
    await chooseOn(live, CLOSE);
    expect(live.meta.isMigrationPreviewed.value).toBe(true);
    expect(live.meta.canCommitMigration.value).toBe(true);
    const sentBefore = wire!.bodies.all().length;

    liveConfigOf(live).reset();

    expect(live.meta.isMigrationPreviewed.value).toBe(true);
    expect(live.meta.canCommitMigration.value).toBe(false);
    await expect(live.actions.migrate()).resolves.toBe(false);
    expect(
      filter(wire!.bodies.all(), ({ method }) => method === "PUT").length
    ).toBe(sentBefore);
    await vi.waitFor(() =>
      expect(live.meta.canCommitMigration.value).toBe(true)
    );
  });

  it("migrate() resolves false before a plan is chosen", async () => {
    const live = await managerOver(CLOSE);
    await openOn(live);

    await expect(live.actions.migrate()).resolves.toBe(false);
    expect(wire!.bodies.all()).toStrictEqual([]);
  });

  it("migrate() sends the configurator a forced UPDATE", async () => {
    const live = await managerOver(CLOSE);
    await chooseOn(live, CLOSE);
    const child = (live.internals.state.value.context as ContractProductContext)
      .migration?.ref as { send: (event: unknown) => void };
    const told = vi.spyOn(child, "send");

    const outcome = live.actions.migrate().catch(() => undefined);

    await vi.waitFor(() =>
      expect(
        some(
          told.mock.calls,
          ([event]) =>
            (event as AnyEventObject)?.type === "UPDATE" && isForced(event)
        )
      ).toBe(true)
    );
    await outcome;
    await vi.waitFor(() => expect(live.meta.isProcessing.value).toBe(false));
  });

  it("a required provision field left empty does not hold the commit back", async () => {
    const live = await managerOver(PROVISION);
    await chooseOn(live, PROVISION);
    expect(childForm(live).model?.provisionFields?.hostname ?? null).toBeNull();

    armStep(PROVISION, 3);
    const result = await live.actions.migrate();

    expect(result).toMatchObject({
      invoiceId: recordedData<IInvoice>(PROVISION, 3, CHANGE).id
    });
    const [commit] = filter(
      await Promise.all(map(wire!.bodies.all(), "body")),
      body => !(body as { dry_run?: boolean }).dry_run
    );
    expect(commit).toBeDefined();
  });
});

describe("AC-34 — one change of plan at a time", () => {
  it("a rebuild of the configurator lets go of the configurator before it", async () => {
    const live = await managerOver(RELOAD);
    const made = await subscriptionsDuring(() => chooseOn(live, RELOAD));
    const failed = childOf(live);
    const bindings = filter(made, { actor: failed });
    expect(bindings).not.toStrictEqual([]);

    armStep(RELOAD, 3);
    await live.actions.reloadMigrationTarget();
    await vi.waitFor(() =>
      expect(live.meta.isMigrationPreviewed.value).toBe(true)
    );

    expect(childOf(live)).not.toBe(failed);
    expect(map(bindings, "unsubscribed")).toStrictEqual(
      map(bindings, () => true)
    );
  });

  it("closing the change of plan lets go of its configurator and empties its holder", async () => {
    const live = await managerOver(CLOSE);
    await openOn(live);
    const made = await subscriptionsDuring(async () => {
      await live.actions.selectMigrationTarget(planIdOf(CLOSE, 2));
      await vi.waitFor(() =>
        expect(live.meta.isMigrationPreviewed.value).toBe(true)
      );
    });
    const bindings = filter(made, { actor: childOf(live) });
    expect(bindings).not.toStrictEqual([]);

    await live.actions.cancelMigration();

    await vi.waitFor(() =>
      expect(live.context.migrationConfig.value).toBeNull()
    );
    expect(map(bindings, "unsubscribed")).toStrictEqual(
      map(bindings, () => true)
    );
  });
});

describe("AC-31 — a commit whose re-read fails", () => {
  it("resolves the result even when the re-read of my product fails after the commit lands", async () => {
    const live = await managerOver(PROVISION);
    await chooseOn(live, PROVISION);

    armStep(PROVISION, 3);
    server.use(http.get("*/contract_products/*", () => HttpResponse.error()));

    const result = await live.actions.migrate();

    expect(result).toMatchObject({
      invoiceId: recordedData<IInvoice>(PROVISION, 3, CHANGE).id
    });
    await vi.waitFor(() =>
      expect(live.context.migrationResult.value?.invoiceId).toBe(
        recordedData<IInvoice>(PROVISION, 3, CHANGE).id
      )
    );
  });
});

describe("AC-29 — a reload clears the error", () => {
  it("clears the manager error when a plan that failed to load loads on a reload", async () => {
    const live = await managerOver(RELOAD);
    await chooseOn(live, RELOAD);
    expect(live.meta.isMigrationTargetUnavailable.value).toBe(true);
    expect(live.meta.hasError.value).toBe(true);

    armStep(RELOAD, 3);
    await live.actions.reloadMigrationTarget();
    await vi.waitFor(() =>
      expect(live.meta.isMigrationPreviewed.value).toBe(true)
    );

    expect(live.meta.hasError.value).toBe(false);
    expect(live.context.error.value).toBeUndefined();
  });
});

describe("AC-34 — the configuration surface", () => {
  const OMITTED = [
    "setTrial",
    "provisionFields",
    "provisionFieldsSchema",
    "setProvisioningFields",
    "getProvisioningField",
    "state",
    "id"
  ] as const;

  it("exposes the Config members only, and none of the provision or trial members", async () => {
    const live = await managerOver(PROVISION);
    await chooseOn(live, PROVISION);
    const config = liveConfigOf(live);

    for (const member of OMITTED) expect(config).not.toHaveProperty(member);
  });

  it("a setConfig that names a trial and provision fields reaches the child's model with neither", async () => {
    const live = await managerOver(PROVISION);
    await chooseOn(live, PROVISION);
    const config = liveConfigOf(live);
    const child = childOf(live) as {
      getSnapshot: () => { context: ProductConfigContext };
    };

    config.setConfig({
      startTrial: true,
      provisionFields: { hostname: "migrate.example" }
    });

    // a settle window: the omitted fields never land, so there is no positive
    // edge to wait on — only time proves the forward dropped them.
    await new Promise(resolve => setTimeout(resolve, 800));

    const model = child.getSnapshot().context.model as {
      startTrial?: boolean;
      provisionFields?: Record<string, unknown>;
    };
    expect(model.startTrial ?? false).toBe(false);
    expect((model.provisionFields ?? {}).hostname ?? null).toBeNull();
    expect(JSON.stringify(model)).not.toContain("migrate.example");
  });
});

// -----------------------------------------------------------------------------

const machineModel = (productId: string, options = {}): ProductModel => ({
  productId,
  quantity: 1,
  term: SOURCE.billing_cycle_months,
  options,
  attributes: {}
});

type WireOption = { id: string; category_id: string };

/** The plan's options, as staging loaded them: its default and the other one. */
const [SMALL, LARGE] = (
  SOURCE_PLAN as unknown as { products_options: WireOption[] }
).products_options;

const choosing = (option: WireOption) => ({
  [option.category_id]: {
    [option.id]: { productId: option.id, cycle: 1, quantity: 1 }
  }
});

const MODEL = machineModel(SOURCE_PLAN.id, choosing(SMALL));
const OTHER_MODEL = machineModel(SOURCE_PLAN.id, choosing(LARGE));

/** A request service the test settles by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type Manager = Interpreter<
  ContractProductContext,
  StateSchema<ContractProductContext>,
  AnyEventObject
>;

const running: Manager[] = [];

afterEach(() => {
  for (const service of running.splice(0)) service.stop();
  resetContractProductScopes();
});

/**
 * The real manager machine over the recorded source product. `previewMigration`
 * and `migrate` answer through the given functions. The child's failure
 * watcher is quiet, because each test says when the child fails; the
 * composable cases below run the real watcher.
 */
async function managerMachine(
  services: {
    previewMigration?: () => Promise<IInvoice>;
    migrate?: () => Promise<IInvoice | undefined>;
  } = {},
  guards: Record<string, () => boolean> = {}
) {
  await seedClientSession();
  const previewMigration = vi.fn(
    services.previewMigration ?? (() => Promise.resolve(UNPAID))
  );
  const migrate = vi.fn(services.migrate ?? (() => Promise.resolve(PAID)));
  const service = interpret(
    contractProductMachine
      .withConfig({
        services: {
          load: async () => ({ record: SOURCE, lookups: {} }),
          previewMigration,
          migrate,
          watchMigrationTarget: () => () => undefined
        } as never,
        guards: guards as never
      })
      .withContext({
        scopeActor: ScopeActorTypes.CLIENT,
        contractProductId: SOURCE.id
      } as ContractProductContext)
  ) as unknown as Manager;
  running.push(service);
  service.start();
  await vi.waitFor(() =>
    expect(service.getSnapshot().matches("available")).toBe(true)
  );
  return { service, previewMigration, migrate };
}

const region = (service: Manager) =>
  (service.getSnapshot().value as { available?: { migrating?: unknown } })
    .available?.migrating;
const machineContext = (service: Manager) => service.getSnapshot().context;

/** Opens the change of plan and chooses `plan`. */
function choose(service: Manager, plan: IProduct = SOURCE_PLAN): void {
  service.send({ type: "MIGRATION" });
  service.send({
    type: "MIGRATION.SELECT",
    data: { id: plan.id, product: { id: plan.id } }
  });
}

const changed = (service: Manager, next: ProductModel = MODEL) =>
  service.send({
    type: "MIGRATION.CHANGED",
    data: { model: next, rawProduct: SOURCE_PLAN }
  });

const committed = (service: Manager, next: ProductModel = MODEL) =>
  service.send({
    type: "MIGRATION.COMMIT",
    data: { model: next, rawProduct: SOURCE_PLAN }
  });

const settledOn = (service: Manager, leaf: string) =>
  vi.waitFor(() =>
    expect(region(service)).toStrictEqual({ configuring: leaf })
  );

describe("AC-30 — an equal configuration", () => {
  it("prices a new model once, and prices nothing for a model equal to the one priced", async () => {
    const { service, previewMigration } = await managerMachine();
    choose(service);
    changed(service);
    await settledOn(service, "previewed");

    changed(service, { ...MODEL });
    expect(region(service)).toStrictEqual({ configuring: "previewed" });
    expect(previewMigration).toHaveBeenCalledTimes(1);

    changed(service, OTHER_MODEL);
    await settledOn(service, "previewed");
    expect(previewMigration).toHaveBeenCalledTimes(2);
    expect(isEqual(machineContext(service).migration?.model, OTHER_MODEL)).toBe(
      true
    );
  });
});

describe("AC-30 — the preview", () => {
  it("clears the cost of the model before while the new model is priced", async () => {
    const second = deferred<IInvoice>();
    let calls = 0;
    const { service } = await managerMachine({
      previewMigration: () =>
        ++calls === 1 ? Promise.resolve(UNPAID) : second.promise
    });
    choose(service);
    changed(service);
    await settledOn(service, "previewed");
    expect(machineContext(service).migration?.preview?.total).toBe(
      mapMigrationPreview(UNPAID).total
    );

    changed(service, OTHER_MODEL);
    expect(region(service)).toStrictEqual({ configuring: "previewing" });
    expect(machineContext(service).migration?.preview).toBeUndefined();

    second.resolve(PAID);
    await settledOn(service, "previewed");
    expect(machineContext(service).migration?.preview?.total).toBe(
      mapMigrationPreview(PAID).total
    );
  });

  it("shows no cost and no error when the platform refuses to price the new model", async () => {
    let calls = 0;
    const { service } = await managerMachine({
      previewMigration: () =>
        ++calls === 1
          ? Promise.resolve(UNPAID)
          : Promise.reject(new Error("refused"))
    });
    choose(service);
    changed(service);
    await settledOn(service, "previewed");

    changed(service, OTHER_MODEL);
    await settledOn(service, "unpreviewed");
    expect(machineContext(service).migration?.preview).toBeUndefined();
    expect(machineContext(service).error).toBeUndefined();
  });

  it("after a refused commit, a new model the platform refuses to price shows no cost", async () => {
    let calls = 0;
    const { service } = await managerMachine(
      {
        previewMigration: () =>
          ++calls === 1
            ? Promise.resolve(UNPAID)
            : Promise.reject(new Error("refused")),
        migrate: () => Promise.reject(new Error("refused"))
      },
      { isMigrationTargetReady: () => true }
    );
    choose(service);
    changed(service);
    await settledOn(service, "previewed");
    service.send({ type: "MIGRATE" });
    committed(service);
    await settledOn(service, "error");

    changed(service, OTHER_MODEL);

    await settledOn(service, "unpreviewed");
    expect(machineContext(service).migration?.preview).toBeUndefined();
  });
});

describe("AC-30 — a cost that cannot be priced", () => {
  it("a first dry run the platform refuses leaves the change open with no cost", async () => {
    const { service } = await managerMachine({
      previewMigration: () => Promise.reject(new Error("refused"))
    });
    choose(service);
    changed(service);

    await settledOn(service, "unpreviewed");
    expect(machineContext(service).migration?.preview).toBeUndefined();
    expect(machineContext(service).error).toBeUndefined();
    expect(machineContext(service).migration?.target?.id).toBe(SOURCE_PLAN.id);
  });
});

describe("AC-29 — a plan that does not load", () => {
  it("a child failure closes the configuration on unavailable, and a reload starts a fresh configurator", async () => {
    const { service } = await managerMachine();
    choose(service);
    const failed = machineContext(service).migration?.ref;

    service.send({ type: "MIGRATION.UNAVAILABLE", data: new Error("gone") });
    expect(region(service)).toStrictEqual({ configuring: "unavailable" });

    service.send({ type: "MIGRATION.RELOAD" });
    expect(region(service)).toStrictEqual({ configuring: "loading" });
    const fresh = machineContext(service).migration?.ref;
    expect(fresh).toBeDefined();
    expect(fresh).not.toBe(failed);
    expect(machineContext(service).migration?.target?.id).toBe(SOURCE_PLAN.id);
    expect((failed as unknown as { status: number }).status).toBe(2);
  });
});

describe("AC-34 — one change of plan at a time", () => {
  it("closing the change of plan stops its configurator and empties the slot", async () => {
    const { service } = await managerMachine();
    choose(service);
    changed(service);
    await settledOn(service, "previewed");
    const child = machineContext(service).migration?.ref;

    service.send({ type: "CANCEL.MIGRATION" });

    expect(region(service)).toBe("idle");
    expect(machineContext(service).migration?.ref).toBeUndefined();
    expect(machineContext(service).migration?.target).toBeUndefined();
    expect(machineContext(service).migration?.preview).toBeUndefined();
    expect((child as unknown as { status: number }).status).toBe(2);
  });

  it("a second choice while one plan is configured is refused", async () => {
    const { service } = await managerMachine();
    choose(service);
    const child = machineContext(service).migration?.ref;

    service.send({
      type: "MIGRATION.SELECT",
      data: { id: SAME_PRICE_PLAN.id, product: { id: SAME_PRICE_PLAN.id } }
    });

    expect(machineContext(service).migration?.ref).toBe(child);
    expect(machineContext(service).migration?.target?.id).toBe(SOURCE_PLAN.id);
  });
});

describe("AC-34 — the forced commit", () => {
  it("a commit is refused while the configurator is not ready", async () => {
    const { service, migrate } = await managerMachine();
    choose(service);
    changed(service);
    await settledOn(service, "previewed");

    service.send({ type: "MIGRATE" });

    expect(region(service)).toStrictEqual({ configuring: "previewed" });
    expect(migrate).not.toHaveBeenCalled();
  });
});

describe("AC-31 — a commit in flight", () => {
  it("a close, a child failure and a refresh leave a commit in flight to land its invoice", async () => {
    const commit = deferred<IInvoice | undefined>();
    const { service, migrate } = await managerMachine(
      { migrate: () => commit.promise },
      { isMigrationTargetReady: () => true }
    );
    choose(service);
    changed(service);
    await settledOn(service, "previewed");

    service.send({ type: "MIGRATE" });
    committed(service);
    await vi.waitFor(() => expect(migrate).toHaveBeenCalledTimes(1));

    for (const type of ["CANCEL.MIGRATION", "MIGRATION.UNAVAILABLE", "REFRESH"])
      service.send({ type });
    expect(region(service)).toStrictEqual({
      configuring: { processing: "sending" }
    });

    commit.resolve(UNPAID);
    await vi.waitFor(() => expect(region(service)).toBe("idle"));
    expect(machineContext(service).migrationResult?.invoiceId).toBe(UNPAID.id);
    expect(migrate).toHaveBeenCalledTimes(1);
  });
});

describe("AC-31 — the invoice of a commit", () => {
  it("outlives the re-read of my product, and is cleared when the change of plan opens again", async () => {
    const { service } = await managerMachine(
      {},
      { isMigrationTargetReady: () => true }
    );
    choose(service);
    changed(service);
    await settledOn(service, "previewed");
    service.send({ type: "MIGRATE" });
    committed(service);

    await vi.waitFor(() => expect(region(service)).toBe("idle"));
    expect(machineContext(service).migration?.ref).toBeUndefined();
    expect(machineContext(service).migrationResult?.invoiceId).toBe(PAID.id);

    service.send({ type: "MIGRATION" });
    expect(region(service)).toBe("choosing");
    expect(machineContext(service).migrationResult ?? null).toBeNull();
  });
});
