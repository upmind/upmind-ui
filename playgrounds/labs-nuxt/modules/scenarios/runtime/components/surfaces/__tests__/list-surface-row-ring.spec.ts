// -----------------------------------------------------------------------------
/**
 * @module surfaces/__tests__/list-surface-row-ring.spec
 * @description T3.9 — how a refused action marks the record it failed on
 * (`AC6.1`–`AC6.5` · `H6` · `H8` · `H10` · `F4` · `G7`). Five claims:
 *   1. NO red fill: the refused row's own surface treatment equals a normal
 *      row's, so what marks it is a ring around it rather than a wash over it
 *      (`H8`, and today's `bg-accent-danger-muted` is exactly what must go);
 *   2. the record is `aria-invalid`, and no other record is — the mark reaches
 *      assistive technology, not only the eye;
 *   3. the ring is the ui package's OWN invalid-ring vocabulary, reached through
 *      the composable the operator ruled for it (`useInvalidRing`, `ESC2`
 *      2026-08-12: raw class-string constants never go on the barrel), and it
 *      renders as the same treatment an invalid ui `Input` wears — with no
 *      outline or ring token from outside that vocabulary, so there is one
 *      error-outline technique system-wide (`H10`, `AC6.3`);
 *   4. the ring encloses the row AND its message as ONE unit, with the next
 *      record plainly outside it (`F4`/`G7`);
 *   5. the row's geometry is untouched — same cells, same cell treatment, no
 *      height or padding token added — which is why the technique is an
 *      `outline` in the first place (`AC6.1`/`E7`), and the card carries the
 *      identical treatment (`H8` has no per-view exception).
 *
 * The refusal is the recorded 409 the capture run got back from staging
 * (`put-clients-id-emails-id-case-set-default-unverified.json`), fired through
 * the surface's own declared action — never a rendering flag set by hand.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import { Card, Input, useInvalidRing } from "@upmind-automation/upmind-ui";
import labsEn from "../../../../../../app/assets/locales/en/labs.json";
import {
  defaultRow,
  recordedRejection,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import {
  CONTROL_TEST_VALUE,
  OVERFLOW_TRIGGER_TEST_VALUE
} from "../../__tests__/control-test-values";
import { ListSurface, ListViewTypes } from "../index";
import {
  difference,
  every,
  filter,
  find,
  intersection,
  isEmpty,
  map,
  reject,
  some,
  split,
  union
} from "lodash-es";
import type { ControlledTableChannel } from "@upmind-automation/scenario-harness";
import type { DOMWrapper, VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const rows = [defaultRow, unverifiedRow];

/** The record the recorded 409 answers a set-default on. */
const REFUSED = 1;

const REFUSED_ACTION = "setDefault";

const messages = { en: { action, labs: labsEn, text } };

const table: ControlledTableChannel = {
  read: () => ({
    filter: {},
    sort: [],
    pagination: { page: 1, perPage: 10, total: rows.length }
  }),
  emit: vi.fn()
};

function mountList() {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: [REFUSED_ACTION],
        context: { data: rows },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions: {
        [REFUSED_ACTION]: vi.fn().mockRejectedValue(recordedRejection())
      },
      presentation: clientEmails.presentation,
      table
    },
    global: {
      plugins: [createI18n({ legacy: false, locale: "en", messages })]
    }
  });
}

type Wrapper = ReturnType<typeof mountList>;

const tokensOf = (element: Element) =>
  reject(split(element.className, /\s+/), isEmpty);

/** Whatever paints a surface: a fill, or the contrast text that comes with one. */
const fillTokens = (element: Element) =>
  filter(
    tokensOf(element),
    token => /^bg-/.test(token) || /-contrast$/.test(token)
  );

const outlineTokens = (element: Element) =>
  filter(tokensOf(element), token => /^(outline|ring)/.test(token));

/** The vocabulary the ui composable emits — `ESC2`'s whole public surface. */
const COMPOSED_RING = split(useInvalidRing(), /\s+/);

/** An invalid ui form field: the technique `H10` says the row REUSES. */
const invalidInput = () =>
  mount(Input, {
    attachTo: document.body,
    attrs: { "aria-invalid": "true" }
  }).element;

/**
 * That vocabulary as a ui surface actually RENDERS it — the package's own class
 * merge subsumes the shorthand half of the outline, so the composable's raw
 * output is never what lands on an element.
 */
