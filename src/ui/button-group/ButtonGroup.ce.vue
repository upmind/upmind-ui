<template>
  <span
    :class="cn(styles.buttonGroup.root, props.class)"
    role="group"
    :aria-disabled="disabled"
  >
    <template
      v-for="(item, index) in items"
      :key="'button-group-item-' + index"
    >
      <span :class="styles.buttonGroup.item">
        <Button
          v-if="item.type === ButtonGroup.Button"
          v-bind="item.props"
          :class="styles.buttonGroup.button"
          size="lg"
          :disabled="disabled || item.props.disabled"
          variant="ghost"
          :ring="false"
          @click="item.handler?.($event)"
        />

        <Select
          v-else-if="item.type === ButtonGroup.Select"
          v-bind="item.props"
          :class="styles.buttonGroup.button"
          :ring="false"
          size="lg"
          variant="ghost"
          :to="to"
          @update:modelValue="item.handler?.($event)"
        />
      </span>
    </template>
  </span>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./buttonGroup.config";

// --- components
import { Button } from "../button";
import { Select } from "../select";

// --- types
import type { ComputedRef } from "vue";
import type { ButtonGroupProps } from "./types";
import { ButtonGroup } from "./types";

const props = withDefaults(defineProps<ButtonGroupProps>(), {
  variant: "control",
  // ---
  items: () => [],
  size: "md",
  // ---
  uiConfig: () => ({ buttonGroup: [] }),
  class: ""
});

const meta = computed(() => ({
  variant: "control",
  isDisabled: props.disabled,
  hasRing: true
}));

const styles = useStyles(
  ["buttonGroup", "buttonGroup.select"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  buttonGroup: {
    root: string;
    item: string;
    button: string;
    select: {
      root: string;
    };
  };
}>;
</script>
