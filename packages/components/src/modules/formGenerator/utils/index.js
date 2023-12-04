import { createAjv } from "@jsonforms/core";

export const useValidation = () => {
  // us JSON Forms version of AJV as it has formats and other keywords already
  const ajv = createAjv({ useDefaults: true });

  ajv.addFormat(
    "domain_name",
    // /^(((?!-))(xn--|_)?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$/
    /^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/
  );

  return {
    ajv
  };
};
