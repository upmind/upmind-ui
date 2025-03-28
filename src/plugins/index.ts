import { initializeLottie } from "../utils/useLottie";

// --- types
import type { App, Plugin } from "vue";

export const lottie: Plugin = {
  install: (app: App): void => {
    initializeLottie();
  },
};
