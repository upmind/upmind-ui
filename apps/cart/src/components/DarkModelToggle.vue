<template>
  <div class="flex items-center gap-4">
    <Select
      v-if="available.length > 1"
      :model-value="selected"
      class="w-28"
      size="sm"
      :items="available.map(variant => ({ label: variant, value: variant }))"
      @update:model-value="setTheme"
    />
    <Switch
      v-if="hasDarkMode"
      :checked="selected === 'dark'"
      @update:checked="toggleTheme"
    />
  </div>
</template>

<script lang="ts" setup>
import { Switch, Select } from "@upmind-automation/upmind-ui";
import { useTheme } from "@upmind-automation/client-vue";
import { intersection } from "lodash-es";
import { computed } from "vue";

const { selected, set: setTheme, available } = useTheme();

const toggleTheme = (checked: boolean) => {
  setTheme(checked ? "dark" : "default");
};

const hasDarkMode = computed(() => {
  return intersection(available.value, ["dark", "default"]).length === 2;
});
</script>
