<template>
  <upw-combobox
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-lookup'"
    :disabled="!control.enabled"
    :model-value="control.data"
    :items="items"
    :processing="isSearching"
    @change="onChange"
    @search="onSearch"
  >
  </upw-combobox>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref } from "vue";
import { schemaMatches, uiTypeIs, and } from "@jsonforms/core";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";

// --- components
import UpwCombobox from "../../../combobox/Combobox.vue";

// --- utils
import { useUpwindRenderer } from "../utils";
import { has, isFunction, get } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "LookupRenderer",
  components: {
    UpwCombobox,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsOneOfEnumControl(props),
      target => (target.selectedIndex === 0 ? undefined : target.value)
    );

    debugger;
    const { search, results } = get(renderer.control.value, "schema.lookup");
    const items = ref([results()]);
    const isSearching = ref(false);
    debugger;
    return {
      items,
      ...renderer,
      onSearch: async value => {
        debugger;
        isSearching.value = true;
        search(value).then(results => {
          debugger;
          items.value = results;
          isSearching.value = false;
        });
      },
    };
  },
});

export const tester = {
  rank: 3,
  controlType: and(
    uiTypeIs("Control"),
    schemaMatches(schema => has(schema, "lookup"))
    // schemaMatches(schema => isFunction(get(schema, "lookup.search")))
  ),
};
</script>
