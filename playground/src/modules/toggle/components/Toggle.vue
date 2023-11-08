<template>
  <div class="toggles flex flex-wrap items-center justify-start py-4">
    <fieldset class="form-control">
      <label class="label cursor-pointer uppercase indicator">
        <input
          type="checkbox"
          class="toggle toggle-success pointer-events-none"
          :disabled="isDisabled"
          :checked="!isInactive"
          @input="toggle"
        />
        <strong
          v-if="!!count"
          class="indicator-item badge badge-sm badge-neutral"
          :class="{
            'badge-error': isDisabled
          }"
          >{{ count }}</strong
        >
      </label>
    </fieldset>

    <button
      type="reset"
      class="btn btn-square btn-xs mx-1"
      title="Reset the toggle"
      @click="reset"
      v-if="isDisabled"
    >
      <ArrowPathIcon class="w-5 h-5" />
    </button>

    <div class="status debug flex-1 ml-1 text-xs text-neutral">
      <em><slot></slot></em>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useToggle } from "../composables/useToggle";
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
    const toggle = useToggle(props);

    const { send, isInactive, isDisabled, isProcessing, count } = toggle;

    return {
      send,
      count,
      isInactive,
      isDisabled,
      isProcessing
    };
  },

  computed: {},

  methods: {
    reset() {
      this.send("RESET");
    },

    toggle() {
      this.send("TOGGLE");
    }
  }
});
</script>
