<template>
  <FormField v-bind="formFieldProps">
    <RadioCardsCollapsible
      v-model:open="open"
      v-model="selectedItem"
      :items="parsedValues"
      :disabled="isLoading"
      @update:model-value="selectItem"
      list
      required
    >
      <template #item="{ item, isSelected }">
        <Item v-bind="item" :is-selected="isSelected" />
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
          :label="'Add new ' + lowerCase(formFieldProps.label)"
          size="xs"
          variant="muted"
          @click="clearItem"
        />
      </template>
    </RadioCardsCollapsible>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed, watch, onMounted } from "vue";
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
import { find, lowerCase, map } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import { useBillingDetails } from "@upmind-automation/headless-vue";

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

const { setDefault } = useBillingDetails();

const isLoading = ref(false);
const open = ref(false);

const selectedItem = ref<string>("");

onMounted(() => {
  selectedDefaultItem();
});

const parsedValues = computed(() => {
  return map(
    control.value.uischema.options?.oneOf || [],
    (item: any, index: number) => {
      return {
        id: item.id,
        value: item.id,
        label: item.title,
        item: item.item,
        index: index,
        modelValue: selectedItem.value,
      };
    }
  ) as RadioCardsItemProps[];
});

const selectItem = async (value: string) => {
  onInput(value, false);
  selectedItem.value = value;
  await setDefault(value);
};

const clearItem = () => {
  onInput(null, false);
};

watch(parsedValues, () => {
  selectedDefaultItem();
  open.value = false;
});

const selectedDefaultItem = () => {
  selectedItem.value =
    (
      find(
        parsedValues.value,
        value => value.item?.meta?.isDefault
      ) as RadioCardsItemProps
    )?.id ?? "";
};
</script>

<script lang="ts">
import { uiTypeIs, and } from "@jsonforms/core";

export const tester = {
  rank: 4,
  controlType: and(uiTypeIs("AddressList")),
};
</script>
