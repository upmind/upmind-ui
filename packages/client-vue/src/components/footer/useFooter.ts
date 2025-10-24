// --- external
import { ref } from "vue";
import { Store } from "@tanstack/vue-store";
import { FOOTER_TEMPLATE, type FooterProps } from "./types";

// --- internal

// --- utils

// --- types

// -----------------------------------------------------------------------------
// --- global context

const footerConfig = new Store<FooterProps>({
  state: {
    visible: true,
    template: FOOTER_TEMPLATE.DEFAULT,
    noLocale: false,
    noCurrency: false,
    noCopyright: false,
    noLogo: false,
    noPoweredBy: false
  }
});

// -----------------------------------------------------------------------------
/**
 * Composable to manage footer layout and behavior.
 * @return An object containing footer management methods and properties.
 *
 */
export const useFooter = (initial?: Partial<FooterProps>) => {
  // Initialize state with initial values
  footerConfig.setState(prev => ({
    ...prev,
    ...initial
  }));

  return {
    config: footerConfig
  };
};
