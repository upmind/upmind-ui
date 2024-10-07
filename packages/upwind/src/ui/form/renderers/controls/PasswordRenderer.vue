<template>
  <UpwTextbox
    v-bind="{
      ...control,
      ...appliedOptions,
    }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :max="safeMax"
    :min="safeMin"
    :model-value="control.data"
    @change="onChange"
    :type="unmask ? 'text' : 'password'"
    autocomplete="current-password"
  >
    <template #append="{ styles }">
      <button
        tabindex="-1"
        type="button"
        :class="styles?.button"
        @click.prevent="unmask = !unmask"
      >
        {{ !unmask ? "Show" : "Hide" }}
      </button>
    </template>
  </UpwTextbox>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref } from "vue";
import { isStringControl, formatIs, and } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import UpwTextbox from "../../../textbox/Textbox.vue";

// --- utils
import { useUpwindRenderer } from "../utils";
import { isNil } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "PasswordRenderer",
  components: {
    UpwTextbox,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },

  setup(props: RendererProps<ControlElement>) {
    const unmask = ref(false);

    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target.value || undefined
    );
    return {
      ...renderer,
      unmask,
    };
  },
  computed: {
    safeMin(): number | null {
      const applied = this.appliedOptions?.min;
      if (!isNil(applied)) return applied;

      const minimum = this.control?.schema?.minimum;
      if (!isNil(minimum)) return minimum;

      return null;
    },
    safeMax(): number | null {
      const applied = this.appliedOptions?.max;
      if (!isNil(applied)) return applied;

      const maximum = this.control?.schema?.maximum;
      if (!isNil(maximum)) return maximum;

      return null;
    },
  },
});

export const tester = {
  rank: 2,
  controlType: and(isStringControl, formatIs("password")),
};
</script>
