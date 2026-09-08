import { hasInjectionContext, inject, provide } from "vue";
import type { ThemeEngine } from "./theming.types";
import type { InjectionKey } from "vue";

const NOOP_THEME_ENGINE: ThemeEngine = { set: () => {} };

export const THEME_ENGINE: InjectionKey<ThemeEngine> = Symbol(
  "upmind-theme-engine"
);

export const provideThemeEngine = (engine: ThemeEngine) =>
  provide(THEME_ENGINE, engine);

/** Degrades to a no-op: selection still resolves, nothing is applied. */
export const useThemeEngine = (): ThemeEngine => {
  if (!hasInjectionContext()) return NOOP_THEME_ENGINE;

  return inject(THEME_ENGINE, NOOP_THEME_ENGINE);
};
