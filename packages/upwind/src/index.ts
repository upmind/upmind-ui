import "./assets/main.css";

// --- eternal

// --- DEPRECATED Components
export { default as UpwCheckbox } from "./components/checkbox/Checkbox.vue";
export { default as UpwCheckboxList } from "./components/checkbox/CheckboxList.vue";
export { default as UpwCombobox } from "./components/combobox/Combobox.vue";
export { default as UpwDropdown } from "./components/dropdown/Dropdown.vue";
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
import { UwAutocomplete, Autocomplete } from "./ui/autocomplete";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { UwAlert, Alert } from "./ui/alert";
import { UwAvatar, Avatar, type AvatarProps } from "./ui/avatar";
import { UwBadge, Badge, type BadgeProps } from "./ui/badge";
import { UwButton, Button, type ButtonProps } from "./ui/button";
import { UwCheckbox, Checkbox, type CheckboxProps } from "./ui/checkbox";
import {
  CheckboxCards,
  type CheckboxCardsProps,
  type CheckboxCardsItemProps,
} from "./ui/checkbox-cards";

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
  type DropdownMenuItemProps,
} from "./ui/dropdown-menu";
import {
  UwForm,
  Form,
  FormField,
  FormControl,
  FormLabel,
  FormDescription,
  FormMessage,
  type FormProps,
} from "./ui/form";
import { UwIcon, Icon, type IconProps } from "./ui/icon";
import {
  UwIconAnimated,
  IconAnimated,
  type AnimatedIconProps,
} from "./ui/icon-animated";
import { UwIndicator, Indicator } from "./ui/indicator";
import { UwInput, Input, type InputProps } from "./ui/input";
import {
  UwNumberField,
  NumberField,
  type NumberFieldProps,
} from "./ui/number-field";
import { UwSonner, Sonner } from "./ui/sonner";
import { UwSpinner, Spinner } from "./ui/spinner";
import { UwTabs, Tabs, type TabItems } from "./ui/tabs";
import { UwTooltip, Tooltip } from "./ui/tooltip";
import { UwTextarea, Textarea, type TextareaProps } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import {
  RadioSelect,
  type RadioSelectProps,
  type RadioSelectItemProps,
} from "./ui/radio-select";
import {
  RadioCards,
  type RadioCardsProps,
  type RadioCardsItemProps,
} from "./ui/radio-cards";

import { UwSelect, Select, type SelectProps } from "./ui/select";
import { UwSkeleton, Skeleton } from "./ui/skeleton";
// --- uw component utils
export { toast } from "./ui/sonner";

// --- utils
export {
  useStyles,
  cn,
  useThemes,
  useStyleSheet,
  useScrollSpy,
  initializeLottie,
} from "./utils";
import { forEach, kebabCase } from "lodash-es";

// -----------------------------------------------------------------------------
// export individial Custom Elements / Web Components
export {
  // --- Components
  Alert,
  Autocomplete,
  Avatar,
  Badge,
  Button,
  Checkbox,
  CheckboxCards,
  Combobox,
  Dialog,
  Drawer,
  DropdownMenu,
  Form,
  FormField,
  FormControl,
  FormLabel,
  FormDescription,
  FormMessage,
  Icon,
  IconAnimated,
  Indicator,
  Input,
  NumberField,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioSelect,
  RadioCards,
  Separator,
  Select,
  Skeleton,
  Sonner,
  Spinner,
  Switch,
  Tabs,
  Textarea,
  Tooltip,

  // --- Types
  type AvatarProps,
  type BadgeProps,
  type ButtonProps,
  type CheckboxProps,
  type CheckboxCardsProps,
  type CheckboxCardsItemProps,
  type ComboboxProps,
  type ComboboxItemProps,
  type DialogProps,
  type FormProps,
  type IconProps,
  type AnimatedIconProps,
  type InputProps,
  type NumberFieldProps,
  type RadioSelectProps,
  type RadioSelectItemProps,
  type RadioCardsProps,
  type RadioCardsItemProps,
  type SelectProps,
  type TabItems,
  type TextareaProps,
  type DropdownMenuItemProps,

  // --- Custom Elements
  UwAlert,
  UwAutocomplete,
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
  UwIconAnimated,
  UwIndicator,
  UwInput,
  UwNumberField,
  UwSelect,
  UwSkeleton,
  UwSonner,
  UwTabs,
  UwTooltip,
  UwTextarea,
};

// --- utility for registering all custom elements
export function register() {
  customElements.define("uw-alert", UwAlert);
  customElements.define("uw-autocomplete", UwAutocomplete);
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
  customElements.define("uw-icon-animated", UwIconAnimated);
  customElements.define("uw-indicator", UwIndicator);
  customElements.define("uw-input", UwInput);
  customElements.define("uw-number-field", UwNumberField);
  customElements.define("uw-sonner", UwSonner);
  customElements.define("uw-spinner", UwSpinner);
  customElements.define("uw-select", UwSelect);
  customElements.define("uw-skeleton", UwSkeleton);
  customElements.define("uw-tabs", UwTabs);
  customElements.define("uw-tooltip", UwTooltip);
  customElements.define("uw-textarea", UwTextarea);
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

// -----------------------------------------------------------------------------

declare module "vue" {
  export interface GlobalComponents {
    Alert: typeof Alert;
    Autocomplete: typeof Autocomplete;
    Avatar: typeof Avatar;
    Badge: typeof Badge;
    Button: typeof Button;
    Checkbox: typeof Checkbox;
    CheckboxCards: typeof CheckboxCards;
    Combobox: typeof Combobox;
    Dialog: typeof Dialog;
    Drawer: typeof Drawer;
    DropdownMenu: typeof DropdownMenu;
    Form: typeof Form;
    FormField: typeof FormField;
    FormControl: typeof FormControl;
    FormLabel: typeof FormLabel;
    FormDescription: typeof FormDescription;
    FormMessage: typeof FormMessage;
    Icon: typeof Icon;
    IconAnimated: typeof IconAnimated;
    Indicator: typeof Indicator;
    Input: typeof Input;
    NumberField: typeof NumberField;
    Popover: typeof Popover;
    PopoverContent: typeof PopoverContent;
    PopoverTrigger: typeof PopoverTrigger;
    RadioSelect: typeof RadioSelect;
    RadioCards: typeof RadioCards;
    Separator: typeof Separator;
    Sonner: typeof Sonner;
    Skeleton: typeof Skeleton;
    Spinner: typeof Spinner;
    Select: typeof Select;
    Tabs: typeof Tabs;
    Tooltip: typeof Tooltip;
    Textarea: typeof Textarea;
  }
}
