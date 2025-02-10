// --- utils
import { forEach, kebabCase } from "lodash-es";

// -----------------------------------------------------------------------------

// --- UI Components / Custom elements
import { UpmAutocomplete } from "./ui/autocomplete";
import { UpmAlert } from "./ui/alert";
import { UpmAvatar } from "./ui/avatar";
import { UpmBadge } from "./ui/badge";
import { UpmButton } from "./ui/button";
import { UpmCheckbox } from "./ui/checkbox";
import { UpmCombobox } from "./ui/combobox";
import { UpmDialog } from "./ui/dialog";
import { UpmDrawer } from "./ui/drawer";
import { UpmDropdownMenu } from "./ui/dropdown-menu";
import { UpmForm } from "./ui/form";
import { UpmIcon } from "./ui/icon";
import { UpmIconAnimated } from "./ui/icon-animated";
import { UpmIndicator } from "./ui/indicator";
import { UpmInterstitial } from "./ui/interstitial";
import { UpmInput } from "./ui/input";
import { UpmNumberField } from "./ui/number-field";
import { UpmLoading } from "./ui/loading";
import { UpmLink } from "./ui/link";
import { UpmSonner } from "./ui/sonner";
import { UpmSpinner } from "./ui/spinner";
import { UpmTabs } from "./ui/tabs";
import { UpmTooltip } from "./ui/tooltip";
import { UpmTextarea } from "./ui/textarea";
import { UpmSelect } from "./ui/select";
import { UpmSkeleton } from "./ui/skeleton";

// -----------------------------------------------------------------------------
// export individial Custom Elements / Web Components
export {
  UpmAlert,
  UpmAutocomplete,
  UpmAvatar,
  UpmBadge,
  UpmButton,
  UpmCheckbox,
  UpmCombobox,
  UpmDialog,
  UpmDrawer,
  UpmDropdownMenu,
  UpmForm,
  UpmIcon,
  UpmIconAnimated,
  UpmIndicator,
  UpmInterstitial,
  UpmInput,
  UpmNumberField,
  UpmSelect,
  UpmSkeleton,
  UpmSonner,
  UpmTabs,
  UpmTooltip,
  UpmTextarea,
  UpmLoading,
  UpmLink,
};

// --- utility for registering all custom elements
export function register() {
  customElements.define("upm-alert", UpmAlert);
  customElements.define("upm-autocomplete", UpmAutocomplete);
  customElements.define("upm-avatar", UpmAvatar);
  customElements.define("upm-badge", UpmBadge);
  customElements.define("upm-button", UpmButton);
  customElements.define("upm-checkbox", UpmCheckbox);
  customElements.define("upm-combobox", UpmCombobox);
  customElements.define("upm-dialog", UpmDialog);
  customElements.define("upm-drawer", UpmDrawer);
  customElements.define("upm-dropdown-menu", UpmDropdownMenu);
  customElements.define("upm-form", UpmForm);
  customElements.define("upm-icon", UpmIcon);
  customElements.define("upm-icon-animated", UpmIconAnimated);
  customElements.define("upm-indicator", UpmIndicator);
  customElements.define("upm-interstitial", UpmInterstitial);
  customElements.define("upm-input", UpmInput);
  customElements.define("upm-number-field", UpmNumberField);
  customElements.define("upm-sonner", UpmSonner);
  customElements.define("upm-spinner", UpmSpinner);
  customElements.define("upm-select", UpmSelect);
  customElements.define("upm-skeleton", UpmSkeleton);
  customElements.define("upm-tabs", UpmTabs);
  customElements.define("upm-tooltip", UpmTooltip);
  customElements.define("upm-textarea", UpmTextarea);
  customElements.define("upm-loading", UpmLoading);
  customElements.define("upm-link", UpmLink);
}

// --- utility for registering custom elements and allowing for code splitting
export function useCustomElement(
  ...constructors: CustomElementConstructor[]
): void {
  forEach(constructors, constructor => {
    const componentName = kebabCase(constructor.name); // no more name in definition as we use setup scripts
    if (!customElements.get(componentName)) {
      customElements.define(componentName, constructor);
    }
  });
}
