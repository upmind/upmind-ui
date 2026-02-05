import { defineElement } from "@lordicon/element";
import lottie from "lottie-web";
import type { App, Plugin } from "vue";
// -----------------------------------------------------------------------------

export default {
  install: (_app: App): void => {
    defineElement(lottie.loadAnimation);
  }
} as Plugin;
