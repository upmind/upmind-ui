import { registerEntry } from "@upmind/ui";
import { foundationRenderers } from "@upmind-automation/foundation";
import EnumToggleGroupRenderer from "./EnumToggleGroupRenderer.vue";
import { tester as enumToggleGroupTest } from "./EnumToggleGroupRenderer.vue";
import FilterBarRenderer from "./FilterBarRenderer.vue";
import { tester as filterBarTest } from "./FilterBarRenderer.vue";
import FilterButtonGroupRenderer from "./FilterButtonGroupRenderer.vue";
import { tester as filterButtonGroupTest } from "./FilterButtonGroupRenderer.vue";
import FilterExclusiveToggleGroupRenderer from "./FilterExclusiveToggleGroupRenderer.vue";
import { tester as filterExclusiveToggleGroupTest } from "./FilterExclusiveToggleGroupRenderer.vue";
import FilterMultiSelectRenderer from "./FilterMultiSelectRenderer.vue";
import { tester as filterMultiSelectTest } from "./FilterMultiSelectRenderer.vue";
import FilterRangeRenderer from "./FilterRangeRenderer.vue";
import { tester as filterRangeTest } from "./FilterRangeRenderer.vue";
import FilterSearchRenderer from "./FilterSearchRenderer.vue";
import { tester as filterSearchTest } from "./FilterSearchRenderer.vue";
import FilterToggleGroupRenderer from "./FilterToggleGroupRenderer.vue";
import { tester as filterToggleGroupTest } from "./FilterToggleGroupRenderer.vue";
import ImageRenderer from "./ImageRenderer.vue";
import { tester as imageTest } from "./ImageRenderer.vue";
import { concat } from "lodash-es";

// -----------------------------------------------------------------------------

export const formRenderers = concat(
  [registerEntry(ImageRenderer, imageTest)],
  foundationRenderers,
  [
    registerEntry(FilterButtonGroupRenderer, filterButtonGroupTest),
    registerEntry(
      FilterExclusiveToggleGroupRenderer,
      filterExclusiveToggleGroupTest
    ),
    registerEntry(FilterToggleGroupRenderer, filterToggleGroupTest),
    registerEntry(EnumToggleGroupRenderer, enumToggleGroupTest),
    registerEntry(FilterSearchRenderer, filterSearchTest),
    registerEntry(FilterMultiSelectRenderer, filterMultiSelectTest),
    registerEntry(FilterRangeRenderer, filterRangeTest),
    registerEntry(FilterBarRenderer, filterBarTest)
  ]
);
