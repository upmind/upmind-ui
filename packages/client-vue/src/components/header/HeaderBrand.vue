<template>
  <Link id="logo" :class="headerLinkVariants()" v-bind="props.storefrontRoute">
    <picture v-if="logo" :class="headerPictureVariants()">
      <slot name="logo" :logo="logo">
        <img
          v-if="logo"
          :src="logo"
          :class="headerImageVariants()"
          alt="logo"
        />
      </slot>
      <span class="sr-only">
        {{ name }}
      </span>
    </picture>
    <h3 v-else :class="headerNameVariants()">
      {{ name }}
    </h3>
  </Link>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useBrand } from "@upmind-automation/headless";
import { Link } from "@upmind/ui";
import {
  headerLinkVariants,
  headerPictureVariants,
  headerImageVariants,
  headerNameVariants
} from "./variants";
import type { StorefrontRoute } from "../../types";

const { name, image } = useBrand();

// -----------------------------------------------------------------------------
const props = defineProps<{
  logo?: string;
  storefrontRoute?: StorefrontRoute;
}>();

const logo = computed(
  () => props.logo ?? `${image.value?.full_url}?size=400x400`
);
</script>
