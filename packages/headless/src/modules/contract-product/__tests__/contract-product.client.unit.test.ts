// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview contract-product lifecycle writes — the rules (unit)
 *
 * ## Job To Be Done
 * Pin the rules a client's five lifecycle writes rest on, each against a
 * staging recording of the product it applies to: the renewal invoicing gates,
 * the next invoice gate and its late reading, the trial gate, the label gate,
 * the billing entity gate, picker and pick, the composite every gate and guard
 * shares (placed, no region write in flight, the record), the invoice that
 * survives the re-read, and the error copy of a refused write.
 *
 * Where a rule needs a fact no recording carries — a plan that is silent on
 * stopping renewal invoicing, a staged import — the fact is a literal argument
 * over a recorded product, never a served fixture.
 *
 * ## What Breaks If These Fail
 * A client is offered a write the platform refuses, or kept from one it
 * allows; a write goes out while a cancellation, consolidation, billing-entity
 * or change-of-plan write is in flight; a pick goes out with the wrong address
 * or company; a pick of what the subscription already bills to is sent; the
 * invoice a write raised is lost to the re-read; or a refused write carries no
 * error copy.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { State, interpret } from "xstate";
import {
  replayStep,
  startScenarioReplay
} from "@upmind-automation/test-fixtures/replay-server";
import {
  ContractStatusCodes,
  TrialEndActionTypes
} from "@upmind-automation/types";
import { mapContractProduct, useContractProduct } from "..";
import { observeRequestBodies } from "../../../__tests__/criteria-int-kit";
import { ScopeActorTypes } from "../../scope/scope.types";
import { contractProductMachine } from "../contract-product.machine";
import { isNextInvoiceDateInFuture } from "../contract-product.utils";
import { createContractProductMeta } from "../useContractProduct.meta";
import {
  armBootStep,
  resetContractProductScopes,
  seedClientSession
} from "./contract-product.int-helpers";
import billsToAddressRecording from "./scenarios/change-what-my-subscription-bills-to-an-address/02/get-contract-products-id.json";
import billsToCompanyRecording from "./scenarios/change-what-my-subscription-bills-to-one-of-my-companies/02/get-contract-products-id.json";
import addressPickRereadRecording from "./scenarios/change-what-my-subscription-bills-to-one-of-my-companies/03/get-contract-products-id.json";
import addressPickRecording from "./scenarios/change-what-my-subscription-bills-to-one-of-my-companies/03/put-contracts-id-address-company-vat.json";
import creditNoteRecording from "./scenarios/end-the-trial-of-my-product-early-cancelling/03/post-contracts-id-products-id-trial-end-action-manual.json";
import trialEndInvoiceRecording from "./scenarios/end-the-trial-of-my-product-early-continuing/03/post-contracts-id-products-id-trial-end-action-manual.json";
import noNextInvoiceRecording from "./scenarios/i-am-not-offered-a-next-invoice-that-the-platform-cannot-raise/02/get-contract-products-id.json";
import cancelledOffRecording from "./scenarios/i-am-not-offered-a-renewal-invoicing-change-that-legacy-does-not-offer-a-cancelled-subscription-whose-renewal-invoicing-is-off/02/get-contract-products-id.json";
import trialOnRecording from "./scenarios/i-am-not-offered-a-renewal-invoicing-change-that-legacy-does-not-offer-a-subscription-in-trial-whose-renewal-invoicing-is-on/02/get-contract-products-id.json";
import expiresRecording from "./scenarios/i-am-not-offered-a-renewal-invoicing-change-that-legacy-does-not-offer-a-subscription-that-expires-at-the-end-of-its-term/02/get-contract-products-id.json";
import forbidsRecording from "./scenarios/i-am-not-offered-a-renewal-invoicing-change-that-legacy-does-not-offer-a-subscription-whose-product-forbids-stopping-renewal-invoicing/02/get-contract-products-id.json";
import cancellingTrialRecording from "./scenarios/i-am-told-how-the-trial-of-my-product-ends-cancelling/02/get-contract-products-id.json";
import continuingTrialRecording from "./scenarios/i-am-told-how-the-trial-of-my-product-ends-continuing/02/get-contract-products-id.json";
import awaitingTrialRecording from "./scenarios/i-cannot-end-a-trial-that-waits-for-activation/02/get-contract-products-id.json";
import nextInvoiceRecording from "./scenarios/issue-the-next-invoice-of-my-subscription-now/02/get-contract-products-id.json";
import raisedInvoiceRecording from "./scenarios/issue-the-next-invoice-of-my-subscription-now/03/post-contracts-id-products-id-recurring.json";
import oneOffRecording from "./scenarios/know-whether-a-product-still-invoices-its-own-renewal-off/02/get-contract-products-id.json";
import cancelledRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-cancelled/02/get-contract-products-id.json";
import lapsedRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-lapsed/02/get-contract-products-id.json";
import pendingRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-pending/02/get-contract-products-id.json";
import invoicingOffRecording from "./scenarios/turn-the-renewal-invoicing-of-my-subscription-off-or-on-off/02/get-contract-products-id.json";
import invoicingOnRecording from "./scenarios/turn-the-renewal-invoicing-of-my-subscription-off-or-on-on/02/get-contract-products-id.json";
import { server } from "./setup.integration";
import type {
  ContractProductContext,
  ContractProductMachineServices
} from "../contract-product.types";
import type {
  IContractProduct,
  IInvoice,
  IProduct
} from "@upmind-automation/types";
import type { AnyEventObject, StateValue } from "xstate";

