import { useI18n } from "vue-i18n";
// -----------------------------------------------------------------------------

/** Removes `.00` or `,00` from a formatted price — "£10.00" → "£10". Setup-context free. */
export function removeTrailingZeroes(val?: string) {
  return val?.replace(/[,.]00\b/, "") || "";
}

export function useMoney() {
  const { t } = useI18n();

  function isFree(val?: string | null) {
    // Extract numeric value by removing all non-numeric characters except decimal point and minus sign
    return parseFloat((val || "0").replace(/[^0-9.-]/g, "")) === 0;
  }

  function formatPrice(
    price?: string | null,
    options?: {
      zeroPriceDisplayIsLabel?: boolean;
      trimTrailingZeroes?: boolean;
    }
  ) {
    // Show "Free" label for zero prices if configured
    if (price && options?.zeroPriceDisplayIsLabel && isFree(price)) {
      return t("text.free");
    }

    // Optionally remove trailing zeroes
    if (price && options?.trimTrailingZeroes) {
      return removeTrailingZeroes(price);
    }

    return price;
  }

  return {
    removeTrailingZeroes,
    isFree,
    formatPrice
  };
}
