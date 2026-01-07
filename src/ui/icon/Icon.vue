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
import { computed, ref, watchEffect, inject } from "vue";

// --- internal
import theme from "../../utils/useThemes";

import {
  useStyles,
  cn
  //stylesheet
} from "../../utils";
import config from "./icon.config";

// --- utils
import { find, isObject, isEmpty } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
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

const icons = import.meta.glob("@icons/**/*.svg", {
  query: "?raw",
  eager: false,
  import: "default"
});

const svg = ref();

watchEffect(async () => {
  const safeVariant = props.variant || theme.activeIconTheme?.value;
  const safePath = isObject(props.icon) ? `${props.icon?.path}/` : "";
  const safeName = isObject(props.icon) ? props.icon?.name : props.icon;

  // Try to find exact variant match first
  const variantMatch = safeVariant
    ? find(icons, (_, iconPath) =>
        iconPath.endsWith(`/${safeVariant}/${safeName}.svg`)
      )
    : null;

  // Fallback to direct path match
  const directMatch = find(
    icons,
    (_, iconPath) =>
      iconPath.endsWith(`${safePath}${safeName}.svg`) &&
      iconPath.endsWith(`/${safeName}.svg`)
  );

  const asyncImport = variantMatch || directMatch;

  if (!asyncImport) {
    // console.warn("icon", "import not found", {
    //   icon: props.icon,
    //   icons
    // });
    emit("error", new Error(`Icon not found: ${safeName}`));
    svg.value = null;
    return;
  }

  svg.value = await asyncImport().catch(() => {
    emit("error", new Error(`Failed to process content: ${safeName}`));
    return null;
  });
});
</script>
