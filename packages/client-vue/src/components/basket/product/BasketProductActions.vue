<template>
  <!-- Button and icons have built in spacing which we are counteracting with minus margin -->
  <div class="-mb-2 mt-4 flex items-baseline justify-between">
    <Button
      :label="t('product.showDetails')"
      :color="color"
      variant="link"
      size="sm"
      class="h-auto !p-0 leading-none"
      @click="$emit('update:open', !open)"
      :disabled="isEmpty(details)"
    >
      <template #append>
        <Icon
          icon="arrow-down"
          size="xs"
          class="-ml-1 mt-0.5 transition-all duration-300"
          :class="{ 'rotate-180': open }"
        />
      </template>
    </Button>

    <div class="text-primary flex items-end space-x-2">
      <Button
        v-for="action in actions"
        :key="action.icon"
        :color="action.color"
        variant="link"
        size="sm"
        class="h-auto !p-0 leading-none"
        @click="action.onClick"
        :disabled="disabled"
      >
        <Icon :icon="action.icon" :color="action.color" class="h-5 w-5" />
      </Button>
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
import { Icon, Button } from "@upmind-automation/upwind";

// --- types
import { type BasketProductActionsProps } from "./types";

const router = useRouter();

const { t } = useI18n();

const props = defineProps<BasketProductActionsProps>();

const editLink = computed(() => {
  return {
    name: "productEdit",
    params: {
      bpid: props.id,
    },
  };
});

const emits = defineEmits(["remove", "update:open"]);

const actions = computed(() => [
  {
    icon: "pencil",
    color: props.color,
    onClick: () => router.push(editLink.value),
  },
  {
    icon: "bin",
    color: props.color,
    onClick: () => emits("remove"),
  },
]);
</script>
