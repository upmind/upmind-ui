## Upmind - Monorepo README

**Project Name:** Upmind

**Overview:**

Upmind is a monorepo that houses all the second-generation packages and UI components for Upmind, a billing, sales, and automation platform designed to help service businesses run and scale their online operations.

### Adding a new pkg

```bash
npm init -y --scope @upmind-automation -w packages/XXX
```

**Packages:**

Upmind consists of several reusable packages located in the `packages` directory, all named using camelCase.

- **Upmind Headless:** A library of core functions built with vanilla JavaScript and XState state machines to manage Upmind's business logic. It does not include any UI components.
- **Vue:** A Vue.js implementation of Upmind Headless. It provides a collection of composables that consume Upmind Headless and make it reactive for easier use within Vue.js projects.
- **UI (to be named):** A component library built with Vue.js and Tailwind CSS. It will eventually house the entire Upmind component library, consisting of atomic components that consume the Upmind Headless logic through the Vue implementation. This library will not include pages or views.

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

2. **Git submodules:**

When cloning this repo, use `git clone --recurse-submodules git@github.com:upmind/types.git`.

If you already have the repo cloned, then you need to `git submodule update --init --recursive`.

2.1 **Update a git submodule**

To update a git submodule to its latest commit from its remote repo:

```
cd packages/types
git pull origin main
```

Then commit in the monorepo to track the new submodule commit:

```
git add packages/types
git commit -m "chore(types): Updated types submodule to v0.0.1"
```

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

# Trello: Lifecycle of a Card

**Spec**: Create a specification document outlining the component's functionality, behavior, and usage.
**Scope**: Define the component's purpose, use cases, and requirements.
**Design**: In Figma, create a design system component with all necessary states and interactions.
**Review**: Ensure Figma design elements and their override options align with spec and all states are represented as well as interactions or animations are defined.
**Review**: Address accessibility considerations (color contrast, keyboard navigation) in the design.
**Review**: Check design reference and ensure all states and interactions are considered.
**Code**: Develop any necessary Back-End endpoints or logic for the component.
**Code**: Implement the component based on the approved design and specifications.
**Tests**: Write unit tests to ensure component functionality.
**Tests**: Write e2e tests to ensure component functionality.
**Documentation**: Create Storybook stories for the component, covering various states and interactions as well as providing documentation and usage instructions and examples.
**Review**: Verify Figma Design matches component implementation using Storybook or the provided demo link.
**Review**: Confirm all design elements, options, and states are implemented as per the design and spec.
**Review**: Review code quality and adherence to project guidelines.
**Review**: Verify unit tests cover the implemented functionality.
**Review**: Verify e2e tests cover the implemented functionality.
**QA**: Conduct thorough testing of the component functionality on the staging environment.
