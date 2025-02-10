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
import { Autocomplete } from "./ui/autocomplete";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Alert } from "./ui/alert";
import { Avatar, type AvatarProps } from "./ui/avatar";
import { Badge, type BadgeProps } from "./ui/badge";
import { Button, type ButtonProps } from "./ui/button";
import { Checkbox, type CheckboxProps } from "./ui/checkbox";
import {
  CheckboxCards,
  type CheckboxCardsProps,
  type CheckboxCardsItemProps,
} from "./ui/checkbox-cards";
import {
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
import { Dialog, type DialogProps } from "./ui/dialog";
import { Drawer } from "./ui/drawer";
import { DropdownMenu, type DropdownMenuItemProps } from "./ui/dropdown-menu";
import { SelectCards, type SelectCardsItemProps } from "./ui/select-cards";
import {
  Form,
  FormField,
  FormControl,
  FormLabel,
  FormDescription,
  FormMessage,
  type FormProps,
  type FormFooterProps,
  type FormActionsProps,
} from "./ui/form";
import { Icon, type IconProps } from "./ui/icon";
import { IconAnimated, type AnimatedIconProps } from "./ui/icon-animated";
import { Indicator } from "./ui/indicator";
import { Interstitial, type InterstitialProps } from "./ui/interstitial";
import { Input, type InputProps } from "./ui/input";
import { NumberField, type NumberFieldProps } from "./ui/number-field";
import { Loading } from "./ui/loading";
import { Link } from "./ui/link";
import { Sonner } from "./ui/sonner";
import { Spinner } from "./ui/spinner";
import { Tabs, type TabItems } from "./ui/tabs";
import { Tooltip } from "./ui/tooltip";
import { Textarea, type TextareaProps } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import {
  RadioCards,
  type RadioCardsProps,
  type RadioCardsItemProps,
} from "./ui/radio-cards";
import { RadioGroup } from "./ui/radio-group";

import { Select, type SelectProps } from "./ui/select";
import { Skeleton, SkeletonList } from "./ui/skeleton";

export { default as Markdown } from "./ui/markdown/Markdown.vue";
export { default as Lineclamp } from "./ui/lineclamp/Lineclamp.vue";
export { toast } from "./ui/sonner";

// --- utils
export {
  useStyles,
  cn,
  useThemes,
  useStyleSheet,
  initializeLottie,
  usePointerEvents,
} from "./utils";

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
  Link,
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
  type FormFooterProps,
  type FormActionsProps,
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
};

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
