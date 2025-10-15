// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { BadgeProps } from "../badge/types";
import type { ToggleGroupRootProps, ToggleGroupItemProps } from "radix-vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { checkboxLabelVariants } from "./checkboxCards.config";
type CheckboxLabelVariantProps = VariantProps<typeof checkboxLabelVariants>;

export interface CheckboxCardsItemProps extends ToggleGroupItemProps {
  label: string;
  secondaryLabel?: string;
  description?: string;
  secondaryDescription?: string;
  badge?: BadgeProps;
  secondaryBadge?: BadgeProps;
  action?: string;
  id?: string;
  /** When `true`, prevents the user from interacting with the radio item. */
  disabled?: boolean;
  /** When `true`, indicates that the user must check the radio item before the owning form can be submitted. */
  required?: boolean;
  name?: string;
}

type HTMLClassAttributes = HTMLAttributes["class"];
type Cursor = CheckboxLabelVariantProps["cursor"];
export interface CheckboxCardsProps extends ToggleGroupRootProps {
  modelValue?: string[];
  /** The default active value. Use when you do not need to control the state of the items. */
  defaultValue?: string[];
  /** Require at least one checkbox to be checked */
  required?: boolean;
  // --- state
  items: CheckboxCardsItemProps[];
  /** Enable loading state */
  loading?: boolean;
  /** Hides the checkbox input */
  noInput?: boolean;
  /** Disable the pointer cursor allowing text selection */
  cursor?: Cursor;
  /** Display the checkbox cards as a list */
  list?: boolean;
  // ---
  uiConfig?: { tooltip: CxOptions };
  /** Apply additional classes to the container */
  /** @type {import('vue').HTMLAttributes['class']} */
  class?: HTMLClassAttributes;
  /** Apply additional classes to the items */
  itemClass?: HTMLClassAttributes;
  dataHover?: boolean;
  dataFocus?: boolean;
}
