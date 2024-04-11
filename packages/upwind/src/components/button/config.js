import { upwConfig } from "../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig(
    "relative inline-flex !cursor-pointer items-center justify-center gap-x-3 rounded-lg text-center leading-normal transition-all"
  ),
  content: {
    root: upwConfig("mx-auto flex items-center gap-x-3"),
    loading: upwConfig("invisible opacity-0"),
    label: upwConfig(" font-semibold"),
    icon: upwConfig("size-[1.5em]"),
  },
  avatar: {
    root: upwConfig("size-[1.5em] overflow-hidden rounded-full"),
    loading: upwConfig("invisible opacity-0"),
  },
  loading: upwConfig(
    "absolute bottom-0 left-0 right-0 top-0 m-auto size-[1.5em]"
  ),

  // ------------------------------------------------------------
  // Attribute based Classes: These are conditional based on the component props
  // Each Attribute is an object of key value pairs where key is the attribute value that can be passed to the component
  attributes: {
    size: {
      target: "root",
      options: {
        sm: upwConfig("px-3 py-2 text-sm [&>.content]:px-1"),
        default: upwConfig("px-3 py-3 [&>.content]:px-3"),
        lg: upwConfig("px-3 py-4 text-lg [&>.content]:px-5"),
      },
    },
    variant: {
      target: "root",
      options: {
        default: upwConfig("border-transparent"),
        flat: upwConfig("border-transparent"),
        outlined: upwConfig("border bg-opacity-0 hover:bg-opacity-100"),
        ghost: upwConfig(
          "border-transparent bg-opacity-0 hover:bg-opacity-100"
        ),
        link: upwConfig("!bg-transparent hover:underline"),
      },
    },
    color: {
      target: "root",
      options: {
        default: upwConfig(
          "bg-primary hover:bg-primary-800 text-primary-content data-[variant=ghost]:hover:bg-primary-50 data-[variant=ghost]:text-primary data-[variant=link]:text-primary data-[variant=outlined]:border-primary data-[variant=outlined]:hover:bg-primary-50 data-[variant=outlined]:text-primary disabled:hover:bg-primary border-transparent"
        ),
        primary: upwConfig(
          "bg-primary hover:bg-primary-800 text-primary-content data-[variant=ghost]:hover:bg-primary-50 data-[variant=ghost]:text-primary data-[variant=link]:text-primary data-[variant=outlined]:border-primary data-[variant=outlined]:hover:bg-primary-50 data-[variant=outlined]:text-primary disabled:hover:bg-primary border-transparent"
        ),
        secondary: upwConfig(
          "bg-secondary text-secondary-content hover:bg-secondary-800 disabled:hover:bg-secondary data-[variant=ghost]:hover:bg-secondary-50 data-[variant=ghost]:text-secondary data-[variant=link]:text-secondary data-[variant=outlined]:border-secondary data-[variant=outlined]:hover:bg-secondary-50 data-[variant=outlined]:text-secondary border-transparent"
        ),
        accent: upwConfig(
          "bg-accent text-accent-content hover:bg-accent-800 disabled:hover:bg-accent data-[variant=ghost]:hover:bg-accent-50 data-[variant=ghost]:text-accent data-[variant=link]:text-accent data-[variant=outlined]:border-accent data-[variant=outlined]:hover:bg-accent-50 data-[variant=outlined]:text-accent border-transparent"
        ),
        neutral: upwConfig(
          "bg-neutral text-neutral-content disabled:hover:bg-neutral data-[variant=ghost]:text-neutral data-[variant=link]:text-neutral data-[variant=outlined]:border-neutral data-[variant=outlined]:text-neutral border-transparent hover:bg-neutral-800 data-[variant=ghost]:hover:bg-neutral-50 data-[variant=outlined]:hover:bg-neutral-50"
        ),
        success: upwConfig(
          "bg-success text-success-content hover:bg-success-800 disabled:hover:bg-success data-[variant=ghost]:hover:bg-success-50 data-[variant=ghost]:text-success data-[variant=link]:text-success data-[variant=outlined]:border-success data-[variant=outlined]:hover:bg-success-50 data-[variant=outlined]:text-success border-transparent"
        ),
        error: upwConfig(
          "bg-error text-error-content hover:bg-error-800 disabled:hover:bg-error data-[variant=ghost]:hover:bg-error-50 data-[variant=ghost]:text-error data-[variant=link]:text-error data-[variant=outlined]:border-error data-[variant=outlined]:hover:bg-error-50 data-[variant=outlined]:text-error border-transparent"
        ),
        warning: upwConfig(
          "bg-warning text-warning-content hover:bg-warning-800 disabled:hover:bg-warning data-[variant=ghost]:hover:bg-warning-50 data-[variant=ghost]:text-warning data-[variant=link]:text-warning data-[variant=outlined]:border-warning data-[variant=outlined]:hover:bg-warning-50 data-[variant=outlined]:text-warning border-transparent"
        ),
        info: upwConfig(
          "bg-info text-info-content hover:bg-info-800 disabled:hover:bg-info data-[variant=ghost]:hover:bg-info-50 data-[variant=ghost]:text-info data-[variant=link]:text-info data-[variant=outlined]:border-info data-[variant=outlined]:hover:bg-info-50 data-[variant=outlined]:text-info border-transparent"
        ),
      },
    },
    disabled: {
      target: "root",
      options: {
        default: upwConfig(),
        true: upwConfig("!cursor-default opacity-50"),
      },
    },
    iconOnly: {
      target: "root",
      options: {
        default: upwConfig(),
        true: upwConfig("[&>.avatar]:hidden [&>.content>.label]:sr-only"),
      },
    },
    block: {
      target: "root",
      options: {
        default: upwConfig(),
        true: upwConfig("flex w-full"),
      },
    },
  },
};
