<template>
  <div
    v-if="layout.visible"
    class="flex w-full flex-wrap items-end gap-x-6 gap-y-2"
  >
    <template
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
    >
      <DispatchRenderer
        :schema="layout.schema"
        :uischema="element"
        :path="layout.path"
        :enabled="layout.enabled"
        :renderers="layout.renderers"
        :cells="layout.cells"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout
} from "@jsonforms/vue";
import type { Layout } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module form/renderers/FilterBarRenderer
 * @description The `FilterBar` layout — a filter bar is its own element type, not
 * a generic layout wearing an option flag, so a declaration says what it IS and
 * every other form keeps the generic layout renderer untouched.
 *
 * The generic renderer gives each element an equal share of the row
 * (`md:flex-1`), which is right for a two-column form and wrong for a bar: a
 * narrow switch stranded in half a row reads as two filters at opposite ends of
 * the page. Here the elements sit together and the bar wraps rather than
 * spreads; each control owns its own width.
 */

const props = defineProps(rendererProps<Layout>());

const { layout } = useJsonFormsLayout(props);
</script>

<script lang="ts">
/**
 * `rank: 2` for the same reason `Group` and `Tabs` rank 2: the ui package's
 * `LayoutRenderer` testers on bare `isLayout` at rank 1, so ANY element carrying
 * `elements` — a distinct type included — still matches it.
 */
export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("FilterBar"))
};
</script>
