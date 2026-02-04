// --- styles
import "./assets/upmind-ui.css";

import { UpmAlert } from "./ui/alert";
import { UpmAvatar } from "./ui/avatar";
import { UpmBadge } from "./ui/badge";
import { UpmButton } from "./ui/button";
import { UpmCombobox } from "./ui/combobox";
import { UpmDialog } from "./ui/dialog";
import { UpmDrawer } from "./ui/drawer";
import { UpmIcon } from "./ui/icon";
import { UpmIndicator } from "./ui/indicator";
import { UpmSonner } from "./ui/sonner";
import { UpmTabs } from "./ui/tabs";
import { UpmTooltip } from "./ui/tooltip";
// -----------------------------------------------------------------------------
// --- Auto register all custom elements
customElements.define("upm-alert", UpmAlert);
customElements.define("upm-avatar", UpmAvatar);
customElements.define("upm-badge", UpmBadge);
customElements.define("upm-button", UpmButton);
customElements.define("upm-combobox", UpmCombobox);
customElements.define("upm-dialog", UpmDialog);
customElements.define("upm-drawer", UpmDrawer);
customElements.define("upm-icon", UpmIcon);
customElements.define("upm-indicator", UpmIndicator);
customElements.define("upm-sonner", UpmSonner);
customElements.define("upm-tabs", UpmTabs);
customElements.define("upm-tooltip", UpmTooltip);
