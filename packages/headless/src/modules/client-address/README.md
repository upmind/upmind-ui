# Client Addresses

This is a new unified address flow, where we dont differentiate between a normal address and a company. We have a single address flow that can be used for both.

This allows us to have much simplified address ui, where the user does not have to differentiate between a company and a normal address.

This has several advantages:

- we can have a single form that can satisfy both cases
- we dont use objects for company addresses, phones and emails, which are cumbersome to add
- rather we provide an lookup values to a combobox, where the user can select a company address, phone or email
- we also allow users to add new ones as they are regular inputs, and we can add them to the combobox
- we defer the complexity of adding new company addresses, phones and emails to the machine and services which will calculate the appropriate values
- if we have existing company addresses, phones and emails, we can use them as lookup values
- the machines will provide any existing values as a lookup of items
- the machine with then evaluate the returned value and determine if we have an - existing record that we can use, or if we need to create a new one
- if we create a new one, we will add it to the lookup values, so that the user = can select it in the future
- everything gis added asynchronously, so that we can add new values to the lookup values as they are created, we just ensure uniqueness
