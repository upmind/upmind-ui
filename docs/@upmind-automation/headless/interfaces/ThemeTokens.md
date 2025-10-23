[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ThemeTokens

# ThemeTokens

Interface representing theme tokens, which are the fundamental design system values
like colours, typography, spacing, and border radii. These are typically inferred
from a `tokens.json` file or a design system definition.

## Properties

### badge?

```ts
optional badge: object;
```

#### radius

```ts
radius: string;
```

***

### button?

```ts
optional button: object;
```

#### radius

```ts
radius: string;
```

***

### card?

```ts
optional card: object;
```

#### radius

```ts
radius: string;
```

***

### color?

```ts
optional color: object;
```

#### background

```ts
background: object;
```

##### background.accent

```ts
accent: object;
```

##### background.accent.danger

```ts
danger: string;
```

##### background.accent.dangerMuted

```ts
dangerMuted: string;
```

##### background.accent.info

```ts
info: string;
```

##### background.accent.infoMuted

```ts
infoMuted: string;
```

##### background.accent.neutral

```ts
neutral: string;
```

##### background.accent.neutralMuted

```ts
neutralMuted: string;
```

##### background.accent.primary

```ts
primary: string;
```

##### background.accent.primaryMuted

```ts
primaryMuted: string;
```

##### background.accent.promo

```ts
promo: string;
```

##### background.accent.promoMuted

```ts
promoMuted: string;
```

##### background.accent.success

```ts
success: string;
```

##### background.accent.successMuted

```ts
successMuted: string;
```

##### background.accent.warning

```ts
warning: string;
```

##### background.accent.warningMuted

```ts
warningMuted: string;
```

##### background.button

```ts
button: object;
```

##### background.button.danger0

```ts
danger0: string;
```

##### background.button.danger1

```ts
danger1: string;
```

##### background.button.dangerHover0

```ts
dangerHover0: string;
```

##### background.button.dangerHover1

```ts
dangerHover1: string;
```

##### background.button.dangerRing

```ts
dangerRing: string;
```

##### background.button.ghost

```ts
ghost: string;
```

##### background.button.ghostHover

```ts
ghostHover: string;
```

##### background.button.ghostRing

```ts
ghostRing: string;
```

##### background.button.neutral0

```ts
neutral0: string;
```

##### background.button.neutral1

```ts
neutral1: string;
```

##### background.button.neutralHover0

```ts
neutralHover0: string;
```

##### background.button.neutralHover1

```ts
neutralHover1: string;
```

##### background.button.neutralRing

```ts
neutralRing: string;
```

##### background.button.outline

```ts
outline: string;
```

##### background.button.outlineHover

```ts
outlineHover: string;
```

##### background.button.outlineRing

```ts
outlineRing: string;
```

##### background.button.primary0

```ts
primary0: string;
```

##### background.button.primary1

```ts
primary1: string;
```

##### background.button.primaryHover0

```ts
primaryHover0: string;
```

##### background.button.primaryHover1

```ts
primaryHover1: string;
```

##### background.button.primaryRing

```ts
primaryRing: string;
```

##### background.button.secondary0

```ts
secondary0: string;
```

##### background.button.secondary1

```ts
secondary1: string;
```

##### background.button.secondaryHover0

```ts
secondaryHover0: string;
```

##### background.button.secondaryHover1

```ts
secondaryHover1: string;
```

##### background.button.secondaryRing

```ts
secondaryRing: string;
```

##### background.button.subtle0

```ts
subtle0: string;
```

##### background.button.subtle1

```ts
subtle1: string;
```

##### background.button.subtleHover0

```ts
subtleHover0: string;
```

##### background.button.subtleHover1

```ts
subtleHover1: string;
```

##### background.button.subtleRing

```ts
subtleRing: string;
```

##### background.canvas

```ts
canvas: string;
```

##### background.control

```ts
control: object;
```

##### background.control.checked

```ts
checked: string;
```

##### background.control.checkedContrast

```ts
checkedContrast: string;
```

##### background.control.checkedHover

```ts
checkedHover: string;
```

##### background.control.ring

```ts
ring: string;
```

##### background.control.selected

```ts
selected: string;
```

##### background.control.surface

```ts
surface: string;
```

##### background.control.unchecked

```ts
unchecked: string;
```

##### background.control.uncheckedHover

```ts
uncheckedHover: string;
```

##### background.overlay

```ts
overlay: string;
```

##### background.skeleton

```ts
skeleton: string;
```

##### background.surface

```ts
surface: string;
```

##### background.surfaceGlass

```ts
surfaceGlass: string;
```

#### border

```ts
border: object;
```

##### border.accent

```ts
accent: object;
```

##### border.accent.danger

```ts
danger: string;
```

##### border.accent.info

```ts
info: string;
```

##### border.accent.neutral

```ts
neutral: string;
```

##### border.accent.primary

```ts
primary: string;
```

##### border.accent.promo

```ts
promo: string;
```

##### border.accent.secondary

```ts
secondary: string;
```

##### border.accent.success

```ts
success: string;
```

##### border.accent.warning

```ts
warning: string;
```

##### border.button

```ts
button: object;
```

##### border.button.outline

```ts
outline: string;
```

##### border.button.outlineHover

```ts
outlineHover: string;
```

##### border.control

```ts
control: object;
```

##### border.control.default

```ts
default: string;
```

##### border.control.hover

```ts
hover: string;
```

##### border.control.selected

```ts
selected: string;
```

##### border.surface

```ts
surface: string;
```

#### icon

```ts
icon: object;
```

##### icon.neutral

```ts
neutral: string;
```

##### icon.primary

```ts
primary: string;
```

##### icon.subtle

```ts
subtle: string;
```

#### primary

```ts
primary: string;
```

#### primitive

```ts
primitive: object;
```

##### primitive.control

```ts
control: object;
```

##### primitive.control.default

```ts
default: string;
```

##### primitive.control.defaultContrast

```ts
defaultContrast: string;
```

##### primitive.control.defaultDelta

```ts
defaultDelta: string;
```

##### primitive.control.muted

```ts
muted: string;
```

##### primitive.control.mutedContrast

```ts
mutedContrast: string;
```

##### primitive.control.stroke

```ts
stroke: string;
```

##### primitive.control.strokeDelta

```ts
strokeDelta: string;
```

##### primitive.core

```ts
core: object;
```

##### primitive.core.base

```ts
base: string;
```

##### primitive.core.canvas

```ts
canvas: string;
```

##### primitive.core.display

```ts
display: string;
```

##### primitive.core.faint

```ts
faint: string;
```

##### primitive.core.muted

```ts
muted: string;
```

##### primitive.core.overlay

```ts
overlay: string;
```

##### primitive.core.skeleton

```ts
skeleton: string;
```

##### primitive.core.surface

```ts
surface: string;
```

##### primitive.danger

```ts
danger: object;
```

##### primitive.danger.default

```ts
default: string;
```

##### primitive.danger.defaultContrast

```ts
defaultContrast: string;
```

##### primitive.danger.defaultDelta

```ts
defaultDelta: string;
```

##### primitive.danger.muted

```ts
muted: string;
```

##### primitive.danger.mutedContrast

```ts
mutedContrast: string;
```

##### primitive.info

```ts
info: object;
```

##### primitive.info.default

```ts
default: string;
```

##### primitive.info.defaultContrast

```ts
defaultContrast: string;
```

##### primitive.info.muted

```ts
muted: string;
```

##### primitive.info.mutedContrast

```ts
mutedContrast: string;
```

##### primitive.neutral

```ts
neutral: object;
```

##### primitive.neutral.default

```ts
default: string;
```

##### primitive.neutral.defaultContrast

```ts
defaultContrast: string;
```

##### primitive.neutral.defaultDelta

```ts
defaultDelta: string;
```

##### primitive.neutral.muted

```ts
muted: string;
```

##### primitive.neutral.mutedContrast

```ts
mutedContrast: string;
```

##### primitive.neutral.mutedDelta

```ts
mutedDelta: string;
```

##### primitive.neutral.stroke

```ts
stroke: string;
```

##### primitive.neutral.strokeDelta

```ts
strokeDelta: string;
```

##### primitive.primary

```ts
primary: object;
```

##### primitive.primary.default

```ts
default: string;
```

##### primitive.primary.defaultContrast

```ts
defaultContrast: string;
```

##### primitive.primary.defaultDelta

```ts
defaultDelta: string;
```

##### primitive.primary.defaultStop

```ts
defaultStop: string;
```

##### primitive.primary.muted

```ts
muted: string;
```

##### primitive.primary.mutedContrast

```ts
mutedContrast: string;
```

##### primitive.promo

```ts
promo: object;
```

##### primitive.promo.default

```ts
default: string;
```

##### primitive.promo.defaultContrast

```ts
defaultContrast: string;
```

##### primitive.promo.muted

```ts
muted: string;
```

##### primitive.promo.mutedContrast

```ts
mutedContrast: string;
```

##### primitive.secondary

```ts
secondary: object;
```

##### primitive.secondary.default

```ts
default: string;
```

##### primitive.secondary.defaultContrast

```ts
defaultContrast: string;
```

##### primitive.secondary.defaultDelta

```ts
defaultDelta: string;
```

##### primitive.secondary.defaultStop

```ts
defaultStop: string;
```

##### primitive.success

```ts
success: object;
```

##### primitive.success.default

```ts
default: string;
```

##### primitive.success.defaultContrast

```ts
defaultContrast: string;
```

##### primitive.success.muted

```ts
muted: string;
```

##### primitive.success.mutedContrast

```ts
mutedContrast: string;
```

##### primitive.warning

```ts
warning: object;
```

##### primitive.warning.default

```ts
default: string;
```

##### primitive.warning.defaultContrast

```ts
defaultContrast: string;
```

##### primitive.warning.muted

```ts
muted: string;
```

##### primitive.warning.mutedContrast

```ts
mutedContrast: string;
```

#### secondary

```ts
secondary: string;
```

#### text

```ts
text: object;
```

##### text.accent

```ts
accent: object;
```

##### text.accent.danger

```ts
danger: string;
```

##### text.accent.dangerContrast

```ts
dangerContrast: string;
```

##### text.accent.dangerMutedContrast

```ts
dangerMutedContrast: string;
```

##### text.accent.info

```ts
info: string;
```

##### text.accent.infoContrast

```ts
infoContrast: string;
```

##### text.accent.infoMutedContrast

```ts
infoMutedContrast: string;
```

##### text.accent.neutral

```ts
neutral: string;
```

##### text.accent.neutralContrast

```ts
neutralContrast: string;
```

##### text.accent.neutralMutedContrast

```ts
neutralMutedContrast: string;
```

##### text.accent.primary

```ts
primary: string;
```

##### text.accent.primaryContrast

```ts
primaryContrast: string;
```

##### text.accent.primaryMutedContrast

```ts
primaryMutedContrast: string;
```

##### text.accent.promo

```ts
promo: string;
```

##### text.accent.promoContrast

```ts
promoContrast: string;
```

##### text.accent.promoMutedContrast

```ts
promoMutedContrast: string;
```

##### text.accent.success

```ts
success: string;
```

##### text.accent.successContrast

```ts
successContrast: string;
```

##### text.accent.successMutedContrast

```ts
successMutedContrast: string;
```

##### text.accent.warning

```ts
warning: string;
```

##### text.accent.warningContrast

```ts
warningContrast: string;
```

##### text.accent.warningMutedContrast

```ts
warningMutedContrast: string;
```

##### text.base

```ts
base: string;
```

##### text.button

```ts
button: object;
```

##### text.button.danger

```ts
danger: string;
```

##### text.button.dangerLink

```ts
dangerLink: string;
```

##### text.button.dangerLinkHover

```ts
dangerLinkHover: string;
```

##### text.button.ghost

```ts
ghost: string;
```

##### text.button.link

```ts
link: string;
```

##### text.button.linkHover

```ts
linkHover: string;
```

##### text.button.mutedLink

```ts
mutedLink: string;
```

##### text.button.mutedLinkHover

```ts
mutedLinkHover: string;
```

##### text.button.neutral

```ts
neutral: string;
```

##### text.button.outline

```ts
outline: string;
```

##### text.button.primary

```ts
primary: string;
```

##### text.button.secondary

```ts
secondary: string;
```

##### text.button.subtle

```ts
subtle: string;
```

##### text.control

```ts
control: object;
```

##### text.control.selected

```ts
selected: string;
```

##### text.display

```ts
display: string;
```

##### text.faint

```ts
faint: string;
```

##### text.muted

```ts
muted: string;
```

##### text.primary

```ts
primary: string;
```

***

### control?

```ts
optional control: object;
```

#### radius

```ts
radius: string;
```

***

### fonts?

```ts
optional fonts: object;
```

Typography settings for different text styles.

#### body?

```ts
optional body: string;
```

Primary font for body text.

#### display?

```ts
optional display: string;
```

Primary font for headings and display text.

#### sans?

```ts
optional sans: string;
```

Default sans-serif font.

***

### image?

```ts
optional image: object;
```

#### radius

```ts
radius: string;
```

***

### message?

```ts
optional message: object;
```

#### radius

```ts
radius: string;
```

***

### stroke?

```ts
optional stroke: object;
```

#### badge

```ts
badge: string;
```

#### icon

```ts
icon: string;
```
