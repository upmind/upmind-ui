<template>
  <header data-test-key="page-header" class="flex flex-wrap items-center gap-3">
    <Heading :level="1" class="mr-auto font-mono text-lg font-semibold">
      {{ name }}
    </Heading>

    <!-- The tooltip's own trigger is the wrapper, so the reason is still
         reachable over a control the pointer can no longer press (`R6-23`). -->
    <Tooltip
      v-for="action in actions"
      :key="action.name"
      :label="t('labs.replay_locked')"
      :active="!!locked"
    >
      <Button
        :variant="action.variant ?? 'primary'"
        size="sm"
        :disabled="action.disabled || locked"
        :loading="action.loading"
        :data-attrs="{ 'data-test-value': kebabCase(action.label) }"
        @click="action.onSelect"
      >
        <Icon
          v-if="action.icon"
          :icon="action.icon"
          size="nano"
          aria-hidden="true"
        />
        {{ action.label }}
        <span v-if="action.loading" role="status" class="sr-only">{{
          t("text.loading")
        }}</span>
      </Button>
    </Tooltip>
  </header>
</template>

<script lang="ts" setup>
import { Button, Heading, Tooltip } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/client-vue";
import { kebabCase } from "lodash-es";
import type { PageHeaderProps } from "./PageHeader.types";

defineProps<PageHeaderProps>();

const { t } = useI18n();
</script>
