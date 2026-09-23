import { computed, ref } from "vue";
import { isEmpty, isObject, merge } from "lodash-es";
import type { UseSectionProps } from "./types";

// -----------------------------------------------------------------------------
// --- global context

const defaultSectionProps: UseSectionProps = {
  card: false,
  border: true,
  inset: false
};

// A plain ref, not headless's `Store`. This layer's deciding rule (ADR 023 §2)
// is that presentational glue knows no data layer, and the raw store was dead
// public surface — no caller ever read `useSection().config`.
const config = ref<UseSectionProps>({ ...defaultSectionProps });

// -----------------------------------------------------------------------------
/**
 * Composable to manage main layout behavior.
 * @return An object containing layout management methods and properties.
 */
export const useSection = (initial?: Partial<UseSectionProps>) => {
  // Reset to defaults and apply initial overrides if provided
  if (initial) {
    config.value = merge({}, defaultSectionProps, initial) as UseSectionProps;
  }

  // --- state
  const card = computed(() => config.value.card ?? true);
  const border = computed(() => config.value.border ?? true);
  const inset = computed(() => config.value.inset ?? false);

  // --- methods
  function update(values: Partial<UseSectionProps>) {
    if (!isObject(values) || isEmpty(values)) return;
    config.value = merge({}, config.value, values) as UseSectionProps;
  }

  // ---------------------------------------------------------------------------
  return {
    /**
     * Whether sections render as cards.
     * @type {ComputedRef<boolean>}
     */
    card,

    /**
     * Whether sections draw a border.
     * @type {ComputedRef<boolean>}
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
     * @param {Partial<UseSectionProps>} config - Partial configuration to update the layout state.
     * @returns {void}
     */
    update
  };
};
