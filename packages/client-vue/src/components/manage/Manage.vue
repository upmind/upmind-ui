<template>
  <div v-if="!meta.isLoading" class="w-full">
    <FormLabel v-if="showLabel && label" :formItemId="label">
      {{ label }}
    </FormLabel>

    <component
      :is="component"
      :useList="manage.useList"
      v-model:open="open"
      v-model="modelValue"
      :readonly="props.readonly"
      :class="props.class"
      class="text-md"
      :minimal="props.minimal"
      @add="doAdd"
      @edit="doEdit"
      @remove="doRemove"
    >
      <template name="item" #item="{ item, readonly, doEdit, doRemove }">
        <slot name="item" v-bind="{ item, readonly, doEdit, doRemove }"></slot>
      </template>

      <template #actions="{ open, meta, doAdd }">
        <slot name="actions" v-bind="{ open, meta, doAdd }"></slot>
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
    />
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
import { useVModel } from "@vueuse/core";
import { useI18n } from "vue-i18n";

// --- components
import Form from "./Form.vue";
import List from "./List.vue";
import Select from "./Select.vue";
import { FormLabel } from "@upmind-automation/upmind-ui";

// --- types
import type { ManageRendererProps } from "./types";
import { get } from "lodash-es";

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
  }>(),
  {
    modelValue: "",
    readonly: false,
    as: "list",
    identifier: "id",
    label: "",
    showLabel: false,
    touched: false
  }
);

const emits = defineEmits<{
  (e: "update:modelValue", value: any): void; // return the full <T> of the Mutate composable
  (e: "processing", value: boolean): void;
}>();

const touched = defineModel<boolean>("touched");
// -----------------------------------------------------------------------------
const { meta, isReady } = props.manage.useList();

const { t } = useI18n();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true
});

// -----------------------------------------------------------------------------
const open = ref(false);
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
  modelValue.value = get(value, props.identifier, value);
  openForm.value = false;
  open.value = false;
  editId.value = "";
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
  props.manage.useList().remove(id);
}

// --- side effects

await isReady().then(() => {
  openForm.value = meta.value.isEmpty;
});
</script>
