// -----------------------------------------------------------------------------
/**
 * @module sheets/__tests__/code-pane.spec
 * @description T3.3 — the call that reproduces what is on screen (`AC3.3` ·
 * `D1`). Four claims:
 *   1. the fence carries the page's own composable, at the scope the url named,
 *      with the CURRENT narrowing and ordering inlined — the options on screen,
 *      not a generic example;
 *   2. it is a COMPUTED over the same criteria the filter bar writes: changing a
 *      facet updates the snippet in place, with nothing remounted and nothing
 *      refetched;
 *   3. copying puts that same call on the clipboard;
 *   4. it renders through the real `Markdown.ce.vue` — every `pre` on screen is
 *      the markdown renderer's own, never markup imitating one (`D9`/`P1-R14`).
 *
 * The criteria handle is the module's OWN query pair (`useQuerySchema` /
 * `useQueryUischema`) over a live model, so the snippet is exercised against the
 * shape the composable really publishes rather than a shape invented here.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";
import { ScopeActorTypes } from "@upmind-automation/headless";
import {
  useQuerySchema,
  useQueryUischema
} from "@upmind-automation/headless/testing/client-email/internal-kit";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import { Markdown } from "@upmind-automation/upmind-ui";
import labsEn from "../../../assets/locales/en/labs.json";
import CodePane from "../CodePane.vue";
import { every, find, includes, last, map, trim } from "lodash-es";
import type { ModulePortCriteria } from "../../../../modules/scenarios/runtime/composables/useModulePort.types";
import type { ScopeConfig } from "../../../composables/scope";

// -----------------------------------------------------------------------------

const NAME = "useClientEmails";

const SCOPE: ScopeConfig = {
  actor: ScopeActorTypes.CLIENT,
  context: { type: "client", id: "mock-client-id" }
};

/** The AC3.3 read-back's own state: unverified addresses, ordered email desc. */
const NARROWED = {
  filters: { verified: { eq: false } },
  sort: [{ field: "email", dir: "desc" }]
};

const RE_ORDERED = {
  filters: { verified: { eq: false } },
  sort: [{ field: "email", dir: "asc" }]
};

const messages = { en: { action, labs: labsEn, text } };

const translate = createI18n({ legacy: false, locale: "en", messages }).global
  .t;

const COPY_LABEL = translate("labs.code_copy");

let copied: string[] = [];

function criteriaOn(model: Record<string, unknown>) {
  const live = ref(model);
  const criteria: ModulePortCriteria = {
    schema: useQuerySchema(),
    uischema: useQueryUischema(),
    model: computed(() => live.value),
    set: vi.fn()
  };

  return {
    criteria,
    narrow: (next: Record<string, unknown>) => (live.value = next)
  };
}

function mountPane(model?: Record<string, unknown>) {
  const state = model ? criteriaOn(model) : undefined;
  const wrapper = mount(CodePane, {
    attachTo: document.body,
    props: { name: NAME, scope: SCOPE, criteria: state?.criteria },
    global: {
      plugins: [createI18n({ legacy: false, locale: "en", messages })]
    }
  });

  return { wrapper, narrow: state?.narrow };
}

type Pane = ReturnType<typeof mountPane>["wrapper"];

/** The markdown source the pane hands the real renderer. */
const source = (wrapper: Pane): string =>
  (wrapper.findComponent(Markdown).props("modelValue") as string) ?? "";

/** The call inside the fence, without the markdown chrome around it. */
const call = (wrapper: Pane): string =>
  /```[a-z]*\n([\s\S]*?)```/.exec(source(wrapper))?.[1] ?? "";

/** The copy affordance, found by the name the catalogue gives it. */
const copyControl = (wrapper: Pane) =>
  find(
    wrapper.findAll("button"),
    control =>
      control.attributes("aria-label") === COPY_LABEL ||
      includes(control.text(), COPY_LABEL)
  );

