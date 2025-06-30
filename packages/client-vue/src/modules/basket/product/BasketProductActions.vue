<template>
  <div class="flex items-baseline justify-between">
    <Link
      :label="open ? t('product.hideDetails') : t('product.showDetails')"
      size="sm"
      @click="$emit('update:open', !open)"
      :disabled="isEmpty(details)"
    >
      <template #append>
        <Icon
          icon="arrow-down"
          size="xs"
          class="transition-all duration-300"
          :class="{ 'rotate-180': open }"
        />
      </template>
    </Link>

    <div class="text-primary flex items-end space-x-2">
      <Tooltip
        v-for="action in actions"
        :key="action.icon"
        :label="action.tooltip"
      >
        <Button
          :color="action.color"
          variant="link"
          size="sm"
          class="h-auto !p-0 leading-none"
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
import { Icon, Button, Tooltip, Link } from "@upmind-automation/upmind-ui";

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
