// -----------------------------------------------------------------------------
/**
 * @module tests/product-consolidation-and-label
 * @description Gap doc §2 "Billing tab" (invoice consolidation for THIS
 * product) and "Settings tab" (custom label with revert and save) — the two
 * inline forms one product carries (plan §3, F4). Consolidation is doubly
 * gated: a brand that does not consolidate at all, and a brand that keeps the
 * choice with its staff, both take the form away, so it is graded on both
 * gates from a clone. The label is the client's own name for the product and
 * clearing it must give the product its own name back, which is graded where a
 * client would see it — the billboard.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InvoiceConsolidationTypes } from "@upmind-automation/types";
import { boundRefId, rowBinding } from "./support/page-config";
import { assign, filter, find, first, get, map, some, values } from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockBrandFeatures,
  MockDataset,
  MockProduct
} from "~/portal/mock/types";
import { productPages } from "~/portal/config/product-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction
} from "~/portal/mock/actions";
import {
  consolidationDefaults,
  labelDefaults,
  useConsolidationSchema,
  useLabelSchema
} from "~/portal/mock/contracts/client-contract-product.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const BILLING_PAGE = "product-area/billing";

const SETTINGS_PAGE = "product-area/settings";

const SUBJECT = "prod-analytics";

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function withFeatures(overrides: Partial<MockBrandFeatures>): MockDataset {
  const dataset: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(dataset, {
    features: assign({}, dataset.features, overrides)
  });
}

function subject(data: MockDataset): MockProduct {
  const product = find(data.products, { id: SUBJECT });
  if (product === undefined) throw new Error(`seed carries no ${SUBJECT}`);
  return product;
}

function contextFor(product: MockProduct): DataRouteContext {
  return { groupSlug: product.groupSlug, productId: product.id };
}

function ref<T>(
  data: MockDataset,
  id: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID],
  context: DataRouteContext
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function formRow(
  page: string,
  modelRef: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID]
) {
  const row = rowBinding(productPages()[page], modelRef);
  if (row === undefined) throw new Error(`no row binds ${modelRef}`);
  return row;
}

function formProps(
  page: string,
  modelRef: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID]
): ConfigNode {
  const slots = get(formRow(page, modelRef), "slots");
  const props = get(Array.isArray(slots) ? slots[0] : undefined, "props");
  if (typeof props !== "object" || props === null) {
    throw new Error(`the row binding ${modelRef} carries no form`);
  }
  return props as ConfigNode;
}

function payload(verb: string, product: MockProduct, model: unknown): string {
  return `${verb}:${product.id}:${JSON.stringify(model)}`;
}

function billboardTitle(data: MockDataset, product: MockProduct): string {
  return (
    first(
      ref<{ title: string }[]>(
        data,
        DATA_REF_ID.PRODUCT_BILLBOARD_ITEMS,
        contextFor(product)
      )
    )?.title ?? ""
  );
}

describe("invoice consolidation for one product, where the brand allows it", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("stands only while the brand consolidates AND leaves the choice to clients", () => {
    const data = hostgrid();
    const visible = formRow(
      BILLING_PAGE,
      DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_MODEL
    ).visible;
    const context = contextFor(subject(data));

    expect(
      boundRefId(
        formRow(BILLING_PAGE, DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_MODEL),
        "visible"
      )
    ).toBe(DATA_REF_ID.PRODUCT_HAS_CONSOLIDATION_FORM);
    expect(data.features.INVOICE_CONSOLIDATION_ENABLED).toBe(true);
    expect(data.features.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF).toBe(false);
    expect(resolveDataRef(visible, data, context)).toBe(true);
    expect(
      resolveDataRef(
        visible,
        withFeatures({ INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF: true }),
        context
      )
    ).toBe(false);
    expect(
      resolveDataRef(
        visible,
        withFeatures({ INVOICE_CONSOLIDATION_ENABLED: false }),
        context
      )
    ).toBe(false);
  });

  it("offers the platform's own three states, each worded once", () => {
    const data = hostgrid();
    const context = contextFor(subject(data));
    const states = filter(
      values(InvoiceConsolidationTypes),
      value => typeof value === "number"
    );
    const schema = ref(
      data,
      DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_SCHEMA,
      context
    );
    const choices = get(
      schema,
      "properties.invoiceConsolidation.options",
      []
    ) as { label: string }[];

    expect(schema).toEqual(useConsolidationSchema());
    expect(get(schema, "properties.invoiceConsolidation.enum")).toEqual(states);
    expect(new Set(map(choices, "label")).size).toBe(states.length);
    expect(some(choices, choice => choice.label === "")).toBe(false);
  });

  it("opens on the preference this product carries, and saves the one chosen", () => {
    const data = hostgrid();
    const product = subject(data);
    const context = contextFor(product);
    const props = formProps(
      BILLING_PAGE,
      DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_MODEL
    );

    expect(boundRefId(props, "submit")).toBe(
      DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_SUBMIT
    );
    expect(
      ref(data, DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_SUBMIT, context)
    ).toBe(`${MOCK_ACTION.PRODUCT_CONSOLIDATION_SAVE}:${product.id}`);
    expect(
      ref(data, DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_MODEL, context)
    ).toEqual(consolidationDefaults(product.invoiceConsolidation));

    const result = dispatchMockAction(
      data,
      context,
      payload(MOCK_ACTION.PRODUCT_CONSOLIDATION_SAVE, product, {
        invoiceConsolidation: InvoiceConsolidationTypes.DISABLED
      })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(find(data.products, { id: product.id })?.invoiceConsolidation).toBe(
      InvoiceConsolidationTypes.DISABLED
    );
    expect(
      ref(data, DATA_REF_ID.PRODUCT_CONSOLIDATION_FORM_MODEL, context)
    ).toEqual(consolidationDefaults(InvoiceConsolidationTypes.DISABLED));
  });
});

describe("the client's own label, and giving the product its name back", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("opens on the label on file and submits against this product", () => {
    const data = hostgrid();
    const product = subject(data);
    const context = contextFor(product);
    const props = formProps(
      SETTINGS_PAGE,
      DATA_REF_ID.PRODUCT_LABEL_FORM_MODEL
    );

    expect(product.customLabel).toBeTruthy();
    expect(ref(data, DATA_REF_ID.PRODUCT_LABEL_FORM_MODEL, context)).toEqual(
      labelDefaults(product.customLabel)
    );
    expect(ref(data, DATA_REF_ID.PRODUCT_LABEL_FORM_SCHEMA, context)).toEqual(
      useLabelSchema()
    );
    expect(boundRefId(props, "submit")).toBe(
      DATA_REF_ID.PRODUCT_LABEL_FORM_SUBMIT
    );
    expect(ref(data, DATA_REF_ID.PRODUCT_LABEL_FORM_SUBMIT, context)).toBe(
      `${MOCK_ACTION.PRODUCT_LABEL_SAVE}:${product.id}`
    );
  });

  it("saves what the client typed, trimmed, and heads the billboard with it", () => {
    const data = hostgrid();
    const product = subject(data);

    const result = dispatchMockAction(
      data,
      contextFor(product),
      payload(MOCK_ACTION.PRODUCT_LABEL_SAVE, product, {
        label: "  Board reporting  "
      })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(find(data.products, { id: product.id })?.customLabel).toBe(
      "Board reporting"
    );
    expect(billboardTitle(data, product)).toBe("Board reporting");
  });

  it("clearing it takes it off the product, and the billboard says the product's own name", () => {
    const data = hostgrid();
    const product = subject(data);
    const own = product.name;

    expect(billboardTitle(data, product)).toBe(product.customLabel);

    const result = dispatchMockAction(
      data,
      contextFor(product),
      payload(MOCK_ACTION.PRODUCT_LABEL_SAVE, product, { label: "   " })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(
      find(data.products, { id: product.id })?.customLabel
    ).toBeUndefined();
    expect(billboardTitle(data, product)).toBe(own);
  });

  it("a half-typed payload writes neither form", () => {
    const data = hostgrid();
    const product = subject(data);
    const label = product.customLabel;
    const consolidation = product.invoiceConsolidation;

    for (const verb of [
      MOCK_ACTION.PRODUCT_LABEL_SAVE,
      MOCK_ACTION.PRODUCT_CONSOLIDATION_SAVE
    ]) {
      expect(
        dispatchMockAction(
          data,
          contextFor(product),
          `${verb}:${product.id}:{"label":`
        )
      ).toBeUndefined();
    }

    expect(find(data.products, { id: product.id })?.customLabel).toBe(label);
    expect(find(data.products, { id: product.id })?.invoiceConsolidation).toBe(
      consolidation
    );
  });
});
