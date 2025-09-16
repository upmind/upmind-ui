<template>
  <!-- products -->
  <dl
    class="m-0 grid grid-cols-2 gap-1 border-t py-4 text-sm first-of-type:border-t-0 first-of-type:pt-0"
    v-auto-animate
  >
    <Skeleton
      class="text-foreground group m-0 inline-flex w-28 flex-1 items-end gap-2 text-left text-sm leading-normal"
    >
      Product
    </Skeleton>

    <dd
      class="text-foreground m-0 flex w-full flex-0 justify-end gap-2 text-right font-medium"
    >
      <slot name="actions">
        <Skeleton class="text-primary">00.000000</Skeleton>
      </slot>
    </dd>

    <Skeleton
      class="text-foreground group m-0 inline-flex w-36 flex-1 items-end gap-2 text-left text-sm leading-normal"
    >
      Products
    </Skeleton>

    <dd
      class="text-foreground m-0 flex w-full flex-0 justify-end gap-2 text-right font-medium"
    >
      <slot name="actions">
        <Skeleton class="text-primary">00.000000000</Skeleton>
      </slot>
    </dd>
  </dl>

  <!-- subtotals -->
  <dl
    class="m-0 grid grid-cols-2 gap-1 border-t py-4 text-sm first-of-type:border-t-0 first-of-type:pt-0"
    v-auto-animate
  >
    <dt
      class="text-base-700 group m-0 inline-flex flex-1 items-center text-left text-sm leading-normal font-normal"
    >
      <Skeleton
        class="m-0 inline-flex h-full w-16 items-end text-left text-sm leading-normal font-normal"
        >Title</Skeleton
      >
    </dt>

    <dd class="m-0 flex flex-0 justify-end">
      <Skeleton class="text-base-700 block w-14 font-medium">
        Subtotal
      </Skeleton>
    </dd>

    <dt
      class="text-base-700 group m-0 flex-1 items-center text-left text-sm leading-normal font-normal"
    >
      <Skeleton
        class="m-0 h-full w-24 text-left text-sm leading-normal font-normal"
        >Title</Skeleton
      >
    </dt>

    <dd class="m-0 flex flex-0 justify-end">
      <Skeleton class="text-base-700 block w-16 font-medium">
        Subtotal
      </Skeleton>
    </dd>
  </dl>

  <!-- total -->
  <div class="flex flex-col gap-4 border-t">
    <dl class="m-0 flex justify-between pt-4 text-lg">
      <Skeleton
        class="text-foreground group m-0 w-16 items-center gap-2 font-bold"
      >
        Total
      </Skeleton>
      <Skeleton class="text-foreground m-0 w-32 text-right font-bold">
        Total
      </Skeleton>
    </dl>

    <!-- promotions -->
    <Skeleton class="h-6 w-32" />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";

// --- components
import { Skeleton } from "@upmind-automation/upmind-ui";
</script>
