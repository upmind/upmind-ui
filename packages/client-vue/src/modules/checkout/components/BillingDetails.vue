<template>
  <div class="flex flex-col gap-y-4">
    <section>
      <List :view="view" @setView="setView" />
    </section>

    <section>
      <Add
        v-if="view === Views.default || view === Views.add"
        :view="view"
        @setView="setView"
      />
    </section>
  </div>
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

const { isReady, getAll, data } = useBillingDetails();

const view = ref<Views>(Views.loading);

await isReady().then(async () => {
  await getAll();
  view.value = !isEmpty(data.value) ? Views.default : Views.add;
});

const setView = (value: Views) => {
  view.value = value;
};
</script>
