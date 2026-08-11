<template>
  <ToggleGroup
    v-bind="forwarded"
    :variant="variant"
    :size="size"
    :class="cn(styles.toggleGroup.root, props.class)"
  >
    <slot>
      <span
        v-for="item in items"
        :key="`toggle-group-item-${item.value}`"
        :class="styles.toggleGroup.item"
      >
        <ToggleGroupItem
          :value="item.value"
          :disabled="disabled || item.disabled"
          :variant="variant"
          :size="size"
          :aria-label="item.label"
          :class="cn(props.classItem, item.class)"
          v-bind="testAttrs(item)"
        >
          <slot name="item" v-bind="item">
            <Icon v-if="item.icon" :icon="item.icon" size="nano" />
            <span v-if="item.label">{{ item.label }}</span>
          </slot>
        </ToggleGroupItem>
      </span>
    </slot>
  </ToggleGroup>
</template>

<script lang="ts" setup>
import { useForwardPropsEmits } from "radix-vue";
import { computed } from "vue";
import { Icon } from "../icon";
import config from "./toggleGroup.config";
import ToggleGroup from "./ToggleGroup.vue";
import ToggleGroupItem from "./ToggleGroupItem.vue";
import { useStyles, cn, useTestAttrs } from "../../utils";
import { pick } from "lodash-es";
import type { ToggleGroupItem as ToggleGroupItemType } from "./types";
import type { ToggleGroupProps } from "./types";
import type { ToggleGroupRootEmits } from "radix-vue";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ToggleGroupProps>(), {
  // --- props
  items: () => [],
  type: "single",
  // --- variants
  variant: "default",
  size: "default",
  // --- state
  disabled: false,
  rovingFocus: true,
  loop: true,
  // --- styles
  uiConfig: () => ({ toggleGroup: { root: [], item: [] } }),
  class: "",
  classItem: ""
});

const emits = defineEmits<ToggleGroupRootEmits>();

const forwarded = useForwardPropsEmits(
  computed(() =>
    pick(props, [
      "modelValue",
      "defaultValue",
      "type",
      "rovingFocus",
      "disabled",
      "orientation",
      "dir",
      "loop"
    ])
  ),
  emits
);

const meta = computed(() => ({
  variant: props.variant,
  size: props.size,
  isDisabled: props.disabled
}));

const styles = useStyles(["toggleGroup"], meta, config, props.uiConfig ?? {});

function testAttrs(item: ToggleGroupItemType) {
  return useTestAttrs({
    key: "toggle-group-item",
    value: item.value,
    dataAttrs: item.dataAttrs
  });
}
</script>