// -----------------------------------------------------------------------------

const recorded = <T>(recording: unknown): T =>
  (recording as { response: { body: { data: T } } }).response.body.data;

const ACTIVE_ON = recorded<IContractProduct>(invoicingOnRecording);
const INVOICING_OFF = recorded<IContractProduct>(invoicingOffRecording);
const FORBIDS = recorded<IContractProduct>(forbidsRecording);
const NEXT = recorded<IContractProduct>(nextInvoiceRecording);
const NO_NEXT = recorded<IContractProduct>(noNextInvoiceRecording);
const TRIAL_CONTINUING = recorded<IContractProduct>(continuingTrialRecording);
const TRIAL_CANCELLING = recorded<IContractProduct>(cancellingTrialRecording);
const TRIAL_AWAITING = recorded<IContractProduct>(awaitingTrialRecording);
const TRIAL_INVOICING_ON = recorded<IContractProduct>(trialOnRecording);
const EXPIRES = recorded<IContractProduct>(expiresRecording);
const BILLS_TO_ADDRESS = recorded<IContractProduct>(billsToAddressRecording);
const BILLS_TO_COMPANY = recorded<IContractProduct>(billsToCompanyRecording);
const CANCELLED_OFF = recorded<IContractProduct>(cancelledOffRecording);
const ONE_OFF = recorded<IContractProduct>(oneOffRecording);
const PENDING = recorded<IContractProduct>(pendingRecording);
const CANCELLED = recorded<IContractProduct>(cancelledRecording);
const CLOSED = recorded<IContractProduct>(lapsedRecording);

/** A recorded product with one wire fact set — the literal argument of a rule no recording holds. */
const withWireFact = (
  raw: IContractProduct,
  patch: Partial<IContractProduct>
): IContractProduct => ({ ...raw, ...patch });

const withCatalogue = (
  raw: IContractProduct,
  patch: Partial<IProduct>
): IContractProduct =>
  withWireFact(raw, { product: { ...raw.product, ...patch } as IProduct });

const contextOf = (raw: IContractProduct): ContractProductContext => ({
  scopeActor: ScopeActorTypes.CLIENT,
  contractProductId: raw.id,
  contractId: raw.contract_id,
  contractProduct: mapContractProduct(raw)
});

const noHolders = () =>
  ({
    count: { value: null },
    list: { value: null },
    config: { value: null },
    isMigrationTargetReady: { value: false },
    dispose: () => undefined
  }) as never;

type NodeValue = StateValue;

const metaAt = (node: NodeValue, context: Partial<ContractProductContext>) =>
  createContractProductMeta(
    ScopeActorTypes.CLIENT,
    {
      id: "contract-product",
      state: ref(State.from(node, context as ContractProductContext)),
      send: vi.fn(),
      service: {} as never
    } as never,
    noHolders()
  );

const IDLE_REGIONS = {
  status: "active",
  setup: "complete",
  trial: "none",
  cancelling: "idle",
  migrating: "idle",
  consolidating: "idle",
  billingEntity: "idle"
};

const AVAILABLE: NodeValue = { available: IDLE_REGIONS };

/** The `unavailable` node on one status child, with its billing region idle. */
const unavailableAt = (status: string): NodeValue => ({
  unavailable: { status, billingEntity: "idle" }
});

/** The `available` node with one form region in the write the platform has not answered yet. */
const REGION_WRITES: Record<string, NodeValue> = {
  "available.cancelling.processing": {
    available: {
      ...IDLE_REGIONS,
      cancelling: { processing: { stoppingRenewal: "validating" } }
    }
  },
  "available.consolidating.processing": {
    available: {
      ...IDLE_REGIONS,
      consolidating: { processing: { settingConsolidation: "validating" } }
    }
  },
  "available.billingEntity.processing": {
    available: { ...IDLE_REGIONS, billingEntity: "processing" }
  },
  "available.migrating.configuring.processing": {
    available: {
      ...IDLE_REGIONS,
      migrating: { configuring: { processing: "sending" } }
    }
  }
};

const GATES = [
  ["canDisableAutoRenew", ACTIVE_ON],
  ["canEnableAutoRenew", INVOICING_OFF],
  ["canIssueNextInvoice", NEXT],
  ["canEndTrial", TRIAL_CONTINUING],
  ["canUpdateContractProduct", ACTIVE_ON],
  ["canSetBillingEntity", ACTIVE_ON]
] as const;

type GateName = (typeof GATES)[number][0];

const gate = (
  name: GateName,
  node: NodeValue,
  context: Partial<ContractProductContext>
): boolean => metaAt(node, context)[name].value;

const open = (name: GateName, raw: IContractProduct): boolean =>
  gate(name, AVAILABLE, contextOf(raw));

const transition = (
  node: NodeValue,
  raw: IContractProduct,
  event: AnyEventObject
) =>
  contractProductMachine.transition(
    contractProductMachine.resolveState(
      State.from<ContractProductContext, AnyEventObject>(node, contextOf(raw))
    ),
    event
  );

