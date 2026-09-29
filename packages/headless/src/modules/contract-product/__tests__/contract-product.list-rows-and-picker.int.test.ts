// -----------------------------------------------------------------------------
/**
 * @fileoverview useContractProducts list rows, the product picker and a failed
 * list read (integration; AC-1 and the picker `@member`, ruling R38 items 2, 6,
 * 8 and 10)
 *
 * ## Job To Be Done
 * R38 rebuilt the products page to the `useInvoices` / `useTicket` exemplars.
 * A column binds a view-model field the mapper maps — the purchase date, the
 * formatted price, the next due date and the billing cycle — never `raw.*`.
 * `useContractProduct` with no id draws its picker from
 * `useContractProducts().useContext().schemas.contractProductPicker`, and the
 * picked value is the id the manager loads by. A failed list read is reported
 * as an error with its reason, never shown as an empty list. The repair of
 * gaps G4 to G8 adds: the legacy price (recurring for a subscription,
 * discounted for a one-time product, net under an EXCLUDE_TAX brand), the
 * translated status and its one flag, the billing cycle in words, and a picker
 * labelled, searched and delegation-filtered like the list. Drive the REAL
 * composables against RECORDED staging captures and prove each.
 *
 * ## Provenance
 * Every body is a `pnpm fixtures:generate contract-product` capture: the
 * production list (`recorded.list()`), the 12-member list off the two-year
 * cycle (`recorded.listRows()`), the single client read (`recorded.one()`),
 * the unknown-product read (`recorded.readNotFound()`) and the list ordered by
 * an undeclared column (`recorded.listFailure()`).
 *
 * ## Negative controls
 * `contract-product.list-rows-and-picker.<control>.must-fail.patch`, one per
 * mapped behaviour.
 *
 * ## What Breaks If These Fail
 * A products column renders blank, a wire string, a raw key or the wrong
 * price, picking a product opens a different one or none, the picker cannot
 * be searched or hides a delegated product the list shows, or a list the
 * platform refused reads as "you have no products".
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { unref } from "vue";
import { getFixture } from "@upmind-automation/test-fixtures";
import { BrandTaxTypes, ContractStatusCodes } from "@upmind-automation/types";
import { useContractProduct, useContractProducts } from "..";
import { useLookup } from "../../lookup";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { recordingsDir, server } from "./setup.integration";
import {
  escapeRegExp,
  every,
  filter,
  find,
  forEach,
  get,
  keyBy,
  keys,
  map,
  pickBy,
  some,
  sortBy,
  split,
  uniq
} from "lodash-es";
import type { ContractProduct } from "..";

// -----------------------------------------------------------------------------

type RecordedList = typeof recorded.list;

type RecordedRow = {
  id: string;
  created_at: string;
  configuration_total_amount_formatted: string;
  configuration_total_recurring_amount_formatted: string;
  configuration_total_recurring_net_amount_formatted: string;
  configuration_net_amount_discounted_formatted: string;
  next_due_date: string | null;
  billing_cycle_months: number;
  service_identifier: string | null;
  status: { code: ContractStatusCodes; name: string };
  brand?: { tax_type: BrandTaxTypes; currency: { prefix: string } };
};

async function bootRecordedList(capture: RecordedList = recorded.list) {
  await seedClientSession();
  installBackgroundStubs();
  server?.use(
    http.get("*/contracts_products", () =>
      HttpResponse.json(capture(), { status: 200 })
    )
  );
  const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
  await collection.useActions().isReady();
  return collection;
}

const rowsOf = (capture: RecordedList) =>
  capture().data as unknown as RecordedRow[];
const recordedRows = () => rowsOf(recorded.list);

const STATUS_FLAG: Record<ContractStatusCodes, keyof ContractProduct["meta"]> =
  {
    [ContractStatusCodes.ACTIVE]: "isActive",
    [ContractStatusCodes.AWAITING_ACTIVATION]: "isAwaitingActivation",
    [ContractStatusCodes.CANCELLED]: "isCancelled",
    [ContractStatusCodes.CLOSED]: "isClosed",
    [ContractStatusCodes.FRAUD]: "isFraud",
    [ContractStatusCodes.PENDING]: "isPending",
    [ContractStatusCodes.SUSPENDED]: "isSuspended"
  };

