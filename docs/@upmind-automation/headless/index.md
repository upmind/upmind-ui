[Upmind](../packages.md) / @upmind-automation/headless

# Upmind Headless

Upmind Headless is a JavaScript framework used within the Upmind ecosystem, specifically for client UI user journeys. It is responsible for generating state machines that control the flow of client information and interactions, and to manage what actions can be done for each state.

## Installation

Currently, there is no separate installation method for Upmind Headless. It is part of a package within a monorepo and can be consumed using standard ES6 `import` or `require` methods, configured using npm workspaces.

## Usage

See individual modules for usage details.

## Configuration

See individual modules for configuration details.

## API Documentation

See individual modules for API documentation.

## Examples

See individual modules for examples.

## Tests

Unit tests are written using [Vitest](https://vitest.dev/).

```
npm test
```

We also have unit tests code coverage provided by [@vitest/coverage-istanbul](https://www.npmjs.com/package/@vitest/coverage-istanbul).

## License

The **Upmind Headless** package is proprietary and closed source.

## Enumerations

| Enumeration | Description |
| ------ | ------ |
| [DomainTypes](enumerations/DomainTypes.md) | - |
| [GatewayCtx](enumerations/GatewayCtx.md) | - |
| [GatewayTypes](enumerations/GatewayTypes.md) | - |
| [messageDisplays](enumerations/messageDisplays.md) | - |
| [messageTypes](enumerations/messageTypes.md) | - |
| [ProductSortableProperties](enumerations/ProductSortableProperties.md) | - |
| [PromotionDisplayTypes](enumerations/PromotionDisplayTypes.md) | - |
| [RequestSortDirection](enumerations/RequestSortDirection.md) | - |
| [REQUIRES\_ACTION](enumerations/REQUIRES_ACTION.md) | - |
| [ROUTE](enumerations/ROUTE.md) | - |
| [UnifiedType](enumerations/UnifiedType.md) | - |
| [UpmindStatus](enumerations/UpmindStatus.md) | - |

## Classes

| Class | Description |
| ------ | ------ |
| [Upmind](classes/Upmind.md) | - |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [Address](interfaces/Address.md) | - |
| [AddressContext](interfaces/AddressContext.md) | - |
| [AddressModel](interfaces/AddressModel.md) | - |
| [Badge](interfaces/Badge.md) | - |
| [BasketContext](interfaces/BasketContext.md) | - |
| [BasketHelperContext](interfaces/BasketHelperContext.md) | - |
| [BasketProduct](interfaces/BasketProduct.md) | Represents a "configured" product with its configuration, pricing, and associated details. |
| [Benefit](interfaces/Benefit.md) | - |
| [BillingContext](interfaces/BillingContext.md) | - |
| [BillingModel](interfaces/BillingModel.md) | - |
| [Company](interfaces/Company.md) | - |
| [CompanyContext](interfaces/CompanyContext.md) | - |
| [CompanyModel](interfaces/CompanyModel.md) | - |
| [DataLayerEcommerce](interfaces/DataLayerEcommerce.md) | - |
| [DataLayerEcommerceItem](interfaces/DataLayerEcommerceItem.md) | DataLayerEcommerceItem |
| [DataLayerEcommerceItems](interfaces/DataLayerEcommerceItems.md) | - |
| [DataLayerPage](interfaces/DataLayerPage.md) | - |
| [DataLayerUser](interfaces/DataLayerUser.md) | - |
| [Email](interfaces/Email.md) | - |
| [EmailContext](interfaces/EmailContext.md) | - |
| [EmailModel](interfaces/EmailModel.md) | - |
| [Flow](interfaces/Flow.md) | - |
| [FormComposable](interfaces/FormComposable.md) | - |
| [Gateway](interfaces/Gateway.md) | - |
| [GatewayContext](interfaces/GatewayContext.md) | - |
| [IAuthTransfer](interfaces/IAuthTransfer.md) | - |
| [IBasketProductModel](interfaces/IBasketProductModel.md) | - |
| [IBasketSubproductModel](interfaces/IBasketSubproductModel.md) | - |
| [IMessage](interfaces/IMessage.md) | - |
| [IPhoneData](interfaces/IPhoneData.md) | - |
| [IProductConfig](interfaces/IProductConfig.md) | - |
| [Locale](interfaces/Locale.md) | - |
| [Message](interfaces/Message.md) | - |
| [MessageError](interfaces/MessageError.md) | - |
| [MessageModel](interfaces/MessageModel.md) | - |
| [MessagesContext](interfaces/MessagesContext.md) | - |
| [PageRoute](interfaces/PageRoute.md) | - |
| [PaginationInfo](interfaces/PaginationInfo.md) | - |
| [PaymentArgs](interfaces/PaymentArgs.md) | - |
| [PaymentContext](interfaces/PaymentContext.md) | - |
| [PaymentDetailModel](interfaces/PaymentDetailModel.md) | - |
| [PaymentDetailsArgs](interfaces/PaymentDetailsArgs.md) | - |
| [PaymentDetailsContext](interfaces/PaymentDetailsContext.md) | - |
| [Phone](interfaces/Phone.md) | - |
| [PhoneContext](interfaces/PhoneContext.md) | - |
| [PhoneModel](interfaces/PhoneModel.md) | - |
| [Price](interfaces/Price.md) | The price details for any price , allowing for gross/net and discount breakdowns Price |
| [ProductBundle](interfaces/ProductBundle.md) | - |
| [ProductConfigContext](interfaces/ProductConfigContext.md) | - |
| [ProductProps](interfaces/ProductProps.md) | Represents the product model used for configuration. This is the model that is built and verified by the schema |
| [QueryClient](interfaces/QueryClient.md) | - |
| [QueryResponse](interfaces/QueryResponse.md) | - |
| [QueryResponseError](interfaces/QueryResponseError.md) | - |
| [RecaptchaContext](interfaces/RecaptchaContext.md) | - |
| [Recommendation](interfaces/Recommendation.md) | Represents a "configured" product with its configuration, pricing, and associated details. |
| [RecommendationsEngineContext](interfaces/RecommendationsEngineContext.md) | - |
| [RelatedProduct](interfaces/RelatedProduct.md) | - |
| [RequestFilters](interfaces/RequestFilters.md) | - |
| [RequestPagination](interfaces/RequestPagination.md) | - |
| [RoutingEngineContext](interfaces/RoutingEngineContext.md) | - |
| [SessionTransfer](interfaces/SessionTransfer.md) | - |
| [Theme](interfaces/Theme.md) | - |
| [ThemeConfig](interfaces/ThemeConfig.md) | - |
| [ThemeTokens](interfaces/ThemeTokens.md) | - |
| [UIConfig](interfaces/UIConfig.md) | - |
| [UIMeta](interfaces/UIMeta.md) | - |
| [UIProductMeta](interfaces/UIProductMeta.md) | - |
| [UISchema](interfaces/UISchema.md) | - |
| [UploadContext](interfaces/UploadContext.md) | - |
| [UpmindProps](interfaces/UpmindProps.md) | - |
| [User](interfaces/User.md) | - |
| [ValidationErrorObject](interfaces/ValidationErrorObject.md) | - |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [AutocompleteSuggestions](type-aliases/AutocompleteSuggestions.md) | - |
| [BillingCycleFormats](type-aliases/BillingCycleFormats.md) | - |
| [DomainContext](type-aliases/DomainContext.md) | - |
| [DomainModel](type-aliases/DomainModel.md) | - |
| [DomainProduct](type-aliases/DomainProduct.md) | - |
| [DomainProps](type-aliases/DomainProps.md) | - |
| [DomainSearch](type-aliases/DomainSearch.md) | - |
| [ExternalError](type-aliases/ExternalError.md) | - |
| [GlobbedFiles](type-aliases/GlobbedFiles.md) | - |
| [InfiniteQueryPage](type-aliases/InfiniteQueryPage.md) | Represents the structure of a single page returned from an infinite query's queryFn. |
| [MutationParams](type-aliases/MutationParams.md) | - |
| [Place](type-aliases/Place.md) | - |
| [PlacePrediction](type-aliases/PlacePrediction.md) | - |
| [PlacePredictions](type-aliases/PlacePredictions.md) | - |
| [PlaceService](type-aliases/PlaceService.md) | - |
| [PriceCalculations](type-aliases/PriceCalculations.md) | - |
| [PriceDetail](type-aliases/PriceDetail.md) | The price details for any price that is displayed in the UI We also provide all the necessary price breakdowns for display and tracking purposes The Individual unit price, both gross and net: Individual unit prices are the base price of the product, before any adjustments or quantity modifiers The Configuration price, both gross and net: Configuration prices are the total price of the product, including any adjustments or quantity modifiers |
| [PriceDisplay](type-aliases/PriceDisplay.md) | The display price structure for any price that is displayed in the UI We will always provide the price details: Based on the TOTAL CONFIGURATION which could be GROSS OR NET based on the Brands settings This would include quantity modifier, discounts, and any other adjustments Effectively this is the price that should be shown to the customer |
| [Product](type-aliases/Product.md) | Represents a "configured" product with its configuration, pricing, and associated details. |
| [ProductBreadcrumb](type-aliases/ProductBreadcrumb.md) | - |
| [ProductBundles](type-aliases/ProductBundles.md) | - |
| [ProductCategory](type-aliases/ProductCategory.md) | - |
| [ProductDetails](type-aliases/ProductDetails.md) | Represents the actual store product being configured. |
| [ProductImage](type-aliases/ProductImage.md) | - |
| [ProductModel](type-aliases/ProductModel.md) | Represents the product model used for configuration. This is the model that is built and verified by the schema |
| [ProductSummary](type-aliases/ProductSummary.md) | - |
| [ProductSummaryDetail](type-aliases/ProductSummaryDetail.md) | - |
| [ProductSummaryDetailWithPrice](type-aliases/ProductSummaryDetailWithPrice.md) | - |
| [ProductSummaryMeta](type-aliases/ProductSummaryMeta.md) | - |
| [PromotionDetails](type-aliases/PromotionDetails.md) | - |
| [PromotionModel](type-aliases/PromotionModel.md) | - |
| [QueryParams](type-aliases/QueryParams.md) | - |
| [QueryProps](type-aliases/QueryProps.md) | - |
| [RawInfiniteQueryData](type-aliases/RawInfiniteQueryData.md) | The raw data structure provided by TanStack's `useInfiniteQuery` to the `select` function before transformation. |
| [ReactiveQueryKeys](type-aliases/ReactiveQueryKeys.md) | - |
| [RequestParams](type-aliases/RequestParams.md) | - |
| [Route](type-aliases/Route.md) | - |
| [RouteQueryParams](type-aliases/RouteQueryParams.md) | - |
| [SubproductDetails](type-aliases/SubproductDetails.md) | - |
| [SubproductModel](type-aliases/SubproductModel.md) | - |
| [SubproductModelValue](type-aliases/SubproductModelValue.md) | - |
| [SubproductValue](type-aliases/SubproductValue.md) | - |
| [Target](type-aliases/Target.md) | - |
| [TermDetails](type-aliases/TermDetails.md) | - |
| [ThemeConfigValue](type-aliases/ThemeConfigValue.md) | - |
| [UseBasket](type-aliases/UseBasket.md) | - |
| [UseBasketBilling](type-aliases/UseBasketBilling.md) | The return type of composable. |
| [UseBasketCurrency](type-aliases/UseBasketCurrency.md) | The return type of useBasketCurrency composable. |
| [UseBasketFields](type-aliases/UseBasketFields.md) | The return type of useBasketFields composable. |
| [UseBasketProduct](type-aliases/UseBasketProduct.md) | - |
| [UseBasketProductPending](type-aliases/UseBasketProductPending.md) | - |
| [UseBasketPromotions](type-aliases/UseBasketPromotions.md) | The return type of useBasketPromotions composable. |
| [UseBrand](type-aliases/UseBrand.md) | The return type of useBrand composable. |
| [UseClientAddress](type-aliases/UseClientAddress.md) | The return type of the composable. |
| [UseClientAddresses](type-aliases/UseClientAddresses.md) | - |
| [UseClientCompanies](type-aliases/UseClientCompanies.md) | - |
| [UseClientCompany](type-aliases/UseClientCompany.md) | The return type of the composable. |
| [UseClientEmail](type-aliases/UseClientEmail.md) | The return type of the composable. |
| [UseClientEmails](type-aliases/UseClientEmails.md) | - |
| [UseClientPhone](type-aliases/UseClientPhone.md) | The return type of the composable. |
| [UseClientPhones](type-aliases/UseClientPhones.md) | - |
| [UseDataLayer](type-aliases/UseDataLayer.md) | The return type of useBrand composable. |
| [UseDomain](type-aliases/UseDomain.md) | The return type of useDomain composable. |
| [UseInvoice](type-aliases/UseInvoice.md) | - |
| [useLocale](type-aliases/useLocale.md) | The return type of useSystem composable. |
| [UsePayment](type-aliases/UsePayment.md) | The return type of usePayment composable. |
| [UsePaymentDetails](type-aliases/UsePaymentDetails.md) | The return type of usePaymentDetails composable. |
| [UsePaymentGateway](type-aliases/UsePaymentGateway.md) | The return type of usePaymentGateway composable. |
| [UseProductCatalogue](type-aliases/UseProductCatalogue.md) | - |
| [UseProductCategories](type-aliases/UseProductCategories.md) | - |
| [UseProductConfig](type-aliases/UseProductConfig.md) | - |
| [UseProductConfigMeta](type-aliases/UseProductConfigMeta.md) | - |
| [useRecaptcha](type-aliases/useRecaptcha.md) | The return type of useSystem composable. |
| [UseRecommendations](type-aliases/UseRecommendations.md) | The return type of the `useRecommendations` composable, ensuring type safety for consumers. |
| [UseSession](type-aliases/UseSession.md) | The return type of useSession composable. |
| [UseSystem](type-aliases/UseSystem.md) | The return type of useSystem composable. |
| [UseTermsAndConditions](type-aliases/UseTermsAndConditions.md) | - |
| [UseTracking](type-aliases/UseTracking.md) | The return type of useTracking composable. |
| [UseTransfer](type-aliases/UseTransfer.md) | The return type of useTransfer composable. |
| [useUpload](type-aliases/useUpload.md) | Return type for useUpload composable. |

## Variables

| Variable | Description |
| ------ | ------ |
| [ADDRESS\_TYPE\_KEYS](variables/ADDRESS_TYPE_KEYS.md) | - |
| [AddressTypes](variables/AddressTypes.md) | - |
| [default](variables/default.md) | - |
| [EmailTypes](variables/EmailTypes.md) | - |
| [localStoragePersister](variables/localStoragePersister.md) | A persister object used to synchronize query cache data with the browser's localStorage. |
| [PAGINATION](variables/PAGINATION.md) | - |

## Functions

| Function | Description |
| ------ | ------ |
| [canRetryAuthorization](functions/canRetryAuthorization.md) | - |
| [cleanQueryKey](functions/cleanQueryKey.md) | - |
| [handleError](functions/handleError.md) | Handles errors from a query response by displaying a feedback message and throwing a detailed error. |
| [invalidateQueryByKey](functions/invalidateQueryByKey.md) | Invalidate a query by its key. Perfect for invalidating a query after a mutation on a thenable |
| [parseBillingCycle](functions/parseBillingCycle.md) | Maps a billing cycle duration in months to various descriptive formats. |
| [parseData](functions/parseData.md) | Parse the data to be sent in the request body (e.g. JSON.stringify) |
| [resetQueryByKey](functions/resetQueryByKey.md) | - |
| [storePersister](functions/storePersister.md) | - |
| [useBasket](functions/useBasket.md) | - |
| [useBasketBilling](functions/useBasketBilling.md) | - |
| [useBasketCurrency](functions/useBasketCurrency.md) | - |
| [useBasketFields](functions/useBasketFields.md) | - |
| [useBasketFlows](functions/useBasketFlows.md) | - |
| [useBasketPaymentDetails](functions/useBasketPaymentDetails.md) | - |
| [useBasketPaymentGateway](functions/useBasketPaymentGateway.md) | - |
| [useBasketProduct](functions/useBasketProduct.md) | - |
| [useBasketProductPending](functions/useBasketProductPending.md) | - |
| [useBasketProducts](functions/useBasketProducts.md) | - |
| [useBasketProductsPending](functions/useBasketProductsPending.md) | - |
| [useBasketPromotions](functions/useBasketPromotions.md) | - |
| [useBrand](functions/useBrand.md) | - |
| [useCheckoutFlows](functions/useCheckoutFlows.md) | - |
| [useClientAddress](functions/useClientAddress.md) | - |
| [useClientAddresses](functions/useClientAddresses.md) | - |
| [useClientCompanies](functions/useClientCompanies.md) | - |
| [useClientCompany](functions/useClientCompany.md) | - |
| [useClientEmail](functions/useClientEmail.md) | - |
| [useClientEmails](functions/useClientEmails.md) | - |
| [useClientPhone](functions/useClientPhone.md) | - |
| [useClientPhones](functions/useClientPhones.md) | - |
| [useClientSlots](functions/useClientSlots.md) | - |
| [useClientTemplate](functions/useClientTemplate.md) | - |
| [useDataLayer](functions/useDataLayer.md) | Composable for managing the data layer for tracking and analytics. |
| [useDomain](functions/useDomain.md) | Composable for managing domain selection and search logic using XState and Vue. Provides state, context, and helpers for domain-related flows (DAC, existing, basket). |
| [useFeedback](functions/useFeedback.md) | - |
| [useI18n](functions/useI18n.md) | - |
| [useInvoice](functions/useInvoice.md) | Composable to manage a single invoice. It provides methods to load and manage the state of an invoice. |
| [useLocale](functions/useLocale.md) | - |
| [useLocalisation](functions/useLocalisation.md) | - |
| [useMessage](functions/useMessage.md) | This is a helper function to extract the message from an actor item. It is used to simplify the extraction of message properties from the feedback machine. |
| [useOrder](functions/useOrder.md) | Composable to manage a single order. It provides methods to load and manage the state of an order. This is an alias for useInvoice, as orders are a type of invoice. |
| [useOrderFlows](functions/useOrderFlows.md) | - |
| [usePayment](functions/usePayment.md) | - |
| [usePaymentDetails](functions/usePaymentDetails.md) | A composable function that provides access to the payment gateway actor. |
| [usePaymentGateway](functions/usePaymentGateway.md) | A composable function that provides access to the payment gateway actor. |
| [usePlaces](functions/usePlaces.md) | Hook to access Google Places API placess This provides access to address searching and parsing functions. |
| [useProductCatalogue](functions/useProductCatalogue.md) | Composable to manage the product catalogue. It provides methods to filter, sort, and retrieve products from the catalogue. |
| [useProductCategories](functions/useProductCategories.md) | - |
| [useProductConfig](functions/useProductConfig.md) | - |
| [useProductFlows](functions/useProductFlows.md) | - |
| [useProductRecommendations](functions/useProductRecommendations.md) | This composable is used to manage the product recommendations for a specific product. It uses the recommendations engine to fetch and manage the recommendations. NB: Only recommendations that originate from the specified product will be available. This is useful for displaying recommendations on the product detail page, or after adding to the basket |
| [useProductsRequiringAction](functions/useProductsRequiringAction.md) | - |
| [useQuery](functions/useQuery.md) | - |
| [useQueryParams](functions/useQueryParams.md) | - |
| [useRecaptcha](functions/useRecaptcha.md) | - |
| [useRecommendations](functions/useRecommendations.md) | - |
| [useRecommendationsFlows](functions/useRecommendationsFlows.md) | - |
| [useRouteQueryParams](functions/useRouteQueryParams.md) | - |
| [useRouteRequiresAction](functions/useRouteRequiresAction.md) | - |
| [useRoutingEngine](functions/useRoutingEngine.md) | - |
| [useRoutingFlows](functions/useRoutingFlows.md) | - |
| [useSession](functions/useSession.md) | Composable function to manage session-related logic using Vue. It provides state, context and helpers for session, login and registration processes. |
| [useSessionFlows](functions/useSessionFlows.md) | - |
| [useSystem](functions/useSystem.md) | The `useSystem` composable provides a simple interface to interact with the system API and includes utility methods for fetching data. |
| [useTermsAndConditions](functions/useTermsAndConditions.md) | Composable to get the current terms and conditions. |
| [useTheming](functions/useTheming.md) | Composable for consolidating brand theme information with any provided themes through the upmind initialisation |
| [useTracking](functions/useTracking.md) | - |
| [useTransfer](functions/useTransfer.md) | Composable function to manage session-related logic using Vue. It provides state, context and helpers for session, login and registration processes. |
| [useUpload](functions/useUpload.md) | - |
