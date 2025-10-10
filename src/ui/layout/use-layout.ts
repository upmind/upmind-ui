import { ref } from "vue";
import type { LayoutProps } from "./types";

const layoutVariant = ref<LayoutProps["variant"]>("full");

export function useLayout() {
  return {
    variant: layoutVariant
  };
}

export function setLayoutVariant(variant: LayoutProps["variant"]) {
  layoutVariant.value = variant;
}