// -----------------------------------------------------------------------------

describe("AC-36 — canDisableAutoRenew", () => {
  it("is open on a subscription that invoices its renewal and whose product permits stopping it", () => {
    expect(open("canDisableAutoRenew", ACTIVE_ON)).toBe(true);
  });

  it("is closed for a product that is not a subscription", () => {
    expect(
      open(
        "canDisableAutoRenew",
        withWireFact(ACTIVE_ON, { billing_cycle_months: 0 })
      )
    ).toBe(false);
  });

  it("is closed while the renewal invoicing is already off", () => {
    expect(open("canDisableAutoRenew", INVOICING_OFF)).toBe(false);
  });

  it("is closed for a product that forbids stopping renewal invoicing", () => {
    expect(open("canDisableAutoRenew", FORBIDS)).toBe(false);
  });

  it("is open when the product carries no permission at all", () => {
    const silent = withCatalogue(ACTIVE_ON, {
      can_disable_auto_create_renew_invoice: undefined
    });

    expect(open("canDisableAutoRenew", silent)).toBe(true);
  });

  for (const [code, raw] of [
    [ContractStatusCodes.PENDING, PENDING],
    [ContractStatusCodes.CANCELLED, CANCELLED],
    [ContractStatusCodes.CLOSED, CLOSED]
  ] as const)
    it(`is closed for a product whose record is ${code}, though it invoices its renewal`, () => {
      expect(raw.status?.code).toBe(code);
      expect(raw.auto_create_renew_invoice).toBe(true);
      expect(open("canDisableAutoRenew", raw)).toBe(false);
    });

  it("is closed during a trial, though it invoices its renewal", () => {
    expect(TRIAL_INVOICING_ON.in_trial).toBe(true);
    expect(TRIAL_INVOICING_ON.auto_create_renew_invoice).toBe(true);
    expect(open("canDisableAutoRenew", TRIAL_INVOICING_ON)).toBe(false);
  });

  it("is closed for a subscription set to expire at the end of its term", () => {
    expect(
      open("canDisableAutoRenew", withWireFact(ACTIVE_ON, { renew: false }))
    ).toBe(false);
  });
});

describe("AC-36 — canEnableAutoRenew", () => {
  it("is open on a subscription whose renewal invoicing is off", () => {
    expect(open("canEnableAutoRenew", INVOICING_OFF)).toBe(true);
  });

  it("is closed for a one-time purchase whose renewal invoicing is off", () => {
    expect(ONE_OFF.billing_cycle_months).toBe(0);
    expect(ONE_OFF.auto_create_renew_invoice).toBe(false);
    expect(open("canEnableAutoRenew", ONE_OFF)).toBe(false);
  });

  it("is closed while the renewal invoicing is on", () => {
    expect(open("canEnableAutoRenew", ACTIVE_ON)).toBe(false);
  });

  it("is closed for a cancelled subscription whose renewal invoicing is off", () => {
    expect(CANCELLED_OFF.status?.code).toBe(ContractStatusCodes.CANCELLED);
    expect(open("canEnableAutoRenew", CANCELLED_OFF)).toBe(false);
  });

  for (const code of [ContractStatusCodes.PENDING, ContractStatusCodes.CLOSED])
    it(`is closed for a product whose record is ${code}`, () => {
      const status = { ...INVOICING_OFF.status, code };

      expect(
        open(
          "canEnableAutoRenew",
          withWireFact(INVOICING_OFF, {
            status: status as IContractProduct["status"]
          })
        )
      ).toBe(false);
    });

  it("is closed for a subscription set to expire at the end of its term", () => {
    expect(EXPIRES.renew).toBe(false);
    expect(EXPIRES.auto_create_renew_invoice).toBe(false);
    expect(open("canEnableAutoRenew", EXPIRES)).toBe(false);
  });
});

describe("AC-36 — the record, not the node", () => {
  const staged = unavailableAt("staged") as NodeValue;
  const asked = (raw: IContractProduct, on: boolean) =>
    transition(staged, raw, {
      type: "AUTO_RENEW.SET",
      data: { on }
    }).matches("processing.settingAutoRenew");

  it("a staged product whose record is pending is refused", () => {
    expect(gate("canDisableAutoRenew", staged, contextOf(PENDING))).toBe(false);
  });

  it("a product on the pending node whose record is active is accepted", () => {
    const pendingNode = {
      available: { ...IDLE_REGIONS, status: "pending" }
    } as NodeValue;

    expect(gate("canDisableAutoRenew", pendingNode, contextOf(ACTIVE_ON))).toBe(
      true
    );
  });

  it("the machine refuses a write for a staged product whose record is pending, and sends it for one whose record is active", () => {
    const pendingOff = withWireFact(INVOICING_OFF, {
      status: {
        ...INVOICING_OFF.status,
        code: ContractStatusCodes.PENDING
      } as IContractProduct["status"]
    });

    expect(asked(PENDING, false)).toBe(false);
    expect(asked(pendingOff, true)).toBe(false);
    expect(asked(ACTIVE_ON, false)).toBe(true);
    expect(asked(INVOICING_OFF, true)).toBe(true);
  });

  it("a staged product whose record is active is accepted", () => {
    expect(gate("canDisableAutoRenew", staged, contextOf(ACTIVE_ON))).toBe(
      true
    );
  });
});

