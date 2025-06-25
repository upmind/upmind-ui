<template>
  <FormField v-bind="formFieldProps">
    <Manage
      v-bind="appliedOptions"
      :model-value="control.data"
      @update:model-value="onInput"
    />
  </FormField>
</template>

<script setup lang="ts">
// --- external
import { useJsonFormsControlWithDetail } from "@jsonforms/vue";

// --- internal
import { useUpmindUIRenderer, FormField } from "@upmind-automation/upmind-ui";

// --- components
import Manage from "../../manage/Manage.vue";

// --- utils

// --- types
import type { ManageRendererProps } from "../../manage/types";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// -----------------------------------------------------------------------------

const props =
  defineProps<RendererProps<ControlElement & ManageRendererProps>>();

const { control, appliedOptions, onInput, formFieldProps } =
  useUpmindUIRenderer(useJsonFormsControlWithDetail(props));

// -----------------------------------------------------------------------------
</script>

<script lang="ts">
import { and, uiTypeIs } from "@jsonforms/core";

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
