<template>
  <!-- Button and icons have built in spacing which we are counteracting with minus margin -->
  <div class="-mb-2 mt-4 flex items-baseline justify-between">
    <Button
      :label="detailsButtonLabel"
      variant="link"
      size="sm"
      class="h-auto !p-0 leading-none"
      @click="$emit('update:isOpen', !isOpen)"
      :disabled="isEmpty(details)"
    >
      <template #append>
        <Icon
          icon="arrow-down"
          size="xs"
          class="-ml-1 mt-0.5 transition-all duration-300"
          :class="{ 'rotate-180': isOpen }"
        />
      </template>
    </Button>

    <div class="text-primary flex items-end space-x-2">
      <Button
        variant="link"
        size="sm"
        class="h-auto !p-0 leading-none"
        @click="router.push(editLink)"
        :disabled="isDisabled"
      >
        <Icon icon="pencil" class="h-5 w-5" />
      </Button>
      <Button
        variant="link"
        size="sm"
        class="h-auto !p-0 leading-none"
        @click="remove"
        :disabled="isDisabled"
      >
        <Icon icon="bin" class="h-5 w-5" />
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { isEmpty } from "lodash-es";
import { useRouter } from "vue-router";

// --- components
import { Icon, Button } from "@upmind-automation/upwind";

const router = useRouter();

const props = defineProps<{
  id: string;
  isOpen: boolean;
  details: any[];
  isDisabled: boolean;
  detailsButtonLabel?: string;
  remove: () => void;
}>();

const editLink = computed(() => {
  return {
    name: "productEdit",
    params: {
      bpid: props.id,
    },
  };
});

defineEmits<{
  (e: "update:isOpen", value: boolean): void;
}>();
</script>
