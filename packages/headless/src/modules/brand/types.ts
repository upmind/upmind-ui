// --- internal

import type { UIMeta } from "../product/types";
import { ThemeTokens } from "../theming";

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
  variant?: string; // the preferred variant/token id to be used
  variants?: Record<string, ThemeTokens>;
}
