import type { AnnouncementBarVariants } from "@upmind/ui";

export interface AnnouncementOptions {
  /** The text content of the announcement */
  text: string;
  /** The announcement intent (maps to the AnnouncementBar variant). */
  type?: AnnouncementBarVariants["variant"];
  /** The icon to display (defaults to "x") */
  icon?: string;
  /** Callback fired when the action is triggered */
  onAction?: () => void;
}
