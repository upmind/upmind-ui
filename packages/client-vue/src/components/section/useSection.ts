import { computed, ref } from "vue";
import { Store } from "@upmind-automation/headless";
import { isEmpty, isObject, merge } from "lodash-es";
import type { UseSectionProps } from "./types";

// -----------------------------------------------------------------------------
// --- global context

const defaultSectionProps: UseSectionProps = {
  card: false,
  border: true
};

const sectionConfig = new Store<UseSectionProps>(defaultSectionProps);

// NB: Create a reactive ref initialized with the store's current state.
const config = ref<UseSectionProps>(sectionConfig.state);
sectionConfig.subscribe(state => (config.value = state.currentVal));

// -----------------------------------------------------------------------------
/**
 * Composable to manage main layout behavior.
 * @return An object containing layout management methods and properties.
 */
export const useSection = (initial?: Partial<UseSectionProps>) => {
  // Reset to defaults and apply initial overrides if provided
  if (initial) {
    sectionConfig.setState(
      merge({}, defaultSectionProps, initial) as UseSectionProps
    );
  }

  // --- state
  const card = computed(() => config.value.card ?? true);
  const border = computed(() => config.value.border ?? true);

  // --- methods
  function update(values: Partial<UseSectionProps>) {
    if (!isObject(values) || isEmpty(values)) return;
    sectionConfig.setState(
      (prev: UseSectionProps) => merge({}, prev, values) as UseSectionProps
    );
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    config: sectionConfig,

    /**
     * The current layout variant.
     * @type {ComputedRef<LAYOUT_VARIANTS>}
     */
    card,

    /**
     * The current layout mode.
     * @type {ComputedRef<LayoutMode>}
     */
    border,

    // --- methods
    /**
     * Updates the layout configuration.
     * @param {Partial<LayoutProps>} config - Partial configuration to update the layout state.
     * @returns {void}
     */
    update
  };
};
