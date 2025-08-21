<template>
  <Input
    v-model="inputValue"
    :placeholder="t('domain.dac.search')"
    autocomplete="url"
    :icon="type === 'existing' ? 'network-settings' : 'search'"
  >
    <template #append>
      <span
        :class="[
          styles.domain.search.actions,
          { 'opacity-0 select-none': type === 'existing' }
        ]"
      >
        <Button
          variant="link"
          size="lg"
          @click="inputValue = ''"
          :class="{ hidden: isEmpty(inputValue) }"
          icon="clear"
        />
        <Button
          :disabled="isEmpty(inputValue)"
          :loading="isLoading"
          size="lg"
          color="secondary"
          @click="emit('search', inputValue)"
        >
          <span class="hidden md:block">{{ t("domain.search") }}</span>
          <Icon icon="search" size="xs" class="md:hidden" />
        </Button>
      </span>
    </template>
  </Input>
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
import { Input, Icon, Button } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { DomainSearchProps } from "../types";

const props = withDefaults(defineProps<DomainSearchProps>(), {
  modelValue: "",
  isLoading: false,
  type: "register"
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
