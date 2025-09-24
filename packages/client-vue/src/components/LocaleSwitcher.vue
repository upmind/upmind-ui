<template>
  <Combobox
    v-if="meta.isAvailable || meta.isLoading"
    :modelValue="locale"
    :items="items"
    :loading="meta.isLoading"
    @update:modelValue="updateLocale"
    search
    width="fit"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useLocale } from "@upmind-automation/headless";

// --- components
import { Combobox } from "@upmind-automation/upmind-ui";

// --- utils
import { map, last, split } from "lodash-es";

// --- types
import type { ILanguage } from "../../../types/src";
import type { HTMLAttributes } from "vue";
import type { ComboboxItemProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

// props: {
//   popoverClass: { type: string, default: "mt-0" },
// }

const props = withDefaults(
  defineProps<{
    popoverClass?: HTMLAttributes["class"];
  }>(),
  {
    popoverClass: "mt-0"
  }
);

const { isReady, locale, setLocale, meta, supportedLanguages } = useLocale();

function updateLocale(value: ILanguage["code"]) {
  setLocale(value);
}

const items = computed(() => {
  return map(supportedLanguages.value, item => {
    return {
      avatar: {
        icon: last(split(item.code, "-"))?.toLowerCase()
      },
      label: item.language,
      selectedLabel: item.language,
      value: item.code,
      selected: item.code === locale.value
    };
  }) as ComboboxItemProps[];
});

await isReady();
</script>
