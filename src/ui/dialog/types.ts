// --- external
import type { contentVariant, overlayVariant } from "./dialog.config";
import type { VariantProps, CxOptions } from "class-variance-authority";
import type {
  DialogRootProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogTitleProps,
  DialogTriggerProps,
  DialogPortalProps
} from "radix-vue";
import type { HTMLAttributes } from "vue";
// --- internal

type DialogContentVariantProps = VariantProps<typeof contentVariant>;
type _DialogOverlayVariantProps = VariantProps<typeof overlayVariant>;

export type DialogProps = DialogRootProps &
  DialogContentProps &
  DialogDescriptionProps &
  DialogTitleProps &
  DialogTriggerProps &
  DialogPortalProps & {
    title?: string;
    description?: string;
    // ---
    noHeader?: boolean;
    noFooter?: boolean;
    // ---
    open?: boolean;
    dismissible?: boolean;
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
  };
