// -----------------------------------------------------------------------------
/**
 * @module tests/dashboard-closure
 * @description Plan F5 O7, O8 and O4 — the three grouping-and-attention rows
 * the parity audit left open. Legacy's `contractProductsNeedsConfirmation`
 * showed the products it could not switch on yet, two at a time, each naming
 * the answers it is short of; `cProdsByGroup` folded the rest under group
 * headings; `ticketMessages` collapsed a run of messages from one voice.
 *
 * The panel's own gate is graded from BOTH sides against seeds mutated onto
 * the other side of it — a product waiting on nothing, and a running product
 * with an unanswered field — so neither the status nor the field alone can
 * pass for the rule. The two rendering facts are driven through the module
 * itself, since a config flag renders nothing on its own.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import { propsBinding, rowBinding } from "./support/page-config";
import {
  assign,
  every,
  filter,
  find,
  first,
  last,
  map,
  size,
  some
} from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRefId } from "~/portal/mock/data-refs";
import type {
  MockDataset,
  MockProduct,
  MockProvisionField,
  MockTicket
} from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { MOCK_ACTION, mockActionValue } from "~/portal/mock/actions";
import {
  DATA_REF_ID,
  dataRef,
  isDataRef,
  resolveDataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import List from "~/portal/modules/list/List.vue";
import { resolve } from "~/portal/resolve";
import { PAGE_KEY } from "~/portal/types";

const SHOWN_AT_ONCE = 2;

/** How many entries a thread draws before it offers the rest (plan F16 O-7). */
const THREAD_PAGE = 20;

const TIMELINE_TITLE = '[data-slot="timeline-title"]';

const LIST_ROW = '[data-test-key="portal-list-item"]';

const GROUP_TOGGLE = "button[aria-expanded]";

