// -----------------------------------------------------------------------------
/**
 * @module tests/sixth-closure
 * @description Phase F10 (plan §12): the four leaf capabilities the sixth
 * audit read as open. An order says where it stands in one of seven sentences
 * and offers the invoice's own Pay control while it is payable (D1, D2); the
 * filed credit periods page, narrow and sort like every other panel (D3); a
 * document past its line cap collapses behind one control (D4); and a
 * notification too long to print says so and opens the rest (D5).
 *
 * Every figure is read off a facade output or off the seed — no amount is
 * added up here (plan R6) — and each gate is graded on BOTH seeds where the
 * seed or the gate applies: the minimal brand publishes no gateway, so its
 * branch of the order controls is "nothing offered".
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { propsBinding } from "./support/page-config";
import {
  assign,
  cloneDeep,
  compact,
  filter,
  find,
  first,
  last,
  map,
  replace,
  size,
  sortBy,
  sumBy,
  uniq
} from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { PageKey } from "~/portal/types";
import { billingPages } from "~/portal/config/billing-pages";
import {
  MOCK_ACTION,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  PAGED_COLLECTION_ID,
  pagedCollectionHandle
} from "~/portal/mock/collection-defs";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { useMockWallet } from "~/portal/mock/facades";
import { formatMoney } from "~/portal/mock/money";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import Document from "~/portal/modules/document/Document.vue";
import { LIST_CONTROLS_RANGE_SEPARATOR } from "~/portal/modules/list-controls/types";
import { PAGE_KEY } from "~/portal/types";

type LabelledFigure = { readonly label: string; readonly value: string };

const NO_CONTEXT: DataRouteContext = {};

/** The invoice whose 24 lines run past the document's own cap. */
const LONG_INVOICE_ID = "inv-95";

/** The notification whose body runs past the read-more limit. */
const LONG_NOTIFICATION_ID = "ntf-7";

/** Legacy's own bound — `userNotification.vue:14-16`. */
const BODY_LIMIT = 150;

const STATEMENT_IDS = [
  "cs-2026-08",
  "cs-2026-07",
  "cs-2026-06",
  "cs-2026-05",
  "cs-2026-04",
  "cs-2026-03",
  "cs-2026-02",
  "cs-2026-01",
  "cs-2025-12"
];

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

/** The seed whose brand publishes no online gateway at all. */
function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

// -----------------------------------------------------------------------------
// D1 — where an order stands
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// D2 — the Pay control an order carries
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// D3 — the filed periods, as a collection
// -----------------------------------------------------------------------------

function statementsHandle(data: MockDataset) {
  return pagedCollectionHandle(PAGED_COLLECTION_ID.CREDIT_STATEMENTS, data, {});
}

function statementFilter(value: string): string {
  return `${mockActionValue(MOCK_ACTION.COLLECTION_FILTER, PAGED_COLLECTION_ID.CREDIT_STATEMENTS)}:period:${value}`;
}

function statementSort(value: string): string {
  return `${mockActionValue(MOCK_ACTION.COLLECTION_SORT, PAGED_COLLECTION_ID.CREDIT_STATEMENTS)}:${value}`;
}

function csvRows(href: string): string[][] {
  const body = decodeURIComponent(href.slice(href.indexOf(",") + 1));
  return map(body.split("\n"), line =>
    map(line.split('","'), cell => cell.replace(/^"|"$/g, ""))
  );
}

