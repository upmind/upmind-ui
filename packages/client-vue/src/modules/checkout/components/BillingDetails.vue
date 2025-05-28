<template>
  <template v-if="meta.requiresAddress">
    <AddressList
      v-if="view === Views.list || view === Views.default"
      :view="view"
      @setView="setView"
    />

    <AddressAdd v-else-if="view === Views.add" @setView="setView" />
  </template>
  <template v-else-if="meta.requiresPhone">
    <PhoneListings
      v-if="view === Views.list || view === Views.default"
      :view="view"
      @setView="setView"
    />

    <PhoneAdd v-else-if="view === Views.add" @setView="setView" />
  </template>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";
import {
  useBillingDetails,
  useClientPhones,
} from "@upmind-automation/headless-vue";
import { isEmpty } from "lodash-es";

// --- components
import AddressAdd from "../../client/components/billing/Add.vue";
import AddressList from "../../client/components/billing/List.vue";
import PhoneAdd from "../../client/components/phone/Add.vue";
import PhoneListings from "../../client/components/phone/List.vue";

// --- types
import { Views } from "../../client/components/billing/types";
// -----------------------------------------------------------------------------

const { isReady, getAll, data, meta } = useBillingDetails();
const { getAll: getAllPhones, data: phoneData } = useClientPhones();

const view = ref<Views>(Views.loading);

await isReady().then(async () => {
  if (meta.value.requiresAddress) {
    await getAll();
    view.value = !isEmpty(data.value) ? Views.default : Views.add;
  } else if (meta.value.requiresPhone) {
    await getAllPhones();
    view.value = !isEmpty(phoneData.value) ? Views.default : Views.add;
  }
});

const setView = (value: Views) => {
  view.value = value;
};
</script>
