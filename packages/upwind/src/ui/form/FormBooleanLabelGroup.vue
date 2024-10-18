<template>
  <span class="flex w-full flex-row flex-nowrap items-center justify-between">
    <span>
      <slot name="labelGroup" />
      <slot name="descriptionGroup" />
    </span>
    <slot name="requiredLabelGroup" />
  </span>
</template>
