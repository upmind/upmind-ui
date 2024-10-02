// --- external
import { type HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { containerVariant, overlayVariant } from "./drawer.config";
type DrawerContentVariantProps = VariantProps<typeof containerVariant>;
type DrawerOverlayVariantProps = VariantProps<typeof overlayVariant>;

export interface DrawerProps {
  open?: boolean;
  title?: string;
  description?: string;
  showClose?: boolean;
  // --- variants
  size?: DrawerContentVariantProps["size"];
  skrim?: DrawerOverlayVariantProps["skrim"];
  // --- styles
  upwindConfig?: {
    drawer: {
      container: Partial<DrawerOverlayVariantProps>;
      overlay: Partial<DrawerContentVariantProps>;
    };
  };
  class?: HTMLAttributes["class"];
  classHeader?: HTMLAttributes["class"];
  classContent?: HTMLAttributes["class"];
  classFooter?: HTMLAttributes["class"];
}
