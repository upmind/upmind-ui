// --- external
import { computed, defineAsyncComponent, ref } from "vue";

// --- internal
import { Store } from "@upmind-automation/headless";

// --- async components

const FooterFlat = defineAsyncComponent(
  () => import("./layouts/FooterFlat.layout.vue")
);

const FooterStacked = defineAsyncComponent(
  () => import("./layouts/FooterStacked.layout.vue")
);
// --- utils
import { get, isEmpty, isObject, merge } from "lodash-es";

// --- types
import { FOOTER_TEMPLATE, type FooterProps } from "./types";

// -----------------------------------------------------------------------------
// --- global context

const defaultFooterProps: FooterProps = {
  visible: true,
  template: FOOTER_TEMPLATE.DEFAULT,
  noLocale: false,
  noCurrency: false,
  noCopyright: false,
  noLogo: false,
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
    footerConfig.setState(
      merge({}, defaultFooterProps, initial) as FooterProps
    );
  }

  // --- state
  const meta = computed(() => {
    const { visible, noCopyright, noCurrency, noLocale, noLogo, noPoweredBy } =
      config.value;

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

  // --- context
  const supportedTemplates = {
    [FOOTER_TEMPLATE.DEFAULT]: FooterStacked,
    [FOOTER_TEMPLATE.ENCLOSED]: FooterStacked,
    [FOOTER_TEMPLATE.FULL]: FooterStacked,
    [FOOTER_TEMPLATE.TWO_COLUMN_LTR]: FooterFlat,
    [FOOTER_TEMPLATE.TWO_COLUMN_RTL]: FooterFlat,
    [FOOTER_TEMPLATE.SPLIT]: FooterFlat,
    [FOOTER_TEMPLATE.CANVAS_CARD]: FooterFlat,
    [FOOTER_TEMPLATE.SURFACE_BOX]: FooterFlat
  };

  const defaultTemplate = FOOTER_TEMPLATE.DEFAULT;

  const template = computed(() => {
    const template = config.value.template ?? defaultTemplate;
    return get(
      supportedTemplates,
      template,
      get(supportedTemplates, defaultTemplate)
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

  function hideLogo() {
    update({ noLogo: true });
  }

  function showLogo() {
    update({ noLogo: false });
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
    update({ noLogo: true, noPoweredBy: true, noCopyright: true });
  }

  function showContent() {
    update({ noLogo: false, noPoweredBy: false, noCopyright: false });
  }

  function setTemplate(template: FooterProps["template"]) {
    update({ template });
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
    templateName: computed(() => config.value.template),

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
