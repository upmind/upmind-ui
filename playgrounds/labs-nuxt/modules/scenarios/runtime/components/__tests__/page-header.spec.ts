// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/page-header.spec
 * @description T3.8 — the page's own heading and the collection's own action
 * (`D1` · `G4` · `AC5.2`). Three claims:
 *   1. the title IS the composable's name, verbatim — one identity, spelled one
 *      way in the heading, the url segment and the nav (`D1`);
 *   2. Add-new is a sibling of the title, drawn as a real ui control, and firing
 *      it runs the trigger the surface bound to it (`G4`);
 *   3. the header holds NO display setting — ordering, the view choice and the
 *      Results count belong to the data surface (`G3` · `H1`).
 *
 * ## What breaks if these fail
 * The page reads as a different thing from the url that reached it, or the
 * cluster `G4` broke apart re-forms one line higher — the collection's action
 * and "how the same rows are drawn" sharing a row again.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import { renderedStrings } from "../../../../../tests/support/rendered";
import clientEmails from "../../../useClientEmails/client-email.scenario";
import PageHeader from "../PageHeader.vue";
import { CONTROL_TEST_VALUE } from "./control-test-values";
import { ActionPlacementTypes } from "../../scenario.types";
import { filter, first, get, includes, map, startCase } from "lodash-es";
import type { ActionSlotItem } from "../ActionSlots.types";

// -----------------------------------------------------------------------------

/**
 * The page's identity. `route` is attached by the registrar from the declaring
 * DIRECTORY, so the declaration itself does not carry it — the directory name is
 * the oracle, and it is the one string the url segment, the route name and this
 * heading all have to agree on (`D1`).
 */
const NAME = "useClientEmails";

const PRETTIFIED = startCase(NAME);

const messages = { en: { action, text } };

/**
 * The collection's own declared action, pre-bound as the surface hands it over
 * — read off the client-emails page's declaration so the spec names no action of its own.
 */
/** The collection's OWN controls — the placement is what tells them from a row's (`R6-33`). */
const headerActions = filter(clientEmails.presentation.actions.elements, {
  placement: ActionPlacementTypes.HEADER
});

function collectionActions(onSelect = vi.fn()): ActionSlotItem[] {
  const { t } = createI18n({ legacy: false, locale: "en", messages }).global;

  return map(headerActions, declared => ({
    name: declared.name,
    label: t(get(declared, "i18n", "")),
    icon: declared.icon,
    color: declared.color,
    variant: declared.variant,
    placement: declared.placement,
    onSelect
  })) as ActionSlotItem[];
}

const mountHeader = (actions?: ActionSlotItem[]) =>
  mount(PageHeader, {
    attachTo: document.body,
    props: { name: NAME, actions },
    global: {
      plugins: [createI18n({ legacy: false, locale: "en", messages })]
    }
  });

const ADD = `[data-test-value="${CONTROL_TEST_VALUE.add}"]`;

// -----------------------------------------------------------------------------

describe("T3.8 the title is the composable's own name (D1)", () => {
  it("renders the name it was handed, verbatim", () => {
    const wrapper = mountHeader();

    expect(includes(renderedStrings(wrapper), NAME)).toBe(true);
  });

  it("never prettifies it into an alias the url cannot spell", () => {
    const wrapper = mountHeader(collectionActions());

    expect(wrapper.text()).toContain(NAME);
    expect(wrapper.text()).not.toContain(PRETTIFIED);
  });
});

describe("T3.8 the collection's own action lives here (G4 · AC5.2)", () => {
  it("draws the declared control as a real ui button, never hand-rolled markup", () => {
    const wrapper = mountHeader(collectionActions());
    const control = wrapper.find(ADD);

    expect(control.exists()).toBe(true);
    expect(control.attributes("data-test-key")).toBe("button");
  });

  it("fires the trigger the surface bound to it — the header renders, the list still owns the editor", async () => {
    const onSelect = vi.fn();
    const wrapper = mountHeader(collectionActions(onSelect));

    await wrapper.find(ADD).trigger("click");

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("offers no control at all where the collection declares none", () => {
    const wrapper = mountHeader();

    expect(wrapper.find(ADD).exists()).toBe(false);
  });

  it("draws the control beside the title, not inside it", () => {
    const wrapper = mountHeader(collectionActions());
    const control = wrapper.find(ADD).element;
    const heading = first(
      map(wrapper.findAll("h1, h2, h3"), node => node.element)
    );

    expect(heading).toBeDefined();
    expect(heading?.contains(control)).toBe(false);
    expect(wrapper.element.contains(control)).toBe(true);
  });
});

describe("T3.8 the header holds no display setting (G3 · H1)", () => {
  it("carries neither the ordering control nor the view toggle", () => {
    const wrapper = mountHeader(collectionActions());

    expect(wrapper.find('[data-test-key="sort"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-value="table"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-value="card"]').exists()).toBe(false);
  });

  it("carries no Results count either — that is the data surface's", () => {
    const wrapper = mountHeader(collectionActions());

    expect(/\d/.test(wrapper.text())).toBe(false);
  });
});
