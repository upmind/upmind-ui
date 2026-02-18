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
      <span :class="cn(styles.buttonGroup.item, item.class)">
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
import { computed } from "vue";
import { Button } from "../button";
import { Select } from "../select";
import config from "./buttonGroup.config";
import { ButtonGroup } from "./types";
import { useStyles, cn } from "../../utils";
import type { ButtonGroupProps } from "./types";

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
);
</script>
