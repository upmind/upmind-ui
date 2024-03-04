<script setup lang="ts">
import WelcomeItem from "./WelcomeItem.vue";
import DocumentationIcon from "@/assets/icons/IconDocumentation.svg";
import ToolingIcon from "@/assets/icons/IconTooling.svg";
import EcosystemIcon from "@/assets/icons/IconEcosystem.svg";
import CommunityIcon from "@/assets/icons/IconCommunity.svg";
import SupportIcon from "@/assets/icons/IconSupport.svg";
import StateMachineIcon from "@/assets/icons/IconStateMachine.svg";
import { test as testFlow } from "@upmind/flow";
</script>

<template>
  <welcome-item>
    <template #icon>
      <state-machine-icon />
    </template>
    <template #heading> {{ testFlow() || "State" }} </template>

    This project is using the Upmind Flow to manage state and user journeys.
  </welcome-item>

  <welcome-item>
    <template #icon>
      <documentation-icon />
    </template>
    <template #heading>Documentation</template>

    Vue’s
    <a
      class="text-accent"
      href="https://vuejs.org/"
      target="_blank"
      rel="noopener"
      >official documentation</a
    >
    provides you with all information you need to get started.
  </welcome-item>

  <welcome-item>
    <template #icon>
      <tooling-icon />
    </template>
    <template #heading>Tooling</template>

    This project is served and bundled with
    <a
      class="text-accent"
      href="https://vitejs.dev/guide/features.html"
      target="_blank"
      rel="noopener"
      >Vite</a
    >. The recommended IDE setup is
    <a
      class="text-accent"
      href="https://code.visualstudio.com/"
      target="_blank"
      rel="noopener"
      >VSCode</a
    >
    +
    <a
      class="text-accent"
      href="https://github.com/johnsoncodehk/volar"
      target="_blank"
      rel="noopener"
      >Volar</a
    >. If you need to test your components and web pages, check out
    <a
      class="text-accent"
      href="https://www.cypress.io/"
      target="_blank"
      rel="noopener"
      >Cypress</a
    >
    and
    <a
      class="text-accent"
      href="https://on.cypress.io/component"
      target="_blank"
      rel="noopener"
      >Cypress Component Testing</a
    >.

    <br />

    More instructions are available in
    <code class="text-accent">README.md</code>.
  </welcome-item>

  <welcome-item>
    <template #icon>
      <ecosystem-icon />
    </template>
    <template #heading>Ecosystem</template>

    Get official tools and libraries for your project:
    <a
      class="text-accent"
      href="https://pinia.vuejs.org/"
      target="_blank"
      rel="noopener"
      >Pinia</a
    >,
    <a
      class="text-accent"
      href="https://router.vuejs.org/"
      target="_blank"
      rel="noopener"
      >Vue Router</a
    >,
    <a
      class="text-accent"
      href="https://test-utils.vuejs.org/"
      target="_blank"
      rel="noopener"
      >Vue Test Utils</a
    >, and
    <a
      class="text-accent"
      href="https://github.com/vuejs/devtools"
      target="_blank"
      rel="noopener"
      >Vue Dev Tools</a
    >. If you need more resources, we suggest paying
    <a
      class="text-accent"
      href="https://github.com/vuejs/awesome-vue"
      target="_blank"
      rel="noopener"
      >Awesome Vue</a
    >
    a visit.
  </welcome-item>

  <welcome-item>
    <template #icon>
      <community-icon />
    </template>
    <template #heading>Community</template>

    Got stuck? Ask your question on
    <a
      class="text-accent"
      href="https://chat.vuejs.org"
      target="_blank"
      rel="noopener"
      >Vue Land</a
    >, our official Discord server, or
    <a
      class="text-accent"
      href="https://stackoverflow.com/questions/tagged/vue.js"
      target="_blank"
      rel="noopener"
      >StackOverflow</a
    >. You should also subscribe to
    <a
      class="text-accent"
      href="https://news.vuejs.org"
      target="_blank"
      rel="noopener"
      >our mailing list</a
    >
    and follow the official
    <a
      class="text-accent"
      href="https://twitter.com/vuejs"
      target="_blank"
      rel="noopener"
      >@vuejs</a
    >
    twitter account for latest news in the Vue world.
  </welcome-item>

  <welcome-item>
    <template #icon>
      <support-icon />
    </template>
    <template #heading>Support Vue</template>

    As an independent project, Vue relies on community backing for its
    sustainability. You can help us by
    <a
      class="text-accent"
      href="https://vuejs.org/sponsor/"
      target="_blank"
      rel="noopener"
      >becoming a sponsor</a
    >.
  </welcome-item>
</template>
