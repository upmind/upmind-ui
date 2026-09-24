/**
 * @module auth-app/useThemeAttribute
 * @description This app's implementation of `foundation`'s theme port.
 */
export function useThemeAttribute() {
  return {
    set: (id: string) => {
      if (!id) return;
      document.documentElement.setAttribute("data-theme", id);
    }
  };
}
