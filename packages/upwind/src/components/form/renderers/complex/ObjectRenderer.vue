<template>
  <dispatch-renderer
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

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { Generate, findUISchema, isObjectControl } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsControlWithDetail,
} from "@jsonforms/vue";

// --- components

// --- local

// --- utils
import { useUpwindRenderer } from "../utils";
import { isEmpty } from "lodash-es";

// --- types
import type {
  ControlElement,
  GroupLayout,
  UISchemaElement,
} from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "ObjectRenderer",
  components: {
    DispatchRenderer,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(useJsonFormsControlWithDetail(props));

    // we dont process styles as  we are using an upwind control, so rather pass the configs and allow the control to handle it
    return {
      ...renderer,
    };
  },
  computed: {
    detailUiSchema(): UISchemaElement {
      const uiSchemaGenerator = () => {
        const uiSchema = Generate.uiSchema(
          this.control.schema,
          "Group",
          undefined,
          this.control.rootSchema
        );
        if (isEmpty(this.control.path)) {
          uiSchema.type = "VerticalLayout";
        } else {
          (uiSchema as GroupLayout).label = this.control.label;
        }
        return uiSchema;
      };

      const result = findUISchema(
        this.control.uischemas,
        this.control.schema,
        this.control.uischema.scope,
        this.control.path,
        uiSchemaGenerator,
        this.control.uischema,
        this.control.rootSchema
      );

      return result;
    },
  },
});

export const tester = {
  rank: 2,
  controlType: isObjectControl,
};
</script>
