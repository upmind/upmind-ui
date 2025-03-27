// -----------------------------------------------------------------------------

export function useMoney() {
  /**
   * Here we remove trailing zeroes from price
   */
  function removeTrailingZeroes(val?: any) {
    return val?.replace(/[,.]00\b/, "") || "";
  }

  function parsePrice(
    price: string,
    amount: number,
    options?: any //ICatalogueOptions
  ) {
    if (options?.trimTrailingZeroes) price = removeTrailingZeroes(price);
    return price;
  }

  return {
    parsePrice,
    removeTrailingZeroes,
  };
}
