// --- external
import { type HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { contentVariant } from "./dialog.config";
type DialogContentVariantProps = VariantProps<typeof contentVariant>;
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
  modelValue?: boolean;
  persistent: boolean;
  // ---
  size?: DialogContentVariantProps["size"];
  overflow?: DialogContentVariantProps["overflow"];
  fit?: DialogContentVariantProps["fit"];
  // ---
  upwindConfig?: { alert: Partial<DialogProps> };
  class?: HTMLAttributes["class"];
}
