// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 states — the two empty states are different sentences,
 * drawn inline, from the module's own answer (Task 55, W-D25).
 *
 * ## Job To Be Done
 * *Empty because nothing exists* and *empty because your filters match nothing*
 * used to be the same `Alert variant="minimal"` saying "No data" — so the only
 * screen that could tell the operator his filter was too narrow told him his
 * collection was gone. The state is read off `meta.isFiltered`, which the module
 * publishes, never a renderer-side reconstruction of the filter model.
 *
 * ## What Breaks If These Fail
 * The canary's filter bar becomes untestable by eye: every over-narrow filter
 * looks exactly like a broken fetch. And an `interstitial` that defaults to
 * `modal` traps the operator behind a dialog he has to dismiss to keep filtering.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import text from "@upmind-automation/i18n/core/text-en.json";
import { renderedStrings } from "../../../../../../tests/support/rendered";
import { ListSurface } from "../index";
import { includes } from "lodash-es";

// -----------------------------------------------------------------------------

const mountEmpty = (isFiltered: boolean) =>
  mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: [],
        context: { data: [] },
        meta: { isEmpty: true, isFiltered }
      },
      actions: {}
    }
  });

// -----------------------------------------------------------------------------

describe("@AC3 states — the two empty states (Task 55)", () => {
  it("an unfiltered empty collection says nothing EXISTS", () => {
    const strings = renderedStrings(mountEmpty(false));

    expect(strings).toContain(text.collection_empty);
    expect(strings).toContain(text.collection_empty_msg);
    expect(strings).not.toContain(text.results_not_found);
  });

  it("the SAME empty collection under a live filter says nothing MATCHES", () => {
    const strings = renderedStrings(mountEmpty(true));

    expect(strings).toContain(text.results_not_found);
    expect(strings).toContain(text.adjust_search_filters_msg);
    expect(strings).not.toContain(text.collection_empty);
  });

  it("the two states share no sentence — the whole point of splitting them", () => {
    const unfiltered = renderedStrings(mountEmpty(false));
    const filtered = renderedStrings(mountEmpty(true));

    expect(unfiltered).not.toEqual(filtered);
    for (const line of [text.collection_empty, text.collection_empty_msg]) {
      expect(includes(filtered, line)).toBe(false);
    }
  });

  it("both are the interstitial primitive, drawn INLINE — neither is a dialog", () => {
    for (const isFiltered of [false, true]) {
      const wrapper = mountEmpty(isFiltered);

      expect(
        wrapper.find('[data-test-key^="interstitial"]').exists(),
        `isFiltered=${isFiltered}`
      ).toBe(true);
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
      expect(wrapper.find("dialog").exists()).toBe(false);
      expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
    }
  });

  it("a collection with rows draws neither empty state", () => {
    const wrapper = mount(ListSurface, {
      attachTo: document.body,
      props: {
        snapshot: {
          actions: [],
          context: { data: [{ id: 1, address: "a@x.com" }] },
          meta: { isEmpty: false, isFiltered: true }
        },
        actions: {}
      }
    });

    const strings = renderedStrings(wrapper);
    expect(strings).not.toContain(text.collection_empty);
    expect(strings).not.toContain(text.results_not_found);
    expect(strings).toContain("a@x.com");
  });
});
