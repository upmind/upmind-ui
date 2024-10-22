import lottie from "lottie-web";
import { defineElement } from "@lordicon/element";

export function initializeLottie() {
  defineElement(lottie.loadAnimation);
}
