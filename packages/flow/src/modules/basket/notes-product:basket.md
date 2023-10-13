on the product cnfiguration page we call...

1. Get the current user with extras...
   - https://api.staging.upmind.io/api/self?with=actor,actor.account,actor.brand,accounts,delegated_ids,enabled_modules
2. Not sure what we are getting here...which account and why??? for when we support users with multiple accounts.
   - https://api.staging.upmind.io/api/accounts/select
3. Not sure what we are getting here??? In App Notifications
   - https://api.staging.upmind.io/api/notifications?filter[message_type]=1&filter[status]=0&limit=count

<!-- Upmind setup -->
<!-- countries / regions / currencies -->

5. Get the lookup of countries....why?

   - https://api.staging.upmind.io/api/countries?limit=0
   -

6. Get the Lookup of Billing Cycles...Put in the brand like currencies : only in store > conditional / event driven

   - https://api.staging.upmind.io/api/billing_cycles?limit=0
   <!-- --- -->

7. Get the full product with extras...why basket endpoint?
   - https://api.staging.upmind.io/api/basket/products/5d085e69-d562-3719-7d6f-218e940d4237?with
8. Calculate the price of the product option/term selected
   - do this on each option change to get the actual value from the api
   - why do we need to do this? We have the value and the currency ? assume formatting ?
   - https://api.staging.upmind.io/api/cart/calculate
   -
9. Get the products provisioning fields **IF the product has provisioning fields** `provision_blueprint_id` `provision_provider_id`
   productConfigProvider / provisionProvider / provisionConfigurationProvider

   - https://api.staging.upmind.io/api/basket/products/5d085e69-d562-3719-7d6f-218e940d4237/provision_fields?client_id=20403869-6e54-721d-359f-518d9305e7d2&limit=0

10. Get the Domain search availability/status,
    - This is because domain is one of the provisioning fields
    - The domain search ui control triggers on mount
    - https://api.staging.upmind.io/api/modules/web_hosting/domains/search/status?no_cache=true&currency_id=e47d7382-4850-7931-56c8-1e642d59e063

For products with options...
Are we going to assume that the sub product has been given to us?
If not how do we handle the parent product being in the basket? Do we show the parent product, and then replace it when the subproduct has been selected? Or do we show both?
Is the parent actually the same as the first option? If so we can just ignore it and show the first option as the parent.
How does the api handle the parent product being in the basket? Does it just ignore it, consolidate it? Or does it show the parent product and the sub product?

<!-- ----------------------------------------------------------------------  -->

// update basket product: PUT
https://api.staging.upmind.io/api/orders/8d632507-9806-5d1e-342b-8174e234e98d/products/20403869-6e54-721d-264c-518d9305e7d2
payload:
{
"quantity": 2,
"product_id": "47d73824-8507-9315-345f-81e642d59e06",
"billing_cycle_months": 0,
"options": [],
"attributes": []
}

// remove basket product: DELETE

https://api.staging.upmind.io/api/orders/8d632507-9806-5d1e-342b-8174e234e98d/products/3de78642-de53-9714-77db-21208469530d

// check provisioning fields: PATCH
https://api.staging.upmind.io/api/orders/8d632507-9806-5d1e-342b-8174e234e98d/provision_fields/values/check
