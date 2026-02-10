<template>
  <section :class="cn(styles.banner.root, props.class)" role="banner" aria-live="polite">
    <div :class="styles.banner.container">
      <span v-if="icon || $slots['action']" :class="styles.banner.spacer" aria-hidden="true" />

      <p :class="styles.banner.content">
        <slot>
          {{ text }}
        </slot>
      </p>

      <Link
        v-if="icon"
        :icon="icon"
        size="sm"
        :class="styles.banner.action"
        @click="emit('action')"
      />
    </div>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
// --- internal
import { Link } from "../link";
import config from "./banner.config";
import { useStyles, cn } from "../../utils";
// --- types
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
