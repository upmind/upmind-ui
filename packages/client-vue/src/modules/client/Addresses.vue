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
      :items="parsedValues"
      :default-value="defaultAddress?.id"
      list
      required
    >
      <template #item="{ item }">
        <Item :address="getAddress(item.value) as Address" />
      </template>
    </RadioCards>

    <Link
      :label="isEditing ? 'Confirm' : 'Change'"
      size="sm"
      class="leading-none"
      @click="isEditing = !isEditing"
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
import { useRouter } from "vue-router";
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

const router = useRouter();

const isEditing = ref(false);

const addresses = computed(() => {
  if (isEditing.value) {
    return data.value;
  }
  return data.value
    .filter(address => address.meta.isDefault)
    .sort((a, b) => (a.meta.isDefault ? -1 : 1));
});

const defaultAddress = computed(() => {
  return data.value.find(address => address.meta.isDefault);
});

await isReady().then(() => getAll());

const getAddress = (id: string) => {
  return data.value.find(address => address.id === id);
};

const parsedValues = computed<RadioCardsItemProps[]>(() => {
  return map(data.value, (item: any) => {
    return {
      id: item.id,
      value: item.id,
      label: item.title,
      ...item,
    };
  });
});
</script>
