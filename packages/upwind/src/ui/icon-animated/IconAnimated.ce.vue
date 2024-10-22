<template>
  <lord-icon :src="iconSrc" :trigger="trigger" class="h-10 w-10" />
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import type { AnimatedIconProps } from "./types";

const props = withDefaults(defineProps<AnimatedIconProps>(), {
  trigger: "loop",
  primaryColor: "primary",
  secondaryColor: "secondary",
});

const iconSrc = ref("");

watchEffect(async () => {
  const response = await fetch(
    new URL(`../../assets/animations/${props.icon}.json`, import.meta.url)
  );
  const jsonData = await response.json();

  await updateColor(jsonData, "primary", `text-${props.primaryColor}`);
  await updateColor(jsonData, "secondary", `text-${props.secondaryColor}`);

  const blob = new Blob([JSON.stringify(jsonData)], {
    type: "application/json",
  });
  iconSrc.value = URL.createObjectURL(blob);
});

async function updateColor(
  jsonData: any,
  colorType: string,
  colorClass: string
) {
  const color = await getComputedColor(colorClass);
  const rgbColor = hexToRgb(color);

  const layers = jsonData.layers;
  const controlLayer = layers.find((layer: any) => layer.nm === "control");
  if (controlLayer && controlLayer.ef) {
    const colorEffect = controlLayer.ef.find(
      (effect: any) => effect.nm === colorType
    );
    if (
      colorEffect &&
      colorEffect.ef &&
      colorEffect.ef[0] &&
      colorEffect.ef[0].v
    ) {
      colorEffect.ef[0].v.k = rgbColor;
    }
  }

  updateShapeLayers(jsonData.assets, colorType, rgbColor);
}

function updateShapeLayers(
  assets: any[],
  colorType: string,
  rgbColor: number[]
) {
  assets.forEach((asset: any) => {
    if (asset.layers) {
      asset.layers.forEach((layer: any) => {
        if (layer.shapes) {
          layer.shapes.forEach((shape: any) => {
            if (shape.it) {
              shape.it.forEach((item: any) => {
                if (item.ty === "st" && item.nm === `.${colorType}`) {
                  item.c.k = rgbColor;
                }
              });
            }
          });
        }
      });
    }
  });
}

function hexToRgb(hex: string): number[] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

async function getComputedColor(className: string): Promise<string> {
  const tempElement = document.createElement("div");
  tempElement.className = className;
  document.body.appendChild(tempElement);

  const computedStyle = window.getComputedStyle(tempElement);
  const color = computedStyle.color;

  document.body.removeChild(tempElement);

  const rgb = color.match(/\d+/g);
  if (rgb) {
    return `#${parseInt(rgb[0]).toString(16).padStart(2, "0")}${parseInt(rgb[1]).toString(16).padStart(2, "0")}${parseInt(rgb[2]).toString(16).padStart(2, "0")}`;
  }

  return "#ffffff";
}
</script>
