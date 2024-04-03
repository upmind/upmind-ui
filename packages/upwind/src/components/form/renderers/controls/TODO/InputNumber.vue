<script setup lang="ts"></script>

<template>
  <div
    class="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-slate-900"
    data-hs-input-number
  >
    <div class="flex w-full items-center justify-between gap-x-5">
      <div class="grow">
        <span class="block text-xs text-gray-500 dark:text-gray-400">
          Select quantity
        </span>
        <input
          class="w-full border-0 bg-transparent p-0 text-gray-800 focus:ring-0 dark:text-white"
          type="text"
          defaultValue="1"
          data-hs-input-number-input
        />
      </div>
      <div class="flex items-center justify-end gap-x-1.5">
        <button
          type="button"
          class="inline-flex h-6 w-6 items-center justify-center gap-x-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:hover:bg-gray-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
          data-hs-input-number-decrement
        >
          <svg
            class="h-3.5 w-3.5 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          class="inline-flex h-6 w-6 items-center justify-center gap-x-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:hover:bg-gray-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
          data-hs-input-number-increment
        >
          <svg
            class="h-3.5 w-3.5 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