/**
 * The English copy a `<namespace>.<path>` key resolves to: the upload source,
 * else the shipped catalogue for a namespace the source does not carry. The
 * harness never calls `useI18n().init()`, so `t()` hands back the key itself.
 */
function copyOf(key: string): unknown {
  const [namespace, ...path] = split(key, ".");
  const i18n = join(import.meta.dirname, "../../../../../i18n");
  const catalogue = find(
    [
      join(i18n, "src/core", `${namespace}-en.json`),
      join(i18n, "public/locales/en", `${namespace}.json`)
    ],
    file => existsSync(file)
  );
  return catalogue
    ? get(JSON.parse(readFileSync(catalogue, "utf-8")), path)
    : undefined;
}

const CYCLE_WORDS: Record<number, string> = {
  0: "One time",
  1: "Monthly",
  12: "Annually"
};

// -----------------------------------------------------------------------------

describe("useContractProducts — each list row carries the mapped columns (R38 items 8, 10)", () => {
  it("AC-1 each of my products shows the date I bought it", async () => {
    const collection = await bootRecordedList();
    const rows = recordedRows();

    expect(map(collection.useContext().data.value, "createdAt")).toEqual(
      map(rows, "created_at")
    );
    expect(every(rows, row => Boolean(row.created_at))).toBe(true);
  });

  it("AC-1 each of my products shows its price as my brand formats it", async () => {
    const collection = await bootRecordedList(recorded.listRows);
    const rows = rowsOf(recorded.listRows);

    const prices = map(collection.useContext().data.value, "priceFormatted");
    expect(prices).toHaveLength(rows.length);
    forEach(rows, (row, index) => {
      expect(prices[index]).toMatch(
        new RegExp(`^${escapeRegExp(row.brand!.currency.prefix)}\\d`)
      );
    });
  });

  it("AC-1 a subscription shows what it costs each time it renews, as my brand's tax rule prices it", async () => {
    const collection = await bootRecordedList(recorded.listRows);
    const rows = rowsOf(recorded.listRows);
    const byId = keyBy(collection.useContext().data.value, "id");
    const subscriptions = filter(rows, row => row.billing_cycle_months > 0);

    expect(
      every(
        subscriptions,
        row => row.brand?.tax_type === BrandTaxTypes.EXCLUDE_TAX
      )
    ).toBe(true);
    expect(
      some(
        subscriptions,
        row =>
          row.configuration_total_recurring_net_amount_formatted !==
          row.configuration_total_recurring_amount_formatted
      )
    ).toBe(true);
    forEach(subscriptions, row => {
      expect(byId[row.id]?.priceFormatted).toBe(
        row.configuration_total_recurring_net_amount_formatted
      );
    });
  });

  it("AC-1 a one-time purchase shows the price I paid for it, as my brand's tax rule prices it", async () => {
    const collection = await bootRecordedList(recorded.listRows);
    const rows = rowsOf(recorded.listRows);
    const byId = keyBy(collection.useContext().data.value, "id");
    const oneTime = filter(rows, row => row.billing_cycle_months === 0);

    expect(oneTime).not.toEqual([]);
    forEach(oneTime, row => {
      expect(row.brand?.tax_type).toBe(BrandTaxTypes.EXCLUDE_TAX);
      expect(row.configuration_net_amount_discounted_formatted).not.toBe(
        row.configuration_total_recurring_net_amount_formatted
      );
      expect(byId[row.id]?.priceFormatted).toBe(
        row.configuration_net_amount_discounted_formatted
      );
    });
  });

  it("AC-1 the product I open shows its price as my brand's tax rule prices it", async () => {
    await seedClientSession();
    installBackgroundStubs();
    const record = recorded.one().data as unknown as RecordedRow;
    server?.use(
      http.get("*/contract_products/:id", ({ params }) => {
        if (String(params.id) !== record.id) return undefined;
        return HttpResponse.json(recorded.one(), { status: 200 });
      })
    );

    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .withId(record.id);
    await manager.useActions().isReady();

    expect(record.billing_cycle_months).toBeGreaterThan(0);
    expect(record.brand?.tax_type).toBe(BrandTaxTypes.EXCLUDE_TAX);
    expect(record.configuration_total_recurring_amount_formatted).not.toBe(
      record.configuration_total_recurring_net_amount_formatted
    );
    expect(manager.useContext().contractProduct.value?.priceFormatted).toBe(
      record.configuration_total_recurring_net_amount_formatted
    );
  });

  it("AC-1 each of my products shows its status in words, with one flag for that status", async () => {
    const collection = await bootRecordedList(recorded.listRows);
    const rows = rowsOf(recorded.listRows);
    const byId = keyBy(collection.useContext().data.value, "id");

    expect(uniq(map(rows, "status.code")).length).toBeGreaterThan(1);
    forEach(rows, row => {
      const product = byId[row.id]!;
      expect(product.status?.name).toBe(row.status.name);
      expect(product.status?.name).not.toBe(row.status.code);
      const raised = keys(pickBy(product.meta, Boolean));
      expect(raised).toEqual([STATUS_FLAG[row.status.code]]);
    });
  });

  it("AC-1 each of my products shows how often it bills, in words", async () => {
    const collection = await bootRecordedList(recorded.listRows);
    const rows = rowsOf(recorded.listRows);
    const byId = keyBy(collection.useContext().data.value, "id");

    expect(sortBy(uniq(map(rows, "billing_cycle_months")))).toEqual([0, 1, 12]);
    forEach(rows, row => {
      expect(copyOf(byId[row.id]!.billingCycle)).toBe(
        CYCLE_WORDS[row.billing_cycle_months]
      );
    });
  });

  it("AC-1 my product shows when it next falls due and how often it bills", async () => {
    await seedClientSession();
    installBackgroundStubs();
    const record = recorded.one().data as unknown as RecordedRow;
    server?.use(
      http.get("*/contract_products/:id", ({ params }) => {
        if (String(params.id) !== record.id) return undefined;
        return HttpResponse.json(recorded.one(), { status: 200 });
      })
    );

    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .withId(record.id);
    await manager.useActions().isReady();

    expect(record.next_due_date).toBeTruthy();
    expect(manager.useContext().contractProduct.value?.nextDueDate).toBe(
      record.next_due_date
    );
    expect(manager.useContext().contractProduct.value?.billingCycleMonths).toBe(
      record.billing_cycle_months
    );
  });
});

