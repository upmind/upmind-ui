/**
 * @module foundation/theming
 * @description The port onto the theme engine `ui` owns (ADR 023 §2).
 *
 * KNOWN GAP — nothing provides this key yet. `ui` publishes no theme engine:
 * the live one is still `client-vue`'s `useTheme`, so every `apply()` reaches
 * the no-op below. Moving that engine into `ui` and providing it at app root is
 * what closes the gap; implementing one HERE would invert the §2 layer table.
 * Until then the no-op says so out loud rather than swallowing the call.
 */
import { hasInjectionContext, inject, provide } from "vue";
import type { ThemeEngine } from "./theming.types";
import type { InjectionKey } from "vue";

// Not a throw: a standalone consumer with no engine wired — the auth and
// payment shells (Amendment 1 change 4), and any SSR render — must still boot.
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

/** Degrades to the warning no-op: selection still resolves, nothing is applied. */
export const useThemeEngine = (): ThemeEngine => {
  if (!hasInjectionContext()) return NOOP_THEME_ENGINE;

  return inject(THEME_ENGINE, NOOP_THEME_ENGINE);
};
