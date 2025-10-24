// --- external
import { computed, ref } from "vue";

// --- internal
import { Store } from "@upmind-automation/headless";

// --- async components

// --- utils
import { get, isEmpty, isObject, merge, values } from "lodash-es";

// --- types
import { HEADER_TEMPLATE, type HeaderProps } from "./types";

// -----------------------------------------------------------------------------
// --- global context

const headerConfig = new Store<HeaderProps>({
  visible: true,
  template: HEADER_TEMPLATE.DEFAULT,
  noSession: false,
  noBasket: false,
  noLogo: false
});

// NB: Create a reactive ref initialized with the store's current state.
const config = ref<HeaderProps>(headerConfig.state);
headerConfig.subscribe(state => (config.value = state.currentVal));

// -----------------------------------------------------------------------------
/**
 * Composable to manage header layout and behavior.
 * @return An object containing header management methods and properties.
 *
 */
export const useHeader = (initial?: Partial<HeaderProps>) => {
  // Initialize state with initial values
  update(initial || {});

  // --- state
  const meta = computed(() => {
    const { visible, noSession, noBasket, noLogo } = config.value;

    return {
      isVisible: !!visible,
      showLogo: !noLogo,
      showSession: !noSession,
      showBasket: !noBasket,
      hasActions: !(noBasket && noSession),
      hasContent: !noLogo
    };
  });

  // --- context

  const supportedTemplates: HEADER_TEMPLATE[] = values(HEADER_TEMPLATE);

  const defaultTemplate = HEADER_TEMPLATE.DEFAULT;

  const template = computed(() => {
    const template = config.value.template ?? defaultTemplate;
    return get(
      supportedTemplates,
      template,
      get(supportedTemplates, defaultTemplate)
    );
  });

  // --- methods
  function update(values: Partial<HeaderProps>) {
    if (!isObject(values) || isEmpty(values)) return;
    headerConfig.setState(
      (prev: HeaderProps) => merge({}, prev, values) as HeaderProps
    );
  }

  // --- sytactic sugar
  function hide() {
    update({ visible: false });
  }

  function show() {
    update({ visible: true });
  }

  function hideBasket() {
    update({ noBasket: true });
  }

  function showBasket() {
    update({ noBasket: false });
  }

  function hideSession() {
    update({ noSession: true });
  }

  function showSession() {
    update({ noSession: false });
  }

  function hideLogo() {
    update({ noLogo: true });
  }

  function showLogo() {
    update({ noLogo: false });
  }

  function hideActions() {
    update({ noBasket: true, noSession: true });
  }

  function showActions() {
    update({ noBasket: false, noSession: false });
  }

  function hideContent() {
    update({ noLogo: true });
  }

  function showContent() {
    update({ noLogo: false });
  }

  function setTemplate(template: HeaderProps["template"]) {
    update({ template });
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    config: headerConfig,

    /**
     * Meta-information about the Header state.
     * @type {Object} HeaderMeta
     * @property {boolean} isVisible - Indicates if the header is visible.
     * @property {boolean} showBasket - Indicates if the Basket section is shown.
     * @property {boolean} showSession - Indicates if the Session switcher is shown.
     * @property {boolean} showLogo - Indicates if the logo is shown.
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
     * Updates the header configuration.
     * @param {Partial<HeaderProps>} config - Partial configuration to update the header state.
     * @returns {void}
     */
    update,

    /**
     * Hides the header.
     * @returns {void}
     */
    hide,

    /**
     * Shows the header.
     * @returns {void}
     */
    show,

    /**
     * Hides the Basket section.
     * @returns {void}
     */
    hideBasket,

    /**
     * Shows the Basket section.
     * @returns {void}
     */
    showBasket,

    /**
     * Hides the Session switcher.
     * @returns {void}
     */
    hideSession,

    /**
     * Shows the Session switcher.
     * @returns {void}
     */
    showSession,

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
     * Hides all action components (locale and Session switchers).
     * @returns {void}
     */
    hideActions,

    /**
     * Shows all action components (locale and Session switchers).
     * @returns {void}
     */
    showActions,

    /**
     * Hides all content components (logo, powered by, and Basket).
     * @returns {void}
     */
    hideContent,

    /**
     * Shows all content components (logo, powered by, and Basket).
     * @returns {void}
     */
    showContent,

    /**
     * Sets the footer template variant.
     * @param {HEADER_TEMPLATE} template - The template variant to set.
     * @returns {void}
     */
    setTemplate
  };
};
