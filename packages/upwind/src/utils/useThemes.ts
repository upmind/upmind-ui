import { ref, provide } from "vue";
import { find, reduce, set, lowerCase } from "lodash-es";

// -----------------------------------------------------------------------------
const activeTheme = ref();
const config = ref({});
const providedThemes = ref();

export const useThemes = (themes?: Array<Object>, defaultTheme = "light") => {
  providedThemes.value = reduce(
    themes,
    (result, { id, name }) => {
      set(result, lowerCase(id), {
        label: name,
        icon: {
          name: id,
          path: "themes",
        },
        action: () => updateTheme(id),
      });
      return result;
    },
    {}
  );

  updateTheme(defaultTheme);

  function updateTheme(theme: string) {
    if (theme == activeTheme.value) return;

    activeTheme.value = theme || activeTheme.value || defaultTheme;
    if (themes) {
      const themeConfig = find(themes, ["id", activeTheme.value]);
      config.value = themeConfig?.upwind || {};
    }
  }

  provide("upwind", {
    activeTheme,
    config,
    themes: providedThemes,
    updateTheme,
  });
  // ---

  return {
    activeTheme,
    themes: providedThemes,
    config,
    updateTheme,
  };
};

export default {
  activeTheme,
  config,
  providedThemes,
};
