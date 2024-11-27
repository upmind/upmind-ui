<template>
  <!-- Button and icons have built in spacing which we are counteracting with minus margin -->
  <div class="-mb-2 mt-4 flex items-baseline justify-between">
    <Button
      :label="t('product.showDetails')"
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
        variant="link"
        size="sm"
        class="h-auto !p-0 leading-none"
        @click="action.onClick"
        :disabled="disabled"
      >
        <Icon :icon="action.icon" class="h-5 w-5" />
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- internal
import { useBasketProduct } from "@upmind-automation/client-vue";

// --- external
import { computed } from "vue";
import { isEmpty } from "lodash-es";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

// --- components
import { Icon, Button } from "@upmind-automation/upwind";

const router = useRouter();

const { t } = useI18n();

const props = defineProps<{
  id: string;
  open: boolean;
  details: any[];
  disabled: boolean;
}>();

const { remove } = useBasketProduct(props.id);

const editLink = computed(() => {
  return {
    name: "productEdit",
    params: {
      bpid: props.id,
    },
  };
});

const actions = computed(() => [
  {
    icon: "pencil",
    onClick: () => router.push(editLink.value),
  },
  {
    icon: "bin",
    onClick: remove,
  },
]);

defineEmits<{
  (e: "update:open", value: boolean): void;
}>();
</script>
