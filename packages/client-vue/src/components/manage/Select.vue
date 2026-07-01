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
          doRemove,
          setDefault
        }"
      >
        <Item
          v-bind="getItem(item.id!)"
          :readonly="props.readonly"
          @edit="doEdit"
          @remove="doRemove"
        />
      </slot>
    </template>

    <template #dropdown-item="{ item }">
      <slot
        name="item"
        v-bind="{
          item: getItem(item.id!),
          readonly,
          doEdit,
          doRemove,
          setDefault
        }"
      >
        <Item v-bind="getItem(item.id!)" />
      </slot>
    </template>

    <template v-if="!readonly" #additional-item>
      <slot name="additional-item">
        <span
          @click="doAdd"
          class="text-md flex w-full items-center space-x-2 py-0.5 font-normal"
        >
          {{ t("action.add_new") }}
        </span>
      </slot>
    </template>
  </SelectCards>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import { computed, type HtmlHTMLAttributes } from "vue";
import { useI18n } from "vue-i18n";
import { SelectCards } from "@upmind-automation/upmind-ui";
import Item from "./Item.vue";
import { find, map } from "lodash-es";
import type { ManageRendererProps } from "./types";
import type { SelectCardsItemProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{
  useList: ManageRendererProps["useList"]; // the mutation composable needed to create or update the model
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
  (e: "setDefault", id: string): void;
}>();

const { t } = useI18n();
// -----------------------------------------------------------------------------
const { data, meta, default: defaultItem, isReady } = props.useList();

await isReady();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: defaultItem()?.id
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

function doRemove(_id: string) {
  //  TODO
}

function setDefault(id: string) {
  emits("setDefault", id);
}
</script>
