export function useMoney() {
  /**
   *
   * @name formatPrice
   * @desc Here we remove trailing zeroes from price
   */

  function removeTrailingZeroes(val?: any) {
    return val?.replace(/[,.]00\b/, "") || "";
  }

  return {
    removeTrailingZeroes
  };
}
