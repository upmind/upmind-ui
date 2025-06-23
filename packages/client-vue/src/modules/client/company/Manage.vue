<template>
  <pre>{{ { open, openModel, modelValue, editId } }}</pre>
  <Loading :active="meta.isLoading" class="w-full">
    <List
      v-model:open="open"
      v-model="modelValue"
      :client-id="props.clientId"
      :readonly="props.readonly"
      @add="doAdd"
      @edit="doEdit"
    />

    <Form
      v-if="openModel"
      v-model:open="openModel"
      :model-value="editId"
      :client-id="props.clientId"
      :modal="!meta.isEmpty"
      @resolve="doResolve"
      @reject="doReject"
    />
  </Loading>
</template>

<script setup lang="ts">
// --- external
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useClientCompanies } from "@upmind-automation/headless";

// --- components
import Form from "./Form.vue";
import List from "./List.vue";
import { Loading } from "@upmind-automation/upmind-ui";

// --- utils

// --- types

import type { CompanyModel } from "@upmind-automation/headless";
import { useVModel } from "@vueuse/core";

// -----------------------------------------------------------------------------

const props = defineProps<{
  clientId: string;
  modelValue?: CompanyModel["id"];
  readonly?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: CompanyModel["id"]): void;
}>();

const { t } = useI18n();
// -----------------------------------------------------------------------------
const { meta, isReady } = useClientCompanies();

await isReady();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
});

// -----------------------------------------------------------------------------
const open = ref(false);
const openModel = ref(meta.value.isEmpty);
const editId = ref<string>("");

function doReject() {
  openModel.value = false;
  editId.value = "";
}

function doResolve(value: CompanyModel["id"]) {
  modelValue.value = value;
  openModel.value = false;
  editId.value = "";
}

function doAdd() {
  openModel.value = true;
  editId.value = "";
}

function doEdit(id: string) {
  openModel.value = true;
  editId.value = id;
}
</script>
