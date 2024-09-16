export type { IconProps } from "../icon/types";
// --------------------------------------------

export interface InputProps {
  id: { type?: String };
  label?: string;
  description?: string;
  errors?: string;
  // ---
  appendAvatar?: IconProps["icon"];
  appendIcon?: IconProps["icon"];
  appendText?: string;
  // ---
  prependAvatar?: IconProps["icon"];
  prependIcon?: IconProps["icon"];
  prependText?: string;
  // ---
  feedbackIcon?: IconProps["icon"];
  // ---
  size?: "sm" | "md" | "lg";
  layout?: "stacked" | "inline";
  variant?: "flat" | "outline";
  outline;
  // ---
  required?: boolean;
  visible?: boolean;
  disabled?: boolean;
  dirty?: boolean;
  // ---
  noRequired?: boolean;
  noStatus?: boolean;
  noFeedback?: boolean;
  persistFeedback?: boolean;
  // --- Provide a way to add custom styles for a specific instance of the component
  upwindConfig?: Object;
}
