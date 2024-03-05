<template>
  <div class="item flex relative items-start p-4">
    <div class="avatar placeholder">
      <div
        class="bg-neutral text-neutral-content rounded-full w-12 h-12 self-start mt-6 flex items-center justify-center"
      >
        <!-- <span class="text-3xl">D</span> -->
        <slot name="icon"></slot>
      </div>
    </div>

    <div class="details flex-1 ml-6 my-4">
      <h3 class="m-0 text-inherit">
        <slot name="heading"></slot>
      </h3>
      <p>
        <slot name="subheading"></slot>
      </p>
      <slot></slot>
    </div>
  </div>
</template>
