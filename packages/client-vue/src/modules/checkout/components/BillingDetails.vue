<template>
  <List
    v-if="view === Views.list || view === Views.default"
    :view="view"
    @setView="setView"
  />

  <Add v-else-if="view === Views.add" @setView="setView" />
</template>

<script setup lang="ts">
// --- external
import { ref } from "vue";
import { isEmpty } from "lodash-es";
import { useBillingDetails } from "@upmind-automation/headless-vue";

// --- components
import Add from "../../client/components/billing/Add.vue";
import List from "../../client/components/billing/List.vue";

// --- types
import { Views } from "../../client/components/billing/types";

// -----------------------------------------------------------------------------

const { isReady, getAll, data } = useBillingDetails();

const view = ref<Views>(Views.loading);

await isReady().then(async () => {
  await getAll();
  view.value = isEmpty(data.value) ? Views.add : Views.default;
});

const setView = (value: Views) => {
  view.value = value;
};
</script>
