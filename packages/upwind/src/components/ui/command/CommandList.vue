<template>
  <ComboboxContent v-bind="forwarded" :class="styles.command.list">
    <div role="presentation">
      <slot />
    </div>
  </ComboboxContent>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";
import { ComboboxContent, useForwardPropsEmits } from "radix-vue";

// --- internal
import { config } from ".";

// --- utils
import { useStyles } from "../../../utils";

export default defineComponent({
  components: {
    ComboboxContent,
  },
  props: {
    dismissable: { type: Boolean, default: false },
    position: { type: String },
    side: { type: String },
    sideOffset: { type: Number },
    align: { type: String },
    alignOffset: { type: Number },
    avoidCollisions: { type: Boolean },
    collisionBoundary: { type: [Object, Array] },
    collisionPadding: { type: [Number, Object] },
    arrowPadding: { type: Number },
    sticky: { type: String },
    hideWhenDetached: { type: Boolean },
    updatePositionStrategy: { type: String },
    onPlaced: { type: Function },
    prioritizePosition: { type: Boolean },
  },
  emits: ["update:open"],
  setup(props, { emit }) {
    const delegatedProps = computed(() => {
      const { ...delegated } = props;
      return delegated;
    });

    const forwarded = useForwardPropsEmits(delegatedProps, emit);
    const styles = useStyles("command", props, config);

    return {
      forwarded,
      styles,
    };
  },
});
</script>
