// --- external
import { type HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { contentVariant, overlayVariant } from "./drawer.config";
type DrawerContentVariantProps = VariantProps<typeof contentVariant>;
type DrawerOverlayVariantProps = VariantProps<typeof overlayVariant>;

export interface DrawerProps {
  title?: string;
  description?: string;
  // ---
  open?: boolean;
  persistent: boolean;
  // --- variants
  size?: DrawerContentVariantProps["size"];
  overflow?: DrawerContentVariantProps["overflow"];
  fit?: DrawerContentVariantProps["fit"];
  skrim?: DrawerOverlayVariantProps["skrim"];
  // --- styles
  upwindConfig?: {
    drawer: {
      content: Partial<DrawerOverlayVariantProps>;
      overlay: Partial<DrawerContentVariantProps>;
    };
  };
  class?: HTMLAttributes["class"];
  classHeader?: HTMLAttributes["class"];
  classContent?: HTMLAttributes["class"];
  classFooter?: HTMLAttributes["class"];
}
