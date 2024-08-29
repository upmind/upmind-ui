// --- eternal

// --- upw
// import UpwAlert from "./components/alert/Alert.vue";
// import UpwButton from "./components/button/Button.vue";
// import UpwCheckbox from "./components/checkbox/Checkbox.vue";
// import UpwCheckboxList from "./components/checkbox/CheckboxList.vue";
// import UpwCombobox from "./components/combobox/Combobox.vue";
// import UpwDialog from "./components/dialog/Dialog.vue";
// import UpwDropdown from "./components/dropdown/Dropdown.vue";
// import UpwForm from "./components/form/Form.vue";
// import UpwIcon from "./components/icon/Icon.vue";
// import UpwInput from "./components/input/Input.vue";
// import UpwListbox from "./components/listbox/Listbox.vue";
// import UpwQuantitybox from "./components/quantitybox/Quantitybox.vue";
// import UpwRadio from "./components/radio/Radio.vue";
// import UpwRadioList from "./components/radio/RadioList.vue";
// import UpwSelect from "./components/select/Select.vue";
// import UpwSkeletonForm from "./components/skeleton/SkeletonForm.vue";
// import UpwSkeletonList from "./components/skeleton/SkeletonList.vue";
// import UpwSpinner from "./components/spinner/Spinner.vue";
// import UpwSteps from "./components/steps/Steps.vue";
// import UpwTabs from "./components/tabs/Tabs.vue";
// import UpwTextarea from "./components/textarea/Textarea.vue";
// import UpwTextbox from "./components/textbox/Textbox.vue";
// import UpwThemeSwitcher from "./components/theme/ThemeSwitcher.vue";
// import UpwMarkdown from "./components/markdown/Markdown.vue";
// import UpwLineclamp from "./components/lineclamp/Lineclamp.vue";

// --- uw
import "./assets/upwind.css";

import { UwButton } from "./ui/button";
import { UwAvatar } from "./ui/avatar";
import { UwBadge } from "./ui/badge";
import { UwDialog } from "./ui/dialog";
import { UwTooltip } from "./ui/tooltip";

// --- utils
export { useStyles, mergeStyles, useThemes, useScrollSpy } from "./utils";
import { kebabCase } from "lodash-es";

// -----------------------------------------------------------------------------
// export individial Custom Elements / Web Components
export { UwAvatar, UwButton, UwBadge, UwDialog, UwTooltip };

// --- utility for registering all custom elements
export function registerUpwindComponents() {
  customElements.define("uw-avatar", UwAvatar);
  customElements.define("uw-badge", UwBadge);
  customElements.define("uw-button", UwButton);
  customElements.define("uw-dialog", UwDialog);
  customElements.define("uw-tooltip", UwTooltip);
}

// --- utility for registering custom elements and allowing for code splitting
export function useCustomElement(constructor: CustomElementConstructor): void {
  const componentName = kebabCase(constructor.def.name);
  if (!customElements.get(componentName)) {
    customElements.define(componentName, constructor);
  }
}

// -----------------------------------------------------------------------------

declare module "vue" {
  export interface GlobalComponents {
    // UwAvatar: typeof UwAvatar;
    UwBadge: typeof UwBadge;
    UwButton: typeof UwButton;
    UwDialog: typeof UwDialog;
    UwTooltip: typeof UwTooltip;
  }
}
