// --- external
import {
  isValidPhoneNumber,
  parsePhoneNumberWithError
} from "libphonenumber-js";

// --- utils
import {
  isString,
  isObject,
  get,
  isEqual,
  isEmpty,
  startsWith,
  isFunction
} from "lodash-es";

// --- types
import type { CountryCode, PhoneNumber } from "libphonenumber-js";
import type { KeywordDefinition } from "ajv";
// -----------------------------------------------------------------------------

export const useManageKeyword: KeywordDefinition = {
  keyword: "manage",
  schemaType: "object",
  errors: false
};

export const phoneCountryCodeKeyword: KeywordDefinition = {
  keyword: "phone_country_code",
  type: ["string", "object", "null"],
  schemaType: "string",
  validate: (schema, data, parentSchema, dataCxt) => {
    if (isEmpty(data)) return true;
    if (isString(data) && startsWith(data, "+")) {
      return isValidPhoneNumber(data);
    } else if (isObject(data)) {
      const { number, nationalNumber, country } = data as PhoneNumber;
      if (!number && !nationalNumber) return true; // No phone number provided yet so cant validate

      const value = number || nationalNumber || "";
      const countryCode = country || schema;

      return isValidPhoneNumber(value, countryCode as CountryCode);
    }
    return false;
  },
  error: {
    message: ctx => {
      // try {
      //   parsePhoneNumberWithError(phone.value.number, {
      //     defaultCountry: phone?.value?.country,
      //   });
      //   return (
      //     validatePhoneNumberLength(phone.value.number, {
      //       defaultCountry: phone.value.country,
      //     }) || "NOT_A_NUMBER"
      //   );
      // } catch (error) {
      //   return (error as ParseError).message;
      // }

      // const errorsMapped = computed(() => {
      //   switch (errors.value) {
      //     case "TOO_LONG":
      //       return "Phone number is too long";
      //     case "TOO_SHORT":
      //       return "Phone number is too short";
      //     case "INVALID_COUNTRY":
      //       return "Invalid country";
      //     default:
      //       return "Not a phone number";
      //   }
      // });

      return "Invalid phone number format";
    }
  }
};

export const requiredIfKeyword: KeywordDefinition = {
  keyword: "required_if",
  schemaType: "object",
  validate: (schema, data, parentSchema, dataCxt) => {
    const field = get(schema, "field");
    const value = get(data, field);
    if (!value || !field) return false;
    const dependentValue = get(dataCxt?.parentData, field);
    return isEqual(dependentValue, value);
  },
  error: {
    message: cxt => {
      return `is required if ${cxt.schema.field} is ${cxt.schema.value}`;
    }
  }
};

export const requiredUnlessKeyword: KeywordDefinition = {
  keyword: "required_unless",
  schemaType: "object",
  validate: (schema, data, parentSchema, dataCxt) => {
    const field = get(schema, "field");
    const value = get(data, field);
    if (!value || !field) return false;
    const dependentValue = get(dataCxt?.parentData, field);
    return !isEqual(dependentValue, value);
  },
  error: {
    message: cxt => {
      return `is required unless ${cxt.schema.field} is ${cxt.schema.value}`;
    }
  }
};

export const requiredWithKeyword: KeywordDefinition = {
  keyword: "required_with",
  schemaType: "string",
  validate: (schema, data, parentSchema, dataCxt) => {
    if (!schema) return true;
    const dependentValue = get(dataCxt?.parentData, schema);
    return !isEmpty(data) && !isEmpty(dependentValue);
  },
  error: {
    message: cxt => {
      const schemaObj = cxt?.it?.schemaEnv?.schema as {
        properties?: Record<string, any>;
      };
      const dependent = schemaObj?.properties
        ? get(schemaObj.properties, cxt.schema)
        : undefined;
      return `is required with ${dependent?.title ?? cxt.schema}`;
    }
  }
};

export const requiredWithoutKeyword: KeywordDefinition = {
  keyword: "required_without",
  schemaType: "string",
  validate: (schema, data, parentSchema, dataCxt) => {
    if (!schema) return true;
    const dependentValue = get(dataCxt?.parentData, schema);
    return !isEmpty(data) || !isEmpty(dependentValue);
  },
  error: {
    message: cxt => {
      const schemaObj = cxt?.it?.schemaEnv?.schema as {
        properties?: Record<string, any>;
      };
      const dependent = schemaObj?.properties
        ? get(schemaObj.properties, cxt.schema)
        : undefined;
      return `is required without ${dependent?.title ?? cxt.schema}`;
    }
  }
};

export const sameKeyword: KeywordDefinition = {
  keyword: "same",
  schemaType: "string",
  validate: (schema, data, parentSchema, dataCxt) => {
    if (!schema) return true;
    const dependentValue = get(data, schema);
    return isEqual(dependentValue, data);
  },
  error: {
    message: cxt => {
      return "must be the same as " + cxt.data + " is " + cxt.schema;
    }
  }
};

export const differentKeyword: KeywordDefinition = {
  keyword: "different",
  schemaType: "string",
  validate: (schema, data, parentSchema, dataCxt) => {
    if (!schema) return true;
    const dependentValue = get(data, schema);
    return !isEqual(dependentValue, data);
  },
  error: {
    message: cxt => {
      return "must be different from " + cxt.data + " is " + cxt.schema;
    }
  }
};
