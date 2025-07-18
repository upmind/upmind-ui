// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps, CxOptions } from "class-variance-authority";
import type { DrawerDirection, DrawerPortalProps } from "vaul-vue";

// --- internal
import type {
  overlayVariant,
  containerVariant,
  innerVariant
} from "./drawer.config";
import type { ButtonProps } from "../..";
type DrawerOverlayVariantProps = VariantProps<typeof overlayVariant>;
type DrawerContainerVariantProps = VariantProps<typeof containerVariant>;
type DrawerInnerVariantProps = VariantProps<typeof innerVariant>;

export interface DrawerProps extends DrawerPortalProps {
  // --- root props
  activeSnapPoint?: number | string | null;
  closeThreshold?: number;
  shouldScaleBackground?: boolean;
  scrollLockTimeout?: number;
  fixed?: boolean;
  dismissible?: boolean;
  modal?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  nested?: boolean;
  direction?: DrawerDirection;
  // ---
  title?: string;
  description?: string;
  // --- variants
  size?: ButtonProps["size"];
  width?: DrawerContainerVariantProps["width"] | string;
  overflow?: DrawerInnerVariantProps["overflow"] | string;
  fit?: DrawerInnerVariantProps["fit"] | string;
  skrim?: DrawerOverlayVariantProps["skrim"] | string;
  // --- styles
  uiConfig?: {
    drawer: {
      overlay: CxOptions;
      content: CxOptions;
      container: CxOptions;
      inner: CxOptions;
      header: CxOptions;
      footer: CxOptions;
    };
  };
  class?: HTMLAttributes["class"];
  classHeader?: HTMLAttributes["class"];
  classContent?: HTMLAttributes["class"];
  classFooter?: HTMLAttributes["class"];
}
