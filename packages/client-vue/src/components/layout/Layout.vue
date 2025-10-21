<template>
  <Layout v-bind="props">
    <template
      v-for="(slotContent, slotName) in $slots"
      #[slotName]="slotProps"
      :key="slotName"
    >
      <slot :name="slotName" v-bind="slotProps || {}" />
    </template>

    <template #header-left>
      <slot name="header-left">
        <HeaderBrand />
      </slot>
    </template>

    <template #header-right>
      <slot name="header-right">
        <HeaderActions />
      </slot>
    </template>

    <template #footer-content>
      <slot name="footer-content">
        <FooterContent />
      </slot>
    </template>

    <template #footer-actions>
      <slot name="footer-actions">
        <FooterActions :locale="locale" :currency="currency" />
      </slot>
    </template>

    <template #footer-copyright>
      <slot name="footer-copyright">
        <FooterCopyright />
      </slot>
    </template>
  </Layout>
</template>

<script setup lang="ts">
// --- external
import { defineProps } from "vue";

// --- components
import { Layout } from "@upmind-automation/upmind-ui";
import HeaderBrand from "../header/HeaderBrand.vue";
import HeaderActions from "../header/HeaderActions.vue";
import FooterContent from "../footer/Content.vue";
import FooterActions from "../footer/Actions.vue";
import FooterCopyright from "../footer/Copyright.vue";

// --- types
import type { LayoutProps } from "@upmind-automation/upmind-ui";

const props = withDefaults(
  defineProps<
    LayoutProps & {
      currency?: boolean;
      locale?: boolean;
    }
  >(),
  {
    currency: true,
    locale: true
  }
);
</script>
