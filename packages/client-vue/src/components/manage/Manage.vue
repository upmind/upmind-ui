<template>
  <div v-if="!meta.isLoading" class="w-full">
    <List
      :i18nKey="i18nKey"
      :useList="manage.useList"
      v-model:open="open"
      v-model="modelValue"
      :readonly="props.readonly"
      :minimal="props.minimal"
      @add="doAdd"
      @edit="doEdit"
    >
      <template name="item" #item="{ item, readonly, doEdit, doRemove }">
        <slot name="item" v-bind="{ item, readonly, doEdit, doRemove }"></slot>
      </template>

      <template #actions="{ open, meta, doAdd }">
        <slot name="actions" v-bind="{ open, meta, doAdd }"></slot>
      </template>
    </List>

    <Form
      v-if="openModel || meta.isEmpty"
      :i18nKey="i18nKey"
      :useMutate="manage.useMutate"
      v-model:open="openModel"
      :model-value="editId"
      :modal="!meta.isEmpty"
      @resolve="doResolve"
      @reject="doReject"
    />
  </div>
</template>

<script setup lang="ts">
// --- external
import { ref } from "vue";
import { useVModel } from "@vueuse/core";
// --- internal

// --- components
import Form from "./Form.vue";
import List from "./List.vue";
import { Loading } from "@upmind-automation/upmind-ui";

// --- utils

// --- types
import type { ManageRendererProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<{
  manage: ManageRendererProps; // the manage composable that contains the list and mutate composables
  i18nKey?: string; // the i18n key to use for the actions
  modelValue?: string;
  readonly?: boolean;
  minimal?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: any): void; // return the full <T> of the Mutate composable
}>();

// -----------------------------------------------------------------------------
const { meta, isReady } = props.manage.useList();
await isReady();
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true
});

// -----------------------------------------------------------------------------
const open = ref(false);
const openModel = ref(false);
const editId = ref<string | undefined>();

// --- methods

function doReject() {
  openModel.value = false;
  editId.value = "";
}

function doResolve(value?: string) {
  modelValue.value = value;
  openModel.value = false;
  open.value = false;
  editId.value = "";
}

function doAdd() {
  openModel.value = true;
  editId.value = undefined;
}

function doEdit(id: string) {
  openModel.value = true;
  editId.value = id;
}

// --- side effects
</script>
