// --- external
import { ref, computed, readonly } from "vue";

// --- utils
import {
  compact,
  find,
  first,
  isArray,
  isEmpty,
  lowerCase,
  reduce,
  set
} from "lodash-es";

// ---

// --- types
import { cva } from "class-variance-authority"; // If you have a type for cva, otherwise use `any`

export type UIConfigValue =
  | ReturnType<typeof cva>
  | { [component: string]: UIConfigValue };

export interface UIConfig {
  [component: string]: UIConfigValue;
}

export interface Theme {
  name: string;
  id: string;
  icon?: string;
  uiConfig?: UIConfig;
  tokens?: string;
}

export interface ITheme {
  value: string;
  label: string;
  icon?: string;
  handler: () => void;
}

// -----------------------------------------------------------------------------
// --- global context

const activeTheme = ref(<string>"");
const activeIconTheme = ref<string>("");
const config = ref({});
const themes = ref<Theme[]>([]);

// -----------------------------------------------------------------------------

export const useThemes = (value?: Theme | Theme[], defaultTheme?: string) => {
  // safety checks

  themes.value = compact(isArray(value) ? value : [value]) || [];

  defaultTheme ??= first(themes.value)?.id || "default";

  // ---
  const providedThemes = computed(
    (): Record<string, ITheme> =>
      reduce(
        themes.value,
        (result, { id, name, icon }: Theme) => {
          set(result, lowerCase(id), {
            label: name,
            value: id,
            icon,
            handler: () => setTheme(id)
          });
          return result;
        },
        {}
      )
  );

  setTheme(defaultTheme);

  function setTheme(theme: string) {
    if (theme == activeTheme.value && !isEmpty(config.value)) return;

    activeTheme.value = theme || activeTheme.value || defaultTheme || "default";
    if (themes.value) {
      const themeConfig =
        find(themes.value, ["id", activeTheme.value]) || first(themes.value);
      if (themeConfig) config.value = themeConfig.uiConfig || {};
    }

    if (document && document.body) {
      document.body.dataset.theme = activeTheme.value;
    }
  }

  function add(theme: Theme, setActive = true) {
    if (!theme || !theme.id || find(themes.value, ["id", theme.id])) return;
    themes.value.push(theme);
    if (setActive) setTheme(theme.id);
  }

  // ---

  return {
    activeTheme: readonly(activeTheme),
    themes: providedThemes,
    config: readonly(config),
    set: setTheme,
    add
  };
};

export const useThemeIcons = () => {
  function setIconTheme(variant?: string) {
    if (variant) {
      activeIconTheme.value = variant;
    }
  }

  return {
    setIconTheme,
    activeIconTheme: readonly(activeIconTheme)
  };
};

export default {
  activeTheme,
  activeIconTheme,
  config,
  themes
};
