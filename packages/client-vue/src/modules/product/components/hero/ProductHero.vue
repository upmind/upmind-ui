<template>
  <section :class="styles.header.root">
    <div :class="styles.header.details" ref="detailsRef">
      <slot name="prepend" />

      <hgroup>
        <div :class="styles.header.title.root">
          <h1 :class="styles.header.title.text">
            {{ meta.data.productName || props.productDetails.title }}
          </h1>
          <div
            v-if="meta.ui.productBadge.isVisible && meta.data.productBadge"
            :class="styles.header.title.badge"
          >
            <Badge
              v-bind="
                isString(meta.data.productBadge)
                  ? { label: meta.data.productBadge }
                  : meta.data.productBadge
              "
              class="shrink-0"
              variant="minimal"
              color="neutral"
            />
          </div>
        </div>

        <DisplayPrice
          v-if="
            meta.ui.productAnchorPrice.isVisible &&
            props.productDetails?.displayPrice
          "
          v-bind="props.productDetails.displayPrice"
          :class="styles.header.price"
        />
      </hgroup>

      <ProductDescription
        v-if="
          productDetails?.description && meta.ui.productDescription.isVisible
        "
        :class="styles.header.description"
        :description="productDetails?.description"
        :lineclamp="meta.ui.productDescription.isClamped"
        :lines="toNumber(meta.ui.productDescriptionClamp?.value)"
      />

      <p
        v-if="productDetails?.excerpt && meta.ui.productExcerpt.isVisible"
        :class="styles.header.description"
      >
        {{ productDetails?.excerpt }}
      </p>

      <slot name="append" />
    </div>

    <aside
      v-if="stylesMeta.hasImage"
      :class="styles.header.aside"
      :style="{ '--details-h': `${height}px` }"
    >
      <ProductImage
        :class="styles.header.image"
        :product-details="props.productDetails"
        :images="props.productDetails?.images"
        :fallback="meta.ui.productImageFallback.isVisible"
      />
    </aside>
  </section>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
import { useElementSize } from "@vueuse/core";

// --- components
import DisplayPrice from "../terms/DisplayPrice.vue";
import ProductDescription from "../card/ProductDescription.vue";
import ProductImage from "./ProductImage.vue";
import { useStyles, Badge } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./product-hero.config";

// --- utils
import { isEmpty, isString, toNumber } from "lodash-es";

// --- types
import type { ProductHeaderProps } from "./types";
import type { ImageItem } from "@upmind-automation/upmind-ui";
import type { ComputedRef } from "vue";
import type { ImageProps } from "@upmind-automation/upmind-ui";

const props = withDefaults(defineProps<ProductHeaderProps>(), {
  direction: "horizontal",
  image: true
});

const stylesMeta = computed(() => ({
  direction: props.direction,
  hasImage:
    !!(props.productDetails?.imgUrl || !isEmpty(images.value)) && props.image
}));

const styles = useStyles(["header", "header.title"], stylesMeta, config);

const images = computed(() => {
  return props.productDetails?.images?.map(image => ({
    url: image.url,
    alt: props.productDetails?.title
  })) as ImageItem[];
});

const detailsRef = ref<HTMLElement | null>(null);
const { height } = useElementSize(detailsRef);
</script>
