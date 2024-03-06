<template>
  <section class="forms w-full">
    <header class="navbar bg-base-100 pl-4 rounded-box">
      <div class="flex-1">
        <h2 class="title m-0">Stylguide</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <footer></footer>
  </section>
</template>

<script setup lang="ts"></script>
