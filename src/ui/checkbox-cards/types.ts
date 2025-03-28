// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type { ListboxRootProps, ListboxItemProps } from "radix-vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { checkboxLabelVariants } from "./checkboxCards.config";
type CheckboxLabelVariantProps = VariantProps<typeof checkboxLabelVariants>;

export interface CheckboxCardsItemProps extends ListboxItemProps {
  label: string;
  id?: string;
  /** When `true`, prevents the user from interacting with the radio item. */
  disabled?: boolean;
  /** When `true`, indicates that the user must check the radio item before the owning form can be submitted. */
  required?: boolean;
  name?: string;
}

export interface CheckboxCardsProps extends ListboxRootProps {
  label?: string;
  placeholder?: string;
  noneText?: string;
  required?: boolean;
  // --- state
  items: CheckboxCardsItemProps[];
  loading?: boolean;
  noInput?: boolean;
  // ---
  color?: ButtonProps["color"] | string;
  variant?: ButtonProps["variant"] | string;
  cursor?: CheckboxLabelVariantProps["cursor"];
  list?: boolean;
  // ---
  uiConfig?: { tooltip: CxOptions };
  class?: HTMLAttributes["class"];
  itemClass?: HTMLAttributes["class"];
}
