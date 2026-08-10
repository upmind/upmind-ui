// Component-test-only double for `@upmind-automation/client-vue`, aliased in
// vitest.config.ts's "component" project. The factory surfaces reuse
// `UpmForm` (design.md FE-2977 §Block C) — its own rendering/validation is
// client-vue's contract, not this story's; surfaces are tested against this
// prop/emit-faithful double instead of the real JSONForms pipeline. Kept to
// exactly the client-vue exports the factory surfaces reuse.
import { defineComponent, h } from "vue";
import { map, values } from "lodash-es";
import type { PropType } from "vue";

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
