<template>
  <UpmCard class="!py-0">
    <div
      class="relative items-stretch justify-between py-6 leading-none md:flex md:py-8"
    >
      <div class="items-start md:flex md:space-x-10">
        <div>
          <div class="flex flex-col">
            <Skeleton class="text-primary w-44 pt-2 text-lg font-medium"
              >Title</Skeleton
            >
            <Skeleton
              class="text-base-700 mr-6 mt-1 hidden text-sm leading-snug md:block"
            >
              Lorem ipsum dolor sit amet, consectetur adipiscin
            </Skeleton>

            <Skeleton
              class="text-base-700 mt-2 block text-sm leading-snug md:mt-2 md:hidden"
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing
            </Skeleton>

            <div class="mt-3 flex flex-col text-sm">
              <Skeleton class="text-base-700 flex w-44 items-center py-1">
                Category
              </Skeleton>
              <Skeleton class="text-base-700 mt-1 flex w-56 items-center py-1">
                Delivery time: within 24 hours
              </Skeleton>
              <Skeleton class="text-base-700 mt-1 flex w-36 items-center py-1">
                Configuration
              </Skeleton>
            </div>
          </div>
        </div>
      </div>

      <div
        class="mt-8 flex items-end justify-between sm:mt-6 md:mt-0 md:flex-col"
      >
        <div class="flex flex-col justify-end md:text-right">
          <Skeleton class="w-32 pt-2 text-lg font-medium">$99,999.00</Skeleton>
          <Skeleton class="mr-auto mt-1 w-16 text-xs md:ml-auto md:mr-0"
            >One Time</Skeleton
          >
        </div>

        <div class="flex items-center space-x-2">
          <Skeleton>
            <NumberField class="w-[6.25rem]" />
          </Skeleton>
        </div>
      </div>
    </div>
  </UpmCard>
</template>

<script lang="ts" setup>
import { Skeleton, NumberField } from "@upmind-automation/upwind";
import { UpmCard } from "@upmind-automation/client-vue";
</script>
