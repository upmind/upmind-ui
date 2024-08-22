// --- eternal
import { defineCustomElement } from "vue";

// --- components
import Button from "./components/ui/button/Button.ce.vue";
import Avatar from "./components/ui/avatar/AvatarConsolidated.ce.vue";
import Badge from "./components/ui/badge/Badge.ce.vue";

// --- utils
export { useStyles, mergeStyles, useThemes, useScrollSpy } from "./utils";
import { get, forEach, set, reduce, find, kebabCase } from "lodash-es";

// -----------------------------------------------------------------------------

export const UwButton = defineCustomElement(Button);
export const UwAvatar = defineCustomElement(Avatar);
export const UwBadge = defineCustomElement(Badge);

// ---
export function useCustomElement(constructor): void {
  const componentName = kebabCase(constructor.def.name);
  if (!customElements.get(componentName)) {
    customElements.define(componentName, constructor);
  }
}

// ---
export function register() {
  customElements.define("uw-button", UwButton);
  customElements.define("uw-avatar", UwAvatar);
  customElements.define("uw-badge", UwBadge);
}

// -----------------------------------------------------------------------------
// ALTERNATE GLOBAL COMPONENT REGISTRATION
// const components = reduce(
//   import.meta.glob("./**/*.ce.*", {
//     eager: true,
//     import: "default",
//   }),
//   (result, definition, path) => {
//     // Get name of component, based on filename
//     // "./components/Fruits.vue" will become "Fruits"
//     const componentName = kebabCase(definition?.name);

//     debugger;

//     // Register component on this Vue instance
//     const component = defineCustomElement(definition);

//     console.log("custom element", componentName, component);

//     set(result, componentName, component);
//     return result;
//   },
//   {}
// );
//
// export function useCustomElement(name: String): void {
//   name = kebabCase(name);
//   const component = get(components, name);
//   debugger;
//   if (!customElements.get(name) && component) {
//     debugger;
//     customElements.define(name, component);
//   }
// }
// -----------------------------------------------------------------------------

// register global typings
declare module "vue" {
  export interface GlobalComponents {
    // Counter: typeof Counter;
  }
}
