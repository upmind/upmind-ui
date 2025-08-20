<template>
  <div
    :class="cn(styles.buttonGroup.root, props.class)"
    role="group"
    :aria-disabled="disabled"
  >
    <template v-for="(item, index) in items" :key="index">
      <Button
        v-if="item.type === 'button'"
        v-bind="item.props"
        variant="ghost"
        :size="size"
        :disabled="disabled || item.props.disabled"
        @click="item.handler?.($event)"
      />

      <DropdownMenu
        v-else-if="item.type === 'dropdown'"
        v-bind="item.props"
        :disabled="disabled || item.props.disabled"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./buttonGroup.config";

// --- components
import { Button } from "../button";
import { DropdownMenu } from "../dropdown-menu";

// --- types
import type { ComputedRef } from "vue";
import type { ButtonGroupProps } from "./types";

const props = withDefaults(defineProps<ButtonGroupProps>(), {
  variant: "outline",
  color: "base",
  size: "md",
  orientation: "horizontal",
  disabled: false,
  uiConfig: () => ({ buttonGroup: [] }),
  class: "",
  items: () => []
});

const meta = computed(() => ({
  orientation: props.orientation,
  isDisabled: props.disabled
}));

const styles = useStyles(
  ["buttonGroup"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  buttonGroup: {
    root: string;
    button: string;
  };
}>;
</script>
