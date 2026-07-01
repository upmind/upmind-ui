// Define the type for the loaded locales (adjust as needed)
/**
 * Interface representing a collection of loaded locale messages.
 * The keys are locale codes (e.g. "en-GB", "es"), and their values are
 * objects containing translation keys and their corresponding strings.
 *
 * @interface Locale
 * @property {Record<string, Record<string, string>>} [localeCode] - A mapping of locale codes to translation message objects.
 */
export interface Locale {
  /**
   * Index signature allowing dynamic access by locale code.
   * Each locale code maps to an object where keys are message paths and values are translated strings.
   *
   * @example
   * ```JSON
   * {
   *   "en": {
   *     "hello": "Hello",
   *     "welcome": "Welcome to our app"
   *   },
   *   "es": {
   *     "hello": "Hola",
   *     "welcome": "Bienvenido a nuestra aplicación"
   *   }
   * }
   * ```
   */
  [localeCode: string]: Record<string, string>;
}

/**
 * Type alias representing the structure of files loaded via a glob import
 * in a JavaScript/TypeScript module system (e.g. Vite's `import.meta.glob`).
 * This type is flexible to accommodate different glob import patterns,
 * either direct message objects or dynamic import functions.
 *
 * @template T - The type of the translation messages, typically a `Record<string, string>`.
 */
export type GlobbedFiles<T = unknown> =
  | Record<string, { default: Record<string, T> } | Record<string, T>> // E.g. `import.meta.glob('./**/*.json')` where files might export a default or directly be the messages
  | Record<string, () => Promise<T>>; // E.g. `import.meta.glob('./**/*.json', { eager: false })` for dynamic imports
