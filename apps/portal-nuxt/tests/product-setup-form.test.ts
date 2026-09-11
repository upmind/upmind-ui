// -----------------------------------------------------------------------------
/**
 * The product's Setup tab is legacy's `cProdProvConfigManageForm`, mocked:
 * the blueprint's asked fields become one form, a confirmed form writes the
 * answers and takes the product live, and a refused one leaves it waiting.
 * Oracle: vue-app 1.74.0, `views/client/products/product/setup/index.vue`.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import { rowBinding, stringsIn } from "./support/page-config";
import { find, get, includes, map } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockProduct } from "~/portal/mock/types";
import { CLIENT_VUE_STUB_TITLE } from "~/portal/config/client-vue";
import { productPages } from "~/portal/config/product-pages";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction
} from "~/portal/mock/actions";
import {
  setupDefaults,
  setupFields,
  useSetupSchema
} from "~/portal/mock/contracts/contract-product-provisioning.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_PRODUCT_TAG } from "~/portal/mock/types";

const SETUP_PAGE = "product-area/setup";

/** The seed's one product still waiting on its blueprint. */
const SUBJECT = "prod-team";

const ADMIN_EMAIL = "ops@fieldnotes.app";

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
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

function confirm(product: MockProduct, model: unknown): string {
  return `${MOCK_ACTION.PRODUCT_SETUP_SAVE}:${product.id}:${JSON.stringify(model)}`;
}

function answered(data: MockDataset, extra: Record<string, unknown>) {
  const defaults = setupDefaults(subject(data).provisioning.fields);
  return Object.assign({}, defaults, extra);
}

describe("product setup form (legacy cProdProvConfigManageForm)", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks every blueprint field, typed as the provider declares it", () => {
    const fields = subject(hostgrid()).provisioning.fields;
    const schema = useSetupSchema(fields);
    expect(schema.required).toEqual([
      "hostname",
      "seats",
      "region",
      "admin_email"
    ]);
    expect(get(schema, "properties.seats.type")).toBe("number");
    expect(get(schema, "properties.audit_trail.type")).toBe("boolean");
    expect(map(get(schema, "properties.region.oneOf"), "const")).toEqual([
      "eu-west",
      "us-east",
      "ap-southeast"
    ]);
    // `required` alone admits ""; the provider does not.
    expect(get(schema, "properties.admin_email.minLength")).toBe(1);
    expect(map(setupFields(fields), "code")).toEqual(map(fields, "code"));
  });

  it("opens on the provider's values, the unanswered field blank", () => {
    const model = setupDefaults(subject(hostgrid()).provisioning.fields);
    expect(model).toMatchObject({
      hostname: "team.fieldnotes.app",
      seats: 10,
      audit_trail: true,
      admin_email: ""
    });
  });

  it("mounts the form on the Setup tab, confirmed in one step, with no client-vue stub", () => {
    const page = productPages()[SETUP_PAGE];
    const row = rowBinding(page, DATA_REF_ID.PRODUCT_SETUP_FORM_MODEL);
    const props = get(row, "slots[0].props");
    expect(get(props, "submit.id")).toBe(DATA_REF_ID.PRODUCT_SETUP_FORM_SUBMIT);
    expect(get(props, "submitLabel")).toBe("Confirm");
    expect(get(props, "resetLabel")).toBe("Revert changes");
    expect(get(row, "header.title")).toBe("Setup required");
    expect(includes(stringsIn(page), CLIENT_VUE_STUB_TITLE)).toBe(false);
  });

  it("resolves the page refs to this product's blueprint", () => {
    const data = hostgrid();
    const product = subject(data);
    const context = contextFor(product);
    expect(ref(data, DATA_REF_ID.PRODUCT_SETUP_FORM_SUBMIT, context)).toBe(
      `${MOCK_ACTION.PRODUCT_SETUP_SAVE}:${product.id}`
    );
    expect(
      get(ref(data, DATA_REF_ID.PRODUCT_SETUP_FORM_SCHEMA, context), "required")
    ).toContain("admin_email");
    expect(
      get(ref(data, DATA_REF_ID.PRODUCT_SETUP_FORM_MODEL, context), "hostname")
    ).toBe("team.fieldnotes.app");
  });

  it("writes the answers and takes the product live on Confirm", () => {
    const data = hostgrid();
    const product = subject(data);
    expect(product.status).toBe(ContractStatusCodes.AWAITING_ACTIVATION);

    const result = dispatchMockAction(
      data,
      contextFor(product),
      confirm(product, answered(data, { admin_email: ADMIN_EMAIL, seats: 12 }))
    );

    expect(result).toMatchObject({
      formDone: true,
      to: `/${product.groupSlug}/${product.id}`,
      toast: { intent: MOCK_TOAST_INTENT.SUCCESS, title: "Setup complete" }
    });
    expect(product.status).toBe(ContractStatusCodes.ACTIVE);
    expect(product.tags ?? []).not.toContain(MOCK_PRODUCT_TAG.SETUP_PENDING);
    expect(
      find(product.provisioning.fields, { code: "admin_email" })?.value
    ).toBe(ADMIN_EMAIL);
    expect(find(product.provisioning.fields, { code: "seats" })?.value).toBe(
      12
    );
  });

  it("refuses a blank required answer and leaves the product waiting", () => {
    const data = hostgrid();
    const product = subject(data);

    const result = dispatchMockAction(
      data,
      contextFor(product),
      confirm(product, answered(data, { admin_email: "   " }))
    );

    expect(stringsIn(result)).toEqual([
      MOCK_TOAST_INTENT.WARNING,
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.SETUP_INCOMPLETE]
    ]);
    expect(get(result, "formDone")).toBeUndefined();
    expect(product.status).toBe(ContractStatusCodes.AWAITING_ACTIVATION);
    expect(
      find(product.provisioning.fields, { code: "admin_email" })?.value
    ).toBe("");
  });

  it("refuses a product that is not waiting on setup", () => {
    const data = hostgrid();
    const product = subject(data);
    dispatchMockAction(
      data,
      contextFor(product),
      confirm(product, answered(data, { admin_email: ADMIN_EMAIL }))
    );

    const again = dispatchMockAction(
      data,
      contextFor(product),
      confirm(product, answered(data, { admin_email: ADMIN_EMAIL }))
    );

    expect(stringsIn(again)).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NOT_AWAITING_SETUP]
    );
  });
});
