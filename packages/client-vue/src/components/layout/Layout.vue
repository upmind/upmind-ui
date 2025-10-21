<template>
  <Layout>
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

    <template #footer>
      <slot name="footer">
        <FooterContent />
      </slot>
    </template>

    <template #footer-aside>
      <slot name="footer-aside">
        <FooterCopyright />
      </slot>
    </template>
  </Layout>
</template>

<script setup lang="ts">
import { Layout } from "@upmind-automation/upmind-ui";
import HeaderBrand from "../header/HeaderBrand.vue";
import HeaderActions from "../header/HeaderActions.vue";
import FooterContent from "../footer/Content.vue";
import FooterCopyright from "../footer/Copyright.vue";
</script>