const renderedRing = (element: Element) =>
  intersection(tokensOf(element), COMPOSED_RING);

const INVALID_RING_TOKENS = renderedRing(invalidInput());

/** Every ring token a ui surface itself draws with. */
const UI_RING_TOKENS = union(COMPOSED_RING, outlineTokens(invalidInput()));

/** Activates a declared control wherever the scenario placed it. */
async function fire(wrapper: Wrapper, host: DOMWrapper<Element> | VueWrapper) {
  const beside = host.find(
    `[data-test-value="${CONTROL_TEST_VALUE[REFUSED_ACTION]}"]`
  );
  if (beside.exists()) {
    await beside.trigger("click");
  } else {
    await host
      .find(`[data-test-value="${OVERFLOW_TRIGGER_TEST_VALUE}"]`)
      .trigger("click");
    await new Promise(resolve => setTimeout(resolve, 0));
    document
      .querySelector(
        `[role="menuitem"] [data-test-value="${CONTROL_TEST_VALUE[REFUSED_ACTION]}"]`
      )
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }
  await flushPromises();
  await wrapper.vm.$nextTick();
}

/**
 * The table, with the recorded refusal already on record `REFUSED`, and what
 * that same record looked like before it. The baseline is the record's OWN
 * pre-error rendering, never a sibling: row 0 is the account's default address
 * and wears the default treatment, so comparing across records would measure
 * `D14`'s marker rather than the failure.
 */
async function refusedInTable() {
  const wrapper = mountList();
  const row = () => wrapper.findAll("tbody tr")[REFUSED]!.element;
  const before = {
    row: tokensOf(row()),
    cells: map(
      wrapper.findAll("tbody tr")[REFUSED]!.findAll("td"),
      cell => cell.element.className
    ),
    others: tokensOf(wrapper.findAll("tbody tr")[0]!.element)
  };

  await fire(wrapper, wrapper.findAll("tbody tr")[REFUSED]!);

  return { wrapper, before };
}

/**
 * The same refusal in the other view. The view is url state and the one writer
 * outlives any mount, so the reader hands the view back before the next case
 * boots into it.
 */
async function inCards(
  read: (state: {
    wrapper: Wrapper;
    cards: () => VueWrapper[];
    before: string[];
  }) => void | Promise<void>
) {
  const wrapper = mountList();
  await wrapper
    .find(`[data-test-value="${ListViewTypes.CARD}"]`)
    .trigger("click");
  const cards = () => wrapper.findAllComponents(Card);
  const before = tokensOf(cards()[REFUSED]!.element);

  await fire(wrapper, cards()[REFUSED]!);
  await read({ wrapper, cards, before });

  await wrapper
    .find(`[data-test-value="${ListViewTypes.TABLE}"]`)
    .trigger("click");
}

const marked = (wrapper: Wrapper) => wrapper.findAll('[aria-invalid="true"]');

/** The element the ring is drawn on — the enclosure the record is marked by. */
const ringHost = (wrapper: Wrapper) =>
  find(
    map(marked(wrapper), node => node.element),
    element => isEmpty(difference(INVALID_RING_TOKENS, tokensOf(element)))
  ) as HTMLElement | undefined;

const rowIn = (wrapper: Wrapper, index: number) =>
  wrapper.findAll("tbody tr")[index]!.element;

// -----------------------------------------------------------------------------

describe("T3.9 a refusal is an outline, never a red fill (AC6.2 · H8)", () => {
  it("leaves the refused row's surface exactly as it was before it failed", async () => {
    const { wrapper, before } = await refusedInTable();

    expect(fillTokens(rowIn(wrapper, REFUSED))).toEqual(
      filter(
        before.row,
        token => /^bg-/.test(token) || /-contrast$/.test(token)
      )
    );
  });

  it("adds no fill of its own to the row it marks", async () => {
    const { wrapper, before } = await refusedInTable();

    expect(
      some(
        difference(tokensOf(rowIn(wrapper, REFUSED)), before.row),
        token => /^bg-/.test(token) || /-contrast$/.test(token)
      )
    ).toBe(false);
  });

  it("gives the CARD the identical treatment — H8 has no per-view exception", async () => {
    await inCards(({ cards, before }) => {
      expect(
        some(
          difference(tokensOf(cards()[REFUSED]!.element), before),
          token => /^bg-/.test(token) || /-contrast$/.test(token)
        )
      ).toBe(false);
    });
  });
});

