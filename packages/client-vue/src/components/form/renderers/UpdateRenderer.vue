<template>
  <FormField v-bind="formFieldProps">
    <!-- <Dialog v-if="model()" :open="open" size="xl"> -->
    <pre>model: {{ control.data }}</pre>
    <!-- <footer class="flex justify-end gap-x-6">
      <Link as="Button" variant="muted">Close</Link>
      <Button color="secondary">Save</Button>
    </footer>
  </Dialog> -->
  </FormField>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";
import {
  useUpmindUIRenderer,
  Button,
  Dialog,
  Link,
  FormField,
} from "@upmind-automation/upmind-ui";
import type { RendererProps } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";
import { useSchemaComposable } from "./utils";

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const open = ref(true);
</script>

<script lang="ts">
import { uiTypeIs, and } from "@jsonforms/core";

export const tester = {
  rank: 4,
  controlType: and(uiTypeIs("Update")),
};
</script>
