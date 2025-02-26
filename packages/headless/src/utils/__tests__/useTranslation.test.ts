import { describe, it, expect } from "vitest";
import { useTranslateField } from "../../utils/useTranslation";

describe("useTranslation.ts", () => {
  describe("useTranslateField", () => {
    it("should handle null and undefined translated fields", () => {
      const mockField = { test: "Test" };
      expect(useTranslateField(mockField, "test")).toBe("Test");

      // TODO?
      // const mockField2 = { test_translated: null, test: 'Test' };
      // expect(useTranslateField(mockField2, 'test')).toBe('Test');
    });

    it("should handle different argument types correctly", () => {
      expect(useTranslateField({}, "name")).toBeUndefined();
      // @ts-ignore
      expect(useTranslateField(null, "name")).toBeUndefined();
      // @ts-ignore
      expect(useTranslateField(undefined, "name")).toBeUndefined();
      // @ts-ignore
      expect(useTranslateField(123, "name")).toBeUndefined();
    });

    it("should return the translated field if it exists", () => {
      const mockField = { test_translated: "PT_Test", test: "Test" };
      expect(useTranslateField(mockField, "test")).toBe("PT_Test");
    });
    it("should handle fields nested in an object correctly", () => {
      const mockNestedField = {
        details: { test_translated: "PT_Test", test: "Test" },
      };
      expect(useTranslateField(mockNestedField, "details.test")).toBe(
        "PT_Test"
      );
    });
  });
});
