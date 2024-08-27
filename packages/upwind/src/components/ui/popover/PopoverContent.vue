<template>
  <PopoverPortal>
    <PopoverContent v-bind="$attrs" :class="styles.popover.content">
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { PopoverContent, PopoverPortal } from "radix-vue";

// --- internal
import { config } from ".";

// --- utils
import { useStyles } from "../../../utils";

export default defineComponent({
  components: {
    PopoverContent,
    PopoverPortal,
  },
  props: {
    align: { type: String, default: "center" },
    sideOffset: { type: Number, default: 4 },
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
  emits: [
    "escapeKeyDown",
    "pointerDownOutside",
    "focusOutside",
    "interactOutside",
    "dismiss",
  ],
  inheritAttrs: false,
  setup(props) {
    const styles = useStyles("popover", props, config);

    return {
      styles,
    };
  },
});
</script>
