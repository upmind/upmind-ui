import type { BadgeProps } from "../badge";
import type { checkboxLabelVariants, variants } from "./checkboxCards.config";
import type { LinkProps } from "../link";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { ToggleGroupRootProps, ToggleGroupItemProps } from "radix-vue";
import type { HTMLAttributes } from "vue";

type CheckboxLabelVariantProps = VariantProps<typeof checkboxLabelVariants>;

type _CheckboxCardsItemVariants = typeof variants;

export type CheckboxCardsItemActionProps = LinkProps & {
  handler?: Function | string;
  type?: HTMLButtonElement["type"];
  visible?: boolean;
};

export interface CheckboxCardsItemProps extends ToggleGroupItemProps {
  label: string;
  secondaryLabel?: string;
  description?: string;
  secondaryDescription?: string;
  badge?: BadgeProps;
  secondaryBadge?: BadgeProps;
  action?: CheckboxCardsItemActionProps;
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
  /** Number of items per row (0-6). 0 = custom grid, 1 = full width. Example: columns={3} displays 3 items per row. */
  columns?: number;
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
