/**
 * @fileoverview Runs a read in a child of a provider: `inject` never sees its own `provide`.
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