/**
 * jsdom implements neither clipboard channel, and which one VueUse takes turns
 * on a permission it cannot query here — so both are instrumented and the copy
 * is read from whichever one the environment routes it through.
 */
beforeEach(() => {
  copied = [];
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: vi.fn(async (value: string) => {
        copied.push(value);
      })
    }
  });
  document.execCommand = vi.fn(() => {
    copied.push(last(document.querySelectorAll("textarea"))?.value ?? "");

    return true;
  });
});

// -----------------------------------------------------------------------------

describe("T3.3 the fence is the call that reproduces this page (AC3.3 · D1)", () => {
  it("names the composable the page boots, verbatim", () => {
    const { wrapper } = mountPane(NARROWED);

    expect(call(wrapper)).toContain(NAME);
  });

  it("carries the scope the url named", () => {
    const { wrapper } = mountPane(NARROWED);
    const rendered = call(wrapper);

    expect(rendered).toContain(ScopeActorTypes.CLIENT);
    expect(rendered).toContain(SCOPE.context?.id);
  });

  it("inlines the narrowing and the ordering that are on screen", () => {
    const { wrapper } = mountPane(NARROWED);
    const rendered = call(wrapper);

    expect(rendered).toContain("verified");
    expect(rendered).toContain("false");
    expect(rendered).toContain("email");
    expect(rendered.toLowerCase()).toContain("desc");
  });

  it("carries the call alone where the module publishes no criteria", () => {
    const { wrapper } = mountPane();
    const rendered = call(wrapper);

    expect(rendered).toContain(NAME);
    expect(rendered).not.toContain("verified");
  });
});

describe("T3.3 the fence keeps up with the state — a computed, not a screenshot", () => {
  it("follows a facet change with no remount and no reload", async () => {
    const { wrapper, narrow } = mountPane(NARROWED);
    const before = call(wrapper);

    narrow?.({ filters: { verified: { eq: true } }, sort: NARROWED.sort });
    await nextTick();

    const after = call(wrapper);
    expect(after).not.toBe(before);
    expect(after).toContain("true");
  });

  it("follows a change of ordering too", async () => {
    const { wrapper, narrow } = mountPane(NARROWED);

    narrow?.(RE_ORDERED);
    await nextTick();

    expect(call(wrapper).toLowerCase()).toContain("asc");
  });

  it("drops a cleared facet out of the call entirely", async () => {
    const { wrapper, narrow } = mountPane(NARROWED);

    narrow?.({ filters: {}, sort: NARROWED.sort });
    await nextTick();

    expect(call(wrapper)).not.toContain("verified");
  });
});

describe("T3.3 copy puts that call on the clipboard", () => {
  it("copies what the fence is showing", async () => {
    const { wrapper } = mountPane(NARROWED);

    await copyControl(wrapper)?.trigger("click");

    expect(copied).toHaveLength(1);
    expect(trim(copied[0])).toContain(trim(call(wrapper)));
  });

  it("copies the CURRENT call after a facet change, not the one it booted with", async () => {
    const { wrapper, narrow } = mountPane(NARROWED);

    narrow?.(RE_ORDERED);
    await nextTick();
    await copyControl(wrapper)?.trigger("click");

    expect(copied[0]?.toLowerCase()).toContain("asc");
    expect(copied[0]?.toLowerCase()).not.toContain("desc");
  });
});

describe("T3.3 drawn by the real ui renderer (D9 · P1-R14)", () => {
  it("renders through Markdown.ce.vue", () => {
    const { wrapper } = mountPane(NARROWED);

    expect(wrapper.findComponent(Markdown).exists()).toBe(true);
    expect(source(wrapper)).toContain("```");
  });

  it("draws no fence of its own beside it", () => {
    const { wrapper } = mountPane(NARROWED);
    const renderer = wrapper.findComponent(Markdown).element;

    expect(
      every(
        map(wrapper.findAll("pre"), block => block.element),
        block => renderer.contains(block)
      )
    ).toBe(true);
  });
});
