// Component-test-only double for `@upmind-automation/client-vue`, aliased in
// vitest.config.ts's "component" project. The factory surfaces reuse
// `UpmForm` (design.md FE-2977 §Block C) — its own rendering/validation is
// client-vue's contract, not this story's; surfaces are tested against this
// prop/emit-faithful double instead of the real JSONForms pipeline. Kept to
// exactly the client-vue exports the factory surfaces reuse.
import { defineComponent, h } from "vue";
import { keys, map, values } from "lodash-es";
import type { PropType } from "vue";

// The real package's barrel opens with `export * from "@upmind-automation/
// headless"`, so every headless symbol a surface reaches through client-vue
// (`assign`, `QUERY_PARAMS`, `SESSION_FORMS` — `app/funnels/labs.ts`) is
// client-vue's contract only by re-export. Doubling them would be inventing a
// second headless; what is doubled here stays the JSONForms pipeline alone.
export * from "@upmind-automation/headless";

// A real `formRenderers` array, not `undefined` — previously absent from
// this double, which masked the barrel's missing export (FE-2977 finding #3):
// every component spec fed a stub that never noticed the real import
// resolved to nothing.
export const formRenderers: unknown[] = [];

/**
 * Renders every slot it is handed: a page under test declares its content in
 * the layout's slots, so a double that drops them would measure an empty page.
 */
export const UpmLayout = defineComponent({
  name: "UpmLayout",
  setup:
    (_props, { slots }) =>
    () =>
      h(
        "div",
        map(values(slots), slot => slot?.())
      )
});

/**
 * The page-structure components the app chrome nests — client-vue's contract,
 * not this story's. Each renders every slot it is handed and decides nothing
 * else, so what a layout puts where stays the layout's own answer.
 */
const passThrough = (name: string) =>
  defineComponent({
    name,
    setup:
      (_props, { slots }) =>
      () =>
        h(
          "div",
          map(values(slots), slot => slot?.())
        )
  });

export const UpmMain = passThrough("UpmMain");
export const UpmPage = passThrough("UpmPage");
export const UpmRoot = passThrough("UpmRoot");

/**
 * The app chrome's header, standing in for client-vue's own — which is
 * client-vue's contract, not this story's. It renders every slot it is handed
 * and NAMES each one's boundary, so a spec can read which slot a layout put a
 * control in without this double deciding anything about that control.
 */
export const UpmHeader = defineComponent({
  name: "UpmHeader",
  setup:
    (_props, { slots }) =>
    () =>
      h(
        "header",
        { "data-test-key": "chrome-header" },
        map(keys(slots), name =>
          h(
            "div",
            { "data-test-key": "chrome-header-slot", "data-test-value": name },
            slots[name]?.()
          )
        )
      )
});

export const UpmForm = defineComponent({
  name: "UpmForm",
  props: {
    schema: {
      type: Object as PropType<Record<string, unknown>>,
      default: undefined
    },
    uischema: {
      type: Object as PropType<Record<string, unknown>>,
      default: undefined
    },
    modelValue: { type: null, default: undefined }
  },
  emits: [
    "update:modelValue",
    "update:uischema",
    "resolve",
    "reject",
    "valid",
    "click",
    "action"
  ],
  template: "<div />"
});
