<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <Alert :class="cn(styles.alert.root, props.class)">
    <header class="flex items-start justify-start gap-3">
      <Icon
        v-if="icon"
        :icon="icon"
        size="2xs"
        :class="styles.alert.icon"
        class="p-0.5"
      />
      <div class="text-md/tight w-full gap-2">
        <AlertTitle :class="styles.alert.title">
          <slot name="title">
            <span>{{ title }}</span>
          </slot>
        </AlertTitle>

        <AlertDescription
          v-if="description || $slots['description']"
          :class="styles.alert.description"
        >
          <slot name="description">
            {{ description }}
          </slot>
        </AlertDescription>

        <slot></slot>
      </div>
    </header>

    <footer v-if="action || $slots['action']">
      <slot name="action">
        <div class="flex items-center gap-0.5" :class="styles.alert.action">
          <Button
            size="sm"
            variant="muted-link"
            :label="action"
            class="text-current"
          />
          <Icon icon="arrow-right" class="p-1.5 [&>svg]:size-3" />
        </div>
      </slot>
    </footer>
  </Alert>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import config from "./alert.config";
import {
  useStyles,
  cn
  //stylesheet
} from "../../utils";

// --- components
import Alert from "./Alert.vue";
import AlertTitle from "./AlertTitle.vue";
import AlertDescription from "./AlertDescription.vue";
import { Button } from "../button";
import { Icon } from "../icon";

// --- types
import type { ComputedRef } from "vue";
import type { AlertProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<AlertProps>(), {
  // --- styles
  variant: "muted",
  color: "neutral",
  // --- styles
  uiConfig: () => ({ alert: [] }),
  class: ""
});

defineSlots<{
  /** Append additional content */
  default(props: {}): any;
  /** Provide a title */
  title(props: {}): any;
  /** Provide an action */
  action(props: {}): any;
  /** Provide a description */
  description(props: {}): any;
}>();

const meta = computed(() => ({
  variant: props.variant,
  color: props.color,
  size: props.size
}));

const styles = useStyles(
  "alert",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  alert: {
    root: string;
    title: string;
    description: string;
    icon: string;
    action: string;
  };
}>;
</script>
