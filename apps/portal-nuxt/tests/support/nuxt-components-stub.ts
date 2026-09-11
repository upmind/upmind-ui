import { defineComponent, h } from "vue";

/**
 * Stands in for Nuxt's build-time `#components` virtual module, which the
 * plain Vite config `tests/vitest.config.ts` runs under does not provide
 * (every app component avoids it via `resolveComponent` for exactly this
 * reason — see `PortalFrame.vue`, `BottomNavModule.vue`, `Menu.vue`).
 * `app/layouts/default.vue` is the one file that still imports `NuxtLink`
 * from it directly, so mounting the layout in a test needs this alias
 * (`tests/vitest.config.ts`'s `#components` entry) to resolve at all.
 */
export const NuxtLink = defineComponent({
  name: "NuxtLink",
  props: { to: { type: [String, Object], default: undefined } },
  setup(props, { slots }) {
    return () =>
      h(
        "a",
        { href: typeof props.to === "string" ? props.to : undefined },
        slots.default?.()
      );
  }
});
