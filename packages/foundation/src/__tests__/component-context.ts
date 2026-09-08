/**
 * @fileoverview Test scaffolding — run a read inside a child of a provider.
 *
 * Vue resolves `inject` against the PARENT chain, so a component never sees its
 * own `provide`. Foundation's provider doors (`provideThemeEngine`,
 * `provideFormRenderers`) therefore need two components to be exercised at all.
 */

import { createApp, defineComponent, h } from "vue";

export function readInChildOfProvider<T>(
  provide: () => void,
  read: () => T
): T {
  const captured: T[] = [];

  const Child = defineComponent({
    setup() {
      captured.push(read());
      return () => null;
    }
  });

  const app = createApp(
    defineComponent({
      setup() {
        provide();
        return () => h(Child);
      }
    })
  );

  app.mount(document.createElement("div"));
  app.unmount();

  return captured[0];
}
