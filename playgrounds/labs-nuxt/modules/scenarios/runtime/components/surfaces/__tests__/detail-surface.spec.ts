import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { UpmForm } from "@upmind-automation/client-vue";
import { defaultRow } from "../../../../testing/recorded-emails";
import {
  rawKeys,
  renderedStrings,
  untranslated
} from "../../../../testing/rendered";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { ContextPanel } from "../../index";
import { DetailSurface } from "../index";
import { flatMap, uniq } from "lodash-es";

const model = { id: 1, name: "Ada" };

function mountDetail() {
  return mount(DetailSurface, {
    props: {
      snapshot: { actions: [], context: { model }, meta: {} },
      actions: {}
    }
  });
}

/** The read as the scenario declares it, over a record the capture run recorded. */
function mountDeclaredDetail() {
  return mount(DetailSurface, {
    attachTo: document.body,
    props: {
      snapshot: { actions: [], context: { model: defaultRow }, meta: {} },
      actions: {},
      presentation: clientEmails.presentation.detail
    }
  });
}

/** Values that came out of the RECORDING; copy is what is left over. */
const dataDerived = uniq(
  flatMap([defaultRow], row => [row.id, row.email]) as string[]
);

describe("@AC3 detail — DetailSurface renders context.model read-only (D-2)", () => {
  it("has no editable form on initial render", () => {
    const wrapper = mountDetail();

    expect(wrapper.findComponent(UpmForm).exists()).toBe(false);
  });

  it("exposes no edit control — editing is Form-Flow's job, not Detail's", () => {
    const wrapper = mountDetail();

    expect(wrapper.find('[data-test-value="edit"]').exists()).toBe(false);
  });

  it("renders context.model read-only via ContextPanel", () => {
    const wrapper = mountDetail();

    const panel = wrapper.findComponent(ContextPanel);
    expect(panel.exists()).toBe(true);
    expect(panel.props("context")).toEqual(model);
  });
});

/**
 * The same catalogue-backed rendered-DOM measurement the list surface is held
 * to, on the read the operator opens. One instrument, one bar: a label the
 * declaration named must arrive as copy, and nothing the surface draws about
 * itself may be English no catalogue carries.
 */
describe("the detail surface renders only copy the catalogue carries (AC3)", () => {
  it("puts no RAW i18n key on screen", () => {
    expect(rawKeys(renderedStrings(mountDeclaredDetail()))).toEqual([]);
  });

  it("puts no HARDCODED string on screen", () => {
    expect(
      untranslated(renderedStrings(mountDeclaredDetail()), dataDerived)
    ).toEqual([]);
  });

  it("draws the fields the declaration named, so the sweep has labels to measure", () => {
    const wrapper = mountDeclaredDetail();

    expect(wrapper.findComponent(ContextPanel).exists()).toBe(false);
    expect(renderedStrings(wrapper).length).toBeGreaterThan(0);
  });
});
