// --- external
import ajvErrors from "ajv-errors";
import { createAjv } from "@jsonforms/core";
import { describe, it, expect, beforeEach, vi } from "vitest";

// --- internal
import {
  useModelParser,
  useValidation,
  useValidationParser
} from "../useValidation";
import { ResponseError } from "../useError";

vi.mock("@jsonforms/core", () => ({
  createAjv: vi.fn().mockReturnValue({
    addFormat: vi.fn(),
    addKeyword: vi.fn(),
    compile: vi.fn()
  })
}));

vi.mock("ajv-errors", () => ({
  default: vi.fn()
}));

vi.mock("../../system", () => ({
  useDataLayer: vi.fn(() => ({})),
  useFeedback: vi.fn(() => ({
    addError: vi.fn()
  }))
}));

// NB: Some modules import from "../../modules/system" instead of "../../system";
// provide a compatible mock that exposes useDataLayer as a function.
vi.mock("../../modules/system", () => ({
  useDataLayer: vi.fn(() => ({ dataLayer: vi.fn(() => ({})) })),
  useFeedback: vi.fn(() => ({ addError: vi.fn() }))
}));

// Mock the query module that useUpmind depends on
vi.mock("../../modules/query", () => ({
  useQuery: vi.fn(() => ({
    queryClient: vi.fn()
  }))
}));

// vi.mock('libphonenumber-js', () => ({
//   isValidPhoneNumber: vi.fn(),
// }));

const mockSchema = {
  type: "object",
  properties: {
    testField1: {
      type: "string"
    }
  }
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
      expect(ajvErrors).toHaveBeenCalledWith(ajv, {
        singleError: true,
        keepErrors: false
      });
      expect(ajv.addFormat).toHaveBeenCalledWith(
        "domain_name",
        expect.any(Function)
      );
      expect(ajv.addFormat).toHaveBeenCalledWith("alpha", expect.any(Function));
      expect(ajv.addFormat).toHaveBeenCalledWith(
        "alpha-dash",
        expect.any(Function)
      );
      expect(ajv.addFormat).toHaveBeenCalledWith(
        "alpha_num",
        expect.any(Function)
      );
      expect(ajv.addKeyword).toHaveBeenCalledTimes(9);
      expect(ajv.addKeyword).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: "manage"
        })
      );
      expect(ajv.addKeyword).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: "semantic_type"
        })
      );
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
    it("should handle no data correctly", () => {
      const parsedError = useValidationParser(mockErrors[0] as ResponseError);
      expect(parsedError).toEqual([]);
    });

    it("should parse error correctly", () => {
      const mockErrorWithData = {
        data: {
          field1: "Field 1 Error",
          field2: "Field 2 Error"
        }
      };

      const parsedError = useValidationParser(
        mockErrorWithData as ResponseError
      );

      expect(parsedError[0].message).toBe("Field 1 Error");
      expect(parsedError[0].instancePath).toBe("/field1");
      expect(parsedError[0].schemaPath).toBe("#/properties/field1");
      expect(parsedError[1].message).toBe("Field 2 Error");
      expect(parsedError[1].instancePath).toBe("/field2");
      expect(parsedError[1].schemaPath).toBe("#/properties/field2");
    });
  });

  describe("useModelParser", () => {
    const mockSchema = {
      properties: {
        field1: { type: "string", default: "Field 1" },
        field2: { type: "number" }
      }
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
      expect(model).toEqual({ field1: "Field 1 Override", field2: null });

      // @ts-ignore
      model = useModelParser(mockSchema);
      expect(model).toEqual({ field1: "Field 1", field2: null });
    });
  });
});
