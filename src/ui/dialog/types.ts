// --- external
import type { HTMLAttributes } from "vue";
import type { contentVariant, overlayVariant } from "./dialog.config";
import type { VariantProps, CxOptions } from "class-variance-authority";
// --- internal
type DialogContentVariantProps = VariantProps<typeof contentVariant>;
type DialogOverlayVariantProps = VariantProps<typeof overlayVariant>;

import type {
  DialogRootProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogTitleProps,
  DialogTriggerProps,
  DialogPortalProps
} from "radix-vue";

export interface DialogProps
  extends
    DialogRootProps,
    DialogContentProps,
    DialogDescriptionProps,
    DialogTitleProps,
    DialogTriggerProps,
    DialogPortalProps {
  title?: string;
  description?: string;
  // ---
  noHeader?: boolean;
  noFooter?: boolean;
  // ---
  open?: boolean;
  dismissable?: boolean;
  // --- variants
  size?: DialogContentVariantProps["size"] | string;
  overflow?: DialogContentVariantProps["overflow"] | string;
  fit?: DialogContentVariantProps["fit"] | string;

  // ---
  uiConfig?: {
    dialog: {
      overlay: CxOptions;
      content: CxOptions;
      header: CxOptions;
      footer: CxOptions;
    };
  };
  class?: HTMLAttributes["class"];
  classHeader?: HTMLAttributes["class"];
  classContent?: HTMLAttributes["class"];
  classFooter?: HTMLAttributes["class"];
}
