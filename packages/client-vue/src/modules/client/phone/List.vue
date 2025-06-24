<template>
  <RadioCardsCollapsible
    v-if="!meta.isLoading && !meta.isEmpty"
    v-model:open="open"
    v-model="modelValue"
    :items="parsedValues"
    :list="false"
    minimal
    required
  >
    <template #item="{ item }">
      <Item
        v-bind="item"
        :readonly="props.readonly"
        @edit="doEdit"
        @remove="doRemove"
      />
    </template>

    <template #actions>
      <Link
        v-if="!open && parsedValues.length > 1"
        :label="t('client.phone.actions.change')"
        size="xs"
        variant="muted"
        @click="open = true"
      />

      <Link
        v-else-if="!readonly"
        :label="t('client.phone.actions.add')"
        size="xs"
        variant="muted"
        @click="doAdd"
      />
    </template>
  </RadioCardsCollapsible>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useClientPhones } from "@upmind-automation/headless";

// --- components
import { RadioCardsCollapsible, Link } from "@upmind-automation/upmind-ui";
import Item from "./Item.vue";

// --- utils
import { map } from "lodash-es";

// --- types
import type { PhoneModel } from "@upmind-automation/headless";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import { useVModel } from "@vueuse/core";

// -----------------------------------------------------------------------------

const props = defineProps<{
  clientId: string;
  modelValue?: PhoneModel["id"];
  readonly?: boolean;
  open?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: PhoneModel["id"]): void;
  (e: "add"): void;
  (e: "edit", id: string): void;
  (e: "update:open"): void;
}>();

const { t } = useI18n();
// -----------------------------------------------------------------------------
const { data, meta, default: defaultItem, isReady } = useClientPhones();

await isReady();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: defaultItem.value?.id,
});

// -----------------------------------------------------------------------------
const open = useVModel(props, "open", emits, {
  passive: true,
  defaultValue: false,
});

const parsedValues = computed(() => {
  return map(data.value || [], (item: any, index: number) => {
    return {
      id: item.id,
      value: item.id,
      label: item.title,
      item: item,
      index: index,
    };
  }) as RadioCardsItemProps[];
});

function doAdd() {
  emits("add");
}

function doEdit(id: string) {
  emits("edit", id);
}

function doRemove(id: string) {
  //  TODO
}
</script>
