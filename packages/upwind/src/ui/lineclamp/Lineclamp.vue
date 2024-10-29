<template>
  <div class="upw-lineclamp" :class="styles.lineclamp.root">
    <div ref="wrapper" :class="styles.lineclamp.wrapper">
      <slot />
    </div>

    <transition name="fade">
      <p v-if="truncated" :class="styles.lineclamp.actions">
        <Button
          variant="link"
          size="xs"
          @click="open = !open"
          :label="meta.isOpen ? labelLess : labelMore"
          :append-icon="meta.isOpen ? iconLess : iconMore"
        />
      </p>
    </transition>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed, useTemplateRef, onMounted, nextTick, watch } from "vue";

// --- internal
import Button from "../../ui/button/Button.ce.vue";
import config from "./config.cva";

// --- utils
import { cn, useStyles } from "../../utils";

// --- types
import type { ComputedRef } from "vue";
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    labelMore?: string;
    labelLess?: string;
    iconMore?: string;
    iconLess?: string;
    lines?: number;
    forceOpen?: boolean;
  }>(),
  {
    labelMore: "Show more",
    labelLess: "Show less",
    iconMore: "arrow-down",
    iconLess: "arrow-up",
    lines: 3,
    forceOpen: false,
  }
);

const open = ref(props.forceOpen);
const truncated = ref(false);
const wrapper = useTemplateRef("wrapper");

const meta = computed(() => ({
  lines: props.lines,
  isOpen: open.value,
  isTruncated: truncated.value,
}));

const styles = useStyles("lineclamp", meta, config);

const windowWidth: ComputedRef<number> = computed(() => {
  return window.innerWidth;
});

// --- methods

function setDefaultClampState() {
  nextTick(() => {
    truncated.value = wrapper?.scrollHeight > wrapper?.clientHeight;
  });
}
// --- lifecycle
onMounted(() => {
  setTimeout(setDefaultClampState, 200);
});

// --- side effects
watch(windowWidth, setDefaultClampState);
</script>
