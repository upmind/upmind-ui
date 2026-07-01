import { Methods, Targets } from "@upmind-automation/types";
import { get } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------

/**
 * @name submitViaForm
 * @desc This function lets you programmatically create, insert and
 * submit a new form element so we can reliably hand off to third party origins
 * without encountering any cross-origin (CORS) issues. */

export function submitViaForm({
  fields,
  method = Methods.GET,
  target = Targets.SELF,
  url
}: {
  fields?: Record<string, any>;
  method?: Methods;
  target?: Targets;
  url: string;
}) {
  return new Promise((resolve, reject) => {
    try {
      const form = document.createElement("form");

      form.target = target;
      form.method = method;
      form.action = url;
      form.style.display = "none";

      for (const key in fields || {}) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = get(fields, key);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      resolve({});
    } catch (error) {
      reject(error);
    }
  });
}
