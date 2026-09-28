/**
 * @module auth-app/useThemeAttribute
 * @description This app's brand-theme setter.
 */
export function useThemeAttribute() {
  return {
    set: (id: string) => {
      if (!id) return;
      document.documentElement.setAttribute("data-theme", id);
    }
  };
}
