import type { LinkProps } from "@upmind-automation/upmind-ui";
import type { StorefrontRoute } from "../../types";

export interface ShareProps {
  size?: LinkProps["size"];
}

export type BackProps = {
  label?: string;
  icon?: string;
  size?: string;
  color?: string;
  button?: boolean;
} & Partial<StorefrontRoute>;
