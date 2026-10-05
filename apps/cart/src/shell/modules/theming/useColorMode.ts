import {
  defaultDocument,
  useLocalStorage,
  usePreferredDark
} from "@vueuse/core";
import { ref, computed, watch } from "vue";
import { COLOR_MODE } from "./types";

// -----------------------------------------------------------------------------
/**
 * @module theming/useColorMode
 * @description Dark-mode state for client-vue. Mode is orthogonal to brand:
 * brand is the `data-theme` attribute, mode is the `.dark` class on the document
 * root — the OKLCH token engine emits its dark values under `:root.dark`, so
 * toggling the class re-skins base and brand together.
 *
 * Appearance resolves in precedence order — the user's persisted choice, then
 * the brand's preferred mode, then the OS, which is followed live while the user
 * has made no choice.
 */

const STORAGE_KEY = "upmind-color-mode";

/** Ignore a persisted value we no longer recognise instead of honouring it. */
function toColorMode(value: string): COLOR_MODE | null {
  if (value === COLOR_MODE.LIGHT) return COLOR_MODE.LIGHT;
  if (value === COLOR_MODE.DARK) return COLOR_MODE.DARK;
  return null;
}

// --- module-global singleton state

const stored = useLocalStorage<COLOR_MODE | null>(STORAGE_KEY, null, {
  serializer: { read: toColorMode, write: String }
});
const brandPreferred = ref<COLOR_MODE | undefined>();
const prefersDark = usePreferredDark();

const isDark = computed<boolean>(() => {
  const preferred = stored.value ?? brandPreferred.value;
  if (preferred) return preferred === COLOR_MODE.DARK;
  return prefersDark.value;
});

watch(
  isDark,
  value => {
    defaultDocument?.documentElement.classList.toggle("dark", value);
  },
  { immediate: true }
);

// --- methods

/** Persist an explicit choice, which outranks the brand and OS preferences. */
function set(mode: COLOR_MODE) {
  stored.value = mode;
}

function toggle() {
  if (isDark.value) set(COLOR_MODE.LIGHT);
  else set(COLOR_MODE.DARK);
}

/** Drop the explicit choice and follow the brand/OS again. */
function clear() {
  stored.value = null;
}

/** The brand's initial default, only honoured while there's no user choice. */
function setBrandPreferred(mode?: COLOR_MODE) {
  brandPreferred.value = mode;
}

export function useColorMode() {
  return {
    isDark,
    set,
    toggle,
    clear,
    setBrandPreferred
  };
}

export type UseColorMode = ReturnType<typeof useColorMode>;
