import { Methods, Targets } from "@upmind-automation/types";
import { get } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------

/**
 * Programmatically create, insert and submit a form element for third-party
 * handoff without CORS issues. Synchronous: throws on failure, returns on
 * success. Callers needing a promise wrap with `Promise.resolve()`.
 */
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
}): void {
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
}
