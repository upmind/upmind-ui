// --- eternal

// --- upw
export { default as UpwAlert } from "./components/alert/Alert.vue";
export { default as UpwAvatar } from "./components/avatar/Avatar.vue";
export { default as UpwButton } from "./components/button/Button.vue";
export { default as UpwCheckbox } from "./components/checkbox/Checkbox.vue";
export { default as UpwCheckboxList } from "./components/checkbox/CheckboxList.vue";
export { default as UpwCombobox } from "./components/combobox/Combobox.vue";
export { default as UpwDialog } from "./components/dialog/Dialog.vue";
export { default as UpwDropdown } from "./components/dropdown/Dropdown.vue";
export { default as UpwForm } from "./components/form/Form.vue";
export { default as UpwIcon } from "./components/icon/Icon.vue";
export { default as UpwInput } from "./components/input/Input.vue";
export { default as UpwListbox } from "./components/listbox/Listbox.vue";
export { default as UpwQuantitybox } from "./components/quantitybox/Quantitybox.vue";
export { default as UpwRadio } from "./components/radio/Radio.vue";
export { default as UpwRadioList } from "./components/radio/RadioList.vue";
export { default as UpwSelect } from "./components/select/Select.vue";
export { default as UpwSkeletonForm } from "./components/skeleton/SkeletonForm.vue";
export { default as UpwSkeletonList } from "./components/skeleton/SkeletonList.vue";
export { default as UpwSpinner } from "./components/spinner/Spinner.vue";
export { default as UpwSteps } from "./components/steps/Steps.vue";
export { default as UpwTabs } from "./components/tabs/Tabs.vue";
export { default as UpwTextarea } from "./components/textarea/Textarea.vue";
export { default as UpwTextbox } from "./components/textbox/Textbox.vue";
export { default as UpwThemeSwitcher } from "./components/theme/ThemeSwitcher.vue";
export { default as UpwMarkdown } from "./components/markdown/Markdown.vue";
export { default as UpwLineclamp } from "./components/lineclamp/Lineclamp.vue";
export * from "./components/form/renderers/utils";

// --- uw
import { UwAlert } from "./ui/alert";
import { UwAvatar } from "./ui/avatar";
import { UwBadge } from "./ui/badge";
import { UwButton } from "./ui/button";
import { UwCombobox } from "./ui/combobox";
import { UwDialog } from "./ui/dialog";
import { UwIcon } from "./ui/icon";
import { UwIndicator } from "./ui/indicator";
import { UwSonner } from "./ui/sonner";
import { UwTabs } from "./ui/tabs";
import { UwTooltip } from "./ui/tooltip";

// --- uw component utils
export { toast } from "./ui/sonner";

// --- utils
export { useStyles, mergeStyles, useThemes, useScrollSpy } from "./utils";
import { forEach, kebabCase } from "lodash-es";

// -----------------------------------------------------------------------------
// export individial Custom Elements / Web Components
export {
  UwAlert,
  UwAvatar,
  UwBadge,
  UwButton,
  UwCombobox,
  UwDialog,
  UwIcon,
  UwIndicator,
  UwSonner,
  UwTabs,
  UwTooltip,
};

// --- utility for registering all custom elements
export function register() {
  customElements.define("uw-alert", UwAlert);
  customElements.define("uw-avatar", UwAvatar);
  customElements.define("uw-badge", UwBadge);
  customElements.define("uw-button", UwButton);
  customElements.define("uw-combobox", UwCombobox);
  customElements.define("uw-dialog", UwDialog);
  customElements.define("uw-icon", UwIcon);
  customElements.define("uw-indicator", UwIndicator);
  customElements.define("uw-sonner", UwSonner);
  customElements.define("uw-tabs", UwTabs);
  customElements.define("uw-tooltip", UwTooltip);
}

// --- utility for registering custom elements and allowing for code splitting
export function useCustomElement(constructor: CustomElementConstructor): void {
  const componentName = kebabCase(constructor.def.name);
  if (!customElements.get(componentName)) {
    customElements.define(componentName, constructor);
  }
}

export function useCustomElements(
  ...constructors: Array<CustomElementConstructor>
): void {
  forEach(constructors, constructor => {
    const componentName = kebabCase(constructor.def.name);
    if (!customElements.get(componentName)) {
      customElements.define(componentName, constructor);
    }
  });
}

// -----------------------------------------------------------------------------

declare module "vue" {
  export interface GlobalComponents {
    UwAlert: typeof UwAlert;
    UwAvatar: typeof UwAvatar;
    UwBadge: typeof UwBadge;
    UwButton: typeof UwButton;
    UwCombobox: typeof UwCombobox;
    UwDialog: typeof UwDialog;
    UwIcon: typeof UwIcon;
    UwIndicator: typeof UwIndicator;
    UwSonner: typeof UwSonner;
    UwTabs: typeof UwTabs;
    UwTooltip: typeof UwTooltip;
  }
}
