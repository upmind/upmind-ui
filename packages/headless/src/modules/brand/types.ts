// --- internal

import type { UIMeta } from "../product/types";

// -----------------------------------------------------------------------------

export interface IBrandMeta {
  cart: {
    storefront_url?: string; // URL of the storefront
    layout?: "default" | "enclosed" | "full";
    terms_url?: string;
    clickwrap_disclaimer?: string;
    tagline?: string;
    description?: string;
    catalogue?: {
      disabled?: boolean;
      facet?: boolean;
    };
    ui: UIMeta;
  };
  icon_variant?: string; // the preferred icon variant to be used
  variant?: string; // the preferred variant/token id to be used
  theme?: string; // the preferred data-theme id to be used
}
