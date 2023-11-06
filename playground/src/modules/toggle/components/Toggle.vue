<template>
  <div class="toggles">
    <button
      type="button"
      @click="toggle"
      :class="['toggle', { processing: !isDisabled && isProcessing }]"
      :title="isInactive ? 'Click to activate' : 'Active! Click to deactivate'"
      :disabled="isProcessing || isDisabled"
    >
      <toggle-off-icon v-if="isInactive" />
      <toggle-on-icon v-else />
    </button>

    <button
      type="reset"
      :class="['toggle', { processing: isProcessing }]"
      title="Reset the toggle"
      @click="reset"
      :disabled="isProcessing"
      v-show="isDisabled"
    >
      <refresh-icon />
    </button>

    <div class="status debug">
      <div><slot></slot></div>
      Active : <strong>{{ count }}</strong> times
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useToggle } from "../composables/useToggle";
import RefreshIcon from "@/components/icons/IconRefresh.vue";
import ToggleOffIcon from "@/components/icons/IconToggleOff.vue";
import ToggleOnIcon from "@/components/icons/IconToggleOn.vue";

export default defineComponent({
  name: "UpmToggle",
  components: { ToggleOnIcon, ToggleOffIcon, RefreshIcon },
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
