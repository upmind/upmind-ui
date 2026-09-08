/**
 * @module auth-app/useThemeAttribute
 * @description This app's implementation of `foundation`'s theme port. `ui`
 * publishes no engine yet, so the applier is the one line the tokens need: the
 * resolved id on `data-theme`.
 */
export function useThemeAttribute() {
  return {
    set: (id: string) => {
      if (!id) return;
      document.documentElement.setAttribute("data-theme", id);
    }
  };
}
