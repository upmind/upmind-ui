<template>
  <section class="flex flex-col gap-y-2">
    <Item
      v-if="!isEditing"
      v-for="address in addresses"
      :key="address.id"
      :address="address"
      :editing="isEditing"
    />

    <RadioCards
      v-if="isEditing"
      v-model="selectedAddress"
      :items="parsedValues"
      :default-value="defaultAddress?.id"
      list
      required
    >
      <template #item="{ item }">
        <Item
          :address="getAddress(item.value) as Address"
          :editing="isEditing"
        />
      </template>
    </RadioCards>

    <Link
      :label="isEditing ? 'Confirm' : 'Change'"
      size="sm"
      class="leading-none"
      @click="clickEdit"
      :disabled="isLoading"
    >
      <template #append>
        <Icon
          icon="arrow-down"
          size="xs"
          class="mt-[1px] transition-all duration-300"
          :class="{ 'rotate-180': isEditing }"
        />
      </template>
    </Link>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";
import { map } from "lodash-es";

// --- internal
import { useClientAddresses } from "@upmind-automation/headless-vue";

// --- components
import { Link, Icon, RadioCards } from "@upmind-automation/upmind-ui";
import Item from "./components/address/Item.vue";
const { isReady, getAll, data, meta, error, invalidate, remove, setDefault } =
  useClientAddresses();

// --- types
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import type { Address } from "@upmind-automation/headless-vue";
// -----------------------------------------------------------------------------

const selectedAddress = ref("");
const isLoading = ref(false);
const isEditing = ref(false);

const defaultAddress = computed(() => {
  return data.value.find(address => address.meta.isDefault);
});

await isReady().then(() => {
  getAll();
  selectedAddress.value = defaultAddress.value?.id as string;
});

const addresses = computed(() => {
  if (isEditing.value) {
    return data.value.sort((a, b) => (a.meta.isDefault ? -1 : 1));
  }
  return data.value.filter(address => address.meta.isDefault);
});

const getAddress = (id: string) => {
  return data.value.find(address => address.id === id);
};

const defaultChanged = computed(() => {
  return selectedAddress.value !== defaultAddress.value?.id;
});

const clickEdit = async () => {
  if (isEditing.value && defaultChanged.value) {
    isLoading.value = true;
    await setDefault(selectedAddress.value);
    await getAll();
    isEditing.value = false;
    isLoading.value = false;
  } else {
    isEditing.value = !isEditing.value;
  }
};

const parsedValues = computed<RadioCardsItemProps[]>(() => {
  return map(addresses.value, (item: any) => {
    return {
      id: item.id,
      value: item.id,
      label: item.title,
      ...item,
    };
  });
});
</script>
