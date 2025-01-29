# Title

Please provide a brief description of the feature, component or bug fix

## Summary

Please provide a A brief summary of:

- The purpose of the changes
- Any changes implemented
- Any issues addressed
- Any dependencies or breaking changes

## Links and References

- [ ] **Trello Card:**
- Link to the Trello card which was assigned

- [ ] **Storybook Demo:**
- Link to the Storybook "page" for testing and review

- [ ] **Figma Designs:**
- Link to the Figma "page" for the design

## Design Checks

- [ ] **Design:**
- Does the component match the Figma design, including all states and interactions?

- [ ] **Attributes and Configuration:**
- Do the component's attributes and configurations match the Figma design elements and their override options?

- [ ] **Accessibility Considerations:**
- Does the design address accessibility (color contrast, keyboard navigation)?

## Style Checks

- [ ] **Storybook Tests:**

  - Are there tests for the component within Storybook?
  - Are the tests comprehensive and cover various states, attributes and interactions?
  - Is the Storybook providing documentation for the component?

- [ ] Has the style config been included in the component?

  - Does the config cover all the elements/styles used in the component?
  - Does the config cover all the conditional attributes used in the component?
  - Does the config use any ad hoc tailwind classes or magic numbers?,
    - eg: max-w-[123px]?

- [ ] Is there any custom styles/CSS used in the component
  - CSS should only be defined as tailwind classes in UI Config 'config.js',
  - We should **NOT** be using any custom CSS
- [ ] Are there any inline tailwind classes used in the component
  - Classes should only be defined in UI config 'config.js'

## Code Checks

- [ ] Does the code adhere to project style guidelines and best practices?
- [ ] Are there any lint errors or warnings?

- [ ] Is the component using the Options API?

  - Is the Setup function minimal and contains only the necessary logic?
  - No unnecessary methods in the setup function
  - No unnecessary computed properties in the setup function
  - No watch or lifecycle hooks in the setup function
  - Are there any Data properties that can be moved to the setup function?

- [ ] Is there any repeated code that can be refactored into a function or Composable?
  - Use the rule of 3 to determine if the code should be refactored into a function or Composable

**Additional Notes:**

- Reviewers can add comments and suggestions directly within the PR for specific areas.
- Provide clear and constructive feedback to help improve the PR quality.

**Benefits of Using this Checklist:**

- Ensures a thorough review process.
- Streamlines communication between reviewers and developers.
- Maintains high-quality code and design standards within the component library.
- Verifies component functionality and visual appearance through Storybook tests.
- Enforces the use of Tailwind classes and avoids inline CSS for better maintainability.
