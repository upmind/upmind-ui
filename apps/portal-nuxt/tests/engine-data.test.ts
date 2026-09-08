// -----------------------------------------------------------------------------
/**
 * @module tests/engine-data
 * @description Plan F7: the two host seams the form engine cannot derive from
 * a schema — the reference data and the glyph component — provided ONCE in the
 * layout, before any form mounts. Both degrade silently when they are dropped
 * (`@upmind/ui` `src/form/README.md`): the country picker lists nothing and
 * every glyph disappears, with no error anywhere. That is precisely why the
 * wiring is graded here rather than left to a screenshot.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { every, map, sortBy, uniq } from "lodash-es";
import type { MockDataset } from "~/portal/mock/types";
import layoutSource from "~/layouts/default.vue?raw";
import {
  PORTAL_FORM_CURRENCIES,
  portalFormEngineData
} from "~/portal/mock/forms/engine-data";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import PortalFormIcon from "~/portal/shell/PortalFormIcon.vue";

const KNOWN_ICON = "check";

const UNKNOWN_ICON = "no-such-glyph-anywhere";

/** Every currency a dataset actually trades in, wherever a money value hangs. */
function currenciesIn(node: unknown, found: Set<string>): Set<string> {
  if (Array.isArray(node)) {
    for (const child of node) currenciesIn(child, found);
    return found;
  }
  if (typeof node !== "object" || node === null) return found;
  const record = node as Record<string, unknown>;
  if (
    typeof record.currency === "string" &&
    typeof record.amount === "number"
  ) {
    found.add(record.currency);
  }
  for (const child of Object.values(record)) currenciesIn(child, found);
  return found;
}

function datasetCurrencies(): string[] {
  const found = new Set<string>();
  for (const id of Object.values(MOCK_DATASET_ID)) {
    resetMockData(id);
    const data: MockDataset = useMockData(id);
    currenciesIn(data, found);
  }
  return sortBy([...found]);
}

describe("engine data — F7: the seams the renderers read, provided once", () => {
  it("the layout wires both seams and mounts the one form dialog", () => {
    expect(layoutSource).toContain("provideFormIcon(PortalFormIcon)");
    expect(layoutSource).toContain(
      "provideFormEngineData(portalFormEngineData())"
    );
    expect(layoutSource).toContain("<PortalFormDialog");
  });

  it("hands the engine a country list a picker can actually draw", () => {
    const { countries, ensureCountries } = portalFormEngineData();
    const list = countries.value;

    expect(list.length).toBeGreaterThan(0);
    expect(
      every(
        list,
        country =>
          typeof country.code === "string" &&
          country.code.length > 0 &&
          typeof country.name === "string" &&
          country.name.length > 0
      )
    ).toBe(true);
    expect(uniq(map(list, "code")).length).toBe(list.length);
    expect(ensureCountries()).toBeUndefined();
  });

  it("offers exactly the currencies the datasets trade in", () => {
    expect(sortBy(uniq([...PORTAL_FORM_CURRENCIES]))).toEqual(
      datasetCurrencies()
    );
  });
});

describe("PortalFormIcon — a name it cannot resolve is nothing to draw", () => {
  it("draws the glyph a known name asks for", () => {
    const wrapper = mount(PortalFormIcon, { props: { icon: KNOWN_ICON } });

    expect(wrapper.find("svg").exists()).toBe(true);
  });

  it("reads the engine's `{ name }` bag as readily as a bare string", () => {
    const wrapper = mount(PortalFormIcon, {
      props: { icon: { name: KNOWN_ICON } }
    });

    expect(wrapper.find("svg").exists()).toBe(true);
  });

  it("renders nothing at all for a name the icon set does not carry", () => {
    const wrapper = mount(PortalFormIcon, { props: { icon: UNKNOWN_ICON } });

    expect(wrapper.find("svg").exists()).toBe(false);
    expect(wrapper.text()).toBe("");
  });

  it("renders nothing when the engine names no icon", () => {
    const wrapper = mount(PortalFormIcon, { props: {} });

    expect(wrapper.find("svg").exists()).toBe(false);
  });
});