describe("AC-37 — canIssueNextInvoice", () => {
  it("is open on a subscription the platform lets raise its next invoice", () => {
    expect(NEXT.can_create_next_invoice).toBe(true);
    expect(open("canIssueNextInvoice", NEXT)).toBe(true);
  });

  it("is closed for a product that is not a subscription", () => {
    expect(
      open(
        "canIssueNextInvoice",
        withWireFact(NEXT, { billing_cycle_months: 0 })
      )
    ).toBe(false);
  });

  it("is closed for a staged import", () => {
    expect(
      open("canIssueNextInvoice", withWireFact(NEXT, { staged_import: true }))
    ).toBe(false);
  });

  it("is closed on the staged node of a staged import", () => {
    const stagedImport = contextOf(withWireFact(NEXT, { staged_import: true }));

    expect(
      gate("canIssueNextInvoice", unavailableAt("staged"), stagedImport)
    ).toBe(false);
  });

  it("is closed while the platform says it cannot raise the invoice", () => {
    expect(NO_NEXT.can_create_next_invoice).toBe(false);
    expect(open("canIssueNextInvoice", NO_NEXT)).toBe(false);
  });
});

describe("AC-38 — isNextInvoiceDateInFuture", () => {
  const at = (iso: string) => vi.useFakeTimers({ now: new Date(iso) });
  const dated = (nextInvoiceDate: string | null) =>
    mapContractProduct(
      withWireFact(NEXT, { next_invoice_date: nextInvoiceDate })
    );

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("reads a date of today (UTC) as in the future until UTC midnight", () => {
    at("2026-10-06T23:30:00Z");

    expect(isNextInvoiceDateInFuture(dated("2026-10-06"))).toBe(true);
  });

  it("reads yesterday (UTC) as not in the future", () => {
    at("2026-10-06T00:30:00Z");

    expect(isNextInvoiceDateInFuture(dated("2026-10-05"))).toBe(false);
  });

  it("reads tomorrow as in the future", () => {
    at("2026-10-06T12:00:00Z");

    expect(isNextInvoiceDateInFuture(dated("2026-10-07"))).toBe(true);
  });

  it("reads an absent date as not in the future", () => {
    at("2026-10-06T12:00:00Z");

    expect(NO_NEXT.next_invoice_date).toBeNull();
    expect(isNextInvoiceDateInFuture(mapContractProduct(NO_NEXT))).toBe(false);
  });

  it("reads the UTC day, whatever the clock of the machine says", () => {
    vi.stubEnv("TZ", "Etc/GMT-2");
    at("2026-10-06T23:30:00Z");

    expect(isNextInvoiceDateInFuture(dated("2026-10-06"))).toBe(true);
  });
});

describe("AC-39 — canEndTrial", () => {
  it("is open on a product in trial", () => {
    expect(TRIAL_CONTINUING.in_trial).toBe(true);
    expect(open("canEndTrial", TRIAL_CONTINUING)).toBe(true);
  });

  it("is closed on a product that is not in trial", () => {
    expect(open("canEndTrial", ACTIVE_ON)).toBe(false);
  });

  it("is closed while the product waits for activation", () => {
    expect(TRIAL_AWAITING.status?.code).toBe(
      ContractStatusCodes.AWAITING_ACTIVATION
    );
    expect(open("canEndTrial", TRIAL_AWAITING)).toBe(false);
  });

  it("is open on a trial that ends by cancelling", () => {
    expect(TRIAL_CANCELLING.trial_end_action).toBe(TrialEndActionTypes.CANCEL);
    expect(open("canEndTrial", TRIAL_CANCELLING)).toBe(true);
  });

  it("is open on the staged node", () => {
    expect(
      gate("canEndTrial", unavailableAt("staged"), contextOf(TRIAL_CONTINUING))
    ).toBe(true);
  });
});

describe("AC-40 — canUpdateContractProduct", () => {
  const withProduct = contextOf(ACTIVE_ON);
  const sends = (node: NodeValue) =>
    transition(node, ACTIVE_ON, {
      type: "LABEL.SET",
      data: { label: "Web box" }
    }).matches("processing.settingClientLabel");

  it("is closed before a product is loaded", () => {
    expect(
      gate("canUpdateContractProduct", AVAILABLE, {
        ...withProduct,
        contractProduct: undefined
      })
    ).toBe(false);
  });

  it("is open on available and on each unavailable child", () => {
    for (const node of [
      AVAILABLE,
      unavailableAt("staged"),
      unavailableAt("cancelled"),
      unavailableAt("lapsed"),
      unavailableAt("fraud")
    ] as NodeValue[])
      expect(gate("canUpdateContractProduct", node, withProduct)).toBe(true);
  });

  it("is closed while the product is read again, and a label sent then goes nowhere", () => {
    expect(gate("canUpdateContractProduct", "loading", withProduct)).toBe(
      false
    );
    expect(sends("loading")).toBe(false);
  });

  it("is closed when the re-read failed and the product stays on context, and a label sent then goes nowhere", () => {
    expect(gate("canUpdateContractProduct", "error", withProduct)).toBe(false);
    expect(sends("error")).toBe(false);
  });

  it("sends the label from available", () => {
    expect(sends(AVAILABLE)).toBe(true);
  });
});

