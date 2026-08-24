<template>
  <Root :class="surfaceBoxRootVariants()">
    <div :class="surfaceBoxContainerVariants()">
      <component
        :is="card ? 'article' : CardRoot"
        :class="[surfaceBoxCardVariants(), { 'p-8 lg:p-18': !card }]"
      >
        <!-- Content Header -->
        <section :class="surfaceBoxContentHeaderVariants()">
          <slot name="controls" />
          <slot name="navigation" />
          <slot name="actions" />
          <slot name="content-header" />
          <slot name="aside" />
          <slot name="aside-footer" />
        </section>

        <!-- Content -->
        <component
          :is="card ? 'div' : 'section'"
          :class="surfaceBoxContentVariants()"
        >
          <slot name="content" />
          <slot name="default" />
        </component>
      </component>
    </div>
  </Root>
</template>

<script lang="ts" setup>
import { CardRoot } from "@upmind/ui";
import { useSection } from "../../section/useSection";
import Root from "../components/root/Root.vue";
import {
  surfaceBoxRootVariants,
  surfaceBoxContainerVariants,
  surfaceBoxCardVariants,
  surfaceBoxContentHeaderVariants,
  surfaceBoxContentVariants
} from "../variants";
import type { VariantProps } from "../types";

// --- components

defineProps<VariantProps>();

const { card } = useSection();
</script>