function dashboard() {
  return resolve(hostgridConfig, { pageKeys: [PAGE_KEY.DASHBOARD] }).content;
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: Record<string, string> = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function panelProps(id: DataRefId): ConfigNode | undefined {
  return propsBinding(dashboard(), id);
}

function isUnanswered(field: MockProvisionField): boolean {
  return (
    field.required === true &&
    (field.value === undefined || field.value === null || field.value === "")
  );
}

/** The products legacy's own filter would have returned, counted off the seed. */
function awaitingAnswers(data: MockDataset): MockProduct[] {
  return filter(
    data.products,
    product =>
      product.status === ContractStatusCodes.AWAITING_ACTIVATION &&
      some(product.provisioning.fields, isUnanswered)
  );
}

function setupItems(data: MockDataset): ListModuleItem[] {
  return ref<ListModuleItem[]>(data, DATA_REF_ID.NEEDS_ATTENTION_PRODUCT_ITEMS);
}

function seeded(data: MockDataset): MockProduct {
  const product = first(awaitingAnswers(data));
  if (product === undefined) {
    throw new Error("the seed carries no product waiting on an answer");
  }
  return product;
}

/** The shipped seed with every outstanding answer supplied. */
function everythingAnswered(): MockDataset {
  const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(data, {
    products: map(data.products, product =>
      assign({}, product, {
        provisioning: assign({}, product.provisioning, {
          fields: map(product.provisioning.fields, field =>
            assign({}, field, {
              value: isUnanswered(field) ? "answered" : field.value
            })
          )
        })
      })
    )
  });
}

/** The shipped seed with those same unanswered products already running. */
function everythingRunning(): MockDataset {
  const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(data, {
    products: map(data.products, product => {
      if (product.status !== ContractStatusCodes.AWAITING_ACTIVATION) {
        return product;
      }
      return assign({}, product, { status: ContractStatusCodes.ACTIVE });
    })
  });
}

/**
 * A thread with a second message that the timeline renders WHOLE: the feed
 * carries the standing changes too and stops at one page (plan F16 O-6, O-7),
 * so a thread longer than that, or one carrying entries its messages do not,
 * would be graded against rows it never drew.
 */
function unansweredTicket(data: MockDataset): MockTicket {
  const ticket = find(
    data.tickets,
    candidate =>
      size(candidate.messages) > 1 &&
      size(candidate.statusLog ?? []) === 0 &&
      size(candidate.messages) < THREAD_PAGE
  );
  if (ticket === undefined) {
    throw new Error(
      "the seed carries no whole-rendered thread with a second message"
    );
  }
  return ticket;
}

/** The seed's own thread with its last message answered again by the same voice. */
function withRepeatedAuthor(ticketId: string): MockDataset {
  const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(data, {
    tickets: map(data.tickets, ticket => {
      if (ticket.id !== ticketId) return ticket;
      const tail = last([...(ticket.messages ?? [])]);
      if (tail === undefined) return ticket;
      return assign({}, ticket, {
        messages: [
          ...(ticket.messages ?? []),
          assign({}, tail, {
            id: `${tail.id}-again`,
            sentAt: "2026-12-31T23:59:00Z",
            body: "One more thing on the same point."
          })
        ]
      });
    })
  });
}

describe("the products that cannot switch on yet", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("lists exactly the ones waiting on an answer the client owes", () => {
    const data = hostgrid();

    expect(awaitingAnswers(data).length).toBeGreaterThan(0);
    expect(map(setupItems(data), "id")).toEqual(
      map(awaitingAnswers(data), "id")
    );
  });

  it("names what each one is short of, in legacy's own words", () => {
    const data = hostgrid();
    const product = seeded(data);
    const outstanding = filter(product.provisioning.fields, isUnanswered);

    const card = find(setupItems(data), { id: product.id });

    expect(outstanding.length).toBeGreaterThan(0);
    expect(card?.description).toMatch(/almost ready/i);
    for (const field of outstanding) {
      expect(card?.description?.toLowerCase()).toContain(
        field.label.toLowerCase()
      );
    }
  });

  it("offers each one the way to finish it off", () => {
    const data = hostgrid();

    for (const card of setupItems(data)) {
      const product = find(data.products, { id: card.id });
      expect(card.action?.value).toBe(
        mockActionValue(
          MOCK_ACTION.NAVIGATE,
          `/${product?.groupSlug}/${card.id}/setup`
        )
      );
      expect(card.action?.label).toBeTruthy();
    }
  });

  it("shows two and holds the rest behind a control of its own", () => {
    const props = panelProps(DATA_REF_ID.NEEDS_ATTENTION_PRODUCT_ITEMS);

    expect(props?.maxItems).toBe(SHOWN_AT_ONCE);
    expect(props?.showMoreLabel).toBeTruthy();
  });

  it("the whole panel goes when every answer is in", () => {
    const data = hostgrid();
    const gate = rowBinding(
      dashboard(),
      DATA_REF_ID.NEEDS_ATTENTION_PRODUCT_ITEMS
    )?.visible;
    const answered = everythingAnswered();

    expect(isDataRef(gate)).toBe(true);
    if (!isDataRef(gate)) return;
    expect(seeded(data)).toBeDefined();
    expect(resolveDataRef(gate, data)).toBe(true);
    expect(awaitingAnswers(answered)).toEqual([]);
    expect(map(setupItems(answered), "id")).toEqual([]);
    expect(resolveDataRef(gate, answered)).toBe(false);
  });

  it("a running product with an unanswered field is not waiting on setup", () => {
    const running = everythingRunning();

    expect(
      some(running.products, product =>
        some(product.provisioning.fields, isUnanswered)
      )
    ).toBe(true);
    expect(awaitingAnswers(running)).toEqual([]);
    expect(setupItems(running)).toEqual([]);
  });
});

