<template>
  <Loading :active="meta.isLoading" class-active="w-full rounded-lg">
    <i18n-t
      class="mt-0"
      keypath="brand.termsAndConditions.terms"
      tag="p"
      scope="global"
    >
      <template #brand>{{ brandName }}</template>

      <template #action>
        <span v-if="meta.isEmpty">
          {{ t("brand.termsAndConditions.action") }}
        </span>

        <Link
          v-else-if="meta.isUrl"
          :href="data.url"
          target="_blank"
          class="font-normal text-inherit"
        >
          {{ t("brand.termsAndConditions.action") }}
        </Link>

        <Link v-else @click="toggleOpen" class="font-normal text-inherit">
          {{ t("brand.termsAndConditions.action") }}
        </Link>
      </template>
    </i18n-t>

    <Drawer
      v-model:open="open"
      dismissible
      to="#vue-app"
      size="3xl"
      fit="cover"
      skrim="primary"
      class="bg-white"
      class-footer="flex-row items-center justify-between gap-x-4"
      :title="t('brand.termsAndConditions.action')"
    >
      <Markdown :model-value="data.content" class="prose w-full text-left" />

      <template #close>
        <Button
          @click="toggleOpen"
          :label="t('brand.termsAndConditions.close')"
          variant="link"
          color="base"
        />
      </template>
    </Drawer>
  </Loading>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useTermsAndConditions, useBrand } from "@upmind-automation/headless";

// --- components
import {
  Drawer,
  Loading,
  Markdown,
  Link,
  Button,
  Icon
} from "@upmind-automation/upmind-ui";

// --- utils

// --- types

// -----------------------------------------------------------------------------
const open = defineModel<boolean>("open", {
  default: false
});

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { name: brandName, isReady } = useBrand();
const { meta, data } = useTermsAndConditions();

// --- methods
const toggleOpen = () => {
  open.value = !open.value;
};

// --- side effects
await isReady();
</script>
