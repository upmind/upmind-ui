<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <i
    v-if="svg"
    class="icon"
    :class="cn(styles.icon, props.class)"
    v-html="svg"
    role="img"
    :aria-label="`${isObject(icon) ? icon.name : icon} icon`"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed, ref, watchEffect } from "vue";
// --- internal
import theme from "../../utils/useThemes";
import config from "./icon.config";
import { loadIcon } from "./utils/iconLoader";
import {
  useStyles,
  cn
  //stylesheet
} from "../../utils";
import { isObject, isEmpty } from "lodash-es";
// --- types
import type { IconProps } from ".";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<IconProps>(), {
  //  --- styles
  size: "auto",
  // --- styles
  uiConfig: () => ({ icon: [] }),
  class: ""
});

// Add emit definition
const emit = defineEmits<{
  error: [Error];
}>();

const meta = computed(() => ({
  size: props.size,
  // ---
  hasIcon: !isEmpty(props.icon)
}));

const styles = useStyles("icon", meta, config, props.uiConfig ?? {});

// Removed static glob – we now load icons on demand via iconLoader

const svg = ref<string | undefined>(undefined);

watchEffect(async () => {
  const safeVariant = props.variant || theme.activeIconTheme?.value;
  try {
    const result = await loadIcon(props.icon, { variant: safeVariant });
    svg.value = result;
  } catch (e) {
    emit("error", e as Error);
    svg.value = undefined;
  }
});
</script>
