<template>
  <div class="toggles flex flex-wrap items-center justify-start py-4">
    <fieldset
      class="form-control"
      v-if="!meta.isDisabled || !meta.isProcessing"
    >
      <label class="label cursor-pointer uppercase indicator">
        <input
          type="checkbox"
          class="toggle toggle-success pointer-events-none"
          :disabled="meta.isDisabled"
          :checked="!meta.isInactive"
          @input="toggle"
        />

        <button
          v-if="!!count"
          @click="reset"
          :disabled="meta.isProcessing"
          type="reset"
          class="indicator-item badge badge-sm badge-neutral"
          :class="{
            'badge-error': meta.isDisabled
          }"
          :title="meta.isDisabled ? 'Click to Reset' : ''"
        >
          <span>{{ count }}</span>
          <span v-if="meta.isDisabled">
            <arrow-path-icon class="w-3 h-3 ml-1"
          /></span>
        </button>
      </label>
    </fieldset>

    <progress
      v-if="meta.isDisabled && meta.isProcessing"
      class="progress progress-neutral w-12"
    ></progress>

    <div class="status debug flex-1 ml-1 text-xs text-neutral">
      <em><slot></slot></em>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useToggle } from "../";
import { ArrowPathIcon } from "@heroicons/vue/24/solid";

export default defineComponent({
  name: "UpmToggle",
  components: { ArrowPathIcon },
  inheritAttrs: true,
  customOptions: {},
  props: {
    useGlobal: {
      type: Boolean,
      default: false
    }
  },
  emits: [],

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props, { attrs }) {
    const toggler = useToggle(props);

    const { meta, count, toggle, reset } = toggler;

    return {
      toggle,
      reset,
      count,
      meta
    };
  },

  computed: {}
});
</script>
../useToggle
