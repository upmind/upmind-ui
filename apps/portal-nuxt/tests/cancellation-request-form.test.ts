// -----------------------------------------------------------------------------
/**
 * @module tests/cancellation-request-form
 * @description Gap doc §2 "Billing tab": the cancellation-options modal legacy
 * offered, and the pending banner it leaves behind (plan §3 row "Cancellation
 * request", F12 — the CTA the no-form phase withheld returns). Which of the
 * three choices is offered is a brand gate; WHEN the product stops follows
 * from the choice, and the wire has a different cancellation status for each,
 * so the three are graded apart. The brand's own questions ride under the
 * form, and a product with a request already lodged has nothing left to ask
 * for — it is offered the way OUT instead.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes
} from "@upmind-automation/types";
import { filter, find, get, includes, map, omit } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockProduct } from "~/portal/mock/types";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { CANCEL_OPTION } from "~/portal/mock/contracts/client-contract-product";
import {
  cancellationDefaults,
  useCancellationSchema
} from "~/portal/mock/contracts/client-contract-product.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { cancellationFormContext } from "~/portal/mock/forms/product-contexts";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_BILLING_TYPE } from "~/portal/mock/types";

const REASON = "Moving the workspace in-house";

const FUTURE_DATE = "2026-12-01";

type ActionLike = {
  readonly value: string;
  readonly label: string;
  readonly disabledReason?: string;
};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function contextFor(product: MockProduct): DataRouteContext {
  return { groupSlug: product.groupSlug, productId: product.id };
}

function seeded(
  data: MockDataset,
  trait: string,
  matches: (product: MockProduct) => boolean
): MockProduct {
  const product = find(data.products, matches);
  if (product === undefined) throw new Error(`seed carries no ${trait}`);
  return product;
}

/** A running subscription with nothing lodged against it — the one legacy asks. */
function cancellable(data: MockDataset): MockProduct {
  return seeded(
    data,
    "running subscription with no cancellation",
    product =>
      product.billingType === MOCK_BILLING_TYPE.SUBSCRIPTION &&
      product.status === ContractStatusCodes.ACTIVE &&
      product.cancellationRequest === undefined &&
      product.cancelledAt === undefined &&
      !product.pendingProRata &&
      product.autoExpireAt === undefined
  );
}

function ref<T>(
  data: MockDataset,
  id: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID],
  context: DataRouteContext
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function offer(
  data: MockDataset,
  product: MockProduct
): ActionLike | undefined {
  return find(
    ref<ActionLike[]>(
      data,
      DATA_REF_ID.PRODUCT_MANAGE_ACTIONS,
      contextFor(product)
    ),
    {
      value: mockActionValue(
        MOCK_ACTION.OPEN_FORM,
        `${FORM_ID.PRODUCT_CANCEL_REQUEST}:${product.id}`
      )
    }
  );
}

function request(product: MockProduct, model: unknown): string {
  return `${MOCK_ACTION.PRODUCT_CANCEL_REQUEST}:${product.id}:${JSON.stringify(model)}`;
}

/** The one cancellation question the brand insists on. */
function requiredFieldCode(data: MockDataset): string {
  const field = find(data.cancellationFields, item => item.meta.isRequired);
  if (field === undefined)
    throw new Error("the brand asks nothing on the way out");
  return field.code;
}

describe("who is offered the cancellation options, and who is not", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("offers it on a running subscription with nothing lodged against it", () => {
    const data = hostgrid();
    const product = cancellable(data);

    expect(offer(data, product)?.label).toBeTruthy();
    expect(offer(data, product)?.disabledReason).toBeUndefined();
  });

  it("takes it away once a request is lodged, and from a product already stopped", () => {
    const data = hostgrid();
    const lodged = seeded(
      data,
      "product with a cancellation lodged",
      product => product.cancellationRequest !== undefined
    );
    const stopped = seeded(
      data,
      "cancelled product",
      product => product.status === ContractStatusCodes.CANCELLED
    );

    expect(offer(data, lodged)).toBeUndefined();
    expect(offer(data, stopped)).toBeUndefined();
  });

  it("leaves it standing but dead while a pro-rata change is still landing", () => {
    const data = hostgrid();
    const settling = seeded(
      data,
      "product with a pending pro-rata change",
      product => product.pendingProRata
    );

    expect(offer(data, settling)?.disabledReason).toBeTruthy();
  });

  it("no cancelled product in the whole seed is offered it", () => {
    const data = hostgrid();
    const stopped = filter(data.products, {
      status: ContractStatusCodes.CANCELLED
    });

    expect(stopped.length).toBeGreaterThan(1);
    for (const product of stopped) {
      expect(offer(data, product)).toBeUndefined();
    }
  });
});

