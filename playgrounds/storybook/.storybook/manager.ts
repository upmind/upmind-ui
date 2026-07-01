import { addons } from "@storybook/manager-api";
import UpmindUITheme from "./UpmindUITheme";

addons.setConfig({
  theme: UpmindUITheme,
  panelPosition: "right"
});
