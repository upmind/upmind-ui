<template>
  <Loading :active="meta.isLoading" class-active="w-full rounded-lg">
    <i18n-t
      class="mt-0"
      keypath="brand.termsAndConditions.terms"
      tag="p"
      scope="global"
      data-testid="terms-and-conditions"
    >
      <template #brand>{{ brandName }}</template>

      <template #label>
        {{ t(label) }}
      </template>

      <template #action>
        <span v-if="meta.isEmpty">
          {{ t(action) }}
        </span>

        <Button
          v-else-if="meta.isUrl"
          :href="data!.url"
          target="_blank"
          class="font-normal text-inherit"
          variant="link"
          :label="t(action)"
        />

        <Button
          v-else
          @click="toggleOpen"
          class="font-normal text-inherit"
          data-testid="terms-link"
          variant="link"
          :label="t(action)"
        />
      </template>
    </i18n-t>

    <Drawer
      v-model:open="open"
      dismissible
      to="#vue-app"
      size="3xl"
      fit="cover"
      class="bg-white"
      class-footer="flex-row items-center justify-between gap-x-4"
      :title="t(action)"
    >
      <Markdown :model-value="data?.content" class="prose w-full text-left" />

      <template #close>
        <Button
          @click="toggleOpen"
          :label="t(close)"
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
  Button
} from "@upmind-automation/upmind-ui";

// --- types
import type { TermsAndConditionsProps } from "./types";

// -----------------------------------------------------------------------------

withDefaults(defineProps<TermsAndConditionsProps>(), {
  label: "brand.termsAndConditions.label",
  action: "brand.termsAndConditions.action",
  close: "brand.termsAndConditions.close"
});

const open = defineModel<boolean>("open", {
  default: false
});

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
