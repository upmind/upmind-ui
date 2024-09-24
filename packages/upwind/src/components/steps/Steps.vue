<template>
  <nav :class="styles.steps.root">
    <div :class="styles.steps.wrapper">
      <slot name="prepend"> </slot>

      <UpwStep
        v-for="(step, index) in steps"
        :key="step.hash"
        v-bind="step"
        :loading="loading"
        :selected="step.hash == selectedHash && !step?.disabled"
        :caption="`${index + 1}`"
        @update:modelValue="$emit('update:modelValue', $event)"
      >
      </UpwStep>

      <slot name="append"></slot>
    </div>
  </nav>
</template>

<script>
// --- external
import { defineComponent, computed, toRefs } from "vue";

// -- components
import UpwStep from "./Step.vue";

// --- local
import config from "./config.cva";

// ---utils
import { useStyles } from "../../utils";
import { trimStart } from "lodash-es";

// ----------------------------------------------------------------------------
export default defineComponent({
  name: "UwpwSteps",
  components: { UpwStep },
  emits: ["update:modelValue"],
  props: {
    modelValue: {
      type: String,
      default: "#overview",
    },
    steps: {
      type: Array, // TODO add propType for Array of Steps
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Object, Array], default: () => ({}) },
  },
  setup(props) {
    const styles = useStyles(
      "steps",
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      styles,
      config,
      selectedHash: computed(() => {
        const id = trimStart(props.modelValue, "#");
        return `#${id}`;
      }),
    };
  },
});
</script>
