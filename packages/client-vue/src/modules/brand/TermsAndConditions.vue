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
        :label="t(action)"
        color="inherit"
        size="inherit"
      />

      <Link
        v-else
        @click="toggleOpen"
        :dataAttrs="{ 'data-test-key': 'terms-link' }"
        :label="t(action)"
        color="inherit"
        size="inherit"
      />
    </template>
  </i18n-t>

  <Drawer
    v-model:open="open"
    dismissible
    size="lg"
    fit="cover"
    class-footer="flex-row items-center justify-between gap-x-4"
    :title="t(action)"
  >
    <Markdown
      :model-value="data?.content"
      class="prose w-full text-left text-base"
    />

    <template #close>
      <Link @click="toggleOpen" :label="t(close)" />
    </template>
  </Drawer>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useTermsAndConditions, useBrand } from "@upmind-automation/headless";
import {
  Drawer,
  Markdown,
  Link,
  useTestAttrs
} from "@upmind-automation/upmind-ui";
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
