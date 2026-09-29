/**
 * Stands in for Nuxt's `#app` virtual module under the plain Vite config, so a
 * plugin file can be imported and run. Tests replace it with `vi.mock("#app")`.
 */
export function defineNuxtPlugin<T>(setup: T): T {
  return setup;
}

export function useRouter(): Record<string, never> {
  return {};
}

export function useRuntimeConfig(): { public: Record<string, string> } {
  return { public: {} };
}