describe("AC-41 — canSetBillingEntity", () => {
  it("is open on a subscription", () => {
    expect(open("canSetBillingEntity", ACTIVE_ON)).toBe(true);
  });

  it("is closed on a one-time purchase", () => {
    expect(ONE_OFF.billing_cycle_months).toBe(0);
    expect(open("canSetBillingEntity", ONE_OFF)).toBe(false);
  });
});

// -----------------------------------------------------------------------------

describe("AC-44 — a gate is closed while no write is offered", () => {
  const notPlaced: [string, NodeValue][] = [
    ["loading", "loading"],
    ["processing", { processing: "settingAutoRenew" }],
    ["error", "error"],
    ...Object.entries(REGION_WRITES)
  ];

  for (const [name, record] of GATES)
    describe(name, () => {
      it("is open on available, where the record allows it", () => {
        expect(open(name, record)).toBe(true);
      });

      for (const [label, node] of notPlaced)
        it(`is closed on ${label}, though the record allows it`, () => {
          expect(gate(name, node, contextOf(record))).toBe(false);
        });
    });
});

describe("AC-44 — a write in flight", () => {
  const events: [AnyEventObject, IContractProduct, string][] = [
    [
      { type: "AUTO_RENEW.SET", data: { on: false } },
      ACTIVE_ON,
      "settingAutoRenew"
    ],
    [{ type: "NEXT_INVOICE.ISSUE" }, NEXT, "issuingNextInvoice"],
    [{ type: "TRIAL.END" }, TRIAL_CONTINUING, "endingTrial"],
    [
      { type: "LABEL.SET", data: { label: "Web box" } },
      ACTIVE_ON,
      "settingClientLabel"
    ]
  ];

  for (const [event, record, target] of events)
    describe(event.type, () => {
      it(`starts ${target} from available`, () => {
        expect(
          transition(AVAILABLE, record, event).matches(`processing.${target}`)
        ).toBe(true);
      });

      for (const [region, node] of Object.entries(REGION_WRITES))
        it(`is refused while ${region} is active`, () => {
          const next = transition(node, record, event);

          expect(next.matches("available")).toBe(true);
          expect(next.matches("processing")).toBe(false);
        });
    });
});

// -----------------------------------------------------------------------------

const running: { stop: () => void }[] = [];

afterEach(() => {
  for (const service of running.splice(0)) service.stop();
  resetContractProductScopes();
});

const RAISED = recorded<IInvoice>(raisedInvoiceRecording);
const TRIAL_END_RAISED = recorded<IInvoice>(trialEndInvoiceRecording);
const CREDIT_NOTE = recorded<IInvoice>(creditNoteRecording);

type InvoiceWrites = Partial<
  Pick<ContractProductMachineServices, "issueNextInvoice" | "endTrial">
>;

/**
 * The real manager machine over a recorded product, whose read answers with
 * that product mapped. The two invoice writes answer through the given
 * functions, which give recorded invoices.
 */
async function managerMachine(record: IContractProduct, writes: InvoiceWrites) {
  await seedClientSession();
  const service = interpret(
    contractProductMachine
      .withConfig({
        services: {
          load: async () => mapContractProduct(record),
          ...writes
        }
      })
      .withContext({
        scopeActor: ScopeActorTypes.CLIENT,
        contractProductId: record.id
      })
  );
  running.push(service);
  service.start();
  await vi.waitFor(() =>
    expect(service.getSnapshot().matches("available")).toBe(true)
  );
  return service;
}

type Manager = Awaited<ReturnType<typeof managerMachine>>;

const issued = (service: Manager) =>
  service.getSnapshot().context.issuedInvoice;

const settled = (service: Manager) =>
  vi.waitFor(() =>
    expect(service.getSnapshot().matches("available")).toBe(true)
  );

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
};

const SCENARIOS = join(import.meta.dirname, "scenarios");
const scenarioStep = (slug: string, step: number) =>
  join(SCENARIOS, slug, String(step).padStart(2, "0"));

const NEXT_SCENARIO = "issue-the-next-invoice-of-my-subscription-now";
const PICKER_SCENARIO =
  "change-what-my-subscription-bills-to-one-of-my-companies";
const ADDRESS_SCENARIO = "change-what-my-subscription-bills-to-an-address";
const SAME_PICK_SCENARIO =
  "picking-what-my-subscription-already-bills-to-sends-nothing";
const ONE_OFF_SCENARIO =
  "know-whether-a-product-still-invoices-its-own-renewal-off";

type Wire = {
  replay: ReturnType<typeof startScenarioReplay>;
  bodies: ReturnType<typeof observeRequestBodies>;
};

let wire: Wire | undefined;

afterEach(() => {
  if (!wire) return;
  const { replay, bodies } = wire;
  wire = undefined;
  bodies.stop();
  expect(replay.gaps()).toStrictEqual([]);
});

/**
 * The real `useContractProduct` on the product the scenario `slug` recorded,
 * booted on its recorded session, with its Given's reads armed. A request no
 * armed step recorded fails the test.
 */
