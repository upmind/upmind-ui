// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps, CxOptions } from "class-variance-authority";

// --- internal
import type {
  contentVariant,
  overlayVariant,
  containerVariant,
  innerVariant,
} from "./drawer.config";
type DrawerContentVariantProps = VariantProps<typeof contentVariant>;
type DrawerOverlayVariantProps = VariantProps<typeof overlayVariant>;
type DrawerContainerVariantProps = VariantProps<typeof containerVariant>;
type DrawerInnerVariantProps = VariantProps<typeof innerVariant>;

export interface DrawerProps {
  title?: string;
  description?: string;
  // ---
  open?: boolean;
  // --- variants
  size?: DrawerContainerVariantProps["size"];
  overflow?: DrawerInnerVariantProps["overflow"];
  fit?: DrawerContentVariantProps["fit"];
  skrim?: DrawerOverlayVariantProps["skrim"];
  // --- styles
  upwindConfig?: {
    drawer: {
      overlay: Partial<DrawerContentVariantProps>;
      content: Partial<DrawerOverlayVariantProps>;
      container: Partial<DrawerContainerVariantProps>;
      inner: Partial<DrawerInnerVariantProps>;
      header: CxOptions;
      footer: CxOptions;
    };
  };
  class?: HTMLAttributes["class"];
  classHeader?: HTMLAttributes["class"];
  classContent?: HTMLAttributes["class"];
  classFooter?: HTMLAttributes["class"];
}