describe("the form the CTA opens", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("is the registered one, addressed to this product, on the schema's own defaults", () => {
    const data = hostgrid();
    const product = cancellable(data);

    const opened = dispatchMockAction(
      data,
      contextFor(product),
      offer(data, product)?.value ?? ""
    );
    const entry = resolveMockForm(
      data,
      FORM_ID.PRODUCT_CANCEL_REQUEST,
      product.id
    );

    expect(opened?.form).toEqual({
      id: FORM_ID.PRODUCT_CANCEL_REQUEST,
      entityId: product.id
    });
    expect(entry?.submit).toBe(
      `${MOCK_ACTION.PRODUCT_CANCEL_REQUEST}:${product.id}`
    );
    expect(entry?.model).toEqual(
      cancellationDefaults(cancellationFormContext(data, product))
    );
    expect(entry?.schema).toEqual(
      useCancellationSchema(cancellationFormContext(data, product))
    );
    expect(get(entry?.model, "reason")).toBe("");
    expect(get(entry?.model, "customFields")).toBeDefined();
  });

  it("offers the choices this brand allows, and no others", () => {
    const data = hostgrid();
    const context = cancellationFormContext(data, cancellable(data));
    const allowed = context.options;
    const schema = useCancellationSchema(context);

    expect(data.features.SUBSCRIPTIONS_ALLOW_IMMEDIATE_CANCELLATION).toBe(true);
    expect(allowed).toContain(CANCEL_OPTION.IMMEDIATELY);
    expect(get(schema, "properties.option.enum")).toEqual([...allowed]);
    expect(
      map(get(schema, "properties.option.options", []), "label")
    ).toHaveLength(allowed.length);
  });

  it("asks for a date only where a date is what was chosen, and a reason always", () => {
    const data = hostgrid();
    const validate = usePortalAjv().compile(
      useCancellationSchema(cancellationFormContext(data, cancellable(data)))
    );
    const answers = { [requiredFieldCode(data)]: "A lower price" };

    expect(
      validate({
        option: CANCEL_OPTION.END_OF_BILLING_CYCLE,
        reason: REASON,
        customFields: answers
      })
    ).toBe(true);
    expect(
      validate({
        option: CANCEL_OPTION.SCHEDULED,
        reason: REASON,
        customFields: answers
      })
    ).toBe(false);
    expect(
      validate({
        option: CANCEL_OPTION.SCHEDULED,
        cancelAt: FUTURE_DATE,
        reason: REASON,
        customFields: answers
      })
    ).toBe(true);
    expect(
      validate({
        option: CANCEL_OPTION.END_OF_BILLING_CYCLE,
        customFields: answers
      })
    ).toBe(false);
    expect(
      validate({
        option: CANCEL_OPTION.END_OF_BILLING_CYCLE,
        reason: REASON,
        customFields: omit(answers, [requiredFieldCode(data)])
      })
    ).toBe(false);
  });
});