async function managerOver(slug: string) {
  wire = {
    replay: startScenarioReplay(server),
    bodies: observeRequestBodies(server, "/api/")
  };
  armBootStep(scenarioStep(slug, 1));
  await seedClientSession();
  replayStep(server, scenarioStep(slug, 2));
  const product = JSON.parse(
    readFileSync(
      join(scenarioStep(slug, 2), "get-contract-products-id.json"),
      "utf-8"
    )
  ) as { response: { body: { data: IContractProduct } } };
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(product.response.body.data.id);
  await manager.useActions().isReady();
  return manager;
}

type LiveManager = Awaited<ReturnType<typeof managerOver>>;

const sent = (method: string) =>
  Promise.all(
    (wire?.bodies.all() ?? [])
      .filter(request => request.method === method)
      .map(request => request.body)
  );

const listReads = () =>
  (wire?.bodies.all() ?? []).filter(
    request =>
      request.method === "GET" &&
      ["/addresses", "/companies"].some(list =>
        new URL(request.url).pathname.endsWith(list)
      )
  );

describe("AC-44 — the invoice survives the re-read", () => {
  it("stays after the product is read again, and after a refresh", async () => {
    const manager = await managerOver(NEXT_SCENARIO);
    replayStep(server, scenarioStep(NEXT_SCENARIO, 3));

    const invoice = await manager.useActions().issueNextInvoice();

    expect(invoice).toMatchObject({ id: RAISED.id, number: RAISED.number });
    expect(manager.useContext().issuedInvoice.value?.id).toBe(RAISED.id);

    manager.useActions().refresh();
    await vi.waitFor(() =>
      expect(manager.useMeta().isAvailable.value).toBe(true)
    );
    expect(manager.useContext().issuedInvoice.value?.id).toBe(RAISED.id);
  });

  it("is cleared when the next invoice is asked for again", async () => {
    const second = deferred<IInvoice | null>();
    let calls = 0;
    const service = await managerMachine(NEXT, {
      issueNextInvoice: () =>
        ++calls === 1 ? Promise.resolve(RAISED) : second.promise
    });
    service.send({ type: "NEXT_INVOICE.ISSUE" });
    await vi.waitFor(() => expect(issued(service)?.id).toBe(RAISED.id));
    await settled(service);

    service.send({ type: "NEXT_INVOICE.ISSUE" });

    expect(service.getSnapshot().matches("processing.issuingNextInvoice")).toBe(
      true
    );
    expect(issued(service)).toBeUndefined();
    second.resolve(RAISED);
    await settled(service);
    expect(issued(service)?.id).toBe(RAISED.id);
  });

  it("is cleared when the trial is ended, and is then the document the end raised", async () => {
    const second = deferred<IInvoice | null>();
    let calls = 0;
    const service = await managerMachine(TRIAL_CONTINUING, {
      endTrial: () =>
        ++calls === 1 ? Promise.resolve(TRIAL_END_RAISED) : second.promise
    });
    service.send({ type: "TRIAL.END" });
    await vi.waitFor(() =>
      expect(issued(service)?.id).toBe(TRIAL_END_RAISED.id)
    );
    await settled(service);

    service.send({ type: "TRIAL.END" });

    expect(service.getSnapshot().matches("processing.endingTrial")).toBe(true);
    expect(issued(service)).toBeUndefined();

    second.resolve(CREDIT_NOTE);
    await settled(service);
    expect(issued(service)?.id).toBe(CREDIT_NOTE.id);
  });
});

describe("AC-44 — a refused write carries its error copy", () => {
  const copy = JSON.parse(
    readFileSync(
      join(import.meta.dirname, "../../../../../i18n/src/core/error-en.json"),
      "utf-8"
    )
  ) as Record<string, string>;

  const refused: [
    string,
    string,
    (manager: LiveManager) => Promise<unknown>
  ][] = [
    [
      "a-lifecycle-write-that-the-platform-refuses-turn-its-renewal-invoicing-off",
      "contract_product_auto_renew_failed",
      manager => manager.useActions().setAutoRenew(false)
    ],
    [
      "a-lifecycle-write-that-the-platform-refuses-raise-its-next-invoice",
      "contract_product_next_invoice_failed",
      manager => manager.useActions().issueNextInvoice()
    ],
    [
      "a-lifecycle-write-that-the-platform-refuses-end-its-trial",
      "contract_product_end_trial_failed",
      manager => manager.useActions().endTrial()
    ],
    [
      "a-lifecycle-write-that-the-platform-refuses-set-its-label",
      "contract_product_label_failed",
      manager => manager.useActions().setClientLabel("Web box")
    ],
    [
      "a-billing-entity-change-that-the-platform-refuses-keeps-my-pick",
      "contract_product_billing_entity_failed",
      manager => {
        const write = JSON.parse(
          readFileSync(
            join(
              scenarioStep(
                "a-billing-entity-change-that-the-platform-refuses-keeps-my-pick",
                3
              ),
              "put-contracts-id-address-company-vat.json"
            ),
            "utf-8"
          )
        ) as {
          request: { body: { address_id: string; company_id: string | null } };
        };
        const { address_id, company_id } = write.request.body;
        return manager.useActions().setBillingEntity(company_id ?? address_id);
      }
    ]
  ];

  for (const [slug, key, call] of refused)
    it(`rejects with the copy the error catalogue holds: ${slug.replace(/-/g, " ")}`, async () => {
      const manager = await managerOver(slug);
      replayStep(server, scenarioStep(slug, 3));

      const refusal = await call(manager).then(
        () => undefined,
        (error: unknown) => error as Error
      );

      expect(refusal?.message).toBe(`error.${key}`);
      expect(copy[key]).toStrictEqual(expect.stringMatching(/\S/));
    });
});

