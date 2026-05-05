// -----------------------------------------------------------------------------
/**
 * @module input-password/types
 * @description Type definitions for the InputPassword + PasswordStrength components.
 */

import type { barVariants, messageVariants } from "./input-password.config";
import type { InputProps } from "../input/types";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

export type BarVariantProps = VariantProps<typeof barVariants>;
export type MessageVariantProps = VariantProps<typeof messageVariants>;

export type InputPasswordProps = {
  /** Model value. */
  modelValue?: string;
  /** Default value. */
  defaultValue?: string;
  // --- behaviour (delegated to the underlying Input)
  /** Whether to auto-focus the input on mount. */
  autoFocus?: boolean;
  /** Autocomplete hint for browsers. Defaults to "current-password". */
  autocomplete?: string;
  /** Disabled state. */
  disabled?: boolean;
  /** Readonly state. */
  readonly?: boolean;
  /** Required state. */
  required?: boolean;
  /** Minimum length for native validation. */
  minlength?: number;
  /** Maximum length for native validation. */
  maxlength?: number;
  /** Regex pattern for native validation. */
  pattern?: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Input id. */
  id?: string;
  /** Input name. */
  name?: string;
  /** Width variant inherited from Input. */
  width?: InputProps["width"];
  // --- password-specific affordances
  /** Show the generator (magic-wand) button; parent is responsible for producing the new value via `@generate`. */
  generator?: boolean;
  /** Tooltip label for the generator button. */
  generateLabel?: string;
  /** Tooltip label when the password is masked. */
  showLabel?: string;
  /** Tooltip label when the password is unmasked. */
  hideLabel?: string;
  // --- customisation
  /** UI config overrides. */
  uiConfig?: { inputPassword?: CxOptions };
  /** Additional CSS classes. */
  class?: HTMLAttributes["class"];
};

export type PasswordStrengthProps = {
  /** Render the strength bars. When false, only the message is shown. */
  showBars?: boolean;
  /** Number of satisfied requirements (0..max). */
  score?: number;
  /** Total number of requirements → number of bars rendered when `showBars` is true. */
  max?: number;
  /** Single line rendered beneath the bars (a composed hint or error sentence). */
  message?: string;
  /** Whether `message` should render as an error. */
  hasError?: boolean;
  /** Id assigned to the message element — lets callers wire `aria-describedby` from an input. */
  messageId?: string;
  // --- customisation
  /** UI config overrides. */
  uiConfig?: { passwordStrength?: CxOptions };
  /** Additional CSS classes. */
  class?: HTMLAttributes["class"];
};
