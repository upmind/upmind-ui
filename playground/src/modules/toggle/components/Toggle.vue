<template>
  <span class="toggles">
    <button
      type="button"
      @click="toggle"
      class="toggle"
      :title="isInactive ? 'Click to activate' : 'Active! Click to deactivate'"
      v-if="!isDisabled"
    >
      <ToggleOffIcon v-if="isInactive" />
      <ToggleOnIcon v-else />
    </button>

    <button
      type="button"
      class="toggle"
      title="Reset the toggle"
      @click="reset"
      v-else
    >
      <RefreshIcon />
    </button>

    <span class="status"><slot></slot></span>

    <span class="status debug">
      Active : <strong>{{ count }}</strong> times
    </span>
  </span>
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
  display: flex;
  align-items: center;
  flex-wrap: wrap;

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