describe("AC-44 — a write asked for while another is in flight", () => {
  const SLUG = "turn-the-renewal-invoicing-of-my-subscription-off-or-on-on";
  const step3 = <T>(file: string): T =>
    JSON.parse(readFileSync(join(scenarioStep(SLUG, 3), file), "utf-8")) as T;

  it("is refused with false and sends nothing, and the write in flight still resolves its own re-read product", async () => {
    const write = step3<{ request: { body: Record<string, unknown> } }>(
      "put-contracts-id-products-id-stop-start-invoicing.json"
    );
    const reread = recorded<IContractProduct>(
      step3("get-contract-products-id.json")
    );
    const manager = await managerOver(SLUG);
    replayStep(server, scenarioStep(SLUG, 3), { delayMs: () => 400 });

    const first = manager.useActions().setAutoRenew(false);
    await vi.waitFor(() =>
      expect(manager.useMeta().isProcessing.value).toBe(true)
    );

    await expect(manager.useActions().setClientLabel("Web box")).resolves.toBe(
      false
    );
    await expect(manager.useActions().setAutoRenew(false)).resolves.toBe(false);

    await expect(first).resolves.toMatchObject({
      id: reread.id,
      autoCreateRenewInvoice: reread.auto_create_renew_invoice
    });
    expect(await sent("PUT")).toStrictEqual([write.request.body]);
  });
});

// -----------------------------------------------------------------------------

const offers = (manager: LiveManager) =>
  (
    manager.useContext().billingEntity.value?.schema as
      | { properties?: { billing_entity?: { oneOf?: { const: string }[] } } }
      | undefined
  )?.properties?.billing_entity?.oneOf ?? [];

const defaultOf = (manager: LiveManager) =>
  (
    manager.useContext().billingEntity.value?.schema as
      | { properties?: { billing_entity?: { default?: string } } }
      | undefined
  )?.properties?.billing_entity?.default;

/** Opens the picker and settles once it offers the lists of the client. */
async function openPicker(manager: LiveManager): Promise<string[]> {
  manager.useActions().openBillingEntity();
  await vi.waitFor(() => expect(offers(manager)).not.toStrictEqual([]));
  return offers(manager).map(option => option.const);
}

/** The pick the scenario recorded: an address of mine, sent with no company. */
const ADDRESS_PICK = (
  addressPickRecording as {
    request: { body: { address_id: string; company_id: null } };
  }
).request.body;
const ADDRESS_PICK_REREAD = recorded<IContractProduct>(
  addressPickRereadRecording
);

describe("AC-45 — the billing-entity picker", () => {
  it("the picker reads nothing while the billing entity cannot change", async () => {
    const manager = await managerOver(ONE_OFF_SCENARIO);
    expect(manager.useMeta().canSetBillingEntity.value).toBe(false);

    manager.useActions().openBillingEntity();
    for (let tick = 0; tick < 5; tick++)
      await new Promise(resolve => setImmediate(resolve));

    expect(listReads()).toStrictEqual([]);
    expect(offers(manager)).toStrictEqual([]);
  });

  it("picking an id that resolves to nothing is refused and sends nothing", async () => {
    const manager = await managerOver(PICKER_SCENARIO);
    replayStep(server, scenarioStep(PICKER_SCENARIO, 3));
    const offered = await openPicker(manager);

    await expect(
      manager.useActions().setBillingEntity(`${offered.join("")}-not-offered`)
    ).rejects.toMatchObject({ code: 422 });
    expect(await sent("PUT")).toStrictEqual([]);
  });

  it("opens on the company the contract bills to", async () => {
    const manager = await managerOver(PICKER_SCENARIO);
    replayStep(server, scenarioStep(PICKER_SCENARIO, 3));

    await openPicker(manager);

    expect(defaultOf(manager)).toBe(BILLS_TO_COMPANY.contract?.company_id);
  });

  it("opens on the address the contract bills to when it bills to no company", async () => {
    const manager = await managerOver(ADDRESS_SCENARIO);
    replayStep(server, scenarioStep(ADDRESS_SCENARIO, 3));

    await openPicker(manager);

    expect(BILLS_TO_ADDRESS.contract?.company_id).toBeNull();
    expect(defaultOf(manager)).toBe(BILLS_TO_ADDRESS.contract?.address_id);
  });
});

