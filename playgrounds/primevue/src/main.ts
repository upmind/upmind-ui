import "./assets/app.css";
import "primeicons/primeicons.css";

import { createApp } from "vue";
import upmind from "./plugins/upmind";

import PrimeVue from "primevue/config";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(router);
app.use(upmind);
app.use(PrimeVue);

app.mount("#app");
