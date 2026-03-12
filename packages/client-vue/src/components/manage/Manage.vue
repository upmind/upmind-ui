<template>
  <div v-if="!meta.isLoading" class="w-full">
    <FormLabel v-if="showLabel && label" :formItemId="label">
      {{ label }}
    </FormLabel>

    <component
      :is="component"
      :useList="manage.useList"
      v-model:open="safeOpen"
      v-model="modelValue"
      :readonly="readonly"
      :class="props.class"
      class="text-md"
      :minimal="props.minimal"
      :force-open="props.forceOpen"
      @add="doAdd"
      @edit="doEdit"
      @remove="doRemove"
      @setDefault="setDefault"
    >
      <template
        name="item"
        #item="{ item, readonly, doEdit, doRemove, setDefault }"
      >
        <slot
          name="item"
          v-bind="{ item, readonly, doEdit, doRemove, setDefault }"
        ></slot>
      </template>

      <template #actions="{ open, meta, doAdd, doEdit }">
        <slot name="actions" v-bind="{ open, meta, doAdd, doEdit }"></slot>
      </template>
    </component>

    <Form
      v-if="openForm || meta.isEmpty"
      :useMutate="manage.useMutate"
      v-model:open="openForm"
      :model-value="editId"
      :modal="!meta.isEmpty"
      @resolve="doResolve"
      @reject="doReject"
      @processing="emits('processing', $event)"
      :no-actions="!openForm"
      v-model:touched="touched"
    >
      <template v-if="$slots.additional" #additional>
        <slot name="additional" />
      </template>
    </Form>

    <div v-if="$slots.additional && !openForm && !meta.isEmpty" class="pt-4">
      <slot name="additional" />
    </div>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
// --- components
import Form from "./Form.vue";
import List from "./List.vue";
import Select from "./Select.vue";
import { FormLabel } from "@upmind-automation/upmind-ui";

// --- types
import type { ManageRendererProps } from "./types";
import { get } from "lodash-es";
import { isFunction } from "xstate/lib/utils";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    manage: ManageRendererProps; // the manage composable that contains the list and mutate composables
    modelValue?: string;
    readonly?: boolean;
    as?: "list" | "select";
    identifier?: string; // optional property to use for the list/model to  identify the item, defaults to "id"
    class?: string;
    minimal?: boolean; // if true, the list will be rendered as a minimal list
    label?: string; // optional label to show above the component, defaults to the i18n key
    showLabel?: boolean;
    touched?: boolean;
    forceOpen?: boolean;
  }>(),
  {
    modelValue: "",
    readonly: false,
    as: "list",
    identifier: "id",
    label: "",
    showLabel: false,
    touched: false,
    forceOpen: false
  }
);

const emits = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "processing", value: boolean): void;
  (e: "resolve", add: boolean): void;
}>();

const touched = defineModel<boolean>("touched");
// -----------------------------------------------------------------------------
const { meta, isReady } = props.manage.useList();

const modelValue = defineModel<string>("modelValue");

// -----------------------------------------------------------------------------
const open = ref(props.forceOpen);
const safeOpen = computed({
  get() {
    return props.forceOpen ? true : open.value;
  },
  set(value: boolean) {
    open.value = props.forceOpen ? true : value;
  }
});
const openForm = ref(false);
const editId = ref<string | undefined>();
const component = computed(() => {
  return props.as === "list" ? List : Select;
});

// --- methods

function doReject() {
  openForm.value = false;
  editId.value = "";
}

function doResolve(value?: any) {
  const add = !editId.value;
  modelValue.value = get(value, props.identifier ?? "id", value);
  openForm.value = false;
  if (!props.forceOpen) {
    safeOpen.value = false;
  }
  editId.value = "";
  emits("resolve", add);
}

function doAdd() {
  openForm.value = true;
  editId.value = undefined;
}

function doEdit(id: string) {
  openForm.value = true;
  editId.value = id;
}

function doRemove(id: string) {
  const fn = props.manage.useList()?.remove;
  if (!isFunction(fn)) return;
  fn(id);
}

function setDefault(id: string) {
  const fn = props.manage.useList()?.setDefault;
  if (!isFunction(fn)) return;
  fn(id);
}

// --- side effects

await isReady().then(() => {
  openForm.value = meta.value.isEmpty;
});
</script>
