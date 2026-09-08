// -----------------------------------------------------------------------------
/**
 * @module tests/provisioning
 * @description Gap doc §2 Overview (X5): what the provider handed back. The
 * details list is copyable and masks what the provider called a secret; the
 * functions are runnable, and the sidebar's quick actions are the featured
 * ones ALONE; and what running one DOES is decided by its wire kind — a
 * redirect leaves the portal, a form post and a field refresh only report
 * back, and an iframe becomes a panel on the page it was run from.
 *
 * The render cap is a CONFIG fact (the panel shows four and holds the rest
 * behind a control), so it is graded on the page config the shape ships.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ProvisionRequestActionTypes } from "@upmind-automation/types";
import { propsBinding } from "./support/page-config";
import { every, filter, find, includes, map, reject } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockProvisionFunction } from "~/portal/mock/types";
import { productPages } from "~/portal/config/product-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { DATA_REF_ID } from "~/portal/mock/data-refs";
import {
  productProvisionActions,
  productProvisionFieldItems,
  productProvisionFrames,
  productQuickActions
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const PRODUCT_ID = "prod-analytics";
const CONTEXT: DataRouteContext = {
  groupSlug: "products",
  productId: PRODUCT_ID
};
const NO_CONTEXT: DataRouteContext = {};

/** Legacy showed four provisioning fields and held the rest behind "show all". */
const VISIBLE_FIELDS = 4;

const REFUSAL_INTENTS = [MOCK_TOAST_INTENT.WARNING, MOCK_TOAST_INTENT.ERROR];

function functions(data: MockDataset): readonly MockProvisionFunction[] {
  const product = find(data.products, { id: PRODUCT_ID });
  if (product === undefined) throw new Error(`seed carries no ${PRODUCT_ID}`);
  return product.provisioning.functions;
}

function fields(data: MockDataset) {
  const product = find(data.products, { id: PRODUCT_ID });
  if (product === undefined) throw new Error(`seed carries no ${PRODUCT_ID}`);
  return product.provisioning.fields;
}

function runValue(code: string, productId = PRODUCT_ID): string {
  return mockActionValue(
    MOCK_ACTION.RUN_PROVISION_FUNCTION,
    `${productId}:${code}`
  );
}

function functionOfKind(
  data: MockDataset,
  kind: ProvisionRequestActionTypes
): MockProvisionFunction {
  const ran = find(functions(data), { kind });
  if (ran === undefined) throw new Error(`seed carries no ${kind} function`);
  return ran;
}

describe("provisioning details — everything the provider set up, copyable, secrets masked", () => {
  const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

  it("lists every field the provider returned, in the order it returned them", () => {
    const items = productProvisionFieldItems(data, CONTEXT);

    expect(map(items, "label")).toEqual(map(fields(data), "label"));
    expect(map(items, "value")).toEqual(map(fields(data), "value"));
  });

  it("masks what the provider marked secret and leaves the rest legible", () => {
    const items = productProvisionFieldItems(data, CONTEXT);
    const secretLabels = map(filter(fields(data), { secret: true }), "label");

    expect(secretLabels.length).toBeGreaterThan(0);
    expect(map(filter(items, { secret: true }), "label")).toEqual(secretLabels);
    expect(
      every(
        reject(items, item => includes(secretLabels, item.label)),
        item => Boolean(item.secret) === false
      )
    ).toBe(true);
  });

  it("offers a copy control on every row — a provider value is there to be pasted", () => {
    const items = productProvisionFieldItems(data, CONTEXT);

    expect(items.length).toBeGreaterThan(0);
    expect(every(items, { copyable: true })).toBe(true);
  });

  it("shows four and keeps the rest behind a show-all control", () => {
    const props = propsBinding(
      productPages()[PAGE_KEY.PRODUCT_DETAIL],
      DATA_REF_ID.PRODUCT_PROVISION_FIELD_ITEMS
    );

    expect(fields(data).length).toBeGreaterThan(VISIBLE_FIELDS);
    expect(props?.maxItems).toBe(VISIBLE_FIELDS);
    expect(props?.moreLabel).toBeTruthy();
    expect(props?.lessLabel).toBeTruthy();
  });
});

describe("provisioning functions — every one runnable, the featured ones twice", () => {
  const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

  it("lists every provider function, each naming its own product and code", () => {
    const actions = productProvisionActions(data, CONTEXT);

    expect(map(actions, "label")).toEqual(map(functions(data), "label"));
    expect(map(actions, "value")).toEqual(
      map(functions(data), item => runValue(item.code))
    );
  });

  it("promotes exactly the highlighted functions to the quick actions", () => {
    const highlighted = filter(functions(data), { highlighted: true });
    const quick = productQuickActions(data, CONTEXT);

    expect(highlighted.length).toBeGreaterThan(0);
    expect(highlighted.length).toBeLessThan(functions(data).length);
    expect(map(quick, "value")).toEqual(
      map(highlighted, item => runValue(item.code))
    );
  });
});

describe("running a function — the wire's kind decides what happens next", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("a redirect leaves the portal — an external destination, never a route", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const redirect = functionOfKind(data, ProvisionRequestActionTypes.REDIRECT);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      runValue(redirect.code)
    );

    expect(result?.href).toBe(redirect.url);
    expect(result?.to).toBeUndefined();
  });

  it.each([
    ProvisionRequestActionTypes.FORM_POST,
    ProvisionRequestActionTypes.REFRESH_FIELDS
  ])("%s reports back and names the function that ran", kind => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const ran = functionOfKind(data, kind);

    const result = dispatchMockAction(data, NO_CONTEXT, runValue(ran.code));

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(
      `${result?.toast?.title} ${result?.toast?.description ?? ""}`
    ).toContain(ran.label);
    expect(result?.href).toBeUndefined();
  });

  it("an iframe function becomes a panel BESIDE the ones the provider seeded", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = find(data.products, { id: PRODUCT_ID });
    const embed = functionOfKind(
      data,
      ProvisionRequestActionTypes.RENDER_IFRAME
    );
    const seeded = product?.provisioning.iframes ?? [];

    expect(productProvisionFrames(data, CONTEXT)).toEqual(seeded);

    dispatchMockAction(data, NO_CONTEXT, runValue(embed.code));

    const frames = productProvisionFrames(data, CONTEXT);
    expect(frames).toHaveLength(seeded.length + 1);
    expect(frames).toEqual(
      expect.arrayContaining([{ title: embed.label, url: embed.url }])
    );
    expect(frames).toEqual(expect.arrayContaining([...seeded]));
  });

  it("a function the provider never offered is refused, and says so", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    const result = dispatchMockAction(data, NO_CONTEXT, runValue("no-such-fn"));

    expect({
      intent: result?.toast?.intent,
      href: result?.href,
      to: result?.to
    }).toEqual({
      intent: expect.stringMatching(REFUSAL_INTENTS.join("|")),
      href: undefined,
      to: undefined
    });
  });

  it("a product the client does not own is refused, as every unknown id is", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      runValue("login_panel", "no-such-product")
    );

    expect({ intent: result?.toast?.intent, href: result?.href }).toEqual({
      intent: expect.stringMatching(REFUSAL_INTENTS.join("|")),
      href: undefined
    });
  });
});
