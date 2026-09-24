import { computed, hasInjectionContext, inject, provide } from "vue";
import type { ShellComponents } from "./shell.types";
import type { Component, ComputedRef, InjectionKey } from "vue";

const NO_SHELL: ShellComponents = {};

export const SHELL_COMPONENTS: InjectionKey<ComputedRef<ShellComponents>> =
  Symbol("upmind-shell-components");

export const provideShellComponents = (
  components: ComputedRef<ShellComponents>
) => provide(SHELL_COMPONENTS, components);

export type UseShellComponents = {
  components: ComputedRef<ShellComponents>;
  resolve: (name: string) => Component | undefined;
};

export const useShellComponents = (): UseShellComponents => {
  const provided = hasInjectionContext()
    ? inject(SHELL_COMPONENTS, null)
    : null;

  const components = computed(() => provided?.value ?? NO_SHELL);

  return {
    components,
    resolve: (name: string) => components.value[name]
  };
};
