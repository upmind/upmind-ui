<template>
  <FormControl formItemId="domain-search" auto-focus>
    <Input
      v-model="inputValue"
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
            :class="{ hidden: isEmpty(inputValue) }"
            icon="delete"
            :disabled="processing"
            class="hidden md:block"
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
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../domain.config";

// --- components
import { Input, Button, Link, FormControl } from "@upmind-automation/upmind-ui";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";
import { isEmpty } from "lodash-es";

// --- types
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

const styles = useStyles(["domain.search"], {}, config);
</script>
