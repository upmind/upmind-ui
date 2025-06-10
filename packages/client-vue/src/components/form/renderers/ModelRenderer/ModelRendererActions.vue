<template>
  <footer class="flex flex-col gap-2 md:flex-row md:justify-start">
    <Button
      label="Save Details"
      color="secondary"
      :disabled="disabled || loading"
      @click="$emit('save')"
    />
    <Button
      label="Cancel"
      variant="ghost"
      :disabled="loading"
      @click="$emit('cancel')"
    />
  </footer>
</template>

<script setup lang="ts">
import { Button, Link } from "@upmind-automation/upmind-ui";

defineProps<{
  disabled: boolean;
  loading: boolean;
}>();

defineEmits<{
  save: [];
  cancel: [];
}>();
</script>
