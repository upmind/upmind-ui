import "./assets/main.css";

import { createApp } from "vue";
import upmind from "./plugins/upmind";

import "preline/preline";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(router);
app.use(upmind);

app.mount("#app");