describe("lodging one — the wire has a status for each answer", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("a chosen date schedules it, and keeps the day it was chosen for", () => {
    const data = hostgrid();
    const product = cancellable(data);

    const result = dispatchMockAction(
      data,
      contextFor(product),
      request(product, {
        option: CANCEL_OPTION.SCHEDULED,
        cancelAt: FUTURE_DATE,
        reason: REASON,
        customFields: { [requiredFieldCode(data)]: "A lower price" }
      })
    );

    const saved = find(data.products, { id: product.id });
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(saved?.cancellationRequest?.status).toBe(
      CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION
    );
    expect(saved?.cancellationRequest?.cancelAt).toBe(FUTURE_DATE);
    expect(saved?.cancellationRequest?.reason).toBe(REASON);
    expect(saved?.status).toBe(ContractStatusCodes.ACTIVE);
    expect(saved?.cancelledAt).toBeUndefined();
    expect(map(saved?.cancellationRequest?.fields, "value")).toContain(
      "A lower price"
    );
  });

  it("the end of the term lodges the term's own status, and stops nothing yet", () => {
    const data = hostgrid();
    const product = cancellable(data);

    dispatchMockAction(
      data,
      contextFor(product),
      request(product, {
        option: CANCEL_OPTION.END_OF_BILLING_CYCLE,
        reason: REASON
      })
    );

    const saved = find(data.products, { id: product.id });
    expect(saved?.cancellationRequest?.status).toBe(
      CancellationRequestStatusCodes.REQUEST_END_OF_BILLING_CYCLE
    );
    expect(saved?.cancellationRequest?.cancelAt).toBeTruthy();
    expect(saved?.status).toBe(ContractStatusCodes.ACTIVE);
    expect(saved?.cancelledAt).toBeUndefined();
  });

  it("straight away stops the product then and there", () => {
    const data = hostgrid();
    const product = cancellable(data);

    dispatchMockAction(
      data,
      contextFor(product),
      request(product, { option: CANCEL_OPTION.IMMEDIATELY, reason: REASON })
    );

    const saved = find(data.products, { id: product.id });
    expect(saved?.status).toBe(ContractStatusCodes.CANCELLED);
    expect(saved?.cancelledAt).toBeTruthy();
    expect(saved?.cancellationRequest?.status).toBe(
      CancellationRequestStatusCodes.REQUEST_ACCEPTED
    );
    expect(saved?.cancellationRequest?.cancelAt).toBe(saved?.cancelledAt);
  });

  it("the three answers do not land on the same status", () => {
    const statuses = map(
      [
        CANCEL_OPTION.SCHEDULED,
        CANCEL_OPTION.END_OF_BILLING_CYCLE,
        CANCEL_OPTION.IMMEDIATELY
      ],
      option => {
        resetMockData(MOCK_DATASET_ID.HOSTGRID);
        const fresh = hostgrid();
        const product = cancellable(fresh);
        dispatchMockAction(
          fresh,
          contextFor(product),
          request(product, {
            option,
            cancelAt: FUTURE_DATE,
            reason: REASON
          })
        );
        return find(fresh.products, { id: product.id })?.cancellationRequest
          ?.status;
      }
    );

    expect(new Set(statuses).size).toBe(3);
    expect(includes(statuses, undefined)).toBe(false);
  });
});

describe("after it is lodged, the way out is the only thing offered", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("the banner offers to call it off, and the manage band offers no second request", () => {
    const data = hostgrid();
    const product = cancellable(data);

    dispatchMockAction(
      data,
      contextFor(product),
      request(product, {
        option: CANCEL_OPTION.SCHEDULED,
        cancelAt: FUTURE_DATE,
        reason: REASON
      })
    );

    const banner = ref<ActionLike | undefined>(
      data,
      DATA_REF_ID.PRODUCT_CONDITION_ACTION,
      contextFor(product)
    );

    expect(banner?.value).toBe(
      mockActionValue(MOCK_ACTION.ABORT_CANCELLATION, product.id)
    );
    expect(banner?.label).toBe("Don't cancel");
    expect(offer(data, product)).toBeUndefined();
  });

  it("a second request is refused, and the first one stands untouched", () => {
    const data = hostgrid();
    const product = cancellable(data);

    dispatchMockAction(
      data,
      contextFor(product),
      request(product, {
        option: CANCEL_OPTION.SCHEDULED,
        cancelAt: FUTURE_DATE,
        reason: REASON
      })
    );
    const lodged = find(data.products, { id: product.id })?.cancellationRequest;

    const result = dispatchMockAction(
      data,
      contextFor(product),
      request(product, {
        option: CANCEL_OPTION.IMMEDIATELY,
        reason: "changed my mind"
      })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(result?.toast?.title).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.CANCELLATION_REQUESTED]
    );
    expect(
      find(data.products, { id: product.id })?.cancellationRequest
    ).toEqual(lodged);
    expect(find(data.products, { id: product.id })?.status).toBe(
      ContractStatusCodes.ACTIVE
    );
  });

  it("a half-typed payload is not a request", () => {
    const data = hostgrid();
    const product = cancellable(data);

    expect(
      dispatchMockAction(
        data,
        contextFor(product),
        `${MOCK_ACTION.PRODUCT_CANCEL_REQUEST}:${product.id}:{"option":`
      )
    ).toBeUndefined();
    expect(
      find(data.products, { id: product.id })?.cancellationRequest
    ).toBeUndefined();
  });
});
