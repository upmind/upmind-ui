<template>
  <div class="flex items-baseline justify-between">
    <Button
      :label="open ? t('product.hideDetails') : t('product.showDetails')"
      size="sm"
      variant="link"
      color="muted"
      @click="$emit('update:open', !open)"
      :disabled="isEmpty(details)"
      :checked="open"
    />

    <div class="text-foreground flex items-end space-x-2">
      <Tooltip
        v-for="action in actions"
        :key="action.icon"
        :label="action.tooltip"
      >
        <Button
          :color="action.color"
          variant="link"
          size="lg"
          class="text-emphasis-medium hover:text-emphasis-none h-auto p-0! leading-none"
          @click="action.onClick"
          :disabled="disabled"
        >
          <Icon :icon="action.icon" :color="action.color" class="h-5 w-5" />
        </Button>
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
import { Icon, Button, Tooltip } from "@upmind-automation/upmind-ui";

// --- types
import { type BasketProductActionsProps } from "./types";

const router = useRouter();

const { t } = useI18n();

const props = defineProps<BasketProductActionsProps>();

const emits = defineEmits(["remove", "update:open"]);

const actions = computed(() => [
  {
    icon: "pencil",
    color: props.color,
    tooltip: t("product.edit"),
    onClick: () => router.push(props.editLink)
  },
  {
    icon: "bin",
    color: props.color,
    tooltip: t("product.remove"),
    onClick: () => emits("remove")
  }
]);
</script>
