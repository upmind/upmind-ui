import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  useValidation,
  useValidationParser,
  useModelParser,
} from "../../utils/useValidation";
import { createAjv } from "@jsonforms/core";
import ajvErrors from "ajv-errors";

vi.mock("@jsonforms/core", () => ({
  createAjv: vi.fn().mockReturnValue({
    addFormat: vi.fn(),
    addKeyword: vi.fn(),
    compile: vi.fn(),
  }),
}));

vi.mock("ajv-errors", () => ({
  default: vi.fn(),
}));

// vi.mock('libphonenumber-js', () => ({
//   isValidPhoneNumber: vi.fn(),
// }));

const mockSchema = {
  type: "object",
  properties: {
    testField1: {
      type: "string",
    },
  },
};

const mockErrors = [{ message: "Error 1" }];

describe("useValidation.ts", () => {
  let ajv: any;

  beforeEach(() => {
    ajv = createAjv();
  });

  describe("useValidation", () => {
    it("should initialize correctly (using ajv)", () => {
      const { ajv: ajvMockInstance, validate } = useValidation();

      expect(ajvMockInstance).toBe(ajv);
      expect(ajvErrors).toHaveBeenCalledWith(ajv, { singleError: true });
      expect(ajv.addFormat).toHaveBeenCalledWith(
        "domain_name",
        /^(?!-)[A-Za-z0-9-]+([-.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/
      );
      expect(ajv.addKeyword).toHaveBeenCalledWith({
        keyword: "isPhoneNumber",
        type: ["string", "object"],
        schemaType: "string",
        validate: expect.any(Function),
        error: {
          message: expect.any(Function),
        },
      });
      expect(typeof validate).toBe("function");
    });

    it("should validate schema correctly", () => {
      const mockData = { testField1: "Test Field 1" };

      const validateMock = vi.fn().mockReturnValue(true);
      ajv.compile.mockReturnValue(validateMock);

      const { validate } = useValidation();
      const errors = validate(mockSchema, mockData);

      expect(errors).toEqual([]);
      expect(validateMock).toHaveBeenCalledWith(mockData);
      expect(ajv.compile).toHaveBeenCalledWith(mockSchema);
    });

    it("should return errors if invalid", () => {
      const mockData = { testField1: 123 };

      const validateMock = vi.fn().mockReturnValue(false);
      // @ts-ignore
      validateMock.errors = mockErrors; // ??
      ajv.compile.mockReturnValue(validateMock);

      const { validate } = useValidation();
      const errors = validate(mockSchema, mockData);
      expect(errors).toEqual(mockErrors);
    });
  });

  describe("useValidationParser", () => {
    it("should handle no data correclty", () => {
      const parsedError = useValidationParser(mockErrors[0]);
      expect(parsedError).toBe(mockErrors[0]);
    });

    it("should parse error correctly", () => {
      const mockErrorWithData = {
        data: {
          field1: "Field 1 Error",
          field2: "Field 2 Error",
        },
      };

      const parsedError = useValidationParser(mockErrorWithData);

      expect(parsedError.message).toBe("Validation error");
      expect(parsedError.data).toEqual([
        {
          instancePath: "/field1",
          message: "Field 1 Error",
          schemaPath: "field1",
          keyword: "",
          params: {},
        },
        {
          instancePath: "/field2",
          message: "Field 2 Error",
          schemaPath: "field2",
          keyword: "",
          params: {},
        },
      ]);
    });
  });

  describe("useModelParser", () => {
    const mockSchema = {
      properties: {
        field1: { type: "string", default: "Field 1" },
        field2: { type: "number" },
      },
    };

    it("should handle empty arguments", () => {
      const model = useModelParser({}, {});
      expect(model).toEqual({});
    });

    it("should parse correctly", () => {
      const mockValues = { field2: 30 };

      const model = useModelParser(mockSchema, mockValues);

      expect(model).toEqual({ field1: "Field 1", field2: 30 });
    });

    it("should handle default values correctly", () => {
      const mockValues = { field1: "Field 1 Override" };

      let model = useModelParser(mockSchema, mockValues);
      expect(model).toEqual({ field1: "Field 1 Override" });

      // @ts-ignore
      model = useModelParser(mockSchema);
      expect(model).toEqual({ field1: "Field 1" });
    });
  });
});
