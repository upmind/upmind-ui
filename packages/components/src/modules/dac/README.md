# DAC / Domain Component

## TOD0

- [ ] make DAC slot only, with results available as an array of objects
- [ ] add dropdown component of dac results that can be used within the DAC component
- [ ] change form dac control to be a domain control
  - [ ] add default classes to the domain control
  - [ ] test options/class overrides
  - [ ] ask type based on 3 options:
    - [ ] new domain > render dac component
    - [ ] owned domain > render dropdown list
    - [ ] external domain > render text field
    - [ ] add domain_name format validation in AJV
- [ ] Add a domain component
- [ ] add cancelabble request option to the dac component
- [ ] add ancillary products to basket
  - [ ] ensure logic to not create dupe ancillary products

## Feedback

- [ ] Add feedback machine to Flow
- [ ] Catch and display errors and info messages via the feedback machine
- [ ] Add a global message component that can be used to display messages
  - [ ] toasts
  - [ ] snackbars
  - [ ] dialogs
  - [ ] banners
