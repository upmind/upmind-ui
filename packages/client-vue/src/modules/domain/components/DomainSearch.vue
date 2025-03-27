<template>
  <InputExtended
    v-model="inputValue"
    :placeholder="t('domain.dac.search')"
    autocomplete="url"
    inputSize="lg"
    :class="styles.domain.search.root"
  >
    <template #prepend>
      <span :class="styles.domain.search.icon">
        <Icon
          :icon="type === 'existing' ? 'network-settings' : 'search'"
          size="xs"
        />
      </span>
    </template>

    <template #append>
      <span
        :class="[
          styles.domain.search.actions,
          { 'select-none opacity-0': type === 'existing' },
        ]"
      >
        <Button
          variant="link"
          size="xs"
          @click="inputValue = ''"
          :class="{ hidden: isEmpty(inputValue) }"
        >
          <Icon icon="clear" color="primary" size="xs" />
        </Button>
        <Button
          :disabled="isEmpty(inputValue)"
          :loading="isLoading"
          size="md"
          :class="styles.domain.search.action"
          @click="emit('search', inputValue)"
        >
          <span class="hidden md:block">{{ t("domain.search") }}</span>
          <Icon icon="search" size="xs" class="md:hidden" />
        </Button>
      </span>
    </template>
  </InputExtended>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";
import { watch, computed } from "vue";
import { isEmpty } from "lodash-es";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../domain.config";

// --- components
import { InputExtended, Icon, Button } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { DomainSearchProps } from "../types";

const props = withDefaults(defineProps<DomainSearchProps>(), {
  modelValue: "",
  isLoading: false,
  type: "register",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "search", query: string): void;
}>();

const { t } = useI18n();

const inputValue = useVModel(props, "modelValue", emit);

const styles = useStyles(["domain.search"], {}, config) as ComputedRef<{
  domain: {
    search: {
      root: string;
      icon: string;
      actions: string;
      action: string;
    };
  };
}>;

watch(inputValue, value => {
  emit("search", value?.toString() || "");
});
</script>
