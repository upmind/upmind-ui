// --- external
import { createAjv } from "@jsonforms/core";
import { isValidPhoneNumber } from "libphonenumber-js";

// --- internal
// import { useBrand, useSystem } from "@upmind/flow";

// --- utils
import { isString } from "lodash-es";
// ----------------------------------------------------------------------

export const useValidation = () => {
  // us JSON Forms version of AJV as it has formats and other keywords already
  const ajv = createAjv({ useDefaults: true });
  // const { getCountry: getDefaultCountry } = useBrand();
  // const {getCountry;}

  ajv.addFormat("phone", {
    type: ["object", "string"],
    validate: data => {
      const phoneNumber = isString(data)
        ? data
        : data?.national || data?.number || "";
      const country = data?.countryCode; // || defaultCountry?.id;
      return isValidPhoneNumber(phoneNumber, country);
    }
  });

  ajv.addFormat(
    "domain_name",
    // /^(((?!-))(xn--|_)?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$/
    /^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/
  );

  return {
    ajv
  };
};
