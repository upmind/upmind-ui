// --- utils
import { useValidation } from "./useValidation";
import { isEmpty, get, defaultsDeep } from "lodash-es";

// --- types

export interface IApiPop {
  name: string;
  apiUrl: string;
  region?: string;
}

// --------------------------------------------------------

let POP = {};

const defaults = {
  name: import.meta.env.VITE_API_NAME ?? "upmind-production",
  apiUrl: import.meta.env.VITE_API_URL ?? "https://api.upmind.io",
  region: import.meta.env.VITE_API_REGION ?? "euc1",
};

const schema = {
  type: "object",
  title: "POP",
  required: ["name", "region", "apiUrl"],
  properties: {
    name: {
      type: "string",
      default: defaults.name,
      title: "Name",
      description: "Name of the POP",
    },
    region: {
      type: "string",
      default: defaults.region,
      title: "Region",
      description: "Region of the POP",
    },
    apiUrl: {
      type: "string",
      default: defaults.apiUrl,
      title: "API URL",
      description: "API URL of the POP",
      format: "uri", //  "hostname", "idn-hostname", "ipv4", "ipv6", "uri", "uri-reference", "uri-template", "url", "email", "idn-email",
    },
  },
};

// --------------------------------------------------------

export const usePOP = (value?: IApiPop) => {
  const { validate } = useValidation();

  async function getPop(value?: IApiPop) {
    if (value) return Promise.resolve(value);
    return defaults;
    // todo when @james has the endpoint // return fetch(`/__pop`).then(resp => resp.json());
  }

  async function validatePop(popPromise: Promise<IApiPop>) {
    const pop = await popPromise;
    const errors = validate(schema, pop);

    if (!isEmpty(errors)) {
      console.warn("Invalid pop value", errors);
      return defaults;
    }

    return defaultsDeep(pop, defaults);
  }

  // ---------------------------------------------------------------------------
  // --- initialise our Place of Presence (POP)

  validatePop(getPop(value)).then(validPOP => (POP = validPOP));

  // ---------------------------------------------------------------------------
  // --- return our API
  return {
    getApiUrl: () => get(POP, "apiUrl", defaults.apiUrl),
    getPOP: () => POP,
    isReady: () =>
      new Promise(resolve =>
        setTimeout(() => {
          if (!isEmpty(POP)) resolve(true);
        }, 100)
      ),
  };
};
