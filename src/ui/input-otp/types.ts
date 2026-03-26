// -----------------------------------------------------------------------------
/**
 * @module input-otp/types
 * @description Type definitions for the InputOTP component.
 */

import type { containerVariants } from "./input-otp.config";
import type { AvatarProps } from "../avatar";
import type { Icon } from "../icon/types";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

export type ContainerVariantProps = VariantProps<typeof containerVariants>;

export type InputOTPProps = {
  /** Model value. */
  modelValue?: string;
  /** Default value. */
  defaultValue?: string;
  // ---
  /** Whether to auto-focus the input on mount. */
  autoFocus?: boolean;
  /** Autocomplete hint for browsers. */
  autocomplete?: string;
  /** Disabled state. */
  disabled?: boolean;
  /** Prepend icon. */
  icon?: string | Icon;
  /** Prepend avatar. */
  avatar?: Partial<AvatarProps>;
  /** Append icon. */
  iconAppend?: string | Icon;
  /** Append avatar. */
  avatarAppend?: Partial<AvatarProps>;
  /** Input mode hint for mobile keyboards. */
  inputmode?: "numeric" | "text";
  /** Maximum number of characters. */
  maxlength?: number;
  /** Regex pattern for allowed characters. */
  pattern?: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Readonly state. */
  readonly?: boolean;
  /** Required state. */
  required?: boolean;
  /** Show focus ring. */
  ring?: boolean;
  /** Text alignment within slots. */
  textAlign?: "left" | "center" | "right";
  // --- variants
  /** Width variant. */
  width?: ContainerVariantProps["width"] | string | undefined;
  // --- customisation
  /** UI config overrides. */
  uiConfig?: { input?: CxOptions };
  /** Additional CSS classes. */
  class?: HTMLAttributes["class"];
};

export type InputOTPSlotProps = {
  /** The character in this slot. */
  char: string | null;
  /** Whether to show a fake caret. */
  hasFakeCaret?: boolean;
  /** Whether this slot is the active input position. */
  isActive: boolean;
  /** Whether the overall input is focused. */
  isFocused?: boolean;
  /** The placeholder character. */
  placeholderChar?: string | null;
};