describe("AC-41 — an address pick", () => {
  it("is sent as the recorded address with no company, and the subscription then bills to that address alone", async () => {
    const manager = await managerOver(PICKER_SCENARIO);
    replayStep(server, scenarioStep(PICKER_SCENARIO, 3));
    expect(await openPicker(manager)).toContain(ADDRESS_PICK.address_id);

    const product = await manager
      .useActions()
      .setBillingEntity(ADDRESS_PICK.address_id);

    expect(await sent("PUT")).toStrictEqual([ADDRESS_PICK]);
    expect(product).toMatchObject({
      billingAddressId: ADDRESS_PICK_REREAD.contract?.address_id,
      billingCompanyId: ADDRESS_PICK_REREAD.contract?.company_id
    });
    expect(ADDRESS_PICK_REREAD.contract?.address_id).toBe(
      ADDRESS_PICK.address_id
    );
  });

  it("is sent as picked when the picker has not read the lists yet", async () => {
    const manager = await managerOver(PICKER_SCENARIO);
    replayStep(server, scenarioStep(PICKER_SCENARIO, 3));

    await manager.useActions().setBillingEntity(ADDRESS_PICK.address_id);

    expect(await sent("PUT")).toStrictEqual([ADDRESS_PICK]);
  });
});

describe("AC-41 — a pick of the current billing entity", () => {
  it("sends nothing for the company the subscription bills to", async () => {
    const manager = await managerOver(SAME_PICK_SCENARIO);
    replayStep(server, scenarioStep(SAME_PICK_SCENARIO, 3));
    const current = manager.useContext().contractProduct.value
      ?.billingCompanyId as string;
    expect(await openPicker(manager)).toContain(current);

    await manager.useActions().setBillingEntity(current);

    expect(await sent("PUT")).toStrictEqual([]);
    expect(manager.useContext().error.value).toBeUndefined();
  });

  it("sends nothing for the address the subscription bills to while it bills to no company", async () => {
    const manager = await managerOver(ADDRESS_SCENARIO);
    replayStep(server, scenarioStep(ADDRESS_SCENARIO, 3));
    const current = BILLS_TO_ADDRESS.contract?.address_id as string;
    expect(await openPicker(manager)).toContain(current);

    await manager.useActions().setBillingEntity(current);

    expect(await sent("PUT")).toStrictEqual([]);
    expect(manager.useContext().error.value).toBeUndefined();
  });

  it("is refused on a one-time purchase, which cannot change what it bills to", async () => {
    const manager = await managerOver(ONE_OFF_SCENARIO);

    await expect(
      manager
        .useActions()
        .setBillingEntity(ONE_OFF.contract?.address_id as string)
    ).resolves.toBe(false);
    expect(await sent("PUT")).toStrictEqual([]);
  });
});

describe("AC-44 — a re-read while an invoice-raising write is in flight", () => {
  for (const [event, record, node, write] of [
    ["NEXT_INVOICE.ISSUE", NEXT, "issuingNextInvoice", "issueNextInvoice"],
    ["TRIAL.END", TRIAL_CONTINUING, "endingTrial", "endTrial"]
  ] as const)
    it(`ignores REFRESH and UNAUTHENTICATED during ${node}, and keeps the document it raises`, async () => {
      const raised = deferred<IInvoice | null>();
      const service = await managerMachine(record, {
        [write]: () => raised.promise
      });
      service.send({ type: event });

      service.send({ type: "REFRESH" });
      service.send({ type: "UNAUTHENTICATED" });

      expect(service.getSnapshot().matches(`processing.${node}`)).toBe(true);
      raised.resolve(RAISED);
      await settled(service);
      expect(issued(service)?.id).toBe(RAISED.id);
    });
});

describe("AC-40 — the label is validated before it is sent", () => {
  const LABEL_SLUG = "give-my-product-my-own-label-empty";
  const refusedLabel = (
    JSON.parse(
      readFileSync(
        join(
          scenarioStep(
            "a-lifecycle-write-that-the-platform-refuses-set-its-label",
            3
          ),
          "put-contract-products-id.json"
        ),
        "utf-8"
      )
    ) as { request: { body: { client_label: string } } }
  ).request.body.client_label;

  it("refuses a label the platform refuses as too long, and sends nothing", async () => {
    const manager = await managerOver(LABEL_SLUG);

    await expect(
      manager.useActions().setClientLabel(refusedLabel)
    ).rejects.toMatchObject({ code: 422 });
    expect(await sent("PUT")).toStrictEqual([]);
  });
});

describe("AC-41 — the billing entity of an unavailable product", () => {
  const BILLING_WRITE_UNAVAILABLE: NodeValue = {
    unavailable: { status: "cancelled", billingEntity: "processing" }
  };

  it("is offered on a cancelled subscription", () => {
    expect(CANCELLED.status?.code).toBe(ContractStatusCodes.CANCELLED);
    expect(
      gate(
        "canSetBillingEntity",
        unavailableAt("cancelled"),
        contextOf(CANCELLED)
      )
    ).toBe(true);
  });

  it("closes the label and billing gates while its billing write is in flight", () => {
    for (const name of [
      "canUpdateContractProduct",
      "canSetBillingEntity"
    ] as const)
      expect(gate(name, BILLING_WRITE_UNAVAILABLE, contextOf(CANCELLED))).toBe(
        false
      );
  });

  it("refuses a label write while its billing write is in flight", () => {
    const next = transition(BILLING_WRITE_UNAVAILABLE, CANCELLED, {
      type: "LABEL.SET",
      data: { label: "Web box" }
    });

    expect(next.matches("processing")).toBe(false);
    expect(next.matches("unavailable")).toBe(true);
  });
});
