import { computed, hasInjectionContext, inject, provide } from "vue";
import type { ShellComponents, UseShellComponents } from "./shell.types";
import type { ComputedRef, InjectionKey } from "vue";

const NO_SHELL: ShellComponents = {};

export const SHELL_COMPONENTS: InjectionKey<ComputedRef<ShellComponents>> =
  Symbol("upmind-shell-components");

export const provideShellComponents = (
  components: ComputedRef<ShellComponents>
) => provide(SHELL_COMPONENTS, components);

export const useShellComponents = (): UseShellComponents => {
  const provided = hasInjectionContext()
    ? inject(SHELL_COMPONENTS, null)
    : null;

  const components = computed(() => provided?.value ?? NO_SHELL);

  return {
    resolve: (name: string) => components.value[name]
  };
};
