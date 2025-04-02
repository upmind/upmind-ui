import lottie from "lottie-web";
import { defineElement } from "@lordicon/element";

import type { App, Plugin } from "vue";
// -----------------------------------------------------------------------------

export default {
  install: (app: App): void => {
    defineElement(lottie.loadAnimation);
  },
} as Plugin;
