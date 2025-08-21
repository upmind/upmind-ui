// --- external
import { computed, provide, ref } from "vue";

// --- internal
import { useBrand } from "../brand";

// --- utils
import { isEmpty, startCase, reduce, keyBy, merge, values } from "lodash-es";

// --- types
import type { Theme } from "./types";
import { isArray } from "xstate/lib/utils";

// -----------------------------------------------------------------------------

// --- context

const themes = ref<Theme[] | undefined>(undefined);
// -----------------------------------------------------------------------------
/**
 * Composable for consolidating brand theme information with any provided themes through the upmind initialisation
 *
 * @returns {Object} Theme composable API
 */
export const useTheming = (provided?: Theme | Theme[]) => {
  // First add any themes provided during initialisation

  if (!isEmpty(provided)) addTheme(provided);

  const { meta: brandMeta, uiTheme, isReady } = useBrand();

  // --- context

  // the theme definition

  const meta = computed(() => ({
    isAvailable: brandMeta.value.isAvailable,
    hasThemes: brandMeta.value.isAvailable && !isEmpty(themes.value)
  }));

  // --- methods

  function addTheme(provided: Theme | Theme[]) {
    // ensure we always work with an array
    provided = isArray(provided) ? provided : [provided];

    // then merge to ensure we override any provided themes with brand variant values
    // brand themes are dynamic/from the api so can be updated without requiring a deployment
    const merged = merge({}, keyBy(themes.value, "id"), keyBy(provided, "id"));

    // persist the merged themes
    themes.value = values(merged);
  }

  // --- side Effects

  isReady().then(() => {
    // convert the brand variants into fully fledged themes
    const brandThemes = reduce(
      uiTheme.value?.variants,
      (acc: Theme[], tokens, variant) => {
        acc.push({
          id: variant,
          name: startCase(variant),
          uiConfig: {},
          tokens
        });
        return acc;
      },
      []
    );

    addTheme(brandThemes);
  });

  // ---------------------------------------------------------------------------

  return {
    // --- state
    isReady,

    /** Meta information about the brand theme state. */
    meta,

    // --- context

    /** The available themes, this will be an array of theme objects.
     * brand config theme variants will be added/merged to the list of provided themes
     */
    themes
  };
};
