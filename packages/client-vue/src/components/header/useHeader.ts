// --- external
import { computed, ref } from "vue";

// --- internal
import { Store } from "@upmind-automation/headless";
import { useShell } from "../shell/useShell";
import { SHELL } from "../shell/types";

// --- utils
import { isEmpty, isObject, merge } from "lodash-es";

// --- types
import {
  HEADER_POSITION,
  HEADER_JUSTIFY,
  HEADER_ITEMS,
  HEADER_BACKGROUND,
  type UseHeaderProps,
  HEADER_PADDING,
  HEADER_BORDER
} from "./types";

// -----------------------------------------------------------------------------
// --- global context

const defaultHeaderProps: UseHeaderProps = {
  visible: true,
  noSession: false,
  noBasket: false,
  noLogo: false,
  border: HEADER_BORDER.NONE,
  position: HEADER_POSITION.STATIC,
  background: HEADER_BACKGROUND.CANVAS,
  items: HEADER_ITEMS.END,
  justifyLeft: HEADER_JUSTIFY.START,
  justifyRight: HEADER_JUSTIFY.END,
  padding: HEADER_PADDING.MD
};

const headerConfig = new Store<UseHeaderProps>(defaultHeaderProps);

// NB: Create a reactive ref initialized with the store's current state.
const config = ref<UseHeaderProps>(headerConfig.state);
headerConfig.subscribe(state => (config.value = state.currentVal));

// -----------------------------------------------------------------------------
/**
 * Composable to manage header layout and behavior.
 * @return An object containing header management methods and properties.
 *
 */
export const useHeader = (initial?: Partial<UseHeaderProps>) => {
  // Reset to defaults and apply initial overrides if provided
  if (initial) {
    // Mark as configured if actual config provided (not just empty reset)
    if (!isEmpty(initial)) {
      useShell().mark(SHELL.HEADER);
    }
    headerConfig.setState(
      merge({}, defaultHeaderProps, initial) as UseHeaderProps
    );
  }

  // --- state
  const meta = computed(() => {
    const {
      visible,
      noSession,
      noBasket,
      noLogo,
      background,
      position,
      justifyLeft,
      justifyRight,
      items,
      border,
      padding
    } = config.value;

    return {
      isVisible: !!visible,
      showLogo: !noLogo,
      showSession: !noSession,
      showBasket: !noBasket,
      hasActions: !(noBasket && noSession),
      hasContent: !noLogo,
      background,
      position,
      justifyLeft,
      justifyRight,
      items,
      border,
      padding
    };
  });

  // --- methods
  function update(values: Partial<UseHeaderProps>) {
    if (!isObject(values) || isEmpty(values)) return;
    headerConfig.setState(
      (prev: UseHeaderProps) => merge({}, prev, values) as UseHeaderProps
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
    showContent
  };
};
