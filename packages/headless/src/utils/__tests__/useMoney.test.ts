import { describe, it, expect } from "vitest";
import { useMoney } from "../../utils/useMoney";

describe("useMoney.ts", () => {
  describe("removeTrailingZeroes", () => {
    const { removeTrailingZeroes } = useMoney();

    it("should handle null, undefined or empty string arguments correctly", () => {
      expect(removeTrailingZeroes(null)).toBe("");
      expect(removeTrailingZeroes(undefined)).toBe("");
      expect(removeTrailingZeroes("")).toBe("");
    });

    it("should remove trailing zeroes from value", () => {
      expect(removeTrailingZeroes("1.00")).toBe("1");
      expect(removeTrailingZeroes("1.50")).toBe("1.50");
      expect(removeTrailingZeroes("1,00")).toBe("1");
      expect(removeTrailingZeroes("1,50")).toBe("1,50");
    });

    it("should return the same value for prices with no trailing zeroes", () => {
      expect(removeTrailingZeroes("123")).toBe("123");
      expect(removeTrailingZeroes("123.45")).toBe("123.45");
    });

    it("should handle edge cases", () => {
      expect(removeTrailingZeroes("0.00")).toBe("0");
      expect(removeTrailingZeroes("0,00")).toBe("0");

      // TODO?
      // expect(removeTrailingZeroes('0.000')).toBe('0');
      // expect(removeTrailingZeroes('00.000')).toBe('0');
      // expect(removeTrailingZeroes('0,000')).toBe('0');
      // expect(removeTrailingZeroes('00,000')).toBe('0');
    });
  });
});
