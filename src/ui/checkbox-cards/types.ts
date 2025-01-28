// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type { ListboxRootProps, ListboxItemProps } from "radix-vue";
import type { VariantProps } from "class-variance-authority";
import type { rootVariants } from "./checkboxCards.config";
type CheckboxCardsVariantProps = VariantProps<typeof rootVariants>;

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
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  layout?: CheckboxCardsVariantProps["layout"];
  // ---
  uiConfig?: { tooltip: Partial<CheckboxCardsProps> };
  class?: HTMLAttributes["class"];
}
