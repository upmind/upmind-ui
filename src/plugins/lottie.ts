import { defineElement } from "@lordicon/element";
import lottie from "lottie-web";
import type { App, Plugin } from "vue";
// -----------------------------------------------------------------------------

export default {
  install: (app: App): void => {
    defineElement(lottie.loadAnimation);
  }
} as Plugin;
