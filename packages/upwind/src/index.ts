import "./assets/main.css";

// --- eternal

// --- DEPRECATED Components
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
export { default as UpwSteps } from "./components/steps/Steps.vue";
export { default as UpwTabs } from "./components/tabs/Tabs.vue";
export { default as UpwTextarea } from "./components/textarea/Textarea.vue";
export { default as UpwTextbox } from "./components/textbox/Textbox.vue";
export { default as UpwThemeSwitcher } from "./components/theme/ThemeSwitcher.vue";
export { default as UpwMarkdown } from "./components/markdown/Markdown.vue";
export { default as UpwLineclamp } from "./components/lineclamp/Lineclamp.vue";
export * from "./components/form/renderers/utils";

// --- UI Components / Custom elements
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { UwAlert, Alert } from "./ui/alert";
import { UwAvatar, Avatar, type AvatarProps } from "./ui/avatar";
import { UwBadge, Badge, type BadgeProps } from "./ui/badge";
import { UwButton, Button, type ButtonProps } from "./ui/button";
import { UwCheckbox, Checkbox, type CheckboxProps } from "./ui/checkbox";
import {
  UwCombobox,
  Combobox,
  type ComboboxProps,
  type ComboboxItemProps,
} from "./ui/combobox";
import { UwDialog, Dialog, type DialogProps } from "./ui/dialog";
import { UwDrawer, Drawer } from "./ui/drawer";
import {
  UwDropdownMenu,
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./ui/dropdownMenu";
import { UwForm, Form, type FormProps } from "./ui/form";
import { UwIcon, Icon, type IconProps } from "./ui/icon";
import { UwIndicator, Indicator } from "./ui/indicator";
import { UwInput, Input, type InputProps } from "./ui/input";
import { UwSonner, Sonner } from "./ui/sonner";
import { UwSpinner, Spinner } from "./ui/spinner";
import { UwTabs, Tabs, type TabItems } from "./ui/tabs";
import { UwTooltip, Tooltip } from "./ui/tooltip";
import { UwTextarea, Textarea, type TextareaProps } from "./ui/textarea";
import { Separator } from "./ui/separator";
import {
  RadioSelect,
  type RadioSelectProps,
  type RadioSelectItemProps,
} from "./ui/radioSelect";

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
  Checkbox,
  Combobox,
  Dialog,
  Drawer,
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  Form,
  Icon,
  Indicator,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioSelect,
  Separator,
  Sonner,
  Spinner,
  Tabs,
  Textarea,
  Tooltip,

  // --- Types
  type AvatarProps,
  type BadgeProps,
  type ButtonProps,
  type CheckboxProps,
  type ComboboxProps,
  type ComboboxItemProps,
  type DialogProps,
  type FormProps,
  type IconProps,
  type InputProps,
  type RadioSelectProps,
  type RadioSelectItemProps,
  type TabItems,
  type TextareaProps,

  // --- Custom Elements
  UwAlert,
  UwAvatar,
  UwBadge,
  UwButton,
  UwCheckbox,
  UwCombobox,
  UwDialog,
  UwDrawer,
  UwDropdownMenu,
  UwForm,
  UwIcon,
  UwIndicator,
  UwInput,
  UwSonner,
  UwTabs,
  UwTooltip,
  UwTextarea,
};

// --- utility for registering all custom elements
export function register() {
  customElements.define("uw-alert", UwAlert);
  customElements.define("uw-avatar", UwAvatar);
  customElements.define("uw-badge", UwBadge);
  customElements.define("uw-button", UwButton);
  customElements.define("uw-checkbox", UwCheckbox);
  customElements.define("uw-combobox", UwCombobox);
  customElements.define("uw-dialog", UwDialog);
  customElements.define("uw-drawer", UwDrawer);
  customElements.define("uw-dropdown-menu", UwDropdownMenu);
  customElements.define("uw-form", UwForm);
  customElements.define("uw-icon", UwIcon);
  customElements.define("uw-indicator", UwIndicator);
  customElements.define("uw-input", UwInput);
  customElements.define("uw-sonner", UwSonner);
  customElements.define("uw-spinner", UwSpinner);
  customElements.define("uw-tabs", UwTabs);
  customElements.define("uw-tooltip", UwTooltip);
  customElements.define("uw-textarea", UwTextarea);
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
    Checkbox: typeof Checkbox;
    Combobox: typeof Combobox;
    Dialog: typeof Dialog;
    Drawer: typeof Drawer;
    DropdownMenu: typeof DropdownMenu;
    Form: typeof Form;
    Icon: typeof Icon;
    Indicator: typeof Indicator;
    Input: typeof Input;
    Popover: typeof Popover;
    PopoverContent: typeof PopoverContent;
    PopoverTrigger: typeof PopoverTrigger;
    RadioSelect: typeof RadioSelect;
    Separator: typeof Separator;
    Sonner: typeof Sonner;
    Spinner: typeof Spinner;
    Tabs: typeof Tabs;
    Tooltip: typeof Tooltip;
    Textarea: typeof Textarea;
  }
}
