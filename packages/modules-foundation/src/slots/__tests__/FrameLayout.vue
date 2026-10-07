<template>
  <article data-layout>
    <h1>{{ title }}</h1>

    <template v-for="name in FRAMES" :key="name">
      <section v-if="$slots[name]" :data-frame="name">
        <slot :name="name" />
      </section>
    </template>
  </article>
</template>

<script lang="ts" setup>
defineProps<{ title: string }>();

const FRAMES = ["product-details", "image", "pricing", "terms"];
</script>