describe("T3.9 the refused record is marked, and only it (AC6.3 · AC6.5)", () => {
  it("marks the record the action failed on as invalid", async () => {
    const { wrapper } = await refusedInTable();

    expect(rowIn(wrapper, REFUSED).getAttribute("aria-invalid")).toBe("true");
  });

  it("marks no other record", async () => {
    const { wrapper } = await refusedInTable();

    expect(rowIn(wrapper, 0).getAttribute("aria-invalid")).toBeNull();
  });

  it("marks the card the same way", async () => {
    await inCards(({ cards }) => {
      expect(cards()[REFUSED]!.attributes("aria-invalid")).toBe("true");
      expect(cards()[0]!.attributes("aria-invalid")).toBeUndefined();
    });
  });

  it("clears the mark when the user dismisses the failure", async () => {
    const { wrapper } = await refusedInTable();

    await wrapper.find('[data-test-value="dismiss"]').trigger("click");

    expect(marked(wrapper)).toHaveLength(0);
    expect(wrapper.findAll("tbody tr")).toHaveLength(rows.length);
  });
});

describe("T3.9 one error-outline vocabulary, the ui package's own (H10 · AC6.3)", () => {
  it("draws the ring the ui composable applies, exactly as an invalid Input wears it", async () => {
    const { wrapper } = await refusedInTable();
    const host = ringHost(wrapper);

    expect(host).toBeDefined();
    expect(renderedRing(host!)).toEqual(INVALID_RING_TOKENS);
    expect(some(INVALID_RING_TOKENS, token => /aria-invalid/.test(token))).toBe(
      true
    );
  });

  it("carries the ring on the element that is marked invalid — the variant fires nowhere else", async () => {
    const { wrapper } = await refusedInTable();

    expect(ringHost(wrapper)?.getAttribute("aria-invalid")).toBe("true");
  });

  it("defines no outline of its own beside it", async () => {
    const { wrapper } = await refusedInTable();

    expect(
      difference(outlineTokens(ringHost(wrapper)!), UI_RING_TOKENS)
    ).toEqual([]);
  });

  it("draws the card's ring from the same vocabulary", async () => {
    await inCards(({ cards }) => {
      const card = cards()[REFUSED]!.element;

      expect(difference(INVALID_RING_TOKENS, tokensOf(card))).toEqual([]);
      expect(difference(outlineTokens(card), UI_RING_TOKENS)).toEqual([]);
    });
  });
});

describe("T3.9 the row and its message are ONE unit (F4 · G7 · AC6.4)", () => {
  it("encloses the refused row and the reason together", async () => {
    const { wrapper } = await refusedInTable();
    const host = ringHost(wrapper)!;

    expect(host.contains(rowIn(wrapper, REFUSED))).toBe(true);
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
  });

  it("leaves the next record plainly outside it", async () => {
    const { wrapper } = await refusedInTable();

    expect(ringHost(wrapper)!.contains(rowIn(wrapper, 0))).toBe(false);
  });

  it("keeps the card's reason inside the card the ring is on", async () => {
    await inCards(({ cards }) => {
      expect(
        cards()[REFUSED]!.element.querySelector('[role="alert"]')
      ).not.toBeNull();
      expect(cards()[0]!.element.querySelector('[role="alert"]')).toBeNull();
    });
  });
});

describe("T3.9 the refused row keeps its geometry (AC6.1 · E7)", () => {
  it("keeps every column it had, treated exactly as it was", async () => {
    const { wrapper, before } = await refusedInTable();
    const after = map(
      wrapper.findAll("tbody tr")[REFUSED]!.findAll("td"),
      cell => cell.element.className
    );

    expect(after).toEqual(before.cells);
  });

  it("adds nothing to the row that could move it — the technique is an outline", async () => {
    const { wrapper, before } = await refusedInTable();
    const added = difference(tokensOf(rowIn(wrapper, REFUSED)), before.row);

    expect(
      every(added, token => !/^(h-|min-h-|py-|p-|m-|border-\d)/.test(token))
    ).toBe(true);
  });

  it("leaves every other record's row untouched", async () => {
    const { wrapper, before } = await refusedInTable();

    expect(tokensOf(rowIn(wrapper, 0))).toEqual(before.others);
  });
});
