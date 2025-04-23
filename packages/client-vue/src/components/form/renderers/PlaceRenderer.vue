<template>
  <Search
    :results="searchResults"
    @update:search="searchAddresses"
    @select="selectAddress"
  />

  <fieldset v-if="layout.visible" :class="styles.group.root" class="mt-6">
    <div v-if="layout.label" :class="styles.group.label">
      <legend>{{ layout.label }}</legend>
    </div>

    <div
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="styles.group.item"
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
  </fieldset>
</template>

<script setup lang="ts">
// --- external
import { computed, ref, onMounted } from "vue";
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout,
} from "@jsonforms/vue";
import { usePlaces } from "@upmind-automation/headless-vue";

// --- internal
import config from "./layouts.config";

// --- components
import { Search } from "@upmind-automation/upmind-ui";

// --- utils
import {
  useUpmindUILayoutRenderer,
  useUpmindUIRenderer,
  useStyles,
} from "@upmind-automation/upmind-ui";
import { debounce, isEmpty } from "lodash-es";
import { useJsonFormsControlWithDetail } from "@jsonforms/vue";

// --- types
import type { PropType, ComputedRef } from "vue";
import type { Layout, ControlElement } from "@jsonforms/core";
import type { InputProps, SearchItem } from "@upmind-automation/upmind-ui";

// -------------------------------------------------------------------

const props = defineProps({
  ...rendererProps<Layout>(),
});

const meta = computed(() => ({
  isVisible: layout.value.visible,
  isDisabled: !layout.value.enabled,
}));

// const { control } = useUpmindUIRenderer(useJsonFormsControlWithDetail(props));

const styles = useStyles(["group"], meta, config, {}) as ComputedRef<{
  group: {
    root: string;
    label: string;
    item: string;
  };
}>;

const places = usePlaces();

const parsedResults = ref<any[]>([]);

onMounted(async () => {
  await places.load();
});

const searchAddresses = debounce(async (query: string) => {
  if (!query || query.length < 3) {
    parsedResults.value = [];
    return;
  }

  const results = await places.search(query);
  if (!isEmpty(results)) {
    parsedResults.value = results;
  }
}, 300);

const searchResults = computed(() => {
  return parsedResults.value.map(
    (result: any) =>
      ({
        id: result.id,
        label: result.description,
      }) as SearchItem
  );
});

const selectAddress = (selectedItem: SearchItem) => {
  //   const address = find(
  //     parsedResults.value,
  //     address => address.id === selectedItem.id
  //   ).address as Address;
  //   // updateControl("address", address);
};

const { layout } = useUpmindUILayoutRenderer(useJsonFormsLayout(props));
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("Place")),
};
</script>
