import "./assets/main.css";

// --- eternal

// --- UI Components / Custom elements
export * from "./ui/form/renderers/utils";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
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
import {
  useCarousel,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "./ui/carousel";
import { UwDialog, Dialog, type DialogProps } from "./ui/dialog";
import { UwDrawer, Drawer } from "./ui/drawer";
import {
  UwDropdownMenu,
  DropdownMenu,
  type DropdownMenuItemProps,
} from "./ui/dropdown-menu";
import { SelectCards, type SelectCardsItemProps } from "./ui/select-cards";
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
import {
  UwInterstitial,
  Interstitial,
  type InterstitialProps,
  type InterstitialActionProps,
} from "./ui/interstitial";
import { UwInput, Input, type InputProps } from "./ui/input";
import {
  UwNumberField,
  NumberField,
  type NumberFieldProps,
} from "./ui/number-field";
import { UwLoading, Loading } from "./ui/loading";
import { UwSonner, Sonner } from "./ui/sonner";
import { UwSpinner, Spinner } from "./ui/spinner";
import { UwTabs, Tabs, type TabItems } from "./ui/tabs";
import { UwTooltip, Tooltip } from "./ui/tooltip";
import { UwTextarea, Textarea, type TextareaProps } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import {
  RadioCards,
  type RadioCardsProps,
  type RadioCardsItemProps,
} from "./ui/radio-cards";

import { UwSelect, Select, type SelectProps } from "./ui/select";
import { UwSkeleton, Skeleton, SkeletonList } from "./ui/skeleton";

export { default as Markdown } from "./ui/markdown/Markdown.vue";
export { default as Lineclamp } from "./ui/lineclamp/Lineclamp.vue";
export { toast } from "./ui/sonner";

// --- utils
export {
  useStyles,
  cn,
  useThemes,
  useStyleSheet,
  useScrollSpy,
  initializeLottie,
  usePointerEvents,
} from "./utils";
import { forEach, kebabCase } from "lodash-es";

// -----------------------------------------------------------------------------
// export individial Custom Elements / Web Components
export {
  // --- Components
  Alert,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Autocomplete,
  Avatar,
  Badge,
  Button,
  Checkbox,
  CheckboxCards,
  useCarousel,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
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
  Interstitial,
  Input,
  NumberField,
  Loading,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioSelect,
  RadioCards,
  Separator,
  Select,
  SelectCards,
  Skeleton,
  SkeletonList,
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
  type InterstitialProps,
  type InputProps,
  type NumberFieldProps,
  type RadioCardsProps,
  type RadioCardsItemProps,
  type SelectProps,
  type TabItems,
  type TextareaProps,
  type DropdownMenuItemProps,
  type SelectCardsItemProps,

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
  UwInterstitial,
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
  customElements.define("uw-interstitial", UwInterstitial);
  customElements.define("uw-input", UwInput);
  customElements.define("uw-number-field", UwNumberField);
  customElements.define("uw-sonner", UwSonner);
  customElements.define("uw-spinner", UwSpinner);
  customElements.define("uw-select", UwSelect);
  customElements.define("uw-skeleton", UwSkeleton);
  customElements.define("uw-tabs", UwTabs);
  customElements.define("uw-tooltip", UwTooltip);
  customElements.define("uw-textarea", UwTextarea);
  customElements.define("uw-loading", UwLoading);
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
    Accordion: typeof Accordion;
    AccordionContent: typeof AccordionContent;
    AccordionItem: typeof AccordionItem;
    AccordionTrigger: typeof AccordionTrigger;

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
    Interstitial: typeof Interstitial;
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
    SkeletonList: typeof SkeletonList;
    Spinner: typeof Spinner;
    Select: typeof Select;
    Tabs: typeof Tabs;
    Tooltip: typeof Tooltip;
    Textarea: typeof Textarea;
    Loading: typeof Loading;
  }
}