describe("the products a client already owns, read as groups", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("the panel asks for grouping, and every row carries what it groups by", () => {
    const data = hostgrid();
    const props = panelProps(DATA_REF_ID.ACTIVE_PRODUCT_ITEMS);

    const rows = ref<ListModuleItem[]>(data, DATA_REF_ID.ACTIVE_PRODUCT_ITEMS);

    expect(props?.grouped).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(every(rows, row => Boolean(row.category))).toBe(true);
  });

  it("a grouped list heads each run with its own name", () => {
    const wrapper = mount(List, {
      props: {
        variant: "compact",
        grouped: true,
        emptyTitle: "Nothing here",
        items: [
          { id: "a", title: "Alpha one", category: "Alpha" },
          { id: "b", title: "Alpha two", category: "Alpha" },
          { id: "c", title: "Beta one", category: "Beta" }
        ]
      }
    });

    const headers = wrapper.findAll(GROUP_TOGGLE);

    expect(headers).toHaveLength(2);
    expect(map(headers, header => header.text())).toEqual(["Alpha", "Beta"]);
    expect(wrapper.findAll(LIST_ROW)).toHaveLength(3);
  });

  it("folding a group away takes its rows with it, and unfolding brings them back", async () => {
    const wrapper = mount(List, {
      props: {
        variant: "compact",
        grouped: true,
        emptyTitle: "Nothing here",
        items: [
          { id: "a", title: "Alpha one", category: "Alpha" },
          { id: "b", title: "Alpha two", category: "Alpha" },
          { id: "c", title: "Beta one", category: "Beta" }
        ]
      }
    });
    const alpha = wrapper.findAll(GROUP_TOGGLE)[0];

    await alpha?.trigger("click");

    expect(wrapper.findAll(LIST_ROW)).toHaveLength(1);
    expect(wrapper.text()).not.toContain("Alpha one");
    expect(wrapper.text()).toContain("Beta one");
    expect(wrapper.findAll(GROUP_TOGGLE)[0]?.attributes("aria-expanded")).toBe(
      "false"
    );

    await wrapper.findAll(GROUP_TOGGLE)[0]?.trigger("click");

    expect(wrapper.findAll(LIST_ROW)).toHaveLength(3);
  });
});

describe("a support thread reads as voices, not as messages", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("marks a message continuing the voice above it, and only that one", () => {
    const ticket = unansweredTicket(hostgrid());
    const data = withRepeatedAuthor(ticket.id);
    const messages = find(data.tickets, { id: ticket.id })?.messages ?? [];

    const rows = ref<ListModuleItem[]>(data, DATA_REF_ID.TICKET_MESSAGE_ITEMS, {
      entityId: ticket.id
    });

    expect(rows).toHaveLength(messages.length);
    expect(map(rows, row => row.groupWithPrevious === true)).toEqual(
      map(
        messages,
        (message, index) =>
          index > 0 && messages[index - 1]?.author === message.author
      )
    );
    expect(some(rows, row => row.groupWithPrevious === true)).toBe(true);
  });

  it("a thread that changes voice every message marks none of them", () => {
    const data = hostgrid();
    const ticket = unansweredTicket(data);
    const authors = map(ticket.messages, "author");

    const rows = ref<ListModuleItem[]>(data, DATA_REF_ID.TICKET_MESSAGE_ITEMS, {
      entityId: ticket.id
    });

    expect(authors.length).toBeGreaterThan(1);
    expect(
      some(authors, (author, index) => authors[index - 1] === author)
    ).toBe(false);
    expect(every(rows, row => row.groupWithPrevious !== true)).toBe(true);
  });

  it("the timeline prints the name once for a run, and once per change of voice", () => {
    const run = mount(List, {
      props: {
        variant: "timeline",
        emptyTitle: "Nothing here",
        items: [
          { id: "a", title: "Ada", description: "First" },
          {
            id: "b",
            title: "Ada",
            description: "Second",
            groupWithPrevious: true
          }
        ]
      }
    });
    const alternating = mount(List, {
      props: {
        variant: "timeline",
        emptyTitle: "Nothing here",
        items: [
          { id: "a", title: "Ada", description: "First" },
          { id: "b", title: "Jonah", description: "Second" }
        ]
      }
    });

    expect(run.findAll(TIMELINE_TITLE)).toHaveLength(1);
    expect(run.text()).toContain("Second");
    expect(alternating.findAll(TIMELINE_TITLE)).toHaveLength(2);
  });
});
