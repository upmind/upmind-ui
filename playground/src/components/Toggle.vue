<template>
  <span class="toggles">
    <button
      type="button"
      @click="toggle"
      class="toggle"
      :title="isInactive ? 'Click to activate' : 'Active! Click to deactivate'"
      :disabled="isDisabled"
    >
      <ToggleOffIcon v-if="isInactive" />
      <ToggleOnIcon v-else />
    </button>

    <button
      type="button"
      class="toggle"
      title="Reset the toggle"
      @click="reset"
      v-if="isDisabled"
    >
      <RefreshIcon />
    </button>
  </span>
  <span class="status">
    Active : <strong>{{ count }}</strong> times
  </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useToggle } from "@/composables/useToggle";
import RefreshIcon from "./icons/IconRefresh.vue";
import ToggleOffIcon from "./icons/IconToggleOff.vue";
import ToggleOnIcon from "./icons/IconToggleOn.vue";

export default defineComponent({
  name: "UpmToggle",
  components: { ToggleOnIcon, ToggleOffIcon, RefreshIcon },
  inheritAttrs: true,
  customOptions: {},
  props: {},
  emits: [],

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props, { attrs }) {
    const toggle = useToggle();

    const { send, isInactive, isDisabled, count } = toggle;

    return {
      send,
      count,
      isInactive,
      isDisabled
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
  display: inline-flex;
  align-items: center;

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
}
.status {
  display: block;
  font-size: 0.75em;
  font-family: monospace;
  background-color: whitesmoke;
  padding: 4px 8px;
  border-radius: 0.25em;
}
</style>