type PickerControl = {
  scope?: string;
  options?: {
    lookup?: { service: () => { data: unknown } };
  };
};

/**
 * `@proves contract-product.feature:1106` — the picked option's value is the
 * id the manager loads by.
 */
describe("useContractProducts — the product picker (R38 item 2)", () => {
  it("Picking one of my products opens that very product", async () => {
    await seedClientSession();
    installBackgroundStubs();
    const page = recorded.list();
    const managerReads: string[] = [];
    server?.use(
      http.get("*/contracts_products", () =>
        HttpResponse.json(page, { status: 200 })
      ),
      http.get("*/contract_products/:id", ({ params }) => {
        managerReads.push(String(params.id));
        const refusal = recorded.readNotFound().response;
        return HttpResponse.json(refusal.body as Record<string, unknown>, {
          status: refusal.status
        });
      })
    );

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    const uischema = unref(
      collection.useContext().schemas.contractProductPicker.uischema
    ) as { elements?: PickerControl[] };
    const control = find(uischema.elements, element =>
      Boolean(element.options?.lookup)
    );
    expect(control?.scope).toMatch(/^#\/properties\//);

    const lookup = control!.options!.lookup!.service();
    await vi.waitFor(() => {
      expect(
        (unref(lookup.data) as { value: string }[] | undefined)?.length
      ).toBe(page.data.length);
    });
    const options = unref(lookup.data) as { value: string; label: string }[];
    expect(map(options, "value")).toEqual(map(page.data, "id"));
    expect(every(options, option => Boolean(option.label))).toBe(true);

    const picked = options[1]!.value;
    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .withId(picked);
    await manager
      .useActions()
      .isReady()
      .catch(() => undefined);

    await vi.waitFor(() => {
      expect(managerReads).toContain(picked);
    });
    expect(every(managerReads, id => id === picked)).toBe(true);
  });
});

type PickerLookupControl = {
  options: {
    lookup: {
      searchScope: string;
      service: () => Parameters<typeof useLookup>[0];
    };
  };
};

async function bootPicker() {
  await seedClientSession();
  installBackgroundStubs();
  const asked: URL[] = [];
  server?.use(
    http.get("*/contracts_products", ({ request }) => {
      asked.push(new URL(request.url));
      return HttpResponse.json(recorded.listRows(), { status: 200 });
    })
  );
  const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
  await collection.useActions().isReady();
  const listAsk = asked.at(-1)!;
  const uischema = unref(
    collection.useContext().schemas.contractProductPicker.uischema
  ) as { elements?: PickerControl[] };
  const control = find(uischema.elements, element =>
    Boolean(element.options?.lookup)
  ) as unknown as PickerLookupControl;
  const lookup = control.options.lookup.service();
  await vi.waitFor(() => {
    expect((unref(lookup.data) as unknown[] | undefined)?.length).toBe(
      recorded.listRows().data.length
    );
  });
  return { asked, control, listAsk, lookup };
}

/**
 * `@proves contract-product.feature:1153` · `@proves contract-product.feature:1159`
 * · `@proves contract-product.feature:1165`
 */
describe("useContractProducts — the product picker finds my products (G7, G8)", () => {
  it("The product picker names each product by its service identifier", async () => {
    const { lookup } = await bootPicker();
    const rows = rowsOf(recorded.listRows);
    const named = filter(rows, row => Boolean(row.service_identifier));
    const options = keyBy(
      unref(lookup.data) as { value: string; label: string }[],
      "value"
    );

    expect(named.length).toBeGreaterThan(1);
    forEach(named, row => {
      expect(options[row.id]?.label).toBe(row.service_identifier);
    });
  });

  it("Searching the product picker narrows it by service identifier", async () => {
    const { asked, control, lookup } = await bootPicker();
    const before = asked.length;

    useLookup(lookup, {
      searchScope: control.options.lookup.searchScope
    }).search("asdf");

    await vi.waitFor(() => {
      expect(
        some(asked.slice(before), url =>
          decodeURIComponent(url.search).includes(
            "filter[service_identifier|like]=%asdf%"
          )
        )
      ).toBe(true);
    });
  });

  it("The product picker offers the delegated products my list offers", async () => {
    const { asked, listAsk } = await bootPicker();
    const pickerAsk = asked.at(-1)!;

    expect(pickerAsk).not.toBe(listAsk);
    expect(listAsk.searchParams.has("exclude_delegated")).toBe(true);
    expect(pickerAsk.searchParams.get("exclude_delegated")).toBe(
      listAsk.searchParams.get("exclude_delegated")
    );
  });
});

describe("useContractProducts — a failed list read is reported (R38 item 6)", () => {
  it("AC-1 when my products cannot be read I am told my list has an error, with the reason the read returned", async () => {
    await seedClientSession();
    installBackgroundStubs();
    const failure = getFixture("get-contracts-products-case-list-failure", {
      recordingsDir
    }).response;
    expect(failure.status).toBeGreaterThanOrEqual(400);
    server?.use(
      http.get("*/contracts_products", () =>
        HttpResponse.json(failure.body as Record<string, unknown>, {
          status: failure.status
        })
      )
    );

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection
      .useActions()
      .isReady()
      .catch(() => undefined);

    await vi.waitFor(() => {
      expect(collection.useMeta().hasError.value).toBe(true);
    });
    const reason = (failure.body as { error: { message: string } }).error
      .message;
    expect(JSON.stringify(collection.useContext().error.value)).toContain(
      reason
    );
    expect(collection.useContext().data.value ?? []).toEqual([]);
  });
});
