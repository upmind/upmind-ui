/**
 * Global theme state for the portal sandbox. Applies `data-theme` / `.dark` to
 * <html> so the entire app re-skins through the token cascade — the whole point
 * of the sandbox is to flip brand + mode and watch every screen follow.
 *
 * A lean cousin of the docs `theme.ts`: no live-preview / defineTheme injection,
 * just brand selection from the shipped `themes` plus a light/dark toggle, both
 * persisted to localStorage and crossfaded via document.startViewTransition.
 */
import { themeToCss, themes } from "@upmind/tokens";
import { useColorMode, useLocalStorage } from "@vueuse/core";
import { computed, nextTick, watchEffect } from "vue";
import { APP_BRANDS } from "~/portal/brands";
// -----------------------------------------------------------------------------

/**
 * The app's own brands (`portal/brands.ts`) reach the cascade the same way the
 * design-system docs site's live preview does: their generated CSS is injected
 * under their own `[data-theme]` selector. Done once at module load, before
 * anything sets `data-theme`, so a shape carrying an app brand paints it on
 * first render rather than a frame late.
 */
const APP_BRAND_STYLE_ID = "upmind-portal-brand-style";

function injectAppBrands(): void {
  const existing = document.getElementById(APP_BRAND_STYLE_ID);
  const el = existing ?? document.createElement("style");
  el.id = APP_BRAND_STYLE_ID;
  el.textContent = APP_BRANDS.map(brand => themeToCss(brand)).join("\n\n");
  if (!existing) document.head.append(el);
}

injectAppBrands();

/** The shipped themes plus this app's own, in picker order. */
const ALL_THEMES = [...themes, ...APP_BRANDS];

export const themeOptions = ALL_THEMES.map(t => ({
  name: t.name,
  label: t.label,
  description: t.description,
  preferredMode: t.preferredMode,
  primary: t.light["primary"]!,
  canvas: t.light["canvas"]!
}));

const themeName = useLocalStorage<string>("upmind-portal-theme", "upmind");

// useColorMode toggles the `.dark` class on <html> and persists for us.
const mode = useColorMode({ storageKey: "upmind-portal-mode" });

type ViewTransitionLike = {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (
    update: () => void | Promise<void>
  ) => ViewTransitionLike;
};

/** Run a theme mutation inside a crossfade, falling back under reduced motion. */
function withThemeTransition(apply: () => void): void {
  const doc = document as DocumentWithViewTransition;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (reduceMotion || typeof doc.startViewTransition !== "function") {
    apply();
    return;
  }
  const transition = doc.startViewTransition(async () => {
    apply();
    await nextTick();
  });

  // A skipped transition rejects its promises with AbortError; unsettled, they surface as unhandled.
  const swallowSkip = (): void => {};
  void transition.ready.catch(swallowSkip);
  void transition.finished.catch(swallowSkip);
  void transition.updateCallbackDone.catch(swallowSkip);
}

// Keep the <html> brand attribute in sync with the stored name.
watchEffect(() => {
  document.documentElement.dataset["theme"] = themeName.value;
});

export function useTheme() {
  return {
    themeName,
    mode,
    isDark: computed(() => mode.value === "dark"),
    options: themeOptions,
    setTheme: (name: string) => {
      // The brand owns the mode when you switch TO it; you own it after. The
      // old "has ever toggled" latch never expired, so one toggle stuck every
      // dark-first brand in light permanently.
      const isBrandSwitch = themeName.value !== name;
      const preferred = themeOptions.find(t => t.name === name)?.preferredMode;
      withThemeTransition(() => {
        themeName.value = name;
        // Set synchronously so the view-transition snapshot sees the change.
        document.documentElement.dataset["theme"] = name;
        if (isBrandSwitch && preferred) mode.value = preferred;
      });
    },
    toggleMode: () => {
      withThemeTransition(() => {
        mode.value = mode.value === "dark" ? "light" : "dark";
      });
    }
  };
}
