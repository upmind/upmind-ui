// --- external
import { computed, ref } from "vue";

// --- internal
import { Store } from "@upmind-automation/headless";
import { useShell } from "../shell/useShell";
import { SHELL } from "../shell/types";

// --- utils
import { isEmpty, isObject, merge } from "lodash-es";

// --- types
import type { UseLayoutProps } from "./types";
import { LAYOUT_VARIANTS, LAYOUT_MODE, LAYOUT_OVERFLOW } from "./types";

// -----------------------------------------------------------------------------
// --- global context

const defaultLayoutProps: UseLayoutProps = {
  variant: LAYOUT_VARIANTS.FULL,
  mode: LAYOUT_MODE.GROW,
  overflow: LAYOUT_OVERFLOW.VISIBLE,
  footer: true,
  minimal: false
};

const layoutConfig = new Store<UseLayoutProps>(defaultLayoutProps);

// NB: Create a reactive ref initialized with the store's current state.
const config = ref<UseLayoutProps>(layoutConfig.state);
layoutConfig.subscribe(state => (config.value = state.currentVal));

// -----------------------------------------------------------------------------
/**
 * Composable to manage main layout behavior.
 * @return An object containing layout management methods and properties.
 */
export const useLayout = (initial?: Partial<UseLayoutProps>) => {
  // Reset to defaults and apply initial overrides if provided
  if (initial) {
    // Mark as configured if actual config provided (not just empty reset)
    if (!isEmpty(initial)) {
      useShell().mark(SHELL.LAYOUT);
    }
    layoutConfig.setState(
      merge({}, defaultLayoutProps, initial) as UseLayoutProps
    );
  }

  // --- state
  const variant = computed(() => config.value.variant ?? LAYOUT_VARIANTS.FULL);
  const mode = computed(() => config.value.mode ?? LAYOUT_MODE.GROW);
  const overflow = computed(
    () => config.value.overflow ?? LAYOUT_OVERFLOW.VISIBLE
  );
  const footer = computed(() => config.value.footer ?? true);
  const minimal = computed(() => config.value.minimal ?? false);

  // --- methods
  function update(values: Partial<UseLayoutProps>) {
    if (!isObject(values) || isEmpty(values)) return;
    layoutConfig.setState(
      (prev: UseLayoutProps) => merge({}, prev, values) as UseLayoutProps
    );
  }

  function hideFooter() {
    update({ footer: false });
  }

  function showFooter() {
    update({ footer: true });
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    config: layoutConfig,

    /**
     * The current layout variant.
     * @type {ComputedRef<LAYOUT_VARIANTS>}
     */
    variant,

    /**
     * The current layout mode.
     * @type {ComputedRef<LayoutMode>}
     */
    mode,

    /**
     * The current layout mode.
     * @type {ComputedRef<LayoutMode>}
     */
    minimal,

    /**
     * The current layout overflow.
     * @type {ComputedRef<LAYOUT_OVERFLOW>}
     */
    overflow,

    /**
     * The current display state of the content and aside footer.
     * @type {ComputedRef<boolean>}
     */
    footer,

    // --- methods
    /**
     * Updates the layout configuration.
     * @param {Partial<LayoutProps>} config - Partial configuration to update the layout state.
     * @returns {void}
     */
    update,

    /**
     * Hides the content and aside footer.
     * @returns {void}
     */
    hideFooter,

    /**
     * Shows the content and aside footer.
     * @returns {void}
     */
    showFooter
  };
};
