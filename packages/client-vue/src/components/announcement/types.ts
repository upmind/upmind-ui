import type { BannerProps } from "@upmind-automation/upmind-ui";
export interface AnnouncementOptions {
  /** The text content of the announcement */
  text: string;
  /** The type of announcement (maps to Banner color) */
  type?: BannerProps["color"] | "success";
  /** The icon to display (defaults to "x") */
  icon?: string;
  /** Callback fired when the action is triggered */
  onAction?: () => void;
}
