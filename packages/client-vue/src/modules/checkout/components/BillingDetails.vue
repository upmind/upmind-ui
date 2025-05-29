<template>
  <List :view="view" @setView="setView" class="mb-4" />
  <Add
    v-if="view === Views.list || view === Views.default"
    :view="view"
    @setView="setView"
  />
</template>

<script setup lang="ts">
// --- external
import { ref } from "vue";
import { useBillingDetails } from "@upmind-automation/headless-vue";
import { isEmpty } from "lodash-es";

// --- components
import Add from "../../client/components/billing/Add.vue";
import List from "../../client/components/billing/List.vue";
// --- types
import { Views } from "../../client/components/billing/types";
// -----------------------------------------------------------------------------

const { isReady, getAll, data, meta } = useBillingDetails();

const view = ref<Views>(Views.loading);

await isReady().then(async () => {
  await getAll();
  view.value = !isEmpty(data.value) ? Views.default : Views.add;
});

const setView = (value: Views) => {
  view.value = value;
};
</script>
