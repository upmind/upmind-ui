<template>
  <div v-if="meta.isVisible" :class="styles.filterRow.root">
    <div
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="filterRowItem({ isGrowing: isGrowing(element) })"
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
import { and, isLayout, optionIs } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout
} from "@jsonforms/vue";
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config, { filterRowItem } from "./filterRow.config";
import { get } from "lodash-es";
import type { Layout, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module form/renderers/FilterRowRenderer
 * @description A layout that lays its elements out as ONE flowing row — the
 * toolbar treatment a filter bar is drawn with, opted into by the layout's own
 * `flow` option so every other form keeps the generic layout renderer.
 *
 * The generic renderer gives each element an equal share of the row
 * (`md:flex-1`), which is right for a two-column form and wrong for a bar: a
 * narrow switch stranded in half a row reads as two filters at opposite ends of
 * the page. Here each element keeps its NATURAL width and the row's slack goes
 * to whichever element declared `width: "full"` — the search — so the controls
 * group together and the bar wraps rather than spreads.
 */

const props = defineProps(rendererProps<Layout>());

const { layout } = useJsonFormsLayout(props);

const meta = computed(() => ({
  isVisible: layout.value.visible,
  isDisabled: !layout.value.enabled
}));

const styles = useStyles(["filterRow"], meta, config);

/** The element the row's leftover width belongs to — its own declared width. */
function isGrowing(element: UISchemaElement): boolean {
  return get(element, ["options", "width"]) === "full";
}
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(isLayout, optionIs("flow", true))
};
</script>
