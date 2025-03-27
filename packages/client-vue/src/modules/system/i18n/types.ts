// Define the type for the loaded locales (adjust as needed)
export interface Locale {
  [localeCode: string]: Record<string, string>;
}

// Define the type for the glob imports
export interface GlobbedFiles {
  [path: string]: { default: Record<string, string> };
}

// TODO allow async
// export type GlobbedFiles =
//   | Record<string, string>
//   | Record<string, () => Promise<string>>;
