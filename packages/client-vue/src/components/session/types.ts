import { type HTMLAttributes } from "vue";
// -----------------------------------------------------------------------------

export interface AuthProps {
  show: "login" | "register" | "forgot" | "reset" | "profile";
  noHeader: boolean;
  noFooter: boolean;
  noTabs: boolean;
  // --- varants
  color: string;
  blockTabs: boolean;
  stretchTabs: boolean;
  // ---
  upwindConfig?: { alert: Partial<AuthProps> };
  class?: HTMLAttributes["class"];
}

export interface SessionExpiredProps {
  modal?: boolean;
  title?: string;
  text?: string;
  avatar?: {
    size?: string;
    shape?: string;
    color?: string;
    icon?: string;
    fit?: string;
  };
  action?: {
    label?: string;
    color?: string;
    handler?: () => void;
    auto?: boolean;
  };
  size?: string;
  skrim?: string;
}
