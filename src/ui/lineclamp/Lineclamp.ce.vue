<template>
  <div class="upm-lineclamp" :class="styles.lineclamp.root">
    <div ref="wrapper" :class="styles.lineclamp.wrapper">
      <slot />
    </div>

    <transition name="fade">
      <p v-if="truncated" :class="styles.lineclamp.actions">
        <Link
          @click="open = !open"
          :label="meta.isOpen ? labelLess : labelMore"
          data-testid="lineclamp"
          color="inherit"
          size="inherit"
        />
      </p>
    </transition>
  </div>
</template>

<script lang="ts" setup>
// --- external
import {
  ref,
  computed,
  useTemplateRef,
  onMounted,
  nextTick,
  watch,
  onUnmounted
} from "vue";
// --- internal
import { Link } from "../link"; //
import config from "./lineclamp.config";
// --- utils
import { useStyles } from "../../utils";
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
    iconMore: "chevron-down",
    iconLess: "chevron-up",
    lines: 3,
    forceOpen: false
  }
);

const open = ref(props.forceOpen);
const truncated = ref(false);
const wrapper = useTemplateRef("wrapper");

const meta = computed(() => ({
  lines: props.lines,
  isOpen: open.value,
  isTruncated: truncated.value
}));

const styles = useStyles("lineclamp", meta, config);

const windowWidth: ComputedRef<number> = computed(() => {
  return window.innerWidth;
});

const observer = ref<MutationObserver | null>(null);
// --- methods
function setDefaultClampState() {
  nextTick(() => {
    if (wrapper.value) {
      truncated.value = wrapper.value.scrollHeight > wrapper.value.clientHeight;
    }
  });
}
// --- lifecycle
onMounted(() => {
  // Initial check after a short delay to ensure content is rendered
  nextTick(() => {
    setDefaultClampState();

    // Setup observer for content changes
    observer.value = new MutationObserver(setDefaultClampState);
    if (wrapper.value) {
      observer.value.observe(wrapper.value, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  });
});

// Clean up observer
onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});
// --- side effects
watch(windowWidth, setDefaultClampState);
</script>
