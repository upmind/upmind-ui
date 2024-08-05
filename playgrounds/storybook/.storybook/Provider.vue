<template>
  <div
    ref="el"
    id="provider"
    :data-theme="activeTheme"
    :data-locale="$i18n.locale"
  >
    <!-- force re-render on theme change with a key -->
    <slot :key="activeTheme"></slot>
  </div>
</template>

<script>
/**
 * The Provider allows for reactive global props to be passed down to all components
 * We currently have theme and locale as global props
 */
// --- external
import { defineComponent, ref } from "vue";
import { useMutationObserver } from "@vueuse/core";

// --- internal
import { useThemes } from "@upmind/upwind";
import themes from "@/assets/themes";

// --- utils
import { some, find, get } from "lodash-es";

export default defineComponent({
  name: "ThemeProvider",
  components: {},
  props: {
    theme: {
      type: String,
      required: true,
    },
    locale: {
      type: String,
      required: true,
    },
  },
  setup(props) {
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

    return {
      el,
      activeTheme,
      activeLocale,
    };
  },
  mounted() {
    this.$i18n.locale = this.activeLocale;
  },
  watch: {
    activeLocale(locale) {
      this.$i18n.locale = locale;
    },
  },
});
</script>
