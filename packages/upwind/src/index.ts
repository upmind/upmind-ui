import "./assets/main.css";

// --- eternal

// --- upw
export { default as UpwCheckbox } from "./components/checkbox/Checkbox.vue";
export { default as UpwCheckboxList } from "./components/checkbox/CheckboxList.vue";
export { default as UpwCombobox } from "./components/combobox/Combobox.vue";
export { default as UpwDropdown } from "./components/dropdown/Dropdown.vue";
export { default as UpwForm } from "./components/form/Form.vue";
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

// --- Web Components
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { UwAlert, Alert } from "./ui/alert";
import { UwAvatar, Avatar } from "./ui/avatar";
import { UwBadge, Badge } from "./ui/badge";
import { UwButton, Button } from "./ui/button";
import { UwCombobox, Combobox } from "./ui/combobox";
import { UwDialog, Dialog, DialogClose } from "./ui/dialog";
import { UwDrawer, Drawer } from "./ui/drawer";
import { UwDropdownMenu, DropdownMenu } from "./ui/dropdown-menu";
import { UwIcon, Icon } from "./ui/icon";
import { UwIndicator, Indicator } from "./ui/indicator";
import { UwSonner, Sonner } from "./ui/sonner";
import { UwTabs, Tabs, type TabItems } from "./ui/tabs";
import { UwTooltip, Tooltip } from "./ui/tooltip";

// --- uw component utils
export { toast } from "./ui/sonner";

// --- utils
export { useStyles, cn, useThemes, useStyleSheet, useScrollSpy } from "./utils";
import { forEach, kebabCase } from "lodash-es";

// -----------------------------------------------------------------------------
// export individial Custom Elements / Web Components
export {
  // --- Components
  Alert,
  Avatar,
  Badge,
  Button,
  Combobox,
  Dialog,
  DialogClose,
  Drawer,
  DropdownMenu,
  Icon,
  Indicator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sonner,
  Tabs,
  Tooltip,

  // --- Custom Elements
  UwAlert,
  UwAvatar,
  UwBadge,
  UwButton,
  UwCombobox,
  UwDialog,
  UwDrawer,
  UwDropdownMenu,
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
  customElements.define("uw-drawer", UwDrawer);
  customElements.define("uw-dropdown-menu", UwDropdownMenu);
  customElements.define("uw-icon", UwIcon);
  customElements.define("uw-indicator", UwIndicator);
  customElements.define("uw-sonner", UwSonner);
  customElements.define("uw-tabs", UwTabs);
  customElements.define("uw-tooltip", UwTooltip);
}

// --- utility for registering custom elements and allowing for code splitting
export function useCustomElement(
  ...constructors: CustomElementConstructor[]
): void {
  forEach(constructors, constructor => {
    // debugger;
    const componentName = kebabCase(constructor.name); // no more name in definition as we use setup scripts
    if (!customElements.get(componentName)) {
      customElements.define(componentName, constructor);
    }
  });
}

// -----------------------------------------------------------------------------

declare module "vue" {
  export interface GlobalComponents {
    Alert: typeof Alert;
    Avatar: typeof Avatar;
    Badge: typeof Badge;
    Button: typeof Button;
    Combobox: typeof Combobox;
    Dialog: typeof Dialog;
    DialogClose: typeof DialogClose;
    Drawer: typeof Drawer;
    DropdownMenu: typeof DropdownMenu;
    Icon: typeof Icon;
    Indicator: typeof Indicator;
    Popover: typeof Popover;
    PopoverContent: typeof PopoverContent;
    PopoverTrigger: typeof PopoverTrigger;
    Sonner: typeof Sonner;
    Tabs: typeof Tabs;
    Tooltip: typeof Tooltip;
    TabItems: TabItems;
  }
}
