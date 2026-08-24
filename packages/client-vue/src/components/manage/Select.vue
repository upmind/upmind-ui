<template>
  <div
    v-if="!meta.isLoading && !meta.isEmpty"
    :class="props.class"
    data-test-key="select-cards"
  >
    <OptionTileGroup
      :model-value="modelValue"
      mode="single"
      :data-attrs="{ 'data-test-key': 'select-option-tile-group' }"
      required
      @update:model-value="onSelect"
    >
      <OptionTile
        v-for="item in displayedValues"
        :key="item.value"
        :value="item.value"
      >
        <template #label>
          <slot
            name="item"
            v-bind="{
              item: getItem(item.id),
              readonly,
              doEdit,
              doRemove,
              setDefault
            }"
          >
            <Item
              v-bind="getItem(item.id)"
              :readonly="props.readonly"
              @edit="doEdit"
              @remove="doRemove"
            />
          </slot>
        </template>
      </OptionTile>
    </OptionTileGroup>

    <footer v-if="!minimal" class="mt-1 flex space-x-2">
      <Link
        v-if="!open && parsedValues.length > 1"
        :data-attrs="{ 'data-test-key': 'select-link-change' }"
        size="sm"
        color="muted"
        @click="open = true"
        >{{ t("action.change") }}</Link
      >

      <slot v-else-if="!readonly" name="additional-item">
        <Link
          :data-attrs="{ 'data-test-key': 'select-link-add-new' }"
          size="sm"
          color="muted"
          @click="doAdd"
          >{{ t("action.add_new") }}</Link
        >
      </slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import { computed, type HtmlHTMLAttributes } from "vue";
import { useI18n } from "vue-i18n";
import { OptionTileGroup, OptionTile } from "@upmind/ui";
import { Link } from "@upmind/ui";
import Item from "./Item.vue";
import { find, map } from "lodash-es";
import type { ManageRendererProps } from "./types";

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

const parsedValues = computed(() =>
  map(data.value ?? [], (item: any, index: number) => ({
    id: item.id,
    value: item.id,
    label: item.title,
    item: item,
    index: index
  }))
);

// Collapsed (closed, not minimal) shows only the current selection; the change
// action reveals every card.
const displayedValues = computed(() => {
  if (open.value || props.minimal) return parsedValues.value;
  const selected = parsedValues.value.find(v => v.value === modelValue.value);
  return selected ? [selected] : parsedValues.value;
});

// --- methods
function onSelect(value: unknown) {
  modelValue.value = String(value);
  // Picking an option closes the list, as the retired collapsible did — the
  // "Change" action only returns once the list is closed again.
  open.value = false;
}

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
