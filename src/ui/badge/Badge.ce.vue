<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->
  <Badge :class="cn(styles.badge.root, props.class)">
    <slot name="prepend">
      <Icon v-if="icon" :icon="icon" size="nano" :class="styles.badge.icon" />
    </slot>
    <span :class="styles.badge.label">
      <slot>{{ label }}</slot>
    </span>
    <slot name="append">
      <Icon
        v-if="appendIcon"
        :icon="appendIcon"
        size="nano"
        :class="styles.badge.icon"
      />
      <Icon
        v-else-if="props.close"
        icon="x"
        :class="styles.badge.close"
        @click="handleClose"
      />
    </slot>
  </Badge>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Icon } from "../icon";
import config from "./badge.config";
import Badge from "./Badge.vue";
import { useStyles, cn } from "../../utils";
import type { BadgeProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<BadgeProps>(), {
  // --- props
  label: "",
  // --- styles
  variant: "solid",
  color: "primary",
  size: "md",
  // --- styles
  uiConfig: () => ({ badge: [] }),
  class: ""
});

const meta = computed(() => ({
  variant: props.variant,
  color: props.color,
  size: props.size
}));

const styles = useStyles("badge", meta, config, props.uiConfig ?? {});

const emit = defineEmits<{
  close: [];
}>();

function handleClose() {
  emit("close");
}
</script>
