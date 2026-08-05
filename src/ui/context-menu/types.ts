import type { PortalTarget } from "../../utils";
import type { AvatarProps } from "../avatar";
import type { ButtonProps } from "../button";
import type { IconProps } from "../icon";
import type { CxOptions } from "class-variance-authority";
import type {
  ContextMenuContentProps,
  ContextMenuRootProps,
  ContextMenuTriggerProps
} from "radix-vue";
import type { HTMLAttributes } from "vue";

export type ContextMenuItemProps = {
  label: string;
  value: string;
  icon?: IconProps["icon"];
  avatar?: Partial<AvatarProps>;
  handler?: (...args: unknown[]) => unknown;
  disabled?: boolean;
  hidden?: boolean;
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
  class?: HTMLAttributes["class"];
};

export type ContextMenuProps = ContextMenuRootProps &
  ContextMenuContentProps &
  Pick<ContextMenuTriggerProps, "disabled"> & {
    title?: string;
    label?: string;
    to?: PortalTarget;
    // --- state
    items: ContextMenuItemProps[];
    // --- variants
    size?: ButtonProps["size"];
    // --- styles
    uiConfig?: {
      contextMenu: {
        content?: CxOptions;
        item?: CxOptions;
        label?: CxOptions;
        group?: CxOptions;
      };
    };
    class?: HTMLAttributes["class"];
    popoverClass?: HTMLAttributes["class"];
  };
