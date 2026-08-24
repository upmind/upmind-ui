<template>
  <div
    v-if="!meta.isLoading && !meta.isEmpty"
    :class="props.class"
    :data-test-key="`${modelValue}-radio-cards`"
  >
    <OptionTileGroup
      :name="`${modelValue}-radio-cards`"
      :model-value="modelValue"
      mode="single"
      :data-attrs="{ 'data-test-key': 'option-tile-group' }"
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
              readonly: readonly || (!open && parsedValues.length > 1),
              doEdit,
              doRemove,
              setDefault
            }"
          >
            <Item
              v-bind="getItem(item.id)"
              :readonly="props.readonly || (!open && parsedValues.length > 1)"
              @edit="doEdit"
              @remove="doRemove"
              @setDefault="setDefault"
            />
          </slot>
        </template>
      </OptionTile>
    </OptionTileGroup>

    <slot v-if="!minimal" name="actions" v-bind="{ open, meta, doAdd }">
      <footer class="mt-1 flex space-x-2">
        <Link
          v-if="!open && parsedValues.length > 1"
          data-test-key="link-change"
          size="sm"
          color="muted"
          @click="open = true"
          >{{ t("action.change") }}</Link
        >

        <Link
          v-else-if="!readonly"
          :data-attrs="{ 'data-test-key': 'link-add-new' }"
          size="sm"
          color="muted"
          @click="doAdd"
          >{{ t("action.add_new") }}</Link
        >

        <!-- TODO: Decide on the designs for the list close -->
        <Link
          v-if="open"
          class="sr-only"
          size="sm"
          color="muted"
          @click="open = false"
          >{{ t("action.close") }}</Link
        >
      </footer>
    </slot>
  </div>
</template>

<script setup lang="ts">
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
const { data, meta, default: _defaultItem, isReady } = props.useList();

await isReady();

const modelValue = defineModel<string>("modelValue", {});

// -----------------------------------------------------------------------------
const open = defineModel<boolean>("open", {});

const parsedValues = computed(() =>
  map(data?.value ?? [], (item: any, index: number) => ({
    id: item.id,
    value: item.id,
    label: item.title,
    item: item,
    index: index
  }))
);

// Collapsed (closed, not minimal/forced) shows only the current selection;
// expanding via the actions footer reveals every card.
const isExpanded = computed(
  () => !!open.value || !!props.minimal || !!props.forceOpen
);
const displayedValues = computed(() => {
  if (isExpanded.value) return parsedValues.value;
  const selected = parsedValues.value.find(v => v.value === modelValue.value);
  return selected ? [selected] : parsedValues.value;
});

// --- methods
function onSelect(value: unknown) {
  modelValue.value = String(value);
  // Picking an option closes the list, as the retired collapsible did — the
  // "Change" action only returns once the list is closed again.
  if (!props.forceOpen && !props.minimal) open.value = false;
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

function doRemove(id: string) {
  emits("remove", id);
}

function setDefault(id: string) {
  emits("setDefault", id);
}
</script>
