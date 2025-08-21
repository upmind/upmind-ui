<template>
  <div
    :class="cn(styles.buttonGroup.root, props.class)"
    role="group"
    :aria-disabled="disabled"
  >
    <template v-for="(item, index) in items" :key="index">
      <Button
        v-if="item.type === 'button'"
        :class="styles.buttonGroup.button"
        v-bind="item.props"
        :color="color"
        :size="size"
        :disabled="disabled || item.props.disabled"
        variant="ghost"
        :ring="false"
        @click="item.handler?.($event)"
      />

      <DropdownMenu
        v-else-if="item.type === 'dropdown'"
        v-bind="item.props"
        :color="color"
        :size="size"
        :disabled="disabled || item.props.disabled"
        :ring="false"
        variant="ghost"
        :uiConfig="{
          dropdownMenu: styles.buttonGroup.dropdown
        }"
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
  size: "md",
  orientation: "horizontal",
  // ---
  items: () => [],
  // ---
  uiConfig: () => ({ buttonGroup: [] }),
  class: ""
});

const meta = computed(() => ({
  size: props.size,
  color: props.color,
  variant: props.variant,
  isDisabled: props.disabled,
  hasRing: true
}));

const styles = useStyles(
  ["buttonGroup", "buttonGroup.dropdown"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  buttonGroup: {
    root: string;
    button: string;
    dropdown: string;
  };
}>;
</script>
