import "./style.css";

import { test } from "@upmind/core";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <h1>${test()}!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`;
