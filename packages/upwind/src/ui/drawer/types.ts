// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps, CxOptions } from "class-variance-authority";
import type { DrawerPortalProps } from "vaul-vue";

// --- internal
import type {
  overlayVariant,
  containerVariant,
  innerVariant,
} from "./drawer.config";
import type { ButtonProps } from "../..";
type DrawerOverlayVariantProps = VariantProps<typeof overlayVariant>;
type DrawerContainerVariantProps = VariantProps<typeof containerVariant>;
type DrawerInnerVariantProps = VariantProps<typeof innerVariant>;

export interface DrawerProps extends DrawerPortalProps {
  title?: string;
  description?: string;
  // ---
  open?: boolean;
  // --- variants
  size?: ButtonProps["size"];
  width?: DrawerContainerVariantProps["width"];
  overflow?: DrawerInnerVariantProps["overflow"];
  fit?: DrawerInnerVariantProps["fit"];
  skrim?: DrawerOverlayVariantProps["skrim"];
  // --- styles
  upwindConfig?: {
    drawer: {
      overlay: Partial<DrawerOverlayVariantProps>;
      content: CxOptions;
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
