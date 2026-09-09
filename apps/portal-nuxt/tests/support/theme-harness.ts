import { vi } from "vitest";
import { nextTick } from "vue";

export const STORAGE_KEYS = {
  theme: "upmind-portal-theme",
  mode: "upmind-portal-mode"
} as const;

type MatchMediaOverrides = { reducedMotion?: boolean; prefersDark?: boolean };

export function stubMatchMedia({
  reducedMotion = false,
  prefersDark = false
}: MatchMediaOverrides = {}) {
  const impl = vi.fn((query: string) => {
    const matches = (() => {
      if (query.includes("prefers-reduced-motion: reduce"))
        return reducedMotion;
      if (query.includes("prefers-color-scheme: dark")) return prefersDark;
      return false;
    })();
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false)
    };
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: impl
  });
  return impl;
}

export function stubStartViewTransition() {
  const spy = vi.fn((callback: () => void) => {
    callback();
    return {
      ready: Promise.resolve(),
      finished: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
      skipTransition: vi.fn()
    };
  });
  Object.defineProperty(document, "startViewTransition", {
    writable: true,
    configurable: true,
    value: spy
  });
  return spy;
}

export function removeStartViewTransition() {
  Reflect.deleteProperty(document, "startViewTransition");
}

export function resetDocument() {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.className = "";
  removeStartViewTransition();
}

/** Re-imports the composable so its module-scope state starts clean, then lets init settle. */
export async function loadTheme() {
  vi.resetModules();
  const mod = await import("~/composables/useTheme");
  await settle();
  return mod;
}

/** vueuse persists and applies through watchers, so reads need two flushes to be stable. */
export async function settle() {
  await nextTick();
  await nextTick();
}

export const readRoot = () => ({
  theme: document.documentElement.dataset.theme,
  isDarkClass: document.documentElement.classList.contains("dark")
});

export const readStorage = () => ({
  theme: localStorage.getItem(STORAGE_KEYS.theme),
  mode: localStorage.getItem(STORAGE_KEYS.mode)
});
