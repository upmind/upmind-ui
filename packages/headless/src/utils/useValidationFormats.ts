import { DOMAIN_LIKE_VALIDATION } from "./useValidation";
import { isString, isNil } from "lodash-es";
import type { FormatDefinition } from "ajv";

export interface NamedFormatDefinition<
  T extends string | number = string
> extends FormatDefinition<T> {
  name: string;
}

export const domainNameFormat: NamedFormatDefinition<string> = {
  name: "domain_name",
  type: "string",
  validate: (data: string): boolean => {
    if (isNil(data)) return true;
    if (!isString(data)) return false;
    return DOMAIN_LIKE_VALIDATION.test(data);
  }
};

export const alphaFormat: NamedFormatDefinition<string> = {
  name: "alpha",
  type: "string",
  validate: (data: string): boolean => {
    if (isNil(data)) return true;
    if (!isString(data)) return false;
    return /^[a-zA-Z]+$/.test(data);
  }
};
export const alphaDashFormat: NamedFormatDefinition<string> = {
  name: "alpha-dash",
  type: "string",
  validate: (data: string): boolean => {
    if (isNil(data)) return true;
    if (!isString(data)) return false;
    return /^[a-zA-Z0-9_-]+$/.test(data);
  }
};

export const alphaNumericFormat: NamedFormatDefinition<string> = {
  name: "alpha-num",
  type: "string",
  validate: (data: string): boolean => {
    if (isNil(data)) return true;
    if (!isString(data)) return false;
    return /^[a-zA-Z0-9]+$/.test(data);
  }
};

export const alphaDashDotFormat: NamedFormatDefinition<string> = {
  name: "alpha-dash-dot",
  type: "string",
  validate: (data: string): boolean => {
    if (isNil(data)) return true;
    if (!isString(data)) return false;
    return /^[a-zA-Z.-]+$/.test(data);
  }
};
