# Storybook

Please find Upmind's storybook here - https://storybook.upmind.dev/ (and also here: https://upmind-storybook.web.app/).

## Run locally

```
$ npm install
$ npm run start:storybook
```

## CI/CD

- Storybook is deployed in Firebase - https://console.firebase.google.com/u/1/project/upmind-storybook/overview

- There's a preview env created every time a commit is made to any branch with a PR open with `main` as base branch. These envs last for 7 days, but they can be stopped on-demand by running the manual step in Gitlab (stop preview).

- For production, Storybook is deployed upon any commit (usually only merges) to the `main` branch.

- By default, the pipelines described in the previous 2 bullet points will only run if a change is detected on `playgrounds/storybook/**`. This can be overridden at the repo level with the env var `CI_FORCE_STORYBOOK=true` (and it's currently **enabled**).

- Additionally, we also leverage Gitlab environments for visibility (https://git.upmind.io/upmind/upmind-monorepo/-/environments)
