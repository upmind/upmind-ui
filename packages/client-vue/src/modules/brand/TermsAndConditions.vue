<template>
  <i18n-t
    class="mt-0"
    :class="props.class"
    keypath="text.terms_and_conditions_desc"
    tag="p"
    scope="global"
    v-bind="termsAndConditionsTestAttrs"
  >
    <template #brand>{{ brandName }}</template>

    <template #label>
      {{ t(label) }}
    </template>

    <template #action>
      <span v-if="meta.isEmpty">
        {{ t(action) }}
      </span>

      <Link
        v-else-if="meta.isUrl"
        :href="data!.url"
        target="_blank"
        color="inherit"
        size="inherit"
        >{{ t(action) }}</Link
      >

      <Link
        v-else
        @click="toggleOpen"
        :data-attrs="{ 'data-test-key': 'terms-link' }"
        color="inherit"
        size="inherit"
        >{{ t(action) }}</Link
      >
    </template>
  </i18n-t>

  <Drawer
    v-model:open="open"
    :dismissible="true"
    :title="t(action)"
    :ui="{ footer: 'flex-row items-center justify-between gap-x-4' }"
  >
    <Markdown
      :model-value="data?.content"
      class="prose w-full text-left text-base"
    />

    <template #footer>
      <Link @click="toggleOpen">{{ t(close) }}</Link>
    </template>
  </Drawer>
</template>

<script lang="ts" setup>
import { useTestAttrs } from "@upmind/ui";
import { Drawer } from "@upmind/ui";
import { Link, Markdown } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { useTermsAndConditions, useBrand } from "@upmind-automation/headless";
import type { TermsAndConditionsProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<TermsAndConditionsProps>(), {
  label: "action.continue_label",
  action: "text.terms_and_conditions",
  close: "action.close"
});

const open = defineModel<boolean>("open", {
  default: false
});

const { t } = useI18n();
const termsAndConditionsTestAttrs = useTestAttrs({
  key: "terms-and-conditions"
});
const { name: brandName } = useBrand();
const { meta, data } = useTermsAndConditions();

// --- methods
const toggleOpen = () => {
  open.value = !open.value;
};

// --- side effects
</script>
