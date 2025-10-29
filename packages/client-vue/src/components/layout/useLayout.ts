// --- external
import { computed, ref } from "vue";

// --- internal
import { Store } from "@upmind-automation/headless";

// --- utils
import { isEmpty, isObject, merge } from "lodash-es";

// --- types
import type { LayoutProps } from "./useLayout.types";

// -----------------------------------------------------------------------------
// --- global context

const defaultLayoutProps: LayoutProps = {
  grow: true
};

const layoutConfig = new Store<LayoutProps>(defaultLayoutProps);

// NB: Create a reactive ref initialized with the store's current state.
const config = ref<LayoutProps>(layoutConfig.state);
layoutConfig.subscribe(state => (config.value = state.currentVal));

// -----------------------------------------------------------------------------
/**
 * Composable to manage main layout behavior.
 * @return An object containing layout management methods and properties.
 */
export const useLayout = (initial?: Partial<LayoutProps>) => {
  // Reset to defaults and apply initial overrides if provided
  if (initial) {
    layoutConfig.setState(
      merge({}, defaultLayoutProps, initial) as LayoutProps
    );
  }

  // --- state
  const grow = computed(() => config.value.grow !== false);

  // --- methods
  function update(values: Partial<LayoutProps>) {
    if (!isObject(values) || isEmpty(values)) return;
    layoutConfig.setState(
      (prev: LayoutProps) => merge({}, prev, values) as LayoutProps
    );
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    config: layoutConfig,

    /**
     * Whether the main element should grow to fill available space.
     * @type {ComputedRef<boolean>}
     */
    grow,

    // --- methods
    /**
     * Updates the layout configuration.
     * @param {Partial<LayoutProps>} config - Partial configuration to update the layout state.
     * @returns {void}
     */
    update
  };
};
