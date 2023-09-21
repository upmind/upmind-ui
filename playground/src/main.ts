import "./assets/main.css";

import { createApp } from "vue";
// import { createPinia } from "pinia";
import upmind from "./plugins/upmind";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

// app.use(createPinia());
app.use(router);
app.use(upmind);

app.mount("#app");
