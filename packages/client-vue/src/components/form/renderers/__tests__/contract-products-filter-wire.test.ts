/**
 * @module form/renderers/__tests__/contract-products-filter-wire
 * @description The contract-products filter bar mounted off the module's own
 * LIVE `useContractProducts().as("self").useContext().schemas.query` (see
 * `contractProductsQuery` in `filter.harness.ts`), each list-page control
 * DRIVEN the way a hand drives it, and read back on the WIRE via headless' own
 * `translateQuery`. A dotted column (`product.name`, `product.category.name`)
 * whose write lands at the wrong nesting is silently stripped by
 * `additionalProperties: false` with no ajv error, so every assertion here is
 * post-`translateQuery`, never on the model.
 *
 * Scenarios (headless `contract-product.feature`):
 * - `@proves contract-product.feature:1004` — quick search
 * - `@proves contract-product.feature:1016` — product name
 * - `@proves contract-product.feature:1022` — category name
 * - `@proves contract-product.feature:1028` — date purchased
 * - `@proves contract-product.feature:1034` — next due date
 * - `@proves contract-product.feature:1040` — price
 * - `@proves contract-product.feature:1056` / `:1057` — subscriptions-only on / all
 * - `@proves contract-product.feature:1067` / `:1068` — one-off-only on / all
 *
 * Negative control: `contract-products-filter-wire.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import {
  translateQuery,
  useContractProducts
} from "@upmind-automation/headless";
import {
  catalogue,
  contractProductsQuery,
  mountFilters,
  positionNamed
} from "./filter.harness";
import { get } from "lodash-es";
import type { UISchemaElement } from "@jsonforms/core";

const declaration = contractProductsQuery();

type Mount = Awaited<ReturnType<typeof mountFilters>>;

const UNSET_ON_THE_WIRE = "";

const drive = async (interact: (mount: Mount) => Promise<unknown>) => {
  const mount = await mountFilters(declaration);

  await interact(mount);
  await mount.settle();

  return translateQuery(declaration.schema, mount.model()) as {
    query?: string;
    filters?: Record<string, string>;
  };
};

const type = (path: string, value: string) => async (mount: Mount) =>
  mount.column(path).find("input").setValue(value);

const enterAmount = (path: string, value: string) => async (mount: Mount) => {
  const input = mount.column(path).find("input");
  await input.setValue(value);
  await input.trigger("blur");
};

const press =
  (path: string, i18n: string, position: string) => (mount: Mount) =>
    positionNamed(mount.column(path), catalogue(`${i18n}.${position}`)).trigger(
      "click"
    );

describe("the contract-products bar mounts off the module's own published schema", () => {
  it("renders every element it declares", async () => {
    const elements = (declaration.uischema as { elements: UISchemaElement[] })
      .elements;

    const { wrapper } = await mountFilters(declaration);
    expect(wrapper.findAll('[data-test-key="form-item"]')).toHaveLength(
      elements.length
    );
  });

  it("comes straight off useContractProducts().as('self').useContext().schemas.query", () => {
    const live = useContractProducts().as("self").useContext().schemas.query;
    expect(declaration.schema).toEqual(live.schema);
    expect(declaration.uischema).toEqual(live.uischema);
  });
});

describe("typing in a search box reaches the wire", () => {
  it("the quick-search box sends its term as the top-level query", async () => {
    const wire = await drive(type("query", "hosting"));

    expect(wire.query).toBe("hosting");
  });

  it("the product-name box sends filter[product.name|like] under its dotted column", async () => {
    const wire = await drive(type("filters.product.name.like", "Hosting"));

    expect(get(wire.filters, "filter[product.name|like]")).toBe("%Hosting%");
  });

  it("the category-name box sends filter[product.category.name|like] under its dotted column", async () => {
    const wire = await drive(type("filters.product.category.name.like", "Web"));

    expect(get(wire.filters, "filter[product.category.name|like]")).toBe(
      "%Web%"
    );
  });
});

describe("picking a date or an amount reaches the wire", () => {
  it("the date-purchased control sends filter[created_at|gt]", async () => {
    const wire = await drive(type("filters.created_at.gt", "2024-01-01"));

    expect(get(wire.filters, "filter[created_at|gt]")).toBe("2024-01-01");
  });

  it("the next-due-date control sends filter[next_due_date|gt]", async () => {
    const wire = await drive(type("filters.next_due_date.gt", "2024-01-01"));

    expect(get(wire.filters, "filter[next_due_date|gt]")).toBe("2024-01-01");
  });

  it("the price control sends filter[total_amount]", async () => {
    const wire = await drive(enterAmount("filters.total_amount", "100"));

    expect(get(wire.filters, "filter[total_amount]")).toBe("100");
  });
});

const TOGGLES = [
  {
    toggle: "subscriptions-only",
    path: "filters.billing_cycle_days.neq",
    i18n: "form.contract_product_subscriptions_only",
    key: "filter[billing_cycle_days|neq]",
    other: "filter[billing_cycle_days|eq]"
  },
  {
    toggle: "one-off-only",
    path: "filters.billing_cycle_days.eq",
    i18n: "form.contract_product_one_time_only",
    key: "filter[billing_cycle_days|eq]",
    other: "filter[billing_cycle_days|neq]"
  }
] as const;

describe.each(TOGGLES)(
  "the $toggle toggle is its own control on the wire",
  ({ path, i18n, key, other }) => {
    it("on sends 0 on its own key and leaves the other toggle's key unset", async () => {
      const wire = await drive(press(path, i18n, "0"));

      expect(get(wire.filters, key)).toBe("0");
      expect(get(wire.filters, other)).toBe(UNSET_ON_THE_WIRE);
    });

    it("all, after on, clears its key", async () => {
      const wire = await drive(async mount => {
        await press(path, i18n, "0")(mount);
        await mount.settle();
        await press(path, i18n, "null")(mount);
      });

      expect(get(wire.filters, key)).toBe(UNSET_ON_THE_WIRE);
    });
  }
);
