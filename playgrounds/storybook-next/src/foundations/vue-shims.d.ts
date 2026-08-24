/**
 * Minimal SFC shim so `tsc --noEmit` (this app's typecheck) can resolve the
 * `.vue` modules re-exported by @upmind/ui component entrypoints. The
 * Storybook/Vite build uses the real SFC compiler; vue-tsc in @upmind/ui
 * owns the precise component typings.
 */
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<
    Record<string, never>,
    Record<string, never>,
    unknown
  >;
  export default component;
}
