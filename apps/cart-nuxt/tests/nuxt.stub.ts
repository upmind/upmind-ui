/** Stands in for Nuxt's `#app` and `#imports`, which exist only inside a Nuxt build. */
export const defineNuxtPlugin = <T>(plugin: T): T => plugin;

export const useRuntimeConfig = () => ({ public: {} });
