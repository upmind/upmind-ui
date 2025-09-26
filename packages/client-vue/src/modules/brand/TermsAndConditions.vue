<template>
  <i18n-t
    class="mt-0"
    :class="props.class"
    keypath="text.terms_and_conditions_desc"
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
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useTermsAndConditions, useBrand } from "@upmind-automation/headless";

// --- components
import { Drawer, Markdown, Button } from "@upmind-automation/upmind-ui";

// --- types
import type { TermsAndConditionsProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<TermsAndConditionsProps>(), {
  label: "action.continue_label",
  action: "text.terms_and_conditions_link",
  close: "action.close"
});

const open = defineModel<boolean>("open", {
  default: false
});

const { t } = useI18n();
const { name: brandName } = useBrand();
const { meta, data } = useTermsAndConditions();

// --- methods
const toggleOpen = () => {
  open.value = !open.value;
};

// --- side effects
</script>
