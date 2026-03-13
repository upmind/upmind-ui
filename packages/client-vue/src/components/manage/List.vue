<template>
  <RadioCardsCollapsible
    v-if="!meta.isLoading && !meta.isEmpty"
    v-model:open="open"
    v-model="modelValue"
    :name="`${modelValue}-radio-cards`"
    :items="parsedValues"
    :class="props.class"
    :list="false"
    :minimal="props.minimal"
    :force-open="props.forceOpen"
    required
  >
    <template #item="{ item }">
      <slot
        name="item"
        v-bind="{
          item: getItem(item.id!),
          readonly: readonly || (!open && parsedValues.length > 1),
          doEdit,
          doRemove,
          setDefault
        }"
      >
        <Item
          v-bind="getItem(item.id!)"
          :readonly="props.readonly || (!open && parsedValues.length > 1)"
          @edit="doEdit"
          @remove="doRemove"
          @setDefault="setDefault"
        />
      </slot>
    </template>

    <template #actions>
      <slot name="actions" v-bind="{ open, meta, doAdd }">
        <footer class="mt-1 flex space-x-2">
          <Link
            v-if="!open && parsedValues.length > 1"
            :label="t('action.change')"
            size="sm"
            color="muted"
            @click="open = true"
          />

          <Link
            v-else-if="!readonly"
            :label="t('action.add_new')"
            size="sm"
            color="muted"
            @click="doAdd"
          />

          <!-- TODO: Decide on the designs for the list close -->
          <Link
            v-if="open"
            class="sr-only"
            :label="t('action.close')"
            size="sm"
            color="muted"
            @click="open = false"
          />
        </footer>
      </slot>
    </template>
  </RadioCardsCollapsible>
</template>

<script setup lang="ts">
// --- external
import { computed, type HtmlHTMLAttributes } from "vue";
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal

// --- components
import {
  RadioCardsCollapsible,
  Button,
  Link
} from "@upmind-automation/upmind-ui";
import Item from "./Item.vue";

// --- utils
import { find, map } from "lodash-es";

// --- types
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import type { ManageRendererProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<{
  useList: ManageRendererProps["useList"]; // the mutation composable needed to create or update the model
  modelValue?: string;
  readonly?: boolean;
  open?: boolean;
  forceOpen?: boolean;
  minimal?: boolean; // if true, the component will not show the actions and will not be collapsible
  class?: HtmlHTMLAttributes["class"];
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "add"): void;
  (e: "edit", id: string): void;
  (e: "remove", id: string): void;
  (e: "update:open"): void;
  (e: "setDefault", id: string): void;
}>();

const { t } = useI18n();
// -----------------------------------------------------------------------------
const { data, meta, default: defaultItem, isReady } = props.useList();

await isReady();

const modelValue = defineModel<string>("modelValue", {});

// -----------------------------------------------------------------------------
const open = defineModel<boolean>("open", {});

const parsedValues = computed(() => {
  return map(data?.value ?? [], (item: any, index: number) => {
    return {
      id: item.id,
      value: item.id,
      label: item.title,
      item: item,
      index: index
    };
  }) as RadioCardsItemProps[];
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
  emits("remove", id);
}

function setDefault(id: string) {
  emits("setDefault", id);
}
</script>
