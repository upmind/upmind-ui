// -----------------------------------------------------------------------------

export function useMoney() {
  /**
   * Here we remove trailing zeroes from price
   */
  function removeTrailingZeroes(val?: any) {
    return val?.replace(/[,.]00\b/, "") || "";
  }

  function parsePrice(
    price?: string | null,
    options?: {
      trimTrailingZeroes?: boolean;
    }
  ) {
    if (price && options?.trimTrailingZeroes)
      return removeTrailingZeroes(price);
    return price;
  }

  return {
    parsePrice,
    removeTrailingZeroes
  };
}