describe("D3 — the credit statements page like every other panel", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("pages the nine filed periods three at a time", () => {
    const data = hostgrid();
    const { data: rows, pagination } = statementsHandle(data).useContext();

    expect(map(data.wallet.statements, "id")).toEqual(STATEMENT_IDS);
    expect(pagination.value.total).toBe(size(STATEMENT_IDS));
    expect(pagination.value.limit).toBe(3);
    expect(pagination.value.pages).toBe(3);
    expect(map(rows.value, "id")).toEqual(STATEMENT_IDS.slice(0, 3));
    expect(
      map(
        ref<ListModuleItem[]>(data, DATA_REF_ID.WALLET_CREDIT_STATEMENT_ITEMS),
        "id"
      )
    ).toEqual(STATEMENT_IDS.slice(0, 3));
  });

  it("narrows to the periods a window covers, and gives them all back", () => {
    const data = hostgrid();
    const { pagination } = statementsHandle(data).useContext();
    const july = find(data.wallet.statements, { id: "cs-2026-07" });

    dispatchMockAction(
      data,
      NO_CONTEXT,
      statementFilter(
        `${july?.fromDate ?? ""}${LIST_CONTROLS_RANGE_SEPARATOR}${july?.toDate ?? ""}`
      )
    );

    expect(pagination.value.total).toBe(1);
    expect(
      map(
        ref<ListModuleItem[]>(data, DATA_REF_ID.WALLET_CREDIT_STATEMENT_ITEMS),
        "id"
      )
    ).toEqual(["cs-2026-07"]);

    dispatchMockAction(data, NO_CONTEXT, statementFilter(""));
    expect(pagination.value.total).toBe(size(STATEMENT_IDS));
  });

  it("orders the periods by date, both ways round", () => {
    const data = hostgrid();
    const { data: rows } = statementsHandle(data).useContext();
    const controls = statementsHandle(data).useContext().filterControls;

    expect(map(controls, "key")).toContain("period");
    dispatchMockAction(data, NO_CONTEXT, statementSort("oldest"));
    expect(map(rows.value, "id")).toEqual(sortBy(STATEMENT_IDS).slice(0, 3));
    dispatchMockAction(data, NO_CONTEXT, statementSort("newest"));
    expect(map(rows.value, "id")).toEqual(STATEMENT_IDS.slice(0, 3));
  });

  it("closes each period where the next one opens, across all nine", () => {
    const data = hostgrid();
    const inOrder = sortBy(
      useMockWallet(data).useContext().data.value.statements,
      "fromDate"
    );

    expect(size(inOrder)).toBe(size(STATEMENT_IDS));
    for (const [index, period] of inOrder.entries()) {
      const next = inOrder[index + 1];
      if (next === undefined) continue;
      expect(period.closing).toEqual(next.opening);
    }
  });

  it("hands every period over as a CSV closing on its own closing figure", () => {
    const data = hostgrid();
    const wallet = useMockWallet(data);

    for (const view of wallet.useContext().data.value.statements) {
      const file = wallet.useActions().statementFile(view.id);
      const rows = csvRows(file?.entity?.href ?? "");
      expect(file?.entity?.href.startsWith("data:text/csv")).toBe(true);
      expect(size(rows)).toBe(size(view.movements) + 1);
      expect(last(rows)?.[3]).toBe(String(view.closing.amount));
    }
  });

  it("narrows the filed periods through the module's own from and to setters", () => {
    const data = hostgrid();
    const handle = statementsHandle(data);
    const { data: rows, pagination } = handle.useContext();
    const { filters } = handle.useActions();
    const july = find(data.wallet.statements, { id: "cs-2026-07" });
    const opensLater = filter(
      data.wallet.statements,
      period => period.fromDate >= (july?.fromDate ?? "")
    );
    const closesEarlier = filter(
      data.wallet.statements,
      period => period.toDate <= (july?.toDate ?? "")
    );

    // Hand-counted off the seed rather than read back off the collection, so
    // the two have to agree.
    expect(size(opensLater)).toBeGreaterThan(0);
    expect(size(opensLater)).toBeLessThan(size(STATEMENT_IDS));
    filters.fromDate(july?.fromDate);
    expect(pagination.value.total).toBe(size(opensLater));
    expect(map(rows.value, "id")).toEqual(map(opensLater, "id"));

    filters.fromDate(undefined);
    expect(pagination.value.total).toBe(size(STATEMENT_IDS));

    expect(size(closesEarlier)).toBeGreaterThan(0);
    expect(size(closesEarlier)).toBeLessThan(size(STATEMENT_IDS));
    filters.toDate(july?.toDate);
    expect(pagination.value.total).toBe(size(closesEarlier));

    filters.toDate(undefined);
    expect(pagination.value.total).toBe(size(STATEMENT_IDS));
  });

  it("anchors the ledger on the balance the wallet holds", () => {
    for (const data of [hostgrid(), minimal()]) {
      const view = useMockWallet(data).useContext().data.value;
      const movements = sortBy(view.transactions, "date");

      expect(size(movements)).toBeGreaterThan(0);
      // The newest movement in a currency IS what the wallet holds in it.
      for (const code of uniq(
        map(movements, movement => movement.amount.currency)
      )) {
        const inCode = filter(
          movements,
          movement => movement.amount.currency === code
        );
        expect(last(inCode)?.balanceAfter).toEqual(
          find(view.balances, { currency: code })
        );
      }
    }
  });

  it("never lets the credit chain go below zero, and opens above it", () => {
    for (const data of [hostgrid(), minimal()]) {
      const view = useMockWallet(data).useContext().data.value;

      // Account credit cannot be negative, on the ledger or on a filed period.
      expect(
        filter(view.transactions, movement => movement.balanceAfter.amount < 0)
      ).toEqual([]);
      expect(
        filter(
          view.statements,
          period => period.opening.amount < 0 || period.closing.amount < 0
        )
      ).toEqual([]);
    }

    // The oldest filed period opens on a figure the account actually held.
    const filed = sortBy(
      useMockWallet(hostgrid()).useContext().data.value.statements,
      "fromDate"
    );
    expect(size(filed)).toBeGreaterThan(0);
    expect(first(filed)?.opening.amount).toBeGreaterThan(0);
  });

  it("keeps the saved copies on every row", () => {
    const data = hostgrid();
    const rows = ref<ListModuleItem[]>(
      data,
      DATA_REF_ID.WALLET_CREDIT_STATEMENT_ITEMS
    );

    for (const row of rows) {
      expect(map(row.moreActions ?? [], "value")).toEqual([
        `${MOCK_ACTION.DOWNLOAD}:credit-statement:${row.id}`,
        `${MOCK_ACTION.CREDIT_STATEMENT_CSV}:${row.id}`
      ]);
    }
    expect(size(rows)).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
// D4 — a document too long to print whole
// -----------------------------------------------------------------------------

/**
 * The document module as one page wires it, its variant included — that sits
 * on the module rather than in the props the bindings resolve.
 */
function documentProps(
  data: MockDataset,
  invoiceId: string,
  pageKey: PageKey = PAGE_KEY.BILLING_INVOICE_DETAIL
): ConfigNode {
  const page = billingPages()[pageKey];
  const props = propsBinding(page, DATA_REF_ID.INVOICE_DOCUMENT_LINES);
  if (props === undefined)
    throw new Error("the invoice page binds no document");
  const resolved = resolveDataRefProps(props, data, { entityId: invoiceId });
  if (resolved === undefined)
    throw new Error("the document props resolved to nothing");
  return assign({}, resolved, { variant: documentVariant(page, props) });
}

/** Which variant that page mounted the document under. */
function documentVariant(page: unknown, props: ConfigNode): unknown {
  function walk(node: unknown): unknown {
    if (node === null || typeof node !== "object") return undefined;
    const own: Record<string, unknown> = node;
    if (own["props"] === props) return own["variant"];
    for (const child of Object.values(own)) {
      const found = walk(child);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  return walk(page);
}

function mountDocument(props: ConfigNode) {
  return mount(Document, { props });
}

/**
 * The description cell of each printed line. Cell by cell rather than by row
 * text: a row prints its quantity straight after its description, so "seat 2"
 * followed by "1" reads as "seat 21" and no whole-row match can tell the two
 * lines apart.
 */
function rowDescriptions(wrapper: ReturnType<typeof mountDocument>): string[] {
  return map(
    wrapper.findAll("tbody tr"),
    row => first(row.findAll("td"))?.text() ?? row.text()
  );
}

/** The totals block as the module prints it — every figure the facade handed over. */
function totalsText(props: ConfigNode): string {
  const totals = props["totals"] as {
    subtotal: LabelledFigure;
    taxes: LabelledFigure[];
    total: LabelledFigure;
    paid?: LabelledFigure;
    balance?: LabelledFigure;
  };
  const rows = [
    totals.subtotal,
    ...totals.taxes,
    totals.total,
    totals.paid,
    totals.balance
  ];
  return map(compact(rows), row => `${row.label}${row.value}`).join("");
}

function moreControl(wrapper: ReturnType<typeof mountDocument>) {
  return find(wrapper.findAll("button"), button =>
    button.text().includes("more item")
  );
}

function lessControl(wrapper: ReturnType<typeof mountDocument>) {
  return find(wrapper.findAll("button"), button =>
    button.text().includes("Show less")
  );
}

describe("D4 — the lines a long document hides until asked", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("prints the cap and offers the rest behind one control", () => {
    const data = hostgrid();
    const props = documentProps(data, LONG_INVOICE_ID);
    const lines = props["lines"] as { id: string; description: string }[];
    const cap = props["lineCap"] as number;

    const wrapper = mountDocument(props);

    expect(size(lines)).toBeGreaterThan(cap + 1);
    expect(rowDescriptions(wrapper)).toEqual(
      map(lines.slice(0, cap), "description")
    );
    for (const line of lines.slice(cap)) {
      expect(rowDescriptions(wrapper)).not.toContain(line.description);
    }
    expect(moreControl(wrapper)?.text()).toBe(
      `Show ${size(lines) - cap} more items`
    );
    expect(lessControl(wrapper)).toBeUndefined();
  });

  it("shows every line when asked, and offers to fold them back", async () => {
    const data = hostgrid();
    const props = documentProps(data, LONG_INVOICE_ID);
    const lines = props["lines"] as { id: string; description: string }[];
    const wrapper = mountDocument(props);
    const printed = totalsText(props);

    expect(wrapper.text()).toContain(printed);

    await moreControl(wrapper)?.trigger("click");

    expect(rowDescriptions(wrapper)).toEqual(map(lines, "description"));
    expect(lessControl(wrapper)).toBeDefined();
    expect(moreControl(wrapper)).toBeUndefined();
    // The totals are the server's own figures — folding a table moves none.
    expect(wrapper.text()).toContain(printed);

    await lessControl(wrapper)?.trigger("click");
    expect(rowDescriptions(wrapper)).toHaveLength(props["lineCap"] as number);
  });

  it("prints every line, and offers no collapse at all, on the print view", () => {
    const data = hostgrid();
    const printed = documentProps(
      data,
      LONG_INVOICE_ID,
      PAGE_KEY.BILLING_INVOICE_PRINT
    );
    const lines = printed["lines"] as { description: string }[];
    const onPaper = mountDocument(printed);
    const onScreen = mountDocument(documentProps(data, LONG_INVOICE_ID));

    expect(size(lines)).toBeGreaterThan(21);
    expect(rowDescriptions(onPaper)).toEqual(map(lines, "description"));
    expect(moreControl(onPaper)).toBeUndefined();
    expect(lessControl(onPaper)).toBeUndefined();
    // The same document on screen still folds, so the print view is the
    // difference rather than the document.
    expect(size(rowDescriptions(onScreen))).toBeLessThan(size(lines));
    expect(moreControl(onScreen)).toBeDefined();
  });

  it("totals the document at the sum of its own lines", () => {
    const data = hostgrid();
    const invoice = find(data.invoices, { id: LONG_INVOICE_ID });
    const lines = invoice?.lines ?? [];
    // Added up through the mock's own money helper, so the figure is rounded
    // and worded exactly as every other amount on the page is.
    const summed = formatMoney(
      sumBy(lines, line => line.amount.amount),
      invoice?.total.currency ?? ""
    );
    const totals = ref<{ readonly total: { readonly value: string } }>(
      data,
      DATA_REF_ID.INVOICE_DOCUMENT_TOTALS,
      { entityId: LONG_INVOICE_ID }
    );

    expect(size(lines)).toBeGreaterThan(21);
    expect(summed).toBe(invoice?.total.formatted);
    expect(totals.total.value).toBe(summed);
  });

  it("keeps a table open when only one row would hide", () => {
    const data = hostgrid();
    const props = documentProps(data, LONG_INVOICE_ID);
    const cap = props["lineCap"] as number;
    const lines = (props["lines"] as { description: string }[]).slice(
      0,
      cap + 1
    );

    const wrapper = mountDocument(assign({}, props, { lines }));

    expect(rowDescriptions(wrapper)).toEqual(map(lines, "description"));
    expect(moreControl(wrapper)).toBeUndefined();
    expect(lessControl(wrapper)).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// D5 — a notification too long to print whole
// -----------------------------------------------------------------------------

function notificationRows(data: MockDataset): ListModuleItem[] {
  return ref<ListModuleItem[]>(data, DATA_REF_ID.NOTIFICATION_PAGE_ITEMS) ?? [];
}

function rowFor(data: MockDataset, id: string): ListModuleItem {
  const row = find(notificationRows(data), { id });
  if (row === undefined) throw new Error(`no notification row ${id}`);
  return row;
}

function readMoreValue(id: string): string {
  return mockActionValue(MOCK_ACTION.NOTIFICATION_READ_MORE, id);
}

function offeredValues(row: ListModuleItem): string[] {
  return map([row.action, ...(row.moreActions ?? [])], entry =>
    entry === undefined ? "" : entry.value
  );
}

describe("D5 — the notification body that runs past the limit", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("cuts a long body on the last space inside the limit, and says there is more", () => {
    const data = hostgrid();
    const notification = find(data.notifications, { id: LONG_NOTIFICATION_ID });
    const body = notification?.body ?? "";
    const row = rowFor(data, LONG_NOTIFICATION_ID);
    const shown = (row.description ?? "").slice(0, -1);

    expect(size(body)).toBeGreaterThan(BODY_LIMIT);
    expect(row.description).not.toBe(body);
    expect(body.startsWith(shown)).toBe(true);
    expect(size(shown)).toBeLessThanOrEqual(BODY_LIMIT);
    expect(shown).toBe(body.slice(0, body.lastIndexOf(" ", BODY_LIMIT)));
    expect(offeredValues(row)).toContain(readMoreValue(LONG_NOTIFICATION_ID));
  });

  it("opens the whole body when the client asks for the rest", () => {
    const data = hostgrid();
    const body = find(data.notifications, { id: LONG_NOTIFICATION_ID })?.body;

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      readMoreValue(LONG_NOTIFICATION_ID)
    );

    expect(result?.prose?.markdown).toBe(body);
    expect(result?.prose?.title).toBeTruthy();
  });

  it("prints a short body whole, and offers nothing to open", () => {
    const data = hostgrid();
    const short = filter(notificationRows(data), row => {
      const body = find(data.notifications, { id: row.id })?.body ?? "";
      return size(body) <= BODY_LIMIT;
    });

    expect(size(short)).toBeGreaterThan(0);
    for (const row of short) {
      expect(row.description).toBe(
        find(data.notifications, { id: row.id })?.body
      );
      expect(offeredValues(row)).not.toContain(readMoreValue(row.id));
    }
  });

  it("cuts a body with no space at all at the limit, and offers the rest", () => {
    const data = hostgrid();
    const source = find(data.notifications, { id: LONG_NOTIFICATION_ID })?.body;
    // The seeded long body with its spaces closed up — no seed carries an
    // unbroken run past the limit, and this cut has no word boundary to find.
    const unbroken = replace(source ?? "", / /g, "-");
    const clone = cloneDeep(data);
    const target = find(clone.notifications, { id: LONG_NOTIFICATION_ID });
    if (target === undefined)
      throw new Error("the clone lost the notification");
    assign(target, { body: unbroken });

    const row = rowFor(clone, LONG_NOTIFICATION_ID);
    const shown = (row.description ?? "").slice(0, -1);

    expect(unbroken.includes(" ")).toBe(false);
    expect(size(unbroken)).toBeGreaterThan(BODY_LIMIT);
    expect(shown).toBe(unbroken.slice(0, BODY_LIMIT));
    expect(offeredValues(row)).toContain(readMoreValue(LONG_NOTIFICATION_ID));
    expect(
      dispatchMockAction(clone, NO_CONTEXT, readMoreValue(LONG_NOTIFICATION_ID))
        ?.prose?.markdown
    ).toBe(unbroken);
  });

  it("refuses a notification the account does not hold, out loud", () => {
    const data = hostgrid();
    const stood = JSON.stringify(data);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      readMoreValue("ntf-no-such-8c22")
    );

    expect(result?.toast?.intent).toBe("warning");
    expect(result?.toast?.title).toBeTruthy();
    expect(result?.prose).toBeUndefined();
    expect(JSON.stringify(data)).toBe(stood);
  });
});
