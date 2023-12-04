<template>
  <section class="forms w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Domain Manager</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <p>
      This will render a Domain Manager, which is effectively a Basket Helper,
      that will add/remove/sync basket items based on criteria.
    </p>

    <p>
      The Domain manager will also allow users to <em>add a New Domain DAC</em>,
      transfer an <em>Existing Domain DAC (internally)</em> or transfer an
      <em>Existing Domain Text field (externally)</em>.
    </p>
    <p>
      Basket Helper Criteria =
      <code>service_identifier == 'domain' ( Product )</code> +
      <code>sld ( Provisioning Field )</code>
    </p>

    <footer></footer>
  </section>
</template>

<script setup lang="ts"></script>
