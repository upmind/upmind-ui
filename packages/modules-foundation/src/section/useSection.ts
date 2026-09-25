import { computed, ref } from "vue";
import { Store } from "@upmind-automation/headless";
import { isEmpty, isObject, merge } from "lodash-es";
import type { UseSectionProps } from "./types";

// -----------------------------------------------------------------------------
// --- global context

const defaultSectionProps: UseSectionProps = {
  card: false,
  border: true,
  inset: false
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
  const inset = computed(() => config.value.inset ?? false);

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

    /**
     * Whether carded sections draw their header inside the card.
     * @type {ComputedRef<boolean>}
     */
    inset,

    // --- methods
    /**
     * Updates the layout configuration.
     * @param {Partial<LayoutProps>} config - Partial configuration to update the layout state.
     * @returns {void}
     */
    update
  };
};
