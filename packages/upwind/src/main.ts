// --- eternal
import { defineCustomElement } from "vue";

// --- components
const components = import.meta.glob("./**/*.ce.*", {
  eager: true,
  import: "default",
});
console.log("components", components);

// --- utils
export { useStyles, mergeStyles, useThemes, useScrollSpy } from "./utils";
import { forEach, set, reduce } from "lodash-es";

// -----------------------------------------------------------------------------
// export individual elements
export const CustomElements = reduce(
  components,
  (result, definition, path) => {
    // Get name of component, based on filename
    // "./components/Fruits.vue" will become "Fruits"
    const componentName =
      definition?.name ||
      path
        ?.split("/")
        ?.pop()
        ?.replace(/\.\w+$/, "");

    // Register component on this Vue instance
    const component = defineCustomElement(definition);

    console.log("custom element", componentName, { definition });

    set(result, componentName, component);
    return result;
  },
  {}
);

export function register() {
  forEach(CustomElements, (component, name) => {
    customElements.define(name, component);
  });
}

// register global typings
declare module "vue" {
  export interface GlobalComponents {
    // Counter: typeof Counter;
  }
}
