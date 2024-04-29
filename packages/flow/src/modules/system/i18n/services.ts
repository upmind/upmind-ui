// --- internal

// --- utils

// --- types
import type { i18nContext, i18nEvent } from "./types.d";
import { trimEnd } from "lodash-es";

// --------------------------------------------------------
// HELPERS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function fetchLocale(
  _context: i18nContext,
  { data: { path, locale } }: i18nEvent
) {
  if (!path || !locale) return Promise.reject("No path or locale provided");

  path = trimEnd(path, "/locales/");
  return import(`@/${path}/locales/${locale}.json`).then(
    ({ data }: any) => ({ key: locale, values: data }) as Record<string, Object>
  );
}

// --------------------------------------------------------
// EXPORTS

export default {
  fetchLocale,
};
