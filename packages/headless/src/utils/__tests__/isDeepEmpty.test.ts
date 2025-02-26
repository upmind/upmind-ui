import { describe, it, expect } from "vitest";
import { isDeepEmpty } from "../../utils/isDeepEmpty";

describe("isDeepEmpty.ts", () => {
  it("should return true for an empty object", () => {
    expect(isDeepEmpty({})).toBe(true);
  });

  // Test different types of arguments
  it("should return true for null value", () => {
    expect(isDeepEmpty(null)).toBe(true);
  });
  it("should return true for undefined value", () => {
    expect(isDeepEmpty(undefined)).toBe(true);
  });
  it("should return true for empty string", () => {
    expect(isDeepEmpty("")).toBe(true);
  });
  it("should return false for non-empty string", () => {
    expect(isDeepEmpty("non-empty")).toBe(false);
  });
  it("should return true for number 0", () => {
    expect(isDeepEmpty(0)).toBe(true);
  });
  it("should return true for numbers as not an object", () => {
    expect(isDeepEmpty(42)).toBe(true);
  });
  it("should return true for boolean value as not an object", () => {
    expect(isDeepEmpty(true)).toBe(true);
    expect(isDeepEmpty(false)).toBe(true);
  });

  // Test objects
  it("should return true for an object with only null values", () => {
    expect(isDeepEmpty({ a: null, b: null })).toBe(true);
  });
  it("should return true for an object with only undefined values", () => {
    expect(isDeepEmpty({ a: undefined, b: undefined })).toBe(true);
  });
  it("should return false for an object with a value", () => {
    expect(isDeepEmpty({ a: undefined, b: 1 })).toBe(false);
  });

  // Test deeper objects
  it("should return true for object with an empty nested object", () => {
    expect(isDeepEmpty({ a: { b: {} } })).toBe(true);
  });
  it("should return false for object with a nested object with values", () => {
    expect(isDeepEmpty({ a: { b: { c: 1 } } })).toBe(false);
  });

  // Since arrays are kinda objects in Javascript, does it work with arrays ?
  it("should return true for an empty array", () => {
    expect(isDeepEmpty([])).toBe(true);
  });
  it("should return true for an array with only empty values", () => {
    expect(isDeepEmpty([{}, [], undefined])).toBe(true);
  });
  it("should return false for an array with a non-empty value", () => {
    expect(isDeepEmpty([{}, 1, undefined])).toBe(false);
  });
  it("should return true for array with a nested array with no values", () => {
    expect(isDeepEmpty([[], [[]], [[[]]]])).toBe(true);
  });
  it("should return false for array with a nested array with values", () => {
    expect(isDeepEmpty([[], [[]], [[1]]])).toBe(false);
  });

  // What if it's a mix of objects and arrays ?
  it("should return true for an object with a mix of nested objects and arrays with no values", () => {
    expect(isDeepEmpty({ a: [], b: { c: [[]], d: {} } })).toBe(true);
  });
  it("should return false for an object with a mix of nested objects and arrays with values", () => {
    expect(isDeepEmpty({ a: [], b: { c: [[1]], d: {} } })).toBe(false);
  });
});
