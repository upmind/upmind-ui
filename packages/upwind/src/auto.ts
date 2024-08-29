// --- styles
import "./assets/main.css";

import { UwButton } from "./ui/button";
import { UwAvatar } from "./ui/avatar";
import { UwBadge } from "./ui/badge";
import { UwDialog } from "./ui/dialog";
import { UwTooltip } from "./ui/tooltip";

// -----------------------------------------------------------------------------

// --- Auto register all custom elements
customElements.define("uw-avatar", UwAvatar);
customElements.define("uw-badge", UwBadge);
customElements.define("uw-button", UwButton);
customElements.define("uw-dialog", UwDialog);
customElements.define("uw-tooltip", UwTooltip);
