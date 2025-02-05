<template>
  <div
    ref="el"
    id="provider"
    :data-theme="activeTheme"
    :data-locale="props.locale"
  >
    <!-- force re-render on theme change with a key -->
    <slot :key="activeTheme"></slot>
  </div>
</template>

<script setup>
/**
 * The Provider allows for reactive global props to be passed down to all components
 * We currently have theme and locale as global props
 */
// --- external
import { ref, watch, onMounted } from "vue";
import { useMutationObserver } from "@vueuse/core";
import { useI18n } from "vue-i18n";
// --- internal
import { useThemes } from "@upmind-automation/upmind-ui";
import themes from "@/assets/themes";

// --- utils
import { some, find, get } from "lodash-es";

const props = defineProps({
  theme: {
    type: String,
    required: true,
  },
  locale: {
    type: String,
    required: true,
  },
});

const { locale } = useI18n();
const el = ref(null);
const { updateTheme, activeTheme } = useThemes(themes, props.theme);
const activeLocale = ref(props.locale);

useMutationObserver(
  el,
  mutations => {
    if (some(mutations, ["attributeName", "data-theme"])) {
      const theme = get(
        find(mutations, ["attributeName", "data-theme"]),
        "target.dataset.theme"
      );
      if (theme && theme != activeTheme.value) {
        updateTheme(theme);
      }
    }

    if (some(mutations, ["attributeName", "data-locale"])) {
      const locale = get(
        find(mutations, ["attributeName", "data-locale"]),
        "target.dataset.locale"
      );

      activeLocale.value = locale;
    }
  },
  {
    attributes: true,
  }
);

onMounted(() => {
  locale.value = activeLocale.value;
});

watch(activeLocale, value => {
  locale.value = value;
});
</script>
