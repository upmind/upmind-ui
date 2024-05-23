<template>
  <nav
    class="border-base-300 bg-base text-base-content sticky top-0 z-10 -mx-4 -mt-8 flex flex-row items-center justify-start gap-8 border-b px-4 sm:-mx-6 sm:px-6 lg:-mx-20 lg:px-20"
  >
    <template v-for="(step, index) in steps" :key="step.hash">
      <component
        :is="step.disabled ? 'button' : 'router-link'"
        :to="step.disabled ? null : { hash: step.hash }"
        @click="step.disabled ? null : $emit('update:modelValue', step.hash)"
        :disabled="step.disabled"
        class="m-0 flex items-center gap-3 border-b-2 border-transparent py-8 font-light leading-none no-underline transition disabled:pointer-events-none disabled:opacity-50"
        :class="[
          {
            'font-medium': step.hash == selectedHash || step.complete,
            'text-base-content': step.complete,
            '!border-primary': step.hash == selectedHash,
          },
        ]"
      >
        <upw-spinner
          v-if="loading"
          size="xs"
          class="bg-base-200 text-current"
        />

        <upw-avatar
          v-else-if="step.complete"
          avatar="check-circle"
          size="xs"
          class="bg-primary-content text-primary"
        />

        <upw-avatar
          v-else
          :avatar="{
            caption: `${index + 1}`,
          }"
          size="xs"
          :class="
            step.hash == selectedHash ? 'bg-primary text-primary-content' : ''
          "
        />

        <span>{{ step.label }}</span>
      </component>
    </template>

    <slot name="actions">
      <!-- <upw-button
      :disabled="!meta.isReadyForCheckout || meta.isProcessing"
      @click.prevent="doCheckout"
      color="primary"
      class="ml-auto"
    >
      Submit order and pay
    </upw-button> -->
    </slot>
  </nav>
</template>

<script>
// --- external
import { defineComponent, computed } from "vue";

// -- components
import UpwAvatar from "../avatar/Avatar.vue";
import UpwButton from "../button/Button.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// ---utils
import { trimStart } from "lodash-es";

// ----------------------------------------------------------------------------
export default defineComponent({
  name: "UpwStepper",
  components: { UpwAvatar, UpwButton, UpwSpinner },
  emits: ["update:modelValue"],
  props: {
    modelValue: {
      type: String,
      default: "#overview",
    },
    steps: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    return {
      selectedHash: computed(() => {
        const id = trimStart(props.modelValue, "#");
        return `#${id}`;
      }),
    };
  },
});
</script>
