## Upmind - Monorepo README

**Project Name:** Upmind

**Overview:**

Upmind is a monorepo that houses all the second-generation packages and UI components for Upmind, a billing, sales, and automation platform designed to help service businesses run and scale their online operations.

### Adding a new pkg

```bash
npm init -y --scope @upmind -w packages/XXX
```

**Packages:**

Upmind consists of several reusable packages located in the `packages` directory, all named using camelCase.

- **Flow:** A library of core functions built with vanilla JavaScript and XState state machines to manage Upmind's business logic. It does not include any UI components.
- **Vue:** A Vue.js implementation of Flow. It provides a collection of composables that consume Flow and make it reactive for easier use within Vue.js projects.
- **UI (to be named):** A component library built with Vue.js and Tailwind CSS. It will eventually house the entire Upmind component library, consisting of atomic components that consume the Flow logic through the Vue implementation. This library will not include pages or views.

**Planned Packages:**

- **Widgets:** UI components wrapped as web components for integration into other platforms and websites.
- **Nuxt:** A Nuxt.js wrapper of the UI components for seamless integration into Nuxt.js projects.

**Playgrounds:**

The `playgrounds` folder contains several playgrounds, each implementing a different UI system but consuming the core UI and Vue packages. They all follow the same camelCase naming convention as the packages.

- **DaisyUi:** The first fully functional playground that implements all Upmind flows. It includes features like authentication, shopping cart, system flows (including Requests API, feedback, settings systems, client settings management), and working examples of Domain Access Controller (DAC) and Domain purchase flows.
- **Preline:** A playground showcasing Upmind Labs concepts. It allows users to explore all flows and their appearance on various screen sizes (desktop, tablet, mobile) through a canvas. Additionally, it provides theming options (light, dark, custom) and a theme builder (or Styleguide) for customizing themes and saving them as Tailwind configs usable within the playground.
- **Primvue:** An exploration of an alternative Vue.js component framework (Primvue) to DaisyUi. While configured, Primvue hasn't been implemented across the flows yet.

**Install Instructions:**

1. **Node.js and npm:** This project requires Node.js and npm to be installed on your system. You can download and install the latest version from the official Node.js website: [https://nodejs.org/en](https://nodejs.org/en)

**Running Playgrounds:**

Upmind offers two ways to launch playgrounds:

- **Individual Playground Start Commands:** Each playground can be launched independently using a specific command:
  - **`npm run start:<playground_name>`:** Replace `<playground_name>` with the actual name of the playground (e.g., `npm run start:daisyui`).
- **Automatic Start with `npm start`:** The `npm start` command will automatically attempt to launch the playground that has a defined `start` script in its package.json file. This is currently the configured playground.

**Start Command Behavior:**

The `npm start` command offers flexibility. It will first try to launch any/all playground(s) with a defined `start` script. If none is found, it won't start anything.

**Other npm Commands:**

Upmind provides additional npm commands for convenient code management:

- **`npm run lint`:** Runs linting across all packages and playgrounds, enforcing code style and quality standards.
- **`npm run lint:fix`:** Attempts to automatically fix linting issues across all packages and playgrounds.
- **`npm run clean`:** Cleans out the `node_modules`, `dist`, and `tsbuildinfo` folders in all packages and playgrounds, ensuring a fresh build environment.

These commands help streamline code maintenance and ensure consistency throughout the monorepo.
We also have Husky and Lint-Staged configured to run these commands automatically before commits.

**Additional Notes:**

- Playgrounds are currently under development in the MVP phase. Playground names may be changed, added, or removed in the future. However, each playground will have a launch method using either individual start commands or the automatic `npm start` behavior.
- Feel free to include any other relevant information for developers, such as testing instructions, contribution guidelines, or links to further documentation.

**Remember:** This README provides a general overview. Specific details and commands may change over time. Please also look at individual package or playground readmes for more information.
