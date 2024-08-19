<template>
  <upw-input
    v-bind="{ ...control, ...appliedOptions }"
    :dirty="!!control.data"
    variant="flat"
  >
    <upm-domain
      v-bind="{ ...control, ...appliedOptions }"
      :id="control.id + '-domain'"
      :disabled="!control.enabled"
      :model-value="control.data"
      @change="onChange"
    />
  </upw-input>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { uiTypeIs, formatIs, and, or } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import UpmDomain from "../domain/Domain.vue";

// --- utils
import { useUpwindRenderer, UpwInput } from "@upmind/upwind";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "DomainRenderer",
  components: {
    UpmDomain,
    UpwInput,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target?.value || undefined
    );
    return {
      ...renderer,
    };
  },
});

export const tester = {
  rank: 3,
  controlType: and(uiTypeIs("Control"), formatIs("domain_name")),
};
</script>
