<template>
  <div :class="styles.products.skeleton.root">
    <div :class="styles.products.skeleton.content">
      <Skeleton :class="styles.products.skeleton.image">
        Product Image
      </Skeleton>

      <div :class="styles.products.skeleton.details">
        <div :class="styles.products.skeleton.titleContainer">
          <Skeleton :class="styles.products.skeleton.titleLine1"
            >Product Title</Skeleton
          >
        </div>

        <div :class="styles.products.skeleton.priceContainer">
          <Skeleton :class="styles.products.skeleton.cycle"
            >Billing cycle</Skeleton
          >
        </div>

        <div :class="styles.products.skeleton.descriptionContainer">
          <Skeleton :class="styles.products.skeleton.descriptionLine1"
            >Description line 1</Skeleton
          >
          <Skeleton :class="styles.products.skeleton.descriptionLine2"
            >Description line 2</Skeleton
          >
          <Skeleton :class="styles.products.skeleton.descriptionLine3"
            >Description line 3</Skeleton
          >
        </div>

        <div :class="styles.products.skeleton.buttonContainer">
          <Skeleton :class="styles.products.skeleton.button">
            Add to basket button
          </Skeleton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// --- components
import { Skeleton, useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "../../catalogue.config";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const styles = useStyles(
  ["products", "products.skeleton"],
  {},
  config
) as ComputedRef<{
  products: {
    skeleton: {
      root: string;
      content: string;
      image: string;
      details: string;
      titleContainer: string;
      titleLine1: string;
      titleLine2: string;
      priceContainer: string;
      price: string;
      cycle: string;
      descriptionContainer: string;
      descriptionLine1: string;
      descriptionLine2: string;
      descriptionLine3: string;
      buttonContainer: string;
      button: string;
    };
  };
}>;
</script>
