<template>
  <FormField v-bind="formFieldProps">
    <RadioCardsCollapsible
      v-model:open="open"
      v-model="selectedAddress"
      :items="parsedValues"
      :disabled="isLoading"
      list
      required
    >
      <template #item="{ item }">
        <Item
          :address="getAddress(item.value)"
          :is-default="item.value === selectedAddress"
        />
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
          @click="clearAddress"
        />
      </template>
    </RadioCardsCollapsible>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import {
  FormField,
  RadioCardsCollapsible,
  Link,
} from "@upmind-automation/upmind-ui";
import Item from "../../../modules/client/components/billing/Item.vue";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { find, map } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import type { Address } from "@upmind-automation/headless-vue";

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

// Use the basic control instead of oneOfEnumControl since we want custom oneOf from options
const { control, formFieldProps, onInput } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

const addresses = computed(() => {
  const oneOfOptions = control.value.uischema.options?.oneOf || [];
  return oneOfOptions;
});

const isLoading = ref(false);

const open = ref(false);

const defaultAddress = computed(() => {
  return find(addresses.value, { meta: { isDefault: true } }) as Address;
});

const selectedAddress = ref<string>(defaultAddress.value?.id ?? "");

const getAddress = (id: string) => {
  return find(addresses.value, { id }) as Address;
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

const clearAddress = () => {
  onInput(null, false);
};
</script>

<script lang="ts">
import { uiTypeIs, and } from "@jsonforms/core";

export const tester = {
  rank: 4,
  controlType: and(uiTypeIs("AddressList")),
};
</script>
