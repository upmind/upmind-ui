import type { IconProps } from "../icon";
import type { rootVariants } from "./select.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type {
  SelectRootProps,
  SelectContentProps,
  SelectItemProps,
  SelectValueProps
} from "radix-vue";
import type { HTMLAttributes } from "vue";

type RootVariants = VariantProps<typeof rootVariants>;

export type SelectProps = Omit<SelectRootProps, "variant"> &
  SelectContentProps &
  SelectValueProps & {
    // --- state
    items: ({
      label?: string;
      title?: string;
      const?: string;
      id?: string;
      /** Explicit data-* attributes spread onto the rendered option (e.g.
       * `{ "data-testid": "currency-gbp" }`). Overrides the implicit
       * `select-item-*` testid; the uniform escape hatch across primitives. */
      dataAttrs?: Record<`data-${string}`, string | number | boolean>;
    } & SelectItemProps)[];
    additionalItems?: SelectItemAdditional[];
    // --- variants;
    variant?: RootVariants["variant"];
    width?: RootVariants["width"];
    size?: RootVariants["size"];
    placeholder?: string;
    ring?: boolean;
    to?: string;
    // --- styles
    uiConfig?: {
      select: {
        root: CxOptions;
        value: CxOptions;
        item: CxOptions;
      };
    };
    class?: HTMLAttributes["class"];
    dataHover?: boolean;
    dataFocus?: boolean;
  };

export type SelectItemAdditional = {
  textValue: string;
  value: string;
  icon: IconProps["icon"];
  emitOnly?: boolean;
};
