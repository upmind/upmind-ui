import { FormatDefinition } from "ajv";
import { isString, isNil } from "lodash-es";

export interface NamedFormatDefinition<T extends string = string>
  extends FormatDefinition<T> {
  name: string;
}

export const domainNameFormat: NamedFormatDefinition<string> = {
  name: "domain_name",
  type: "string",
  validate: (data: string): boolean => {
    if (isNil(data)) return true;
    if (!isString(data)) return false;
    return /^(?!-)[A-Za-z0-9-]+([-.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/.test(data);
    // Original regex (slighly modified for use)
    // return /^(((?!-))(xn--|_)?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$/.test(data);
  },
};

export const alphaFormat: NamedFormatDefinition<string> = {
  name: "alpha",
  type: "string",
  validate: (data: string): boolean => {
    if (isNil(data)) return true;
    if (!isString(data)) return false;
    return /^[a-zA-Z]+$/.test(data);
  },
};
export const alphaDashFormat: NamedFormatDefinition<string> = {
  name: "alpha-dash",
  type: "string",
  validate: (data: string): boolean => {
    if (isNil(data)) return true;
    if (!isString(data)) return false;
    return /^[a-zA-Z0-9_-]+$/.test(data);
  },
};

export const alphaNumericFormat: NamedFormatDefinition<string> = {
  name: "alpha_num",
  type: "string",
  validate: (data: string): boolean => {
    if (isNil(data)) return true;
    if (!isString(data)) return false;
    return /^[a-zA-Z0-9]+$/.test(data);
  },
};
