<template>
  <div class="toggles">
    <button
      type="button"
      @click="toggle"
      :class="['toggle', { processing: !isDisabled && isProcessing }]"
      :title="isInactive ? 'Click to activate' : 'Active! Click to deactivate'"
      :disabled="isProcessing || isDisabled"
    >
      <ToggleOffIcon v-if="isInactive" />
      <ToggleOnIcon v-else />
    </button>

    <button
      type="reset"
      :class="['toggle', { processing: isProcessing }]"
      title="Reset the toggle"
      @click="reset"
      :disabled="isProcessing"
      v-if="isDisabled"
    >
      <RefreshIcon />
    </button>

    <div class="status debug">
      <div><slot></slot></div>
      Active : <strong>{{ count }}</strong> times
    </div>
  </div>
</template>

<script lang="ts">
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

<style scoped lang="scss">
.toggles {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;

  &:not(:first-child) {
    margin-top: 16px;
  }
  .toggle {
    display: inherit;
    align-items: inherit;

    &:not(:disabled) {
      cursor: pointer;
    }

    &:disabled {
      .icon {
        opacity: 0.25;
      }
    }

    .icon {
      margin-right: 4px;
    }
  }

  .text {
    margin-left: 4px;
  }

  .processing .icon {
    animation: rotate 1s linear infinite;
  }

  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
}
.status {
  display: block;
  font-size: 0.75em;
  margin: 0 4px;
  font-family: monospace;
}
.debug {
  background-color: whitesmoke;
  padding: 4px 8px;
  margin: 4px 0 0;
  border-radius: 0.25em;
  flex-basis: 100%;
}
</style>
@/modules/toggle/composables/useToggle
