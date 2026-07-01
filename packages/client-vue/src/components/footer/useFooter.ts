import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import { computed, ref } from "vue";
import { Store, useBrand } from "@upmind-automation/headless";
import { SHELL } from "../shell/types";
import { useShell } from "../shell/useShell";
import FooterFlat from "./layouts/FooterFlat.layout.vue";
import FooterStacked from "./layouts/FooterStacked.layout.vue";
import { FOOTER_ITEMS, FOOTER_LAYOUT, type FooterProps } from "./types";
import { FOOTER_BACKGROUND, FOOTER_POSITION } from "./types";
import { get, isEmpty, isObject, merge } from "lodash-es";

// -----------------------------------------------------------------------------
// --- global context

const defaultFooterProps: FooterProps = {
  visible: true,
  layout: FOOTER_LAYOUT.STACKED,
  border: true,
  reverse: false,
  background: FOOTER_BACKGROUND.SURFACE,
  position: FOOTER_POSITION.STATIC,
  items: FOOTER_ITEMS.CENTER,
  noLocale: false,
  noCurrency: false,
  noCopyright: false,
  noPoweredBy: false
};

const footerConfig = new Store<FooterProps>(defaultFooterProps);

// NB: Create a reactive ref initialized with the store's current state.
const config = ref<FooterProps>(footerConfig.state);
footerConfig.subscribe(state => (config.value = state.currentVal));

// -----------------------------------------------------------------------------
/**
 * Composable to manage footer layout and behavior.
 * @return An object containing footer management methods and properties.
 *
 */
export const useFooter = (initial?: Partial<FooterProps>) => {
  // Reset to defaults and apply initial overrides if provided
  if (initial) {
    // Mark as configured if actual config provided (not just empty reset)
    if (!isEmpty(initial)) {
      useShell().mark(SHELL.FOOTER);
    }
    footerConfig.setState(
      merge({}, defaultFooterProps, initial) as FooterProps
    );
  }

  // --- state
  const { hasUpmindBranding } = useBrand();

  const meta = computed(() => {
    const {
      visible,
      noCopyright,
      noCurrency,
      noLocale,
      noPoweredBy,
      position,
      background,
      reverse,
      items,
      justifyLeft,
      justifyRight
    } = config.value;

    return {
      isVisible: !!visible,
      position: position,
      background: background,
      reverse: reverse,
      items: items,
      justifyLeft: justifyLeft,
      justifyRight: justifyRight,
      showCopyright: !noCopyright,
      showCurrency: !noCurrency,
      showLocale: !noLocale,
      hasActions: !(noCurrency && noLocale),
      showPoweredBy: !noPoweredBy && hasUpmindBranding.value,
      hasContent: !noCopyright || (!noPoweredBy && hasUpmindBranding.value)
    };
  });

  // --- context
  const supportedLayouts = {
    [FOOTER_LAYOUT.STACKED]: FooterStacked,
    [FOOTER_LAYOUT.FLAT]: FooterFlat
  };

  const defaultLayout = FOOTER_LAYOUT.STACKED;
  const forceStacked = useBreakpoints(breakpointsTailwind).smaller("lg");

  const layout = computed(() => {
    if (forceStacked.value) return FooterStacked;
    return get(
      supportedLayouts,
      config.value.layout ?? defaultLayout,
      FooterStacked
    );
  });

  // --- methods
  function update(values: Partial<FooterProps>) {
    if (!isObject(values) || isEmpty(values)) return;
    footerConfig.setState(
      (prev: FooterProps) => merge({}, prev, values) as FooterProps
    );
  }

  // --- sytactic sugar
  function hide() {
    update({ visible: false });
  }

  function show() {
    update({ visible: true });
  }

  function hideCopyright() {
    update({ noCopyright: true });
  }

  function showCopyright() {
    update({ noCopyright: false });
  }

  function hideCurrency() {
    update({ noCurrency: true });
  }

  function showCurrency() {
    update({ noCurrency: false });
  }

  function hideLocale() {
    update({ noLocale: true });
  }

  function showLocale() {
    update({ noLocale: false });
  }

  function hidePoweredBy() {
    update({ noPoweredBy: true });
  }

  function showPoweredBy() {
    update({ noPoweredBy: false });
  }

  function hideActions() {
    update({ noLocale: true, noCurrency: true });
  }

  function showActions() {
    update({ noLocale: false, noCurrency: false });
  }

  function hideContent() {
    update({ noPoweredBy: true, noCopyright: true });
  }

  function showContent() {
    update({ noPoweredBy: false, noCopyright: false });
  }

  function setLayout(layout: FooterProps["layout"]) {
    update({ layout });
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    config: footerConfig,

    /**
     * Meta-information about the Footer state.
     * @type {Object} FooterMeta
     * @property {boolean} isVisible - Indicates if the footer is visible.
     * @property {boolean} showCopyright - Indicates if the copyright section is shown.
     * @property {boolean} showCurrency - Indicates if the currency switcher is shown.
     * @property {boolean} showLocale - Indicates if the locale switcher is shown.
     * @property {boolean} showPoweredBy - Indicates if the "powered by" section is shown.
     * @property {boolean} hasActions - Indicates if there are any actions to display.
     * @property {boolean} hasContent - Indicates if there is any content to display.
     */
    meta,

    /**
     * Whether "Powered by Upmind" branding is hidden (white-labeled).
     */
    noPoweredBy: computed(
      (): boolean => config.value.noPoweredBy || !hasUpmindBranding.value
    ),

    // --- context

    /**
     * The current footer template component.
     */
    layout,
    layoutName: computed(() => config.value.layout),

    // --- methods
    /**
     * Updates the footer configuration.
     * @param {Partial<FooterProps>} config - Partial configuration to update the footer state.
     * @returns {void}
     */
    update,

    /**
     * Hides the footer.
     * @returns {void}
     */
    hide,

    /**
     * Shows the footer.
     * @returns {void}
     */
    show,

    /**
     * Hides the copyright section.
     * @returns {void}
     */
    hideCopyright,

    /**
     * Shows the copyright section.
     * @returns {void}
     */
    showCopyright,

    /**
     * Hides the currency switcher.
     * @returns {void}
     */
    hideCurrency,

    /**
     * Shows the currency switcher.
     * @returns {void}
     */
    showCurrency,

    /**
     * Hides the locale switcher.
     * @returns {void}
     */
    hideLocale,

    /**
     * Shows the locale switcher.
     * @returns {void}
     */
    showLocale,

    /**
     * Hides the "powered by" section.
     * @returns {void}
     */
    hidePoweredBy,

    /**
     * Shows the "powered by" section.
     * @returns {void}
     */
    showPoweredBy,

    /**
     * Hides all action components (locale and currency switchers).
     * @returns {void}
     */
    hideActions,

    /**
     * Shows all action components (locale and currency switchers).
     * @returns {void}
     */
    showActions,

    /**
     * Hides all content components (logo, powered by, and copyright).
     * @returns {void}
     */
    hideContent,

    /**
     * Shows all content components (logo, powered by, and copyright).
     * @returns {void}
     */
    showContent,

    /**
     * Sets the footer layout variant.
     * @param {FOOTER_LAYOUT} layout - The layout variant to set.
     * @returns {void}
     */
    setLayout
  };
};
