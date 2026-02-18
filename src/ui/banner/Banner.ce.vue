<template>
  <section
    :class="cn(styles.banner.root, props.class)"
    role="banner"
    aria-live="polite"
  >
    <div :class="styles.banner.container">
      <div
        v-if="icon || $slots['action']"
        :class="styles.banner.spacer"
        aria-hidden="true"
      />

      <p :class="styles.banner.content">
        <slot>
          {{ text }}
        </slot>
      </p>

      <Link
        v-if="icon"
        size="sm"
        color="inherit"
        :class="styles.banner.action"
        @click="emit('action')"
      >
        <Icon :icon="icon" :class="styles.banner.icon" />
      </Link>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Icon } from "../icon";
import { Link } from "../link";
import config from "./banner.config";
import { useStyles, cn } from "../../utils";
import type { BannerProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<BannerProps>(), {
  // --- styles
  variant: "solid",
  color: "danger",
  // --- styles
  uiConfig: () => ({ banner: [] }),
  class: ""
});

defineSlots<{
  /** Override the default text content */
  default(props: {}): any;
  /** Override the action area */
  action(props: {}): any;
}>();

const emit = defineEmits<{
  action: [];
}>();

const meta = computed(() => ({
  variant: props.variant,
  color: props.color
}));

const styles = useStyles("banner", meta, config, props.uiConfig ?? {});
</script>
