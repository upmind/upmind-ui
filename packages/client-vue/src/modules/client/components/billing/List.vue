<template>
  <RadioCardsCollapsible
    v-model:open="open"
    v-model="selectedAddress"
    :items="parsedValues"
    :disabled="isLoading"
    list
    required
    @update:modelValue="onAddressChange"
  >
    <template #item="{ item }">
      <Item :address="getAddress(item.value)" editing />
    </template>

    <template #actions>
      <Link
        v-if="!open"
        label="Change"
        size="xs"
        variant="muted"
        @click="open = true"
      />

      <Link
        v-else
        label="Add new address"
        size="xs"
        variant="muted"
        @click="emit('setView', Views.add)"
      />
    </template>
  </RadioCardsCollapsible>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed, defineEmits } from "vue";
import { map } from "lodash-es";

// --- internal
import { useClientAddresses } from "@upmind-automation/headless-vue";

// --- components
import {
  RadioCardsCollapsible,
  Link,
  FormLabel,
} from "@upmind-automation/upmind-ui";
import Item from "./Item.vue";

// --- utils
import { find } from "lodash-es";

// --- types
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import type { Address } from "@upmind-automation/headless-vue";
import type { ListProps } from "./types";
import { Views } from "./types";

// -----------------------------------------------------------------------------

defineProps<ListProps>();

const emit = defineEmits<{
  (e: "setView", value: Views): void;
}>();

const { isReady, getAll, data, setDefault, meta, getDefault } =
  useClientAddresses();

const isLoading = ref(false);

const open = ref(false);

const defaultAddress = computed(() => {
  return find(data.value, { meta: { isDefault: true } }) as Address;
});

const selectedAddress = ref<string>(defaultAddress.value?.id ?? "");

const defaultChanged = computed(
  () => selectedAddress.value !== defaultAddress.value?.id
);

await isReady().then(async () => {
  await getAll();
  selectedAddress.value = defaultAddress.value?.id;
});

const getAddress = (id: string) => {
  return find(data.value, { id }) as Address;
};

const onAddressChange = async (newValue: string) => {
  if (defaultChanged.value && newValue !== defaultAddress.value?.id) {
    await setDefault(newValue);
  }
};

const parsedValues = computed<RadioCardsItemProps[]>(() => {
  const addresses = data.value.sort((a, b) => (a.meta.isDefault ? -1 : 1));
  return map(addresses, (item: any) => {
    return {
      id: item.id,
      value: item.id,
      label: item.title,
      ...item,
    };
  });
});
</script>
