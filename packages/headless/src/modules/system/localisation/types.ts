// Define the type for the loaded locales (adjust as needed)
export interface Locale {
  [localeCode: string]: Record<string, string>;
}

export type GlobbedFiles<T = unknown> =
  | Record<string, { default: Record<string, T> } | Record<string, T>>
  | Record<string, () => Promise<T>>;
