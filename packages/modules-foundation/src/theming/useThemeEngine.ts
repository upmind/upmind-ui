/**
 * @module foundation/theming
 * @description The theme-engine port.
 */
import { hasInjectionContext, inject, provide } from "vue";
import type { ThemeEngine } from "./theming.types";
import type { InjectionKey } from "vue";

const NOOP_THEME_ENGINE: ThemeEngine = {
  set: id =>
    console.warn(
      `[foundation/theming] theme "${id}" was NOT applied: no theme engine is ` +
        "provided. `ui` owns the engine (ADR 023 §2); provide it with " +
        "provideThemeEngine at app root."
    )
};

export const THEME_ENGINE: InjectionKey<ThemeEngine> = Symbol(
  "upmind-theme-engine"
);

export const provideThemeEngine = (engine: ThemeEngine) =>
  provide(THEME_ENGINE, engine);

export const useThemeEngine = (): ThemeEngine => {
  if (!hasInjectionContext()) return NOOP_THEME_ENGINE;

  return inject(THEME_ENGINE, NOOP_THEME_ENGINE);
};
