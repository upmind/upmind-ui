<script setup lang="ts">
defineProps<{
  groupId: string;
}>();
</script>

<template>
  <div class="mb-3 flex justify-end">
    <div
      :id="groupId"
      class="inline-block rounded-lg bg-gray-100 p-0.5 dark:bg-gray-700"
    >
      <label
        :for="`${groupId}-monthly`"
        class="relative inline-block px-3 py-2"
      >
        <span
          class="relative z-10 inline-block cursor-pointer text-sm font-medium text-gray-800 dark:text-gray-200"
        >
          Monthly
        </span>
        <input
          :id="`${groupId}-monthly`"
          :name="groupId"
          type="radio"
          class="absolute end-0 top-0 h-full w-full cursor-pointer rounded-lg border-transparent bg-transparent bg-none text-transparent before:absolute before:inset-0 before:h-full before:w-full before:rounded-lg checked:bg-none checked:before:bg-white checked:before:shadow-sm focus:ring-transparent focus:ring-offset-0 dark:checked:before:bg-gray-800 dark:focus:ring-offset-transparent"
        />
      </label>
      <label :for="`${groupId}-annual`" class="relative inline-block px-3 py-2">
        <span
          class="relative z-10 inline-block cursor-pointer text-sm font-medium text-gray-800 dark:text-gray-200"
        >
          Annual
        </span>
        <input
          :id="`${groupId}-annual`"
          :name="groupId"
          type="radio"
          class="absolute end-0 top-0 h-full w-full cursor-pointer rounded-lg border-transparent bg-transparent bg-none text-transparent before:absolute before:inset-0 before:h-full before:w-full before:rounded-lg checked:bg-none checked:before:bg-white checked:before:shadow-sm focus:ring-transparent focus:ring-offset-0 dark:checked:before:bg-gray-800 dark:focus:ring-offset-transparent"
          checked
        />
      </label>
    </div>
  </div>

  <div
    class="grid grid-cols-3 rounded-xl border border-gray-200 lg:items-center dark:border-gray-700"
  >
    <div class="flex flex-col p-4">
      <h4 class="mb-1 text-gray-800 dark:text-gray-200">Startup</h4>
      <div class="flex gap-x-1">
        <span class="text-xl font-normal text-gray-800 dark:text-gray-200"
          >$</span
        >
        <p
          :data-hs-toggle-count="`{
            &quot;target&quot;: &quot;#${groupId}&quot;,
            &quot;min&quot;: 19,
            &quot;max&quot;: 29
          }`"
          class="text-3xl font-semibold text-gray-800 dark:text-gray-200"
        >
          19
        </p>
      </div>
    </div>

    <div class="flex flex-col p-4">
      <div class="flex justify-between">
        <h4 class="mb-1 text-gray-800 dark:text-gray-200">Team</h4>
      </div>
      <div class="flex gap-x-1">
        <span class="text-xl font-normal text-gray-800 dark:text-gray-200"
          >$</span
        >
        <p
          :data-hs-toggle-count="`{
            &quot;target&quot;: &quot;#${groupId}&quot;,
            &quot;min&quot;: 89,
            &quot;max&quot;: 99
          }`"
          class="text-3xl font-semibold text-gray-800 dark:text-gray-200"
        >
          89
        </p>
      </div>
    </div>

    <div class="flex flex-col p-4">
      <h4 class="mb-1 text-gray-800 dark:text-gray-200">Enterprise</h4>
      <div class="flex gap-x-1">
        <span class="text-xl font-normal text-gray-800 dark:text-gray-200"
          >$</span
        >
        <p
          :data-hs-toggle-count="`{
            &quot;target&quot;: &quot;#${groupId}&quot;,
            &quot;min&quot;: 129,
            &quot;max&quot;: 149
          }`"
          class="text-3xl font-semibold text-gray-800 dark:text-gray-200"
        >
          129
        </p>
      </div>
    </div>
  </div>
</template>
