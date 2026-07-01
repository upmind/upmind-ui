<template>
  <FormControl formItemId="domain-search" auto-focus>
    <Input
      v-model="inputValue"
      id="domain-search-input"
      :placeholder="
        isMobile ? t('domain.search') : t('form.domain_search.placeholder')
      "
      autocomplete="url"
      icon="search-refraction"
      :disabled="processing"
      :class="styles.domain.search.root"
      :ui-config="{ input: { field: [styles.domain.search.field] } }"
      :mask="/^.{0,63}$/"
    >
      <template #append>
        <span :class="styles.domain.search.actions">
          <Link
            size="lg"
            color="muted"
            @click="emit('reset')"
            :class="styles.domain.search.clear"
            icon="delete"
            :disabled="processing"
          />
          <Button
            :disabled="isEmpty(inputValue) || processing"
            :loading="meta.isSearching"
            size="lg"
            variant="subtle"
            icon-append="arrow-right"
            :label="isMobile ? '' : t('domain.search')"
          />
        </span>
      </template>
    </Input>
  </FormControl>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useStyles } from "@upmind-automation/upmind-ui";
import { Input, Button, Link, FormControl } from "@upmind-automation/upmind-ui";
import { isMobile } from "@upmind-automation/upmind-ui";
import config from "../domain.config";
import { isEmpty } from "lodash-es";
import type { DomainSlotProps } from "../types";

// ----------------------------------------------------------------------------

const props = defineProps<DomainSlotProps>();

const emit = defineEmits<{
  (e: "search", query: string): void;
  (e: "reset"): void;
}>();

// ----------------------------------------------------------------------------

const { t } = useI18n();

const meta = computed(() => ({
  isSearching: props.searching
}));

const inputValue = defineModel<string>("modelValue");

const stylesMeta = computed(() => ({
  isEmpty: isEmpty(inputValue.value)
}));

const styles = useStyles(["domain.search"], stylesMeta, config);
</script>
