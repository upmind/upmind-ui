import { registerEntry } from "@upmind/ui";
import EnumToggleGroupRenderer from "./EnumToggleGroupRenderer.vue";
import { tester as enumToggleGroupTester } from "./EnumToggleGroupRenderer.vue";
import FilterBarRenderer from "./FilterBarRenderer.vue";
import { tester as filterBarTester } from "./FilterBarRenderer.vue";
import FilterButtonGroupRenderer from "./FilterButtonGroupRenderer.vue";
import { tester as filterButtonGroupTester } from "./FilterButtonGroupRenderer.vue";
import FilterExclusiveToggleGroupRenderer from "./FilterExclusiveToggleGroupRenderer.vue";
import { tester as filterExclusiveToggleGroupTester } from "./FilterExclusiveToggleGroupRenderer.vue";
import FilterMultiSelectRenderer from "./FilterMultiSelectRenderer.vue";
import { tester as filterMultiSelectTester } from "./FilterMultiSelectRenderer.vue";
import FilterRangeRenderer from "./FilterRangeRenderer.vue";
import { tester as filterRangeTester } from "./FilterRangeRenderer.vue";
import FilterSearchRenderer from "./FilterSearchRenderer.vue";
import { tester as filterSearchTester } from "./FilterSearchRenderer.vue";
import FilterToggleGroupRenderer from "./FilterToggleGroupRenderer.vue";
import { tester as filterToggleGroupTester } from "./FilterToggleGroupRenderer.vue";
import ImageRenderer from "./ImageRenderer.vue";
import { tester as imageTester } from "./ImageRenderer.vue";
import LookupRenderer from "./LookupRenderer.vue";
import { tester as lookupTester } from "./LookupRenderer.vue";
import type { FormRendererEntry } from "./types";

export type { FormRendererEntry } from "./types";
export * from "./useFormRenderers";

export const foundationRenderers: FormRendererEntry[] = [
  registerEntry(ImageRenderer, imageTester),
  registerEntry(LookupRenderer, lookupTester),
  registerEntry(FilterButtonGroupRenderer, filterButtonGroupTester),
  registerEntry(
    FilterExclusiveToggleGroupRenderer,
    filterExclusiveToggleGroupTester
  ),
  registerEntry(FilterToggleGroupRenderer, filterToggleGroupTester),
  registerEntry(EnumToggleGroupRenderer, enumToggleGroupTester),
  registerEntry(FilterSearchRenderer, filterSearchTester),
  registerEntry(FilterMultiSelectRenderer, filterMultiSelectTester),
  registerEntry(FilterRangeRenderer, filterRangeTester),
  registerEntry(FilterBarRenderer, filterBarTester)
];
