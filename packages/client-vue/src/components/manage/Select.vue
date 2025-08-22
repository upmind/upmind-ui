<template>
  <SelectCards
    v-if="!meta.isLoading && !meta.isEmpty"
    v-model:open="open"
    v-model="modelValue"
    :items="parsedValues"
    :class="props.class"
    :minimal="props.minimal"
    :list="false"
    required
  >
    <template #item="{ item }">
      <slot
        name="item"
        v-bind="{
          item: getItem(item.id!),
          readonly,
          doEdit,
          doRemove
        }"
      >
        <Item
          v-bind="getItem(item.id!)"
          :i18nKey="i18nKey"
          :readonly="props.readonly"
          @edit="doEdit"
          @remove="doRemove"
        />
      </slot>
    </template>

    <template #dropdown-item="{ item }">
      <slot
        name="item"
        v-bind="{ item: getItem(item.id!), readonly, doEdit, doRemove }"
      >
        <Item v-bind="getItem(item.id!)" :i18nKey="i18nKey" />
      </slot>
    </template>

    <template v-if="!readonly" #additional-item>
      <slot name="additional-item">
        <p @click="doAdd" class="w-full">
          {{ t(`${i18nKey ?? "manage"}.actions.add`) }}
        </p>
      </slot>
    </template>
  </SelectCards>
</template>

<script setup lang="ts">
// --- external
import { computed, type HtmlHTMLAttributes } from "vue";
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal

// --- components
import { SelectCards } from "@upmind-automation/upmind-ui";
import Item from "./Item.vue";

// --- utils
import { find, map } from "lodash-es";

// --- types
import type { SelectCardsItemProps } from "@upmind-automation/upmind-ui";
import type { ManageRendererProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<{
  useList: ManageRendererProps["useList"]; // the mutation composable needed to create or update the model
  i18nKey?: string; // optional i18n key for actions
  modelValue?: string;
  readonly?: boolean;
  open?: boolean;
  minimal?: boolean; // if true, the component will not show the actions and will not be collapsible
  class?: HtmlHTMLAttributes["class"];
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "add"): void;
  (e: "edit", id: string): void;
  (e: "update:open"): void;
}>();

const { t } = useI18n();
// -----------------------------------------------------------------------------
const { data, meta, default: defaultItem, isReady } = props.useList();

await isReady();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: defaultItem.value?.id
});

// -----------------------------------------------------------------------------
const open = useVModel(props, "open", emits, {
  passive: true,
  defaultValue: false
});

const parsedValues = computed(() => {
  return map(data.value ?? [], (item: any, index: number) => {
    return {
      id: item.id,
      value: item.id,
      label: item.title,
      item: item,
      index: index
    };
  }) as SelectCardsItemProps[];
});

// --- methods
function getItem(id: string) {
  return find(data.value, ["id", id]);
}

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
