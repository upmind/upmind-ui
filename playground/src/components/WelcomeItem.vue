<template>
  <div class="item">
    <div class="avatar placeholder">
      <div
        class="bg-neutral text-neutral-content rounded-full w-12 h-12 self-start mt-6"
      >
        <!-- <span class="text-3xl">D</span> -->
        <slot name="icon"></slot>
      </div>
    </div>

    <div class="divider divider-vertical"></div>

    <div class="details">
      <h3>
        <slot name="heading"></slot>
      </h3>
      <h4 class="green">
        <slot name="subheading"></slot>
      </h4>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.item {
  margin-top: 2rem;
  display: flex;
  position: relative;
}

.details {
  flex: 1;
  margin-left: 1rem;
}
</style>
