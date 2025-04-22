<template>
  <section class="flex flex-col gap-y-2">
    <List
      v-if="view === Views.list || view === Views.default"
      :view="view"
      @setView="setView"
    />

    <Add v-else-if="view === Views.add" />
  </section>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";
import { isEmpty } from "lodash-es";
import { useClientAddresses } from "@upmind-automation/headless-vue";

// --- components
import { Link, Icon } from "@upmind-automation/upmind-ui";
import Add from "../../client/components/address/Add.vue";
import List from "../../client/components/address/List.vue";

// --- types
import { Views } from "../../client/components/address/types";

// -----------------------------------------------------------------------------

const { isReady, getAll, data } = useClientAddresses();

const view = ref<Views>(Views.loading);

await isReady().then(async () => {
  await getAll();
  view.value = isEmpty(data.value) ? Views.add : Views.default;
});

const setView = (value: Views) => {
  view.value = value;
};
</script>
