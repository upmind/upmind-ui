// --- external
import { computed, defineAsyncComponent } from "vue";

// --- internal
import { Store, useRoutingEngine } from "@upmind-automation/headless";

// --- async components

const FooterFlat = defineAsyncComponent(
  () => import("./templates/FooterFlat.template.vue")
);

const FooterStacked = defineAsyncComponent(
  () => import("./templates/FooterStacked.template.vue")
);

const FooterNoOptions = defineAsyncComponent(
  () => import("./templates/FooterNoOptions.template.vue")
);

// --- utils
import { isEmpty, isObject, merge } from "lodash-es";

// --- types
import { FOOTER_TEMPLATE, type FooterProps } from "./types";

// -----------------------------------------------------------------------------
// --- global context

const footerConfig = new Store<FooterProps>({
  visible: true,
  template: FOOTER_TEMPLATE.DEFAULT,
  noLocale: false,
  noCurrency: false,
  noCopyright: false,
  noLogo: false,
  noPoweredBy: false
});

// -----------------------------------------------------------------------------
/**
 * Composable to manage footer layout and behavior.
 * @return An object containing footer management methods and properties.
 *
 */
export const useFooter = (initial?: Partial<FooterProps>) => {
  // Initialize state with initial values
  updateConfig(initial || {});

  const { currentRoute } = useRoutingEngine();

  const supportedTemplates = {
    [FOOTER_TEMPLATE.DEFAULT]: FooterStacked,
    [FOOTER_TEMPLATE.ENCLOSED]: FooterStacked,
    [FOOTER_TEMPLATE.FULL]: FooterStacked,
    [FOOTER_TEMPLATE.TWO_COLUMN_LTR]: FooterFlat,
    [FOOTER_TEMPLATE.TWO_COLUMN_RTL]: FooterFlat,
    [FOOTER_TEMPLATE.SPLIT]: FooterNoOptions,
    [FOOTER_TEMPLATE.CANVAS_CARD]: FooterNoOptions,
    [FOOTER_TEMPLATE.SURFACE_BOX]: FooterNoOptions
  };

  const defaultTemplate = supportedTemplates[FOOTER_TEMPLATE.DEFAULT];

  const template = computed(() => {
    const template = currentRoute.value?.meta?.template as FOOTER_TEMPLATE;
    return supportedTemplates[template] ?? defaultTemplate;
  });

  // --- context

  const meta = computed(() => {
    const { visible, noCopyright, noCurrency, noLocale, noLogo, noPoweredBy } =
      footerConfig.state;

    return {
      isVisible: !!visible,
      showCopyright: !noCopyright,
      showCurrency: !noCurrency,
      showLocale: !noLocale,
      showLogo: !noLogo,
      showPoweredBy: !noPoweredBy,
      hasActions: !(noCurrency && noLocale),
      hasContent: !(noLogo && noPoweredBy && noCopyright)
    };
  });

  // --- methods
  function updateConfig(values: Partial<FooterProps>) {
    console.log(values);
    if (!isObject(values) || isEmpty(values)) return;
    footerConfig.setState((prev: FooterProps) => {
      const value = merge({}, prev, values) as FooterProps;
      return value;
    });
  }

  // --- sytactic sugar
  function hide() {
    updateConfig({ visible: false });
  }

  function show() {
    updateConfig({ visible: true });
  }

  function hideCopyright() {
    updateConfig({ noCopyright: true });
  }

  function showCopyright() {
    updateConfig({ noCopyright: false });
  }

  function hideCurrency() {
    updateConfig({ noCurrency: true });
  }

  function showCurrency() {
    updateConfig({ noCurrency: false });
  }

  function hideLocale() {
    updateConfig({ noLocale: true });
  }

  function showLocale() {
    updateConfig({ noLocale: false });
  }

  function hideLogo() {
    updateConfig({ noLogo: true });
  }

  function showLogo() {
    updateConfig({ noLogo: false });
  }

  function hidePoweredBy() {
    updateConfig({ noPoweredBy: true });
  }

  function showPoweredBy() {
    updateConfig({ noPoweredBy: false });
  }

  function hideActions() {
    updateConfig({ noLocale: true, noCurrency: true });
  }

  function showActions() {
    updateConfig({ noLocale: false, noCurrency: false });
  }

  function hideContent() {
    updateConfig({ noLogo: true, noPoweredBy: true, noCopyright: true });
  }

  function showContent() {
    updateConfig({ noLogo: false, noPoweredBy: false, noCopyright: false });
  }

  function setTemplate(template: FooterProps["template"]) {
    updateConfig({ template });
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
     * @property {boolean} showLogo - Indicates if the logo is shown.
     * @property {boolean} showPoweredBy - Indicates if the "powered by" section is shown.
     * @property {boolean} hasActions - Indicates if there are any actions to display.
     * @property {boolean} hasContent - Indicates if there is any content to display.
     */
    meta,

    // --- context

    /**
     * The current footer template component.
     */
    template,

    // --- methods
    /**
     * Updates the footer configuration.
     * @param {Partial<FooterProps>} config - Partial configuration to update the footer state.
     * @returns {void}
     */
    updateConfig,

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
     * Hides the logo.
     * @returns {void}
     */
    hideLogo,

    /**
     * Shows the logo.
     * @returns {void}
     */
    showLogo,

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
     * Sets the footer template variant.
     * @param {FOOTER_TEMPLATE} template - The template variant to set.
     * @returns {void}
     */
    setTemplate
  };
};
