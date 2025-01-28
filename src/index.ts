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
import { UpmAutocomplete, Autocomplete } from "./ui/autocomplete";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { UpmAlert, Alert } from "./ui/alert";
import { UpmAvatar, Avatar, type AvatarProps } from "./ui/avatar";
import { UpmBadge, Badge, type BadgeProps } from "./ui/badge";
import { UpmButton, Button, type ButtonProps } from "./ui/button";
import { UpmCheckbox, Checkbox, type CheckboxProps } from "./ui/checkbox";
import {
  CheckboxCards,
  type CheckboxCardsProps,
  type CheckboxCardsItemProps,
} from "./ui/checkbox-cards";
import {
  UpmCombobox,
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
import { UpmDialog, Dialog, type DialogProps } from "./ui/dialog";
import { UpmDrawer, Drawer } from "./ui/drawer";
import {
  UpmDropdownMenu,
  DropdownMenu,
  type DropdownMenuItemProps,
} from "./ui/dropdown-menu";
import { SelectCards, type SelectCardsItemProps } from "./ui/select-cards";
import {
  UpmForm,
  Form,
  FormField,
  FormControl,
  FormLabel,
  FormDescription,
  FormMessage,
  type FormProps,
} from "./ui/form";
import { UpmIcon, Icon, type IconProps } from "./ui/icon";
import {
  UpmIconAnimated,
  IconAnimated,
  type AnimatedIconProps,
} from "./ui/icon-animated";
import { UpmIndicator, Indicator } from "./ui/indicator";
import {
  UpmInterstitial,
  Interstitial,
  type InterstitialProps,
  type InterstitialActionProps,
} from "./ui/interstitial";
import { UpmInput, Input, type InputProps } from "./ui/input";
import {
  UpmNumberField,
  NumberField,
  type NumberFieldProps,
} from "./ui/number-field";
import { UpmLoading, Loading } from "./ui/loading";
import { UpmSonner, Sonner } from "./ui/sonner";
import { UpmSpinner, Spinner } from "./ui/spinner";
import { UpmTabs, Tabs, type TabItems } from "./ui/tabs";
import { UpmTooltip, Tooltip } from "./ui/tooltip";
import { UpmTextarea, Textarea, type TextareaProps } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import {
  RadioCards,
  type RadioCardsProps,
  type RadioCardsItemProps,
} from "./ui/radio-cards";
import { RadioGroup } from "./ui/radio-group";

import { UpmSelect, Select, type SelectProps } from "./ui/select";
import { UpmSkeleton, Skeleton, SkeletonList } from "./ui/skeleton";

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
  RadioCards,
  RadioGroup,
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
};

// --- utility for registering all custom elements
export function register() {
  customElements.define("uw-alert", UpmAlert);
  customElements.define("uw-autocomplete", UpmAutocomplete);
  customElements.define("uw-avatar", UpmAvatar);
  customElements.define("uw-badge", UpmBadge);
  customElements.define("uw-button", UpmButton);
  customElements.define("uw-checkbox", UpmCheckbox);
  customElements.define("uw-combobox", UpmCombobox);
  customElements.define("uw-dialog", UpmDialog);
  customElements.define("uw-drawer", UpmDrawer);
  customElements.define("uw-dropdown-menu", UpmDropdownMenu);
  customElements.define("uw-form", UpmForm);
  customElements.define("uw-icon", UpmIcon);
  customElements.define("uw-icon-animated", UpmIconAnimated);
  customElements.define("uw-indicator", UpmIndicator);
  customElements.define("uw-interstitial", UpmInterstitial);
  customElements.define("uw-input", UpmInput);
  customElements.define("uw-number-field", UpmNumberField);
  customElements.define("uw-sonner", UpmSonner);
  customElements.define("uw-spinner", UpmSpinner);
  customElements.define("uw-select", UpmSelect);
  customElements.define("uw-skeleton", UpmSkeleton);
  customElements.define("uw-tabs", UpmTabs);
  customElements.define("uw-tooltip", UpmTooltip);
  customElements.define("uw-textarea", UpmTextarea);
  customElements.define("uw-loading", UpmLoading);
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
