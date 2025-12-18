<template>
  <div class="flex items-end justify-between">
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
      >
        <Link v-bind="action" size="sm" color="muted" :disabled="disabled" />
      </Tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { isEmpty } from "lodash-es";
import { useI18n } from "vue-i18n";

// --- components
import { Tooltip, Link } from "@upmind-automation/upmind-ui";

// --- types
import { type BasketProductActionsProps } from "./types";

const { t } = useI18n();

const props = defineProps<BasketProductActionsProps>();

const emits = defineEmits(["remove", "update:open"]);

const actions = computed(() => [
  {
    icon: "edit-02",
    tooltip: t("action.edit"),
    ...props.editRoute
  },
  {
    icon: "trash-01",
    tooltip: t("action.remove"),
    onClick: () => emits("remove")
  }
]);
</script>
