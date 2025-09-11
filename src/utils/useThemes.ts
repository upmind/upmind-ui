// --- external
import { ref, provide, computed, readonly } from "vue";

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
  tokens?: Record<string, any>;
}

export interface ITheme {
  value: string;
  label: string;
  icon?: string;
  handler: () => void;
}

// -----------------------------------------------------------------------------
const activeTheme = ref(<string>"");
const config = ref({});
const themes = ref<Theme[]>([]);
const iconVariant = ref<string>("");

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
  }

  function setIconVariant(variant?: string) {
    if (!variant) return;
    iconVariant.value = variant;
  }

  function add(theme: Theme, setActive = true) {
    if (!theme || !theme.id || find(themes.value, ["id", theme.id])) return;
    themes.value.push(theme);
    if (setActive) setTheme(theme.id);
  }

  // TODO: FE-1579 Implement a singleton and structured approach to provide/inject namespacing
  provide(
    "icon-variant",
    computed(() => iconVariant.value)
  );

  // make our theme available to the app
  provide("uiConfig", {
    activeTheme,
    config,
    themes: providedThemes,
    setTheme,
    setIconVariant
  });
  // ---

  return {
    activeTheme: readonly(activeTheme),
    themes: providedThemes,
    config: readonly(config),
    set: setTheme,
    add,
    setIconVariant
  };
};

export default {
  activeTheme,
  config,
  themes
};
