// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/refinements-row.spec
 * @description T3.6 — the row that says what is narrowing the collection right
 * now (`G5` · `AC4.4` · `H1`). Four claims:
 *   1. one REMOVABLE chip per active leaf, named from the column's own declared
 *      title and its live value — the ui `Badge`'s own `close`, never a bespoke
 *      × drawn beside it (`D9`/`P1-R14`);
 *   2. removing one chip stops only that leaf narrowing, and leaves the others;
 *   3. Clear all empties every active leaf at once, and sits with the actions;
 *   4. the row carries NO count — the count joined the display row's Results
 *      label (`H1`), and the row is chips + Clear all and nothing else.
 *
 * ## What breaks if these fail
 * The Algolia refinements row goes back to being a second toolbar: a tally
 * nobody can trust (we hold one page, so any number is a lie) beside chips that
 * report a narrowing without offering to lift it.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { createI18n } from "vue-i18n";
import { internalKits } from "@upmind-automation/headless/testing";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import { Badge } from "@upmind-automation/upmind-ui";
import labsEn from "../../../../../app/assets/locales/en/labs.json";
import RefinementsRow from "../RefinementsRow.vue";
import { each, get, indexOf, map } from "lodash-es";
import type { ModulePortCriteria } from "../../composables/useModulePort.types";

const { useQuerySchema, useQueryUischema } =
  await internalKits["client-email"]();

// -----------------------------------------------------------------------------

const SEARCH_TERM = "mock";

/** Two declared leaves, both narrowing — the AC4.4 read-back's own state. */
const NARROWED = {
  filters: { verified: { eq: false }, email: { like: SEARCH_TERM } }
};

const messages = { en: { action, labs: labsEn, text } };

const translate = createI18n({ legacy: false, locale: "en", messages }).global
  .t;

/** The catalogue's own chip sentence, so no label is spelled twice. */
const chipLabel = (label: string, value: string) =>
  translate("labs.refinement", { label, value });

function criteriaOn(model: Record<string, unknown>): ModulePortCriteria {
  const live = ref(model);
  return {
    schema: useQuerySchema(),
    uischema: useQueryUischema(),
    model: computed(() => live.value),
    set: vi.fn()
  };
}

function mountRow(model: Record<string, unknown> = NARROWED) {
  const criteria = criteriaOn(model);
  const wrapper = mount(RefinementsRow, {
    attachTo: document.body,
    props: { criteria },
    global: {
      plugins: [createI18n({ legacy: false, locale: "en", messages })]
    }
  });

  return { wrapper, criteria };
}

type Row = ReturnType<typeof mountRow>["wrapper"];

/**
 * The chips as the DOM carries them. `Badge.ce.vue` opens with a comment node,
 * so its component wrapper is a fragment whose `element` is that comment — the
 * hooks are read off the rendered node and the component is used only for the
 * contract the DOM cannot show (its `close` prop, its `close` event).
 */
const chips = (wrapper: Row) => wrapper.findAll('[data-test-key="refinement"]');

const chipIds = (wrapper: Row) =>
  map(chips(wrapper), chip => chip.attributes("data-test-value"));

const badges = (wrapper: Row) => wrapper.findAllComponents(Badge);

const chipFor = (wrapper: Row, id: string) =>
  badges(wrapper)[indexOf(chipIds(wrapper), id)];

const CLEAR_ALL = '[data-test-key="clear-all"]';

// -----------------------------------------------------------------------------

describe("T3.6 one chip per active refinement (G5 · AC4.4)", () => {
  it("lists every active leaf, keyed by its declared column and operator", () => {
    const { wrapper } = mountRow();

    expect(chipIds(wrapper)).toEqual(["email.like", "verified.eq"]);
  });

  it("names each chip from the column's own declared title and its live value", () => {
    const { wrapper } = mountRow();

    expect(map(chips(wrapper), chip => chip.text())).toEqual([
      chipLabel(translate("text.email_address"), SEARCH_TERM),
      chipLabel(translate("text.verified_label"), translate("text.no"))
    ]);
  });

  it("lists nothing at all while the collection is unnarrowed", () => {
    const { wrapper } = mountRow({ filters: {} });

    expect(chips(wrapper)).toHaveLength(0);
    expect(wrapper.find(CLEAR_ALL).exists()).toBe(false);
  });

  it("draws each chip as the ui Badge's own removable form, never a bespoke ×", () => {
    const { wrapper } = mountRow();

    expect(map(badges(wrapper), chip => chip.props("close"))).toEqual([
      true,
      true
    ]);
  });
});

describe("T3.6 removing a refinement lifts only that one (AC4.4)", () => {
  it("clears the leaf the chip names", () => {
    const { wrapper, criteria } = mountRow();

    chipFor(wrapper, "verified.eq").vm.$emit("close");

    expect(criteria.set).toHaveBeenCalledTimes(1);
    const written = vi.mocked(criteria.set).mock.calls[0][0];
    expect(get(written, "filters.verified.eq", null)).toBeNull();
  });

  it("leaves every other leaf narrowing", () => {
    const { wrapper, criteria } = mountRow();

    chipFor(wrapper, "verified.eq").vm.$emit("close");

    const written = vi.mocked(criteria.set).mock.calls[0][0];
    expect(get(written, "filters.email.like", SEARCH_TERM)).toBe(SEARCH_TERM);
  });
});

describe("T3.6 Clear all returns the whole collection (AC4.4)", () => {
  it("empties every active leaf in one write", async () => {
    const { wrapper, criteria } = mountRow();

    await wrapper.find(CLEAR_ALL).trigger("click");

    expect(criteria.set).toHaveBeenCalledTimes(1);
    const written = vi.mocked(criteria.set).mock.calls[0][0];
    each(["verified.eq", "email.like"], leaf =>
      expect(get(written, `filters.${leaf}`, null)).toBeNull()
    );
  });

  it("sits with the actions, after the chips it clears (G5)", () => {
    const { wrapper } = mountRow();
    const clearAll = wrapper.find(CLEAR_ALL).element;
    const lastChip = chips(wrapper)[1].element;

    expect(
      lastChip.compareDocumentPosition(clearAll) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(wrapper.element.contains(clearAll)).toBe(true);
  });
});

describe("T3.6 the row carries no count (H1)", () => {
  it("renders no tally of its own chips, and no Results label", () => {
    const { wrapper } = mountRow();

    expect(wrapper.find('[data-test-key="refinements-count"]').exists()).toBe(
      false
    );
    expect(wrapper.text()).not.toContain(translate("labs.results"));
    expect(/\d/.test(wrapper.text())).toBe(false);
  });

  it("still renders no count where every declared leaf is narrowing", () => {
    const { wrapper } = mountRow({
      filters: {
        verified: { eq: false },
        bounced: { eq: true },
        email: { like: SEARCH_TERM }
      }
    });

    expect(chips(wrapper)).toHaveLength(3);
    expect(/\d/.test(wrapper.text())).toBe(false);
  });
});
