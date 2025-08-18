export interface IBrandMeta {
  cart: {
    storefront_url?: string; // URL of the storefront
    terms_url?: string;
    clickwrap_disclaimer?: string;
    layout?: string;
    tagline?: string;
    description?: string;
    catalogue?: {
      disabled?: boolean;
      facet?: boolean;
    };
  };
  variant?: string; // the preferred variant to be used
  variants?: {
    [key: string]: IVariant;
  };
}

export interface IVariant {
  border: string;
  foreground: string;
  background: {
    canvas: string;
    surface: string;
  };
  primary: {
    DEFAULT: string;
    foreground: string;
    background: string;
  };
  secondary: {
    DEFAULT: string;
    foreground: string;
    background: string;
  };
  control: {
    DEFAULT: string;
    background: string;
    popover: string;
    foreground: string;
    border: string;
    active: {
      DEFAULT: string;
      muted: string;
      foreground: string;
      background: string;
      hover: string;
      focus: string;
    };
    hover?: {
      border: string;
    };
  };
  icon: {
    primary: string;
    secondary: string;
  };
}
