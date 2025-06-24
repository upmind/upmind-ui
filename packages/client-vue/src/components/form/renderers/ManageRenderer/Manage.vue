<template>
  <FormField v-bind="formFieldProps">
    <Loading :active="meta.isLoading" class="w-full">
      <List
        v-bind="appliedOptions"
        v-model:open="open"
        :model-value="control.data"
        @add="doAdd"
        @edit="doEdit"
        @update:model-value="onInput"
      />

      <Form
        v-if="openModel"
        :useMutate="useMutate"
        v-model:open="openModel"
        :model-value="editId"
        :modal="!meta.isEmpty"
        @resolve="doResolve"
        @reject="doReject"
      />
    </Loading>
  </FormField>
</template>

<script setup lang="ts">
// --- external
import { ref } from "vue";
import { useJsonFormsControlWithDetail } from "@jsonforms/vue";

// --- internal
import { useUpmindUIRenderer, FormField } from "@upmind-automation/upmind-ui";

// --- components
import Form from "./Form.vue";
import List from "./List.vue";
import { Loading } from "@upmind-automation/upmind-ui";

// --- utils
import { get, isEmpty } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// -----------------------------------------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput, formFieldProps } =
  useUpmindUIRenderer(useJsonFormsControlWithDetail(props));

const { list: useList, mutate: useMutate }: ManageRendererProps = get(
  appliedOptions.value,
  "manage",
  {}
) as ManageRendererProps;

// -----------------------------------------------------------------------------
const { meta, isReady } = useList();

await isReady();

// -----------------------------------------------------------------------------
const open = ref(false);
const openModel = ref(meta.value.isEmpty);
const editId = ref<string>("");

function doReject() {
  openModel.value = false;
  editId.value = "";
}

function doResolve(value?: string) {
  onInput(value);
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

<script lang="ts">
import {
  and,
  isObjectControl,
  schemaMatches,
  uiTypeIs,
  optionIs,
} from "@jsonforms/core";
import type { ManageRendererProps } from "./types";

/**
 * Tester for the ManageRenderer.
 * we expect the "manage" property to be in the schema and we expect it to be an boject that contains
 * list: the composable to manage the list of items
 * mutate: the composable to mutate the items, add/update
 * card: the component to override the Item being rendered in the list
 */
export const tester = {
  rank: 4,
  controlType: and(
    uiTypeIs("Manager")
    // optionIs("list", true),
    // optionIs("mutate", true),
    // schemaMatches(schema => !isEmpty((schema as any).manage))
  ),
};
</script>
