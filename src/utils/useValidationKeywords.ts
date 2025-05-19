import {
  isValidPhoneNumber,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";
import { KeywordDefinition } from "ajv";
import { isString, isObject } from "lodash-es";

export const phoneCountryCodeKeyword: KeywordDefinition = {
  keyword: "phoneCountryCode",
  type: ["string", "object"],
  schemaType: "string",
  validate: (schema: CountryCode, data: string | PhoneNumber) => {
    if (isString(data) && data.includes("+")) {
      return isValidPhoneNumber(data);
    } else if (isObject(data)) {
      const value = data?.number || data?.nationalNumber || "";
      const country = data?.country || schema;
      return isValidPhoneNumber(value, country);
    }
    return false;
  },
  error: {
    message: () => "Invalid phone number format",
  },
};
