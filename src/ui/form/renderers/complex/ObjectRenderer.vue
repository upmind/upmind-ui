<template>
  <DispatchRenderer
    v-if="control.visible"
    :visible="control.visible"
    :enabled="control.enabled"
    :schema="control.schema"
    :uischema="detailUiSchema"
    :path="control.path"
    :renderers="control.renderers"
    :cells="control.cells"
  />
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { Generate, findUISchema } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsControlWithDetail
} from "@jsonforms/vue";

// --- utils
import { useUpmindUIRenderer } from "../utils";
import { isEmpty } from "lodash-es";

// --- types
import type {
  ControlElement,
  GroupLayout,
  UISchemaElement
} from "@jsonforms/core";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps({
  ...rendererProps<ControlElement>()
});

const { control } = useUpmindUIRenderer(useJsonFormsControlWithDetail(props));

const detailUiSchema: ComputedRef<UISchemaElement> = computed(() => {
  const uiSchemaGenerator = () => {
    const uiSchema = Generate.uiSchema(
      control.value.schema,
      "Group",
      undefined,
      control.value.rootSchema
    );
    if (isEmpty(control.value.path)) {
      uiSchema.type = "VerticalLayout";
    } else {
      (uiSchema as GroupLayout).label = control.value.label;
    }
    return uiSchema;
  };

  const result = findUISchema(
    control.value.uischemas,
    control.value.schema,
    control.value.uischema.scope,
    control.value.path,
    uiSchemaGenerator,
    control.value.uischema,
    control.value.rootSchema
  );

  return result;
});
</script>

<script lang="ts">
import { isObjectControl } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: isObjectControl
};
</script>
