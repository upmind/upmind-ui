---
id: comp-canonical-names
when: naming a member a composable returns
paths:
  - 'packages/headless/src/modules/**/use*.ts'
---
# Standard members use their canonical names

Give each standard member its canonical name: `context`, `errors`, `model`, `isReady`, `onDone`, `destroy`. Do not use another name for the same concept, such as `contextRef`, `errorList` or `ready`.

The test: the member does the job that a canonical name describes. Then it has that name.
