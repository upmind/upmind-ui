# Upmind Docs

Welcome to Upmind documentation for our open-source projects.

## intro

The tech powering this documentation is [Vitepress](https://vitepress.dev/) and [Typedoc](https://typedoc.org/) (with the help of [typedoc-plugin-markdown](https://www.typedoc-plugin-markdown.org/) - using [typedoc-vitepress-theme](https://www.typedoc-plugin-markdown.org/plugins/vitepress)).

The outcome is a static website - [docs.upmind.io](https://docs.upmind.io/) - deployed on Firebase (more on this on the [Deployment](#deployment) section).

## How does it work ?

There are 2 things happening at the same time in this repo:

- Typdoc generates automatic documentation from code comments blocks

- Vitepress generates the static website

This means there's a few advantages and disadvantages.

- A lot of heavy lifting of our documentation is carried by Typedoc as it generates a lot of it effortlessly. Also, nice blocks of comments in the code means that our documentation source of truth is living right there and then - in the code.

- However, configuring a monorepo (multiple packages) docs setup was far from trivial. Obviously documentation needs to look nice on the generated static site, routes need to make sense and markdown files organisation is a priority - otherwise no one will understand what's going on in the docs package in the future.

## Local development

There are a few relevant scripts for working on the docs:

- `npm run predocs` - Runs Typedoc automatic generation of markdown files (leveraging `typedoc-plugin-markdown`).

- `npm run docs:dev` - Starts a local server (using Vite), where Vitepress is generating the static website on-the-fly.

- `npm run docs:build` - This is the script run by the Gitlab pipeline to actually create a `dist` folder with the generated static site (obviously can be run locally for testing purposes).

> ⚠️ Don't forget to run `npm run predocs` as much as possible. Changes in code and comment blocks will not reflect automatically just by running `npm run docs:dev`.

After running `npm run predocs`, git will always show changes for the `typedoc-sidebar.json` file (even if nothing actually changes) - this is because the file is generated in a "minified javascript style" and then our monorepo setup applies our linter automatically on commit (so when the file is re-generated, it won't be linted anymore).

## Deployment

Whenever a pull request is created in the `upmind-monorepo`, a preview of the documentation is generated - look for `(docs) deploy preview` pipeline job/step.

Both previews and production environments are using Firebase for hosting.

> ℹ️ Always refer back to `upmind-monorepo/.gitlab-ci/vitepress.yml` for more details

### Deploy to Production

Deploying to production is as easy as creating and pushing a new git tag using the format `/^docs-v\d+(\.\d+)*$/` - example `docs-v1.0.0`.

The pipeline is flexible, so we can tag from any branch at any time and it will deploy a new version of the documentation.
