<template>
  <div v-if="meta.isVisible" :class="styles.filterBar.root">
    <div
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="filterBarItem({ isGrowing: isGrowing(element) })"
    >
      <DispatchRenderer
        :schema="layout.schema"
        :uischema="element"
        :path="layout.path"
        :enabled="layout.enabled"
        :renderers="layout.renderers"
        :cells="layout.cells"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout
} from "@jsonforms/vue";
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config, { filterBarItem } from "./filterBar.config";
import { get } from "lodash-es";
import type { Layout, UISchemaElement } from "@jsonforms/core";
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
 * the page. Here each element keeps its NATURAL width and the bar's slack goes
 * to whichever element declared `width: "full"` — the search — so the controls
 * group together and the bar wraps rather than spreads.
 */

const props = defineProps(rendererProps<Layout>());

const { layout } = useJsonFormsLayout(props);

const meta = computed(() => ({
  isVisible: layout.value.visible,
  isDisabled: !layout.value.enabled
}));

const styles = useStyles(["filterBar"], meta, config);

/** The element the bar's leftover width belongs to — its own declared width. */
function isGrowing(element: UISchemaElement): boolean {
  return get(element, ["options", "width"]) === "full";
}
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
