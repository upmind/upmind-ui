// --- external
import { type HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { contentVariant, overlayVariant } from "./dialog.config";
type DialogContentVariantProps = VariantProps<typeof contentVariant>;
type DialogOverlayVariantProps = VariantProps<typeof overlayVariant>;

import type {
  DialogRootProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogTitleProps,
  DialogTriggerProps,
} from "radix-vue";

export interface DialogProps
  extends DialogRootProps,
    DialogContentProps,
    DialogDescriptionProps,
    DialogTitleProps,
    DialogTriggerProps {
  title?: string;
  description?: string;
  // ---
  open?: boolean;
  persistent: boolean;
  // --- variants
  size?: DialogContentVariantProps["size"];
  overflow?: DialogContentVariantProps["overflow"];
  fit?: DialogContentVariantProps["fit"];
  skrim?: DialogOverlayVariantProps["skrim"];

  // ---
  upwindConfig?: {
    dialog: {
      content: Partial<DialogOverlayVariantProps>;
      overlay: Partial<DialogContentVariantProps>;
    };
  };
  class?: HTMLAttributes["class"];
  classHeader?: HTMLAttributes["class"];
  classContent?: HTMLAttributes["class"];
  classFooter?: HTMLAttributes["class"];
}
