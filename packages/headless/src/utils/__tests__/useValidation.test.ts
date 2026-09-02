// --- external
import ajvErrors from "ajv-errors";
import { createAjv } from "@jsonforms/core";
import { describe, it, expect, beforeEach, vi } from "vitest";

// --- internal
import {
  useLaravalSchemaParser,
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

// the package entry builds an Upmind instance on import
vi.mock("../../modules", () => ({
  useQuery: vi.fn(() => ({ queryClient: {} }))
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
        expect.objectContaining({ name: "domain_name" })
      );
      expect(ajv.addFormat).toHaveBeenCalledWith(
        "alpha",
        expect.objectContaining({ name: "alpha" })
      );
      expect(ajv.addFormat).toHaveBeenCalledWith(
        "alpha-dash",
        expect.objectContaining({ name: "alpha-dash" })
      );
      expect(ajv.addFormat).toHaveBeenCalledWith(
        "alpha-num",
        expect.objectContaining({ name: "alpha-num" })
      );
      expect(ajv.addKeyword).toHaveBeenCalledTimes(10);
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

      // a field with no value and no default is stripped from the model
      let model = useModelParser(mockSchema, mockValues);
      expect(model).toEqual({ field1: "Field 1 Override" });

      // @ts-ignore
      model = useModelParser(mockSchema);
      expect(model).toEqual({ field1: "Field 1" });
    });
  });

  describe("useLaravalSchemaParser", () => {
    it("casts in: option values to the declared string type", () => {
      const schema = useLaravalSchemaParser([
        {
          name: "eligibility_type",
          field_label: "Eligibility Type",
          validation_rules: ["required", "string", "in:5,14"],
          options: [
            { label: "Company", value: 5 as unknown as string },
            { label: "Registered Business", value: 14 as unknown as string }
          ]
        }
      ]);
      const property = schema.properties!.eligibility_type as Record<
        string,
        any
      >;
      expect(property.type).toBe("string");
      expect(property.enum).toEqual(["5", "14"]);
      expect(property.options).toEqual([
        { label: "Company", value: "5" },
        { label: "Registered Business", value: "14" }
      ]);
    });

    it("leaves non-numeric option values alone", () => {
      const schema = useLaravalSchemaParser([
        {
          name: "reason",
          field_label: "Reason",
          validation_rules: ["string", "in:a,b"],
          options: [
            { label: "A", value: "a" },
            { label: "None", value: null as unknown as string }
          ]
        }
      ]);
      const property = schema.properties!.reason as Record<string, any>;
      expect(property.enum).toEqual(["a", null, null]);
      expect(property.options).toEqual([
        { label: "A", value: "a" },
        { label: "None", value: null }
      ]);
    });
  });
});
