import type { sheetVariants } from "./sheet.config";
import type { VariantProps, CxOptions } from "class-variance-authority";
import type { DialogPortalProps } from "radix-vue";
import type { HTMLAttributes } from "vue";

export type SheetVariants = VariantProps<typeof sheetVariants>;

export type SheetProps = DialogPortalProps & {
  // --- root props
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  // --- content props
  forceMount?: boolean;
  trapFocus?: boolean;
  disableOutsidePointerEvents?: boolean;
  // ---
  title?: string;
  description?: string;
  noHeader?: boolean;
  noFooter?: boolean;
  // --- variants
  side?: SheetVariants["side"];
  // --- styles
  uiConfig?: {
    sheet: {
      overlay: CxOptions;
      content: CxOptions;
      header: CxOptions;
      container: CxOptions;
      footer: CxOptions;
    };
  };
  class?: HTMLAttributes["class"];
  classHeader?: HTMLAttributes["class"];
  classContent?: HTMLAttributes["class"];
  classFooter?: HTMLAttributes["class"];
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
};
