// --- external
import { type HTMLAttributes } from "vue";
import { type ToasterProps } from "vue-sonner";

// --- internal
export interface SonnerProps extends ToasterProps {
  // ---
  upwindConfig?: {
    sonner?: {
      base: Partial<SonnerProps>;
      primary: Partial<SonnerProps>;
      secondary: Partial<SonnerProps>;
      accent: Partial<SonnerProps>;
      promotion: Partial<SonnerProps>;
      destructive: Partial<SonnerProps>;
      success: Partial<SonnerProps>;
      info: Partial<SonnerProps>;
      error: Partial<SonnerProps>;
      warning: Partial<SonnerProps>;
    };
  };
  class?: HTMLAttributes["class"];
}
