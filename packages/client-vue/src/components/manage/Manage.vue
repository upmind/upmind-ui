<template>
  <div v-if="!meta.isLoading" class="w-full">
    <FormLabel :formItemId="i18nKey">{{
      t(`${i18nKey ?? "manage"}.label`)
    }}</FormLabel>
    <component
      :is="component"
      :i18nKey="i18nKey"
      :useList="manage.useList"
      v-model:open="open"
      v-model="modelValue"
      :readonly="props.readonly"
      :class="props.class"
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
    </component>

    <Form
      v-if="openForm || meta.isEmpty"
      :i18nKey="i18nKey"
      :useMutate="manage.useMutate"
      v-model:open="openForm"
      :model-value="editId"
      :modal="!meta.isEmpty"
      @resolve="doResolve"
      @reject="doReject"
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
    i18nKey?: string; // the i18n key to use for the actions
    modelValue?: string;
    readonly?: boolean;
    as?: "list" | "select";
    identifier?: string; // optional property to use for the list/model to  identify the item, defaults to "id"
    class?: string;
    minimal?: boolean; // if true, the list will be rendered as a minimal list
  }>(),
  {
    i18nKey: "manage",
    modelValue: "",
    readonly: false,
    as: "list",
    identifier: "id"
  }
);

const emits = defineEmits<{
  (e: "update:modelValue", value: any): void; // return the full <T> of the Mutate composable
}>();

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

// --- side effects

await isReady().then(() => {
  openForm.value = meta.value.isEmpty;
});
</script>
