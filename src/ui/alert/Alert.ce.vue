<template>
  <Alert :class="cn(styles.alert.root, props.class)">
    <Icon v-if="icon" :icon="icon" size="2xs" :class="styles.alert.icon" />
    <div :class="styles.alert.content">
      <AlertTitle :class="styles.alert.title">
        <slot name="title">
          {{ title }}
        </slot>
        <slot v-if="!hasDescription && hasAction" name="action">
          <Link size="sm" color="inherit" v-bind="action" @click="onClick">
            <template #append>
              <Icon icon="arrow-right" :class="styles.alert.actionIcon" />
            </template>
          </Link>
        </slot>
      </AlertTitle>

      <AlertDescription
        v-if="hasDescription"
        :class="styles.alert.description"
      >
        <slot name="description">
          {{ description }}
        </slot>
        <slot v-if="hasAction" name="action">
          <Link size="sm" color="inherit" v-bind="action" @click="onClick">
            <template #append>
              <Icon icon="arrow-right" :class="styles.alert.actionIcon" />
            </template>
          </Link>
        </slot>
      </AlertDescription>

      <slot></slot>
    </div>
  </Alert>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { Icon } from "../icon";
import { Link } from "../link";
import config from "./alert.config";

// --- components
import Alert from "./Alert.vue";
import AlertDescription from "./AlertDescription.vue";
import AlertTitle from "./AlertTitle.vue";
import { useStyles, cn } from "../../utils";

// --- types
import type { AlertProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<AlertProps>(), {
  // --- styles
  variant: "muted",
  color: "neutral",
  size: "md",
  // --- styles
  uiConfig: () => ({ alert: [] }),
  class: ""
});

const slots = defineSlots<{
  /** Append additional content */
  default(props: {}): any;
  /** Provide a title */
  title(props: {}): any;
  /** Provide an action */
  action(props: {}): any;
  /** Provide a description */
  description(props: {}): any;
}>();

const emit = defineEmits<{
  click: [];
}>();

function onClick() {
  emit("click");
}

const hasDescription = computed(
  () => !!props.description || !!slots.description
);
const hasAction = computed(() => !!props.action || !!slots.action);

const meta = computed(() => ({
  variant: props.variant,
  color: props.color,
  size: props.size,
  inlineAction: !hasDescription.value && hasAction.value
}));

const styles = useStyles("alert", meta, config, props.uiConfig ?? {});
</script>
