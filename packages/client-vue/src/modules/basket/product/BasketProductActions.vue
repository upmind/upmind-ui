<template>
  <div class="flex items-baseline justify-between">
    <Link
      :label="open ? t('action.hide_details') : t('action.show_details')"
      size="sm"
      color="muted"
      @click="$emit('update:open', !open)"
      :disabled="isEmpty(details)"
      :checked="open"
    />

    <div class="flex items-end space-x-2 text-base">
      <Tooltip
        v-for="action in actions"
        :key="action.icon"
        :label="action.tooltip"
        color="neutral"
      >
        <Link
          size="sm"
          color="muted"
          @click="action.onClick"
          :disabled="disabled"
        >
          <Icon :icon="action.icon" class="h-5 w-5" />
        </Link>
      </Tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { isEmpty } from "lodash-es";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

// --- components
import { Icon, Button, Tooltip, Link } from "@upmind-automation/upmind-ui";

// --- types
import { type BasketProductActionsProps } from "./types";

const router = useRouter();

const { t } = useI18n();

const props = defineProps<BasketProductActionsProps>();

const emits = defineEmits(["remove", "update:open"]);

const actions = computed(() => [
  {
    icon: "edit-02",
    tooltip: t("action.edit"),
    onClick: () => router.push(props.editLink)
  },
  {
    icon: "trash-01",
    tooltip: t("action.remove"),
    onClick: () => emits("remove")
  }
]);
</script>
