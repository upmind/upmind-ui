import { ref, computed, readonly } from "vue";
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
import type { cva } from "class-variance-authority"; // If you have a type for cva, otherwise use `any`
// ---

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
const appDefaultTheme = ref<string>(""); // Tracks the app's initial theme for "default" fallback
const config = ref({});
const themes = ref<Theme[]>([]);
// -----------------------------------------------------------------------------

export const useThemes = (value?: Theme | Theme[], defaultTheme?: string) => {
  // safety checks
  const hasThemes = value !== undefined;

  if (hasThemes) {
    themes.value = compact(isArray(value) ? value : [value]) || [];
  }

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

  if (hasThemes) {
    setTheme(defaultTheme);
  }

  function setTheme(theme: string | undefined) {
    // Skip if same theme already active
    if (theme === activeTheme.value && !isEmpty(config.value)) return;

    // Skip if no theme provided and we already have one
    if (!theme && activeTheme.value) return;

    // Capture the initial app theme (used as fallback when "default" is requested)
    if (!appDefaultTheme.value && theme) {
      appDefaultTheme.value = theme;
    }

    // Resolve the theme to apply
    let resolved: string;
    if (theme === "default" && activeTheme.value !== "default") {
      // Reset to app's initial theme when overriding a context-specific theme
      resolved = appDefaultTheme.value;
    } else {
      resolved = theme || activeTheme.value || defaultTheme || "default";
    }

    activeTheme.value = resolved;

    if (themes.value) {
      const themeConfig =
        find(themes.value, ["id", resolved]) || first(themes.value);
      if (themeConfig) config.value = themeConfig.uiConfig || {};
    }

    // Apply theme to DOM
    if (document?.body) {
      document.body.dataset.theme = resolved;
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
