import { ref, provide } from "vue";
import {
  compact,
  find,
  first,
  isArray,
  lowerCase,
  reduce,
  set,
  values
} from "lodash-es";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
const activeTheme = ref(<string>"");
const config = ref({});
const providedThemes = ref(<Record<string, ITheme>>{});

type Theme = {
  id: string;
  name: string;
  icon?: string;
  uiConfig: object;
};

export interface ITheme {
  value: string;
  label: string;
  icon?: string;
  handler: () => void;
}

export const useThemes = (
  themes?: Theme | Theme[],
  defaultTheme?: string
): {
  activeTheme: Ref<string>;
  themes: Ref<Record<string, ITheme>>;
  config: Ref<any>;
  updateTheme: (theme: string) => void;
} => {
  // safety checks

  const safeThemes: Theme[] =
    compact(isArray(themes) ? themes : [themes]) || [];

  defaultTheme ??= first(safeThemes)?.id || "default";

  // ---
  providedThemes.value = reduce(
    safeThemes,
    (result, { id, name, icon }: Theme) => {
      set(result, lowerCase(id), {
        label: name,
        value: id,
        icon,
        handler: () => updateTheme(id)
      });
      return result;
    },
    {}
  );

  updateTheme(defaultTheme);

  function updateTheme(theme: string) {
    if (theme == activeTheme.value) return;

    activeTheme.value = theme || activeTheme.value || defaultTheme || "default";
    if (safeThemes) {
      const themeConfig =
        find(safeThemes, ["id", activeTheme.value]) ||
        (first(values(safeThemes)) as Theme);
      if (themeConfig) config.value = themeConfig.uiConfig || {};
    }
  }

  // make our theme available to the app
  provide("uiConfig", {
    activeTheme,
    config,
    themes: providedThemes,
    updateTheme
  });
  // ---

  return {
    activeTheme,
    themes: providedThemes,
    config,
    updateTheme
  };
};

export default {
  activeTheme,
  config,
  providedThemes
};
