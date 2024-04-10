import { upwConfig } from "../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig(
    "relative inline-flex !cursor-pointer items-center justify-center gap-x-3 rounded-lg text-center leading-normal transition-all"
  ),
  content: {
    root: upwConfig("mx-auto flex items-center gap-x-3 "),
    loading: upwConfig("invisible opacity-0"),
    label: upwConfig("font-semibold leading-none "),
    icon: upwConfig("size-[1.5em]"),
  },
  avatar: {
    root: upwConfig("size-[1.5em] overflow-hidden rounded-full"),
    loading: upwConfig("invisible opacity-0"),
  },
  loading: upwConfig(
    "absolute bottom-0 left-0 right-0 top-0 m-auto size-6 opacity-80"
  ),

  // ------------------------------------------------------------
  // Attribute based Classes: These are conditional based on the component props
  // Each Attribute is an object of key value pairs where key is the attribute value that can be passed to the component
  attributes: {
    size: {
      target: "root",
      options: {
        default: upwConfig("text-md px-6 py-4"),
        sm: upwConfig("px-6 py-2 text-sm"),
        lg: upwConfig("px-6 py-6 text-lg"),
      },
    },
    variant: {
      target: "root",
      options: {
        default: upwConfig("border-transparent"),
        flat: upwConfig("border-transparent"),
        outlined: upwConfig("border !bg-opacity-0"),
        ghost: upwConfig("border-transparent bg-opacity-0"),
        plain: upwConfig("border-transparent"),
        elevated: upwConfig("border-transparent shadow-md hover:shadow-lg"),
        link: upwConfig("!bg-transparent hover:underline"),
      },
    },
    color: {
      target: "root",
      options: {
        default: upwConfig(
          "text-primary-content hover:text-primary-content data-[variant=link]:text-primary bg-primary-600 hover:bg-primary-700 disabled:hover:bg-primary-600 data-[variant=outlined]:border-primary-500 data-[variant=ghost]:text-primary-500 data-[variant=outlined]:text-primary-500  data-[variant=outlined]:hover:border-primary-400 data-[variant=ghost]:hover:bg-primary-100 data-[variant=ghost]:hover:text-primary-800 data-[variant=outlined]:hover:text-primary-400 border-transparent"
        ),
        primary: upwConfig(
          "bg-primary text-primary-content hover:bg-primary-600 border-primary-300 hover:border-primary-100 disabled:hover:bg-primary data-[variant=outlined]:border-primary-500 data-[variant=outlined]:text-primary-500 data-[variant=outlined]:hover:border-primary-400 data-[variant=outlined]:hover:text-primary-400 data-[variant=ghost]:text-primary-500 data-[variant=ghost]:hover:bg-primary-100 data-[variant=ghost]:hover:text-primary-800  data-[variant=link]:text-primary"
        ),
        secondary: upwConfig(
          "bg-secondary text-secondary-content hover:bg-secondary-600 border-secondary-300 hover:border-secondary-100 disabled:hover:bg-secondary data-[variant=outlined]:border-secondary-500 data-[variant=outlined]:text-secondary-500 data-[variant=outlined]:hover:border-secondary-400 data-[variant=outlined]:hover:text-secondary-400 data-[variant=ghost]:text-secondary-500 data-[variant=ghost]:hover:bg-secondary-100 data-[variant=ghost]:hover:text-secondary-800 data-[variant=link]:text-secondary"
        ),
        accent: upwConfig(
          "bg-accent text-accent-content hover:bg-accent-600 border-accent-300 hover:border-accent-100 disabled:hover:bg-accent data-[variant=outlined]:border-accent-500 data-[variant=outlined]:text-accent-500 data-[variant=outlined]:hover:border-accent-400 data-[variant=outlined]:hover:text-accent-400 data-[variant=ghost]:text-accent-500 data-[variant=ghost]:hover:bg-accent-100 data-[variant=ghost]:hover:text-accent-800 data-[variant=link]:text-accent"
        ),
        neutral: upwConfig(
          "bg-neutral text-neutral-content disabled:hover:bg-neutral data-[variant=link]:text-neutral data-[variant=outlined]:hover:border-neutral data-[variant=outlined]:hover:text-neutral data-[variant=ghost]:text-neutral border-neutral-300 hover:border-neutral-200 hover:bg-neutral-600 data-[variant=outlined]:border-neutral-800 data-[variant=outlined]:text-neutral-800 data-[variant=ghost]:hover:bg-neutral-200 data-[variant=ghost]:hover:text-neutral-800"
        ),
        success: upwConfig(
          "bg-success text-success-content hover:bg-success-600 border-success-300 hover:border-success-100 disabled:hover:bg-success data-[variant=outlined]:border-success-500 data-[variant=outlined]:text-success-500 data-[variant=outlined]:hover:border-success-400 data-[variant=outlined]:hover:text-success-400 data-[variant=ghost]:text-success-500 data-[variant=ghost]:hover:bg-success-100 data-[variant=ghost]:hover:text-success-800  data-[variant=link]:text-success"
        ),
        error: upwConfig(
          "bg-error text-error-content hover:bg-error-600 border-error-300 hover:border-error-100 disabled:hover:bg-error data-[variant=outlined]:border-error-500 data-[variant=outlined]:text-error-500 data-[variant=outlined]:hover:border-error-400 data-[variant=outlined]:hover:text-error-400 data-[variant=ghost]:text-error-500 data-[variant=ghost]:hover:bg-error-100 data-[variant=ghost]:hover:text-error-800 data-[variant=link]:text-error"
        ),
        warning: upwConfig(
          "bg-warning text-warning-content hover:bg-warning-600 border-warning-300 hover:border-warning-100 disabled:hover:bg-warning data-[variant=outlined]:border-warning-500 data-[variant=outlined]:text-warning-500 data-[variant=outlined]:hover:border-warning-400 data-[variant=outlined]:hover:text-warning-400 data-[variant=ghost]:text-warning-500 data-[variant=ghost]:hover:bg-warning-100 data-[variant=ghost]:hover:text-warning-800 data-[variant=link]:text-warning"
        ),
        info: upwConfig(
          "bg-info text-info-content hover:bg-info-600 border-info-300 hover:border-info-100 disabled:hover:bg-info data-[variant=outlined]:border-info-500 data-[variant=outlined]:text-info-500 data-[variant=outlined]:hover:border-info-400 data-[variant=outlined]:hover:text-info-400 data-[variant=ghost]:text-info-500 data-[variant=ghost]:hover:bg-info-100 data-[variant=ghost]:hover:text-info-800 data-[variant=link]:text-info"
        ),
      },
    },
    disabled: {
      target: "root",
      options: {
        default: upwConfig(),
        true: upwConfig(
          "!cursor-not-allowed opacity-50 hover:translate-y-0 active:translate-y-0"
        ),
      },
    },
    iconOnly: {
      target: "root",
      options: {
        default: upwConfig(),
        true: upwConfig(
          "!rounded-full !px-4 data-[size=lg]:!px-6 data-[size=md]:!px-4 data-[size=sm]:!px-2 [&>.avatar]:hidden [&>.content>.label]:sr-only"
        ),
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
