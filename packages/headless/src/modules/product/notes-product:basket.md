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
https://api.staging.upmind.io/api/orders/8d632507-9806-5d1e-342b-8174e234e98d/provision_fields/model/check

// needsProvisioning: ({ product }) => {
// // provision_setup_field_defer_mode; hidden | inherit | none | optional
// const hasProvider = !!product.provision_provider_id;
// const hasConfig = false; //!!product.config;
// return hasProvider && !hasConfig;
// }

<!-- "BROKEN" add to basket-->
<!-- this returns ok/200 but does not actually add the product to the basket...hmmmm -->

curl 'https://api.staging.upmind.io/api/orders/2785d26e-9678-3d16-e0ea-314502e70439/products' \
 -H 'authority: api.staging.upmind.io' \
 -H 'accept: _/_' \
 -H 'accept-language: en-GB,en-US;q=0.9,en;q=0.8' \
 -H 'authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI2MzkiLCJqdGkiOiJmN2JjYmRjNjk5ZTU1MWI0OTM0NmMxYjk4YjAxYjk5OWY0ODYwZDc4ZWRhNzRiOGVlZjkyNmFlYTljZDBkYzdjOWNiYTgxZTIwNmMxM2FhYiIsImlhdCI6MTY5NzU0MTgwMSwibmJmIjoxNjk3NTQxODAxLCJleHAiOjE2OTc1NDU0MDEsInN1YiI6IiIsInNjb3BlcyI6W119.isxia7cM2nbKeo_gyuiIpKu5zL8CVg6tCYzSkyZ9zn4GvOqpnfZlK792jmBFwDPC39mhQI0QqUb-vvjv_ajwg2K0G8gM6d6aQY0cUledvMVsaO76Cyv6BX_8V-9huzKUtaVVHNcsnp3HWsw6d2d8bu7mcwK8bjPc82qTW6YrqkkmrJsrG8GtTiREIJL43PgLGBLrPyAYLjnzZtzdojX--4dgwe-cV3kd44JPL5v_ZeyevqbFMKbZGNYpsKMGLT_ETET63zx1gExPKn63rWrosM4J7UIaC7caXwQsPD-iGwxGHChc14Aat5g-g74tu7ol1h8Ar2X4uhhPPSnUYFw2RsQDGGmXySSVJ8a_Itpk589kMh_In8CvwF6QOmX02S60rqOoBlfv2_SzStw5728_fBeK43jffDZcd0XVP706D9L4b3GvboJs-S1SKCzJgWL9G_vrMuGyZlw0OrQKjFPwfPlrx1Iq67jmTcHSR9dPGYzVSYvzLGq3yZUjcmFSnG9ErlivczkgDR7R4dKZ4uUDhs5Is8I2S7g1aGTQDVOAQOWFklyhGDj_5Jwz4xYNWcUvjt1Cf0-HjYtKxRQAgoJZdyXkD_6z3ciWYkBu8Q7JValbLRenXe5MTZAsM9trxhyaNw3hktDbfy98QoJK0LyrSYOFScHZOvxDdMbWpEgkw9k' \
 -H 'cache-control: no-cache' \
 -H 'content-type: application/json' \
 -H 'dnt: 1' \
 -H 'origin: http://collabstudio.local:5173' \
 -H 'pragma: no-cache' \
 -H 'referer: http://collabstudio.local:5173/' \
 -H 'sec-ch-ua: "Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"' \
 -H 'sec-ch-ua-mobile: ?0' \
 -H 'sec-ch-ua-platform: "macOS"' \
 -H 'sec-fetch-dest: empty' \
 -H 'sec-fetch-mode: cors' \
 -H 'sec-fetch-site: cross-site' \
 -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36' \
 --data-raw '{"product_id":"47d73824-8507-9315-345f-81e642d59e06","quantity":1,"billing_cycle_months":0,"total":99.99}' \
 --compressed

fetch("https://api.staging.upmind.io/api/orders/2785d26e-9678-3d16-e0ea-314502e70439/products", {
"headers": {
"accept": "_/_",
"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
"authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI2MzkiLCJqdGkiOiJmN2JjYmRjNjk5ZTU1MWI0OTM0NmMxYjk4YjAxYjk5OWY0ODYwZDc4ZWRhNzRiOGVlZjkyNmFlYTljZDBkYzdjOWNiYTgxZTIwNmMxM2FhYiIsImlhdCI6MTY5NzU0MTgwMSwibmJmIjoxNjk3NTQxODAxLCJleHAiOjE2OTc1NDU0MDEsInN1YiI6IiIsInNjb3BlcyI6W119.isxia7cM2nbKeo_gyuiIpKu5zL8CVg6tCYzSkyZ9zn4GvOqpnfZlK792jmBFwDPC39mhQI0QqUb-vvjv_ajwg2K0G8gM6d6aQY0cUledvMVsaO76Cyv6BX_8V-9huzKUtaVVHNcsnp3HWsw6d2d8bu7mcwK8bjPc82qTW6YrqkkmrJsrG8GtTiREIJL43PgLGBLrPyAYLjnzZtzdojX--4dgwe-cV3kd44JPL5v_ZeyevqbFMKbZGNYpsKMGLT_ETET63zx1gExPKn63rWrosM4J7UIaC7caXwQsPD-iGwxGHChc14Aat5g-g74tu7ol1h8Ar2X4uhhPPSnUYFw2RsQDGGmXySSVJ8a_Itpk589kMh_In8CvwF6QOmX02S60rqOoBlfv2_SzStw5728_fBeK43jffDZcd0XVP706D9L4b3GvboJs-S1SKCzJgWL9G_vrMuGyZlw0OrQKjFPwfPlrx1Iq67jmTcHSR9dPGYzVSYvzLGq3yZUjcmFSnG9ErlivczkgDR7R4dKZ4uUDhs5Is8I2S7g1aGTQDVOAQOWFklyhGDj_5Jwz4xYNWcUvjt1Cf0-HjYtKxRQAgoJZdyXkD_6z3ciWYkBu8Q7JValbLRenXe5MTZAsM9trxhyaNw3hktDbfy98QoJK0LyrSYOFScHZOvxDdMbWpEgkw9k",
"cache-control": "no-cache",
"content-type": "application/json",
"pragma": "no-cache",
"sec-ch-ua": "\"Google Chrome\";v=\"117\", \"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"117\"",
"sec-ch-ua-mobile": "?0",
"sec-ch-ua-platform": "\"macOS\"",
"sec-fetch-dest": "empty",
"sec-fetch-mode": "cors",
"sec-fetch-site": "cross-site"
},
"referrer": "http://collabstudio.local:5173/",
"referrerPolicy": "strict-origin-when-cross-origin",
"body": "{\"product_id\":\"47d73824-8507-9315-345f-81e642d59e06\",\"quantity\":1,\"billing_cycle_months\":0,\"total\":99.99}",
"method": "POST",
"mode": "cors",
"credentials": "include"
});

<!-- NB we can use actors -->

map(state.value.context.items, item => {
const {state} = useActor(item);
return state;
// return {
// id: item.id,
// state
}
rodu
