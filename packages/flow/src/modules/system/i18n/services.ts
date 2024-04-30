// --- internal

// --- utils

// --- types
import type { i18nContext, i18nEvent } from "./types.d";
import { trimEnd, trimStart } from "lodash-es";

// --------------------------------------------------------
// HELPERS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function fetchLocale(
  { activeLocale }: i18nContext,
  { data: { path, locale } }: i18nEvent
) {
  locale ??= activeLocale; // fallback to activeLocale if not provided
  if (!path) return Promise.reject("No path provided");

  path = trimEnd(path, "/locales/");
  path = trimStart(path, "@/");

  return import(`@/${path}/locales/${locale}.json`).then(
    ({ data }: any) => ({ key: locale, values: data }) as Record<string, Object>
  );
}

// --------------------------------------------------------
// EXPORTS

export default {
  fetchLocale,
};
