<template>
  <section class="flex flex-col gap-y-4">
    <Item v-if="view === Views.default" :address="defaultAddress" />

    <RadioCards
      v-else-if="view === Views.list"
      v-model="selectedAddress"
      :items="parsedValues"
      :disabled="isLoading"
      list
      required
    >
      <template #item="{ item }">
        <Item :address="getAddress(item.value)" editing />
      </template>
    </RadioCards>

    <footer class="flex gap-x-4">
      <Link
        :label="primaryLabel"
        size="sm"
        variant="muted"
        :disabled="isLoading"
        @click="handlePrimaryAction"
      />

      <Link
        v-if="view === Views.list"
        label="Add new address"
        size="sm"
        variant="muted"
        @click="emit('setView', Views.add)"
      />
    </footer>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed, defineEmits } from "vue";
import { map } from "lodash-es";

// --- internal
import { useClientAddresses } from "@upmind-automation/headless-vue";

// --- components
import { RadioCards, Link, Icon } from "@upmind-automation/upmind-ui";
import Item from "./Item.vue";

// --- utils
import { find } from "lodash-es";

// --- types
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import type { Address } from "@upmind-automation/headless-vue";
import type { ListProps } from "./types";
import { Views } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ListProps>();

const emit = defineEmits<{
  (e: "setView", value: Views): void;
}>();

const { isReady, getAll, data, setDefault } = useClientAddresses();

const selectedAddress = ref<string>("");
const isLoading = ref(false);

const defaultAddress = computed(() => {
  return find(data.value, { meta: { isDefault: true } }) as Address;
});

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

const primaryLabel = computed(() => {
  switch (props.view) {
    case Views.default:
      return data.value.length > 1 ? "Change" : "Add new address";
    case Views.list:
      return "Confirm";
  }
});

const handlePrimaryAction = async () => {
  switch (props.view) {
    case Views.default:
      emit("setView", data.value.length > 1 ? Views.list : Views.add);
      break;
    case Views.list:
      if (defaultChanged.value) {
        isLoading.value = true;
        await setDefault(selectedAddress.value);
        isLoading.value = false;
      }
      emit("setView", Views.default);
      break;
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
