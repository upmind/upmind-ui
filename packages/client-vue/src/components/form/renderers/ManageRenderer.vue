<template>
  <FormField v-bind="formFieldProps">
    <!-- Bound by name, not spread: the options bag also carries the CONTROL
         options (placeholder, size, …), and Manage declares none of them. -->
    <Manage
      :manage="appliedOptions.manage as ManageRendererProps"
      :model-value="control.data"
      :readonly="appliedOptions.readonly"
      :as="manageAs"
      :label="appliedOptions.label"
      :class="manageClass"
      :touched="formFieldProps.touched"
      @update:model-value="onInput"
    />
  </FormField>
</template>

<script setup lang="ts">
import { and, uiTypeIs } from "@jsonforms/core";
import { useJsonFormsControlWithDetail } from "@jsonforms/vue";
import { computed } from "vue";
import Manage from "../../manage/Manage.vue";
import FormField from "../engine/FormField.vue";
import { useUpmindUIRenderer } from "../engine/renderers/utils";
import type { ManageRendererProps } from "../../manage/types";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// --- external

// -----------------------------------------------------------------------------

const props =
  defineProps<RendererProps<ControlElement & ManageRendererProps>>();

const { control, appliedOptions, onInput, formFieldProps } =
  useUpmindUIRenderer(useJsonFormsControlWithDetail(props));

/** A `|` inside a template binding parses as a Vue filter, so it lives here. */
const manageClass = computed(() => appliedOptions.value?.class as string);

/** Manage offers exactly two shapes; anything else is its own default. */
const manageAs = computed(() =>
  appliedOptions.value?.as === "select" ? "select" : "list"
);

// -----------------------------------------------------------------------------
</script>

<script lang="ts">
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
  )
};
</script>
