import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useFieldsSchemaParser,
  useFieldsUischemaParser,
  useFieldsModelParser
} from "../../utils/useFields";
// import { useTranslateField } from '@/utils/useTranslation';
// import { forEach, get, set } from 'lodash-es';

// vi.mock('@/utils/useTranslation', () => ({
//   useTranslateField: vi.fn(),
// }));

const mockFields = [
  {
    code: "testField1",
    type_code: "input_number",
    name: "Test Field 1",
    description: "Test Field 1 Description",
    placeholder: "Test Field 1 Placeholder",
    required: true,
    show_on_order_form: true,
    hidden: false,
    value: "VisibleValue1"
  },
  {
    code: "testField2",
    type_code: "input-checkbox",
    name: "Test Field 2",
    description: "Test Field 2 Description",
    required: false,
    show_on_order_form: true,
    hidden: false,
    value: "VisibleValue2"
  },
  {
    code: "testField3",
    type_code: "input_date",
    name: "Test Field 3",
    description: "Test Field 3 Description",
    show_on_order_form: false,
    hidden: true,
    value: "HiddenValue"
  }
  // TODO:
  // Add the remaining input types.
  // Maybe we can even create a loop to generate all these automatically,
  // including generating the expected results. We just have to be careful
  // not to end up with the original code...
];

interface Schema {
  type: string;
  title: string;
  i18n: string;
  required: string[];
  properties: Record<string, any>;
}

let expectedSchema: Schema = {
  type: "object",
  title: "Fields",
  i18n: "fields",
  required: [],
  properties: {}
};

const expectedProperties = {
  testField1: {
    type: ["number"],
    title: "Test Field 1",
    description: "Test Field 1 Description",
    i18n: "fields.testField1"
  },
  testField2: {
    type: ["boolean", "null"],
    title: "Test Field 2",
    description: "Test Field 2 Description",
    i18n: "fields.testField2"
  }
};

const expectedUISchema = [
  {
    type: "Control",
    scope: "#/properties/customFields/properties/testField1",
    i18n: "fields.testField1",
    options: {
      label: "Test Field 1",
      multi: false,
      description: "Test Field 1 Description",
      placeholder: "Test Field 1 Placeholder",
      type: "number"
    }
  },
  {
    type: "Control",
    scope: "#/properties/customFields/properties/testField2",
    i18n: "fields.testField2",
    options: {
      label: "Test Field 2",
      multi: false,
      description: "Test Field 2 Description",
      placeholder: undefined, // TODO? Should this be undefined ?
      type: null // TODO? Should this be null ?
    }
  }
];

describe("useFields.ts", () => {
  describe("useFieldsSchemaParser", () => {
    beforeEach(() => {
      expectedSchema = {
        ...expectedSchema,
        required: [],
        properties: {}
      };
    });

    it("should handle empty data", () => {
      const schema = useFieldsSchemaParser([]);
      expect(schema).toEqual(expectedSchema);
    });

    it("should map fields into the correct schema", () => {
      // useTranslateField.mockImplementation((field, key) => field[key]);
      expectedSchema.required = ["testField1"];
      expectedSchema.properties = expectedProperties;

      const schema = useFieldsSchemaParser(mockFields);

      expect(schema).toEqual(expectedSchema);
    });

    it("should exclude hidden or no show_on_order_form fields", () => {
      const schema = useFieldsSchemaParser(mockFields);
      expect(schema.properties).not.toHaveProperty("testField3");
    });
  });

  describe("useFieldsUischemaParser", () => {
    it("should handle empty data gracefully", () => {
      const uiSchema = useFieldsUischemaParser([]);
      expect(uiSchema).toEqual([]);
    });

    it("should parse fields into UI schema", () => {
      // useTranslateField.mockImplementation((field, key) => field[key]);
      const uiSchema = useFieldsUischemaParser(mockFields);

      expect(uiSchema).toEqual(expectedUISchema);
    });

    it("should exclude hidden or non-order-form fields from UI schema", () => {
      const uiSchema = useFieldsUischemaParser(mockFields);
      const excludedField = uiSchema.find(
        item => item.scope === "#/properties/customFields/properties/testField3"
      );
      expect(excludedField).toBeUndefined();
    });
  });

  describe("useFieldsModelParser", () => {
    const mockData = [
      {
        code: "testField1",
        value: "Test Field 1"
      },
      {
        code: "testField2",
        value: 123
      }
    ];

    it("should handle empty data gracefully", () => {
      const model = useFieldsModelParser([]);
      expect(model).toEqual({});
    });

    it("should map fields into model", () => {
      const model = useFieldsModelParser(mockData);
      expect(model).toEqual({
        testField1: "Test Field 1",
        testField2: 123
      });
    });

    it("should override default values with provided values", () => {
      const mockDataWithNoValues = [
        {
          code: "testField1",
          default: "Test Field 1 Default Value"
        }
      ];
      const mockValues = { testField1: "Test Field 1" };

      const model = useFieldsModelParser(mockDataWithNoValues, mockValues);
      expect(model).toEqual({ testField1: "Test Field 1" });
    });
  });
});
