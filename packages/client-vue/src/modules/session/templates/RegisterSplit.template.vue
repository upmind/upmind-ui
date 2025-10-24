<template>
  <Layout :variant="LAYOUT_VARIANTS.SPLIT">
    <template #content-header>
      <div class="flex h-full flex-col justify-between">
        <HeaderBrand class="pb-12" />
        <RegisterHeader />
      </div>
    </template>

    <template #content>
      <RegisterForm />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import Layout from "../../../components/layout/Layout.vue";
import RegisterHeader from "../components/RegisterHeader.vue";
import RegisterForm from "../components/RegisterForm.vue";
import HeaderBrand from "../../../components/header/HeaderBrand.vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";

// --- types
import { FOOTER_TEMPLATE } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_TEMPLATE } from "../../../components/header/types";

// --- methods
const { setTemplate } = useFooter();
setTemplate(FOOTER_TEMPLATE.SPLIT);

const { setTemplate: setHeaderTemplate } = useHeader();
setHeaderTemplate(HEADER_TEMPLATE.SPLIT);
</script>
