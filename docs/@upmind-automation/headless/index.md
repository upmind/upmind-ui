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
| [BreadcrumbVariant](enumerations/BreadcrumbVariant.md) | - |
| [DomainTypes](enumerations/DomainTypes.md) | Enumeration defining the different types of domain management flows. These types dictate the user interface, available actions, and underlying logic for how a customer interacts with domain names, e.g. registering a new one, transferring an existing one, or using one from their basket. |
| [messageDisplays](enumerations/messageDisplays.md) | Enumeration defining the various display methods for messages within the UI. This dictates how and where a message (e.g. error, success notification) will be presented to the user. |
| [messageTypes](enumerations/messageTypes.md) | Enumeration defining the different types of messages based on their severity or purpose. This is used for styling and categorisation of alerts. |
| [ProductSortableProperties](enumerations/ProductSortableProperties.md) | Properties by which products can be sorted. |
| [PromotionDisplayTypes](enumerations/PromotionDisplayTypes.md) | - |
| [RequestSortDirection](enumerations/RequestSortDirection.md) | Enumeration defining the direction for sorting query results. |
| [REQUIRES\_ACTION](enumerations/REQUIRES_ACTION.md) | Enumeration representing various states or conditions that may require an action to be taken by the user or system. This is often used in contexts like product configuration, order validation, or resource management. |
| [ROUTE](enumerations/ROUTE.md) | Enumeration representing predefined application routes and navigational paths. These routes are used consistently throughout the Upmind frontend for navigation, deep linking, and managing application state transitions. |
| [UnifiedType](enumerations/UnifiedType.md) | Enumeration representing the two primary types of unified profiles or entities: 'personal' for individual clients and 'business' for corporate or organisational clients. This helps in distinguishing the nature of a client's profile for the appropriate data handling and form rendering. |
| [UpmindStatus](enumerations/UpmindStatus.md) | Enumeration representing the initialisation status of the Upmind instance. |

## Classes

| Class | Description |
| ------ | ------ |
| [Upmind](classes/Upmind.md) | The core Upmind class, responsible for initialising and orchestrating all headless modules and plugins. It acts as a singleton entry point for configuring the Upmind headless library within a Vue application. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [Address](interfaces/Address.md) | Interface representing a comprehensive address object, extending [AddressModel](interfaces/AddressModel.md) with additional identifiers, contextual information, and meta-data about the address. This is typically used for addresses retrieved from the API or displayed in the UI. |
| [AddressContext](interfaces/AddressContext.md) | Interface representing the context for address management within a client item context. It extends `ClientItemContext` with specific data relevant to address operations, such as geographical lookups. |
| [AddressModel](interfaces/AddressModel.md) | Interface representing the data model for an address, suitable for forms or API payloads. It encapsulates the core geographical details of an address. |
| [Badge](interfaces/Badge.md) | Interface representing a badge that can be displayed with a product or recommendation. Badges provide quick visual cues or additional descriptive labels. |
| [BasketContext](interfaces/BasketContext.md) | Interface representing the context for the main shopping basket, typically managed by an XState machine. It holds the entire state of the basket, including its products, summary, errors, and references to spawned child actors for managing related concerns like billing, currency, and promotions. |
| [BasketHelperContext](interfaces/BasketHelperContext.md) | Interface representing the context for a basket helper, which facilitates the conversion and management of products between a generic type `T` and the specific `IBasketProduct` format required by the basket. |
| [BasketProduct](interfaces/BasketProduct.md) | Interface representing a product that is already in the shopping basket. It extends the base [Product](type-aliases/Product.md) interface and guarantees the presence of an `id`. |
| [Benefit](interfaces/Benefit.md) | Interface representing a benefit associated with a product. |
| [BillingContext](interfaces/BillingContext.md) | Interface representing the context for billing management, typically managed by an XState machine. It holds the state for billing forms, including the data model, schema definitions, and configuration settings derived from brand keys. |
| [BillingModel](interfaces/BillingModel.md) | Interface representing the data model for billing information, typically used in checkout forms. This model holds the identifiers for the selected address, company, and phone. |
| [Company](interfaces/Company.md) | Interface representing a comprehensive company object, typically retrieved from the API. It extends [CompanyModel](interfaces/CompanyModel.md) with additional identifiers, computed display fields, detailed tax information, and meta-data about the company's status. |
| [CompanyContext](interfaces/CompanyContext.md) | Interface representing the context for company management within a client item context. It extends `ClientItemContext` with specific data relevant to company operations, such as associated addresses, emails, phones, and geographical lookups. |
| [CompanyModel](interfaces/CompanyModel.md) | Interface representing the data model for a company, suitable for forms or API payloads. It encapsulates core company details and their associated address, email, and phone references. |
| [DataLayerEcommerce](interfaces/DataLayerEcommerce.md) | Interface representing e-commerce purchase or transaction data to be pushed to the data layer. This typically follows the Google Analytics Enhanced E-commerce schema for purchase events. |
| [DataLayerEcommerceItem](interfaces/DataLayerEcommerceItem.md) | Interface representing a single e-commerce item within the data layer. |
| [DataLayerEcommerceItems](interfaces/DataLayerEcommerceItems.md) | Interface representing a collection of e-commerce items, often used for add_to_cart, remove_from_cart, or view_item_list events, which require currency and total value information. |
| [DataLayerPage](interfaces/DataLayerPage.md) | Interface representing page-specific data to be pushed to the data layer. This helps track navigation, page views, and contextual information about the current page. |
| [DataLayerUser](interfaces/DataLayerUser.md) | Interface representing user-specific data to be pushed to the data layer. This can include anonymised user IDs, login status, or other user attributes for analytics. |
| [DomainContext](interfaces/DomainContext.md) | Interface representing the context for the domain management XState machine. It holds the state for domain availability checks, existing domains, basket integration, search queries, and related lookups. |
| [Email](interfaces/Email.md) | Interface representing a comprehensive email object, extending [EmailModel](interfaces/EmailModel.md) with additional identifiers, computed display fields, and meta-data about its status. This is typically used for email addresses retrieved from the API or displayed in the UI. |
| [EmailContext](interfaces/EmailContext.md) | Interface representing the context for email management within a client item context. It extends `ClientItemContext` with specific data relevant to email operations. |
| [EmailModel](interfaces/EmailModel.md) | Interface representing the data model for an email address, suitable for forms or API payloads. |
| [Flow](interfaces/Flow.md) | Interface representing a navigational flow within the application, defining a sequence of routes, guards, and resolution logic for complex user journeys. |
| [FormComposable](interfaces/FormComposable.md) | Interface representing the API of a generic form composable. This contract defines common methods and properties expected from composables that manage form state, data, and interactions, typically backed by an XState machine. |
| [IAuthTransfer](interfaces/IAuthTransfer.md) | Interface representing the data for an authenticated session transfer. This is used to securely transfer session context between different parts of an application or between micro-frontends. |
| [IBasketProductModel](interfaces/IBasketProductModel.md) | Interface representing the data model for a product when it's being added to or configured within the shopping basket. It includes core product details and optional configurations for attributes, options, provisioning, and promotions. |
| [IBasketSubproductModel](interfaces/IBasketSubproductModel.md) | Interface representing the data model for a subproduct within a basket product. This defines how subproducts (like add-ons or options) are structured when being added or configured in the basket. |
| [IMessage](interfaces/IMessage.md) | Interface representing a message object as typically retrieved from a backend API. This includes unique identifiers, content, and translation metadata. |
| [IPhoneData](interfaces/IPhoneData.md) | Interface representing parsed phone number data, typically from a phone number parsing utility. |
| [IProductConfig](interfaces/IProductConfig.md) | Interface representing raw product configuration properties, typically passed from a backend API or extracted from URL parameters. |
| [Locale](interfaces/Locale.md) | Interface representing a collection of loaded locale messages. The keys are locale codes (e.g. "en-GB", "es"), and their values are objects containing translation keys and their corresponding strings. |
| [Message](interfaces/Message.md) | Interface representing a client-side message object for display in the UI. It contains content, display preferences, and optional actions. |
| [MessageError](interfaces/MessageError.md) | Interface representing a structured error object, typically used for displaying error messages from API responses or internal validation. |
| [MessageModel](interfaces/MessageModel.md) | Interface representing a client-side model for an [IMessage](interfaces/IMessage.md), simplifying the structure for UI consumption. |
| [MessagesContext](interfaces/MessagesContext.md) | Interface representing the context for a message management system, typically managed by an XState machine. It holds references to active message actors. |
| [PageRoute](interfaces/PageRoute.md) | Interface representing details about a page route, typically including both the target route and the route from which the navigation originated. |
| [PaginationInfo](interfaces/PaginationInfo.md) | Interface representing comprehensive pagination information, typically returned by an API to describe the current state of paginated results. |
| [PaymentArgs](interfaces/PaymentArgs.md) | Interface representing the arguments required to initiate a payment. These details are essential for processing a transaction. |
| [PaymentContext](interfaces/PaymentContext.md) | Interface representing the context for a payment operation, typically managed by an XState machine. It extends [PaymentArgs](interfaces/PaymentArgs.md) with additional details for handling payment cancellations, approvals, and tracking the payment attempt itself. |
| [PaymentDetailsAddArgs](interfaces/PaymentDetailsAddArgs.md) | - |
| [PaymentDetailsArgs](interfaces/PaymentDetailsArgs.md) | Interface representing the arguments required to initialise payment details context. These details provide the necessary context for payment forms and gateway interactions. |
| [PaymentDetailsContext](interfaces/PaymentDetailsContext.md) | Interface representing the context for payment details management, typically managed by an XState machine. It extends [PaymentDetailsArgs](interfaces/PaymentDetailsArgs.md) with a comprehensive set of properties for handling available gateways, payment types, stored methods, wallet balance, form schemas, and error states. |
| [Phone](interfaces/Phone.md) | Interface representing a comprehensive phone object, extending [PhoneModel](interfaces/PhoneModel.md) with additional identifiers, computed display fields, and meta-data about its status. This is typically used for phone numbers retrieved from the API or displayed in the UI. |
| [PhoneContext](interfaces/PhoneContext.md) | Interface representing the context for phone number management within a client item context. It extends `ClientItemContext` with specific data relevant to phone operations, such as geographical country context for phone number formatting and validation. |
| [PhoneModel](interfaces/PhoneModel.md) | Interface representing the data model for a phone number, suitable for forms or API payloads. |
| [Price](interfaces/Price.md) | The price details for any price, allowing for gross/net and discount breakdowns. |
| [ProductBundle](interfaces/ProductBundle.md) | Interface representing a product bundle, extending IRelatedObject. |
| [ProductConfigContext](interfaces/ProductConfigContext.md) | Interface representing the context for product configuration, typically managed by an XState machine. It holds the state for configuring a single product, including its model, lookups, pricing, and associated errors. |
| [ProductProps](interfaces/ProductProps.md) | Interface defining the properties required to create or configure a product. It extends [ProductModel](type-aliases/ProductModel.md) with additional client, currency, and promotion details. |
| [QueryClient](interfaces/QueryClient.md) | - |
| [QueryResponse](interfaces/QueryResponse.md) | Interface representing a standardised response structure from an API query. It encapsulates the status, data, total count, error, and messages. |
| [QueryResponseError](interfaces/QueryResponseError.md) | Interface representing a structured error response from an API query. |
| [RecaptchaContext](interfaces/RecaptchaContext.md) | Interface representing the context for Google reCAPTCHA integration, typically managed by an XState machine. It holds the reCAPTCHA site key, the `grecaptcha` object, the generated token, and any associated errors. |
| [Recommendation](interfaces/Recommendation.md) | Interface representing a single product recommendation, extending a base `Product` with additional details specific to recommendations, such as pricing, configuration, and meta-information for tracking. |
| [RecommendationsEngineContext](interfaces/RecommendationsEngineContext.md) | Interface representing the context for the recommendation engine, typically managed by an XState machine. It holds the list of recommendations, raw product data, relationships, and various helper functions and references for basket integration. |
| [RelatedProduct](interfaces/RelatedProduct.md) | Interface representing a product that is related to another product, extending `IRelatedObject` with additional display fields and augmented product data. This is used to define and enrich connections between products for recommendations. |
| [RequestFilters](interfaces/RequestFilters.md) | Interface representing a collection of filter parameters for a request. It's a record where keys are filter names and values are the filter criteria. |
| [RequestPagination](interfaces/RequestPagination.md) | Interface representing pagination parameters for a request. |
| [RoutingEngineContext](interfaces/RoutingEngineContext.md) | Interface representing the context for the routing engine, typically managed by an XState machine. It holds the state of active flows, current route, and references to other services. |
| [SessionTransfer](interfaces/SessionTransfer.md) | Interface representing the details of an active or pending session transfer. |
| [Theme](interfaces/Theme.md) | Interface representing a complete theme configuration, combining a name, optional icon, and specific UI and token settings. |
| [ThemeConfig](interfaces/ThemeConfig.md) | Interface representing the overall theme configuration, mapping component names to their respective [ThemeConfigValue](type-aliases/ThemeConfigValue.md) settings. This allows for granular styling of different parts of the UI. |
| [ThemeTokens](interfaces/ThemeTokens.md) | Interface representing theme tokens, which are the fundamental design system values like colours, typography, spacing, and border radii. These are typically inferred from a `tokens.json` file or a design system definition. |
| [UIConfig](interfaces/UIConfig.md) | Interface representing general UI configuration settings. |
| [UIMeta](interfaces/UIMeta.md) | Interface representing UI meta-data for a product or view. It encapsulates configurations for UI elements, related items, and product-specific overrides. |
| [UIProductMeta](interfaces/UIProductMeta.md) | Interface representing UI meta-data specific to a product, allowing for granular control over how product components are displayed in the user interface. |
| [UISchema](interfaces/UISchema.md) | Interface representing a UI Schema for form rendering. It provides configurations for billing, grouping, and other form-specific UI aspects. |
| [UploadContext](interfaces/UploadContext.md) | Interface representing the context for managing file uploads, typically used with an XState machine. This context holds information about the upload field, allowed file types, progress, request/response details, and any errors encountered. |
| [UpmindProps](interfaces/UpmindProps.md) | Interface defining the properties required to initialise the Upmind instance. These properties configure various aspects of the headless library, including mode, debugging, analytics, routing, internationalisation, and theming. |
| [User](interfaces/User.md) | Interface representing the profile and authentication details of an authenticated user. |
| [ValidationErrorObject](interfaces/ValidationErrorObject.md) | Re-exports the `ErrorObject` type from `ajv` as `ValidationErrorObject` for clarity in form validation contexts. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [AutocompleteSuggestions](type-aliases/AutocompleteSuggestions.md) | Type alias for an array of Google Maps Autocomplete suggestions. This is the raw type returned by the Google Places API for autocomplete queries. |
| [BillingCycleFormats](type-aliases/BillingCycleFormats.md) | Type alias for various formats of billing cycle descriptions. |
| [DomainModel](type-aliases/DomainModel.md) | Represents the core data model for a domain name, including its parts and type. This is used internally to manage the state of domains being processed. |
| [DomainProduct](type-aliases/DomainProduct.md) | Represents a [Product](type-aliases/Product.md) specifically for domain management, augmented with domain-specific meta-information like availability, ownership, and selection status. It extends [Product](type-aliases/Product.md) and omits `selected` from `DomainModel` to merge `meta`. |
| [DomainProps](type-aliases/DomainProps.md) | Type alias for options that configure the behaviour of the `useDomain` composable, specifically the [DomainTypes](enumerations/DomainTypes.md) to manage. |
| [ExternalError](type-aliases/ExternalError.md) | Type alias for external error structures, typically from validation or API responses. |
| [Gateway](type-aliases/Gateway.md) | - |
| [GatewayContext](type-aliases/GatewayContext.md) | - |
| [GatewayParams](type-aliases/GatewayParams.md) | - |
| [GenericGatewayContext](type-aliases/GenericGatewayContext.md) | - |
| [GlobbedFiles](type-aliases/GlobbedFiles.md) | Type alias representing the structure of files loaded via a glob import in a JavaScript/TypeScript module system (e.g. Vite's `import.meta.glob`). This type is flexible to accommodate different glob import patterns, either direct message objects or dynamic import functions. |
| [InfiniteQueryPage](type-aliases/InfiniteQueryPage.md) | Represents the structure of a single page returned from an infinite query's `queryFn`. This type is used internally by the `useInfiniteQuery` hook. |
| [MutationParams](type-aliases/MutationParams.md) | Type alias defining parameters for TanStack Query's `useMutation` hook, extending [RequestParams](type-aliases/RequestParams.md) with `MutationObserverOptions` and omitting `mutationFn`, which is handled internally. |
| [PaymentDetail](type-aliases/PaymentDetail.md) | - |
| [PaymentDetailData](type-aliases/PaymentDetailData.md) | - |
| [PaymentDetailModel](type-aliases/PaymentDetailModel.md) | - |
| [Place](type-aliases/Place.md) | Represents a geographical place with basic identification and address details. This structure is used for displaying search results or selected locations. |
| [PlacePrediction](type-aliases/PlacePrediction.md) | Type alias representing a simplified place prediction object, extracted from Google Maps Place Prediction results for easier display in UI components. |
| [PlacePredictions](type-aliases/PlacePredictions.md) | Type alias for an array of Google Maps Place Prediction objects. These are the results returned from a Google Places Autocomplete request. |
| [PlaceService](type-aliases/PlaceService.md) | Type alias representing the structure of the Google Maps Places service object, providing access to core classes and constructors for Places API functionality. This allows for instantiation of Google Maps Places objects within the application. |
| [PriceCalculations](type-aliases/PriceCalculations.md) | Type alias for displaying price calculation states. |
| [PriceDetail](type-aliases/PriceDetail.md) | The full price details for any product or item displayed in the UI. This type extends [PriceDisplay](type-aliases/PriceDisplay.md) and provides additional breakdowns for display and tracking purposes, including individual unit prices (gross and net) and the total configuration price (gross and net). |
| [PriceDisplay](type-aliases/PriceDisplay.md) | The display price structure for any price that is shown in the UI. This structure always provides full price details based on the total configuration, which may be gross or net depending on brand settings. It includes quantity modifiers, discounts, and any other adjustments. Essentially, this is the final price that should be presented to the customer. |
| [Product](type-aliases/Product.md) | Represents a "configured" product with its configuration, pricing, and associated details. This type aggregates all information necessary for displaying and managing a product in various contexts, such as a product page or shopping basket. |
| [ProductBreadcrumb](type-aliases/ProductBreadcrumb.md) | Type alias for a product breadcrumb item, used for navigational paths. |
| [ProductBundles](type-aliases/ProductBundles.md) | Type alias for a collection of product bundles. |
| [ProductCategory](type-aliases/ProductCategory.md) | - |
| [ProductDetails](type-aliases/ProductDetails.md) | Represents the actual store product details, typically retrieved from the API. This contains all the displayable and configurable information for a product. |
| [ProductImage](type-aliases/ProductImage.md) | Type alias for a product image. |
| [ProductModel](type-aliases/ProductModel.md) | Represents the product model used for configuration, which is built and verified by a schema. This is the core data structure for configuring a product's attributes, options, and provision fields. |
| [ProductSummary](type-aliases/ProductSummary.md) | Type alias for a product summary, aggregating key pricing and detail information. |
| [ProductSummaryDetail](type-aliases/ProductSummaryDetail.md) | Type alias for a product summary detail, providing name, title, cycle, and meta-information. |
| [ProductSummaryDetailWithPrice](type-aliases/ProductSummaryDetailWithPrice.md) | Type alias for a product summary detail that also includes pricing information. |
| [ProductSummaryMeta](type-aliases/ProductSummaryMeta.md) | Type alias for meta-information about a product summary. |
| [PromotionDetails](type-aliases/PromotionDetails.md) | Type alias for detailed information about a promotion. |
| [PromotionModel](type-aliases/PromotionModel.md) | Type alias for a promotion model, containing the promotion code. |
| [QueryParams](type-aliases/QueryParams.md) | Type alias defining parameters for TanStack Query's `useQuery` hook, extending [RequestParams](type-aliases/RequestParams.md) with `QueryObserverOptions` and omitting `queryFn` and `initialData`, which are handled internally. |
| [QueryProps](type-aliases/QueryProps.md) | Type alias defining common properties for API queries, including sorting, filtering, and pagination. |
| [ReactiveQueryKeys](type-aliases/ReactiveQueryKeys.md) | Type alias for reactive query keys used to create dynamic query keys for TanStack Query. This allows query keys to automatically update based on reactive sources. |
| [RequestParams](type-aliases/RequestParams.md) | Type alias defining the parameters for an API request, combining [QueryProps](type-aliases/QueryProps.md) with additional request-specific options. |
| [Route](type-aliases/Route.md) | Type alias for a generic route object, providing common properties found in router configurations. |
| [RouteQueryParams](type-aliases/RouteQueryParams.md) | - |
| [SubproductDetails](type-aliases/SubproductDetails.md) | Type alias for detailed information about a subproduct. |
| [SubproductModel](type-aliases/SubproductModel.md) | Type alias for a subproduct model, structured as a nested record to organise subproducts by category ID and then by their value ID. |
| [SubproductModelValue](type-aliases/SubproductModelValue.md) | Type alias for a subproduct model value, defining the configuration for a single subproduct instance. |
| [SubproductValue](type-aliases/SubproductValue.md) | Type alias for a specific value/option of a subproduct, extending [ProductDetails](type-aliases/ProductDetails.md). |
| [Target](type-aliases/Target.md) | Type alias for a navigational target, which can be either a predefined `ROUTE` enum member or a more complex object defining guard, resolve, and meta properties. |
| [TermDetails](type-aliases/TermDetails.md) | Type alias for term-specific details in a product summary, including pricing and tax display options. |
| [ThemeConfigValue](type-aliases/ThemeConfigValue.md) | Represents a configuration value for a UI theme. This can be a direct value (e.g. a string for a CSS class generated by `cva`, or a colour code), or a nested object representing a configuration for a specific component or part of a component. |
| [UseBasket](type-aliases/UseBasket.md) | Represents the type definition for the `useBasket` hook. |
| [UseBasketBilling](type-aliases/UseBasketBilling.md) | The return type of composable. |
| [UseBasketCurrency](type-aliases/UseBasketCurrency.md) | Represents the return type of the `useBasketCurrency` function. |
| [UseBasketFields](type-aliases/UseBasketFields.md) | The return type of useBasketFields composable. |
| [UseBasketProduct](type-aliases/UseBasketProduct.md) | Represents the type definition for the return value of the `useBasketProduct` function. |
| [UseBasketProductPending](type-aliases/UseBasketProductPending.md) | - |
| [UseBasketPromotions](type-aliases/UseBasketPromotions.md) | The return type of useBasketPromotions composable. |
| [UseBrand](type-aliases/UseBrand.md) | Type definition for the return value of the `useBrand` composable, ensuring type safety for consumers by providing an explicit signature. |
| [UseClientAddress](type-aliases/UseClientAddress.md) | The return type of the [useClientAddress](functions/useClientAddress.md) composable function. |
| [UseClientAddresses](type-aliases/UseClientAddresses.md) | The return type of the [useClientAddresses](functions/useClientAddresses.md) composable function. |
| [UseClientCompanies](type-aliases/UseClientCompanies.md) | The return type of the [useClientCompanies](functions/useClientCompanies.md) composable function. |
| [UseClientCompany](type-aliases/UseClientCompany.md) | The return type of the [useClientCompany](functions/useClientCompany.md) composable function. |
| [UseClientEmail](type-aliases/UseClientEmail.md) | The return type of the [useClientEmail](functions/useClientEmail.md) composable function. |
| [UseClientEmails](type-aliases/UseClientEmails.md) | The return type of the [useClientEmails](functions/useClientEmails.md) composable function. |
| [UseClientPhone](type-aliases/UseClientPhone.md) | The return type of the [useClientPhone](functions/useClientPhone.md) composable function. |
| [UseClientPhones](type-aliases/UseClientPhones.md) | The return type of the [useClientPhones](functions/useClientPhones.md) composable function. |
| [UseDataLayer](type-aliases/UseDataLayer.md) | The return type of [useDataLayer](functions/useDataLayer.md) composable. |
| [UseDomain](type-aliases/UseDomain.md) | The return type of useDomain composable. |
| [UseInvoice](type-aliases/UseInvoice.md) | The return type of the [useInvoice](functions/useInvoice.md) composable. |
| [UseLocale](type-aliases/UseLocale.md) | The return type of [useLocale](functions/useLocale.md) composable. |
| [UsePayment](type-aliases/UsePayment.md) | The return type of [usePayment](functions/usePayment.md) composable. |
| [UsePaymentDetails](type-aliases/UsePaymentDetails.md) | The return type of usePaymentDetail composable. |
| [UsePaymentGateway](type-aliases/UsePaymentGateway.md) | The return type of [usePaymentGateway](functions/usePaymentGateway.md) composable. |
| [UseProductCatalogue](type-aliases/UseProductCatalogue.md) | The return type of the [useProductCatalogue](functions/useProductCatalogue.md) composable function. |
| [UseProductCategories](type-aliases/UseProductCategories.md) | The return type of the [useProductCategories](functions/useProductCategories.md) composable function. |
| [UseProductConfig](type-aliases/UseProductConfig.md) | The return type of the [useProductConfig](functions/useProductConfig.md) composable function. |
| [UseProductConfigMeta](type-aliases/UseProductConfigMeta.md) | Represents the metadata related to a product configuration process. |
| [useRecaptcha](type-aliases/useRecaptcha.md) | The return type of [useRecaptcha](functions/useRecaptcha.md) composable. |
| [UseRecommendations](type-aliases/UseRecommendations.md) | The return type of the [useRecommendations](functions/useRecommendations.md) composable. |
| [UseSession](type-aliases/UseSession.md) | The return type of useSession composable. |
| [UseSystem](type-aliases/UseSystem.md) | The return type of [useSystem](functions/useSystem.md) composable. |
| [UseTermsAndConditions](type-aliases/UseTermsAndConditions.md) | - |
| [UseTracking](type-aliases/UseTracking.md) | The return type of [useTracking](functions/useTracking.md) composable. |
| [UseTransfer](type-aliases/UseTransfer.md) | The return type of [useTransfer](functions/useTransfer.md) composable. |
| [useUpload](type-aliases/useUpload.md) | The return type of [useUpload](functions/useUpload.md) composable. |

## Variables

| Variable | Description |
| ------ | ------ |
| [ADDRESS\_TYPE\_KEYS](variables/ADDRESS_TYPE_KEYS.md) | A constant object mapping human-readable names to their corresponding numeric keys from the [AddressTypes](variables/AddressTypes.md) array. This provides a type-safe way to reference address types in code. |
| [AddressTypes](variables/AddressTypes.md) | An array of predefined address types, used for categorising different kinds of addresses. Each object contains a numeric `key` and a human-readable `value`. |
| [default](variables/default.md) | - |
| [EmailTypes](variables/EmailTypes.md) | An array of predefined email types, used for categorising different kinds of email addresses. |
| [localStoragePersister](variables/localStoragePersister.md) | A persister object used to synchronize query cache data with the browser's localStorage. |
| [PAGINATION](variables/PAGINATION.md) | Default pagination values for API requests. These values can be used to standardise pagination across different requests. |

## Functions

| Function | Description |
| ------ | ------ |
| [canRetryAuthorization](functions/canRetryAuthorization.md) | Determines if an authorisation retry is permissible based on the URL, error details, and attempt count. This function is primarily used for handling authentication-related errors, such as expired tokens or unauthorised access. |
| [cleanQueryKey](functions/cleanQueryKey.md) | Cleans a query key by removing empty values, objects, and arrays. This is useful for preventing unnecessary data from being included in query keys, which can help in cache management and improve the accuracy of query matching. |
| [handleError](functions/handleError.md) | Handles errors from a query response by displaying a user-friendly feedback message and then throwing a `DetailedError` for programmatic handling. |
| [invalidateQueryByKey](functions/invalidateQueryByKey.md) | Invalidate a query by its key. Perfect for invalidating a query after a mutation on a thenable |
| [parseBillingCycle](functions/parseBillingCycle.md) | Maps a billing cycle duration in months to various descriptive formats. |
| [parseData](functions/parseData.md) | Parse the data to be sent in the request body (e.g. JSON.stringify) |
| [storePersister](functions/storePersister.md) | Creates a persister for the given store that synchronises its state with localStorage This persister will handle the serialisation and deserialization of the store state and will also update the store state with the data from localStorage when it is retrieved. This is useful for persisting the store state across browser sessions. |
| [useBasket](functions/useBasket.md) | Provides a comprehensive interface for managing the shopping basket state using XState. It offers reactive access to basket data, meta-information about its status, and methods for manipulating the basket (e.g. adding/removing items, applying promotions, refreshing, and proceeding to checkout). |
| [useBasketBilling](functions/useBasketBilling.md) | Manages the basket billing process, actor, and associated state, meta information, context, and other interactions related to billing in the application's basket system. |
| [useBasketCurrency](functions/useBasketCurrency.md) | Interacts with the basket currency context and actor. Provides state, context, and methods for managing basket currency data. The functionality includes checking readiness, fetching meta-information, accessing context and models, and performing actions like updating or clearing currency data. |
| [useBasketFields](functions/useBasketFields.md) | Manages the basket fields, state, and interactions. Provides reactive state, context, and methods to manage basket fields. Uses internal actors to manage complex state interactions, including field validation and updates. |
| [useBasketFlows](functions/useBasketFlows.md) | Composable function to manage the basket-related flows. It provides mechanisms to define navigation rules (aka flows), manage their states, and register them with the routing system. Each flow specifies its name, guard logic for conditional transitions, and target routes for navigation. |
| [useBasketPaymentDetails](functions/useBasketPaymentDetails.md) | Retrieves the payment details related to the basket by using the actor model. |
| [useBasketPaymentGateway](functions/useBasketPaymentGateway.md) | Determines and initialises the payment gateway to be used for basket transactions. |
| [useBasketProduct](functions/useBasketProduct.md) | Provides utility functions and state management for interacting with a specific product in the shopping basket. |
| [useBasketProductPending](functions/useBasketProductPending.md) | Composable for managing the state of a product that is pending addition to the basket. This composable is designed to handle the configuration, validation, and eventual addition of a product to the shopping basket. It leverages an internal XState machine to manage the product's lifecycle. |
| [useBasketProducts](functions/useBasketProducts.md) | Provides a composable interface for managing products within the shopping basket. It leverages the [useBasket](functions/useBasket.md) composable for core basket state and actions, and exposes methods for interacting with individual basket products, such as retrieving, removing, updating quantity, and resolving product configurations. |
| [useBasketProductsPending](functions/useBasketProductsPending.md) | Provides functionalities to manage products that are being configured and are pending addition to the basket. This composable handles the lifecycle of pending products, including their addition, resolution, and integration with the main basket state. |
| [useBasketPromotions](functions/useBasketPromotions.md) | Manages basket promotions, providing state, context, and methods to manipulate promotions within a shopping basket. |
| [useBrand](functions/useBrand.md) | Composable function to access and manage brand-related data and configurations. It fetches modules, brand configurations, brand settings, and organisation configurations to provide a unified interface for brand-related information. |
| [useCheckoutFlows](functions/useCheckoutFlows.md) | Composable function to manage the checkout-related flows. It provides mechanisms to define navigation rules, manage their states, and register them with the routing system. Each flow specifies its name, guard logic for conditional transitions, and target routes for navigation. |
| [useClientAddress](functions/useClientAddress.md) | Provides functionalities to manage a client's address, leveraging an XState machine. This composable handles address data, validation, saving, and interaction states. It's designed for use in contexts like client profile management or checkout address selection. |
| [useClientAddresses](functions/useClientAddresses.md) | Composable function for managing client addresses. It handles fetching, displaying, filtering, and performing actions on client addresses, leveraging an underlying service and TanStack Query for data management. |
| [useClientCompanies](functions/useClientCompanies.md) | Composable function to manage client companies. Provides methods for fetching, filtering, updating, and interacting with a list of client companies. Uses the `service` to interact with backend data and integrates with the application's session and query management. |
| [useClientCompany](functions/useClientCompany.md) | Provides functionalities to manage a client's company, leveraging an XState machine. This composable handles company data, validation, saving, and interaction states. It's designed for use in contexts like client profile management or checkout company selection. |
| [useClientEmail](functions/useClientEmail.md) | Provides functionalities to manage a client's email, leveraging an XState machine. This composable handles email data, validation, saving, and interaction states. It's designed for use in contexts like client profile management or checkout email selection. |
| [useClientEmails](functions/useClientEmails.md) | Composable function for managing client emails. It handles fetching, displaying, filtering, and performing actions on client emails, leveraging an underlying service and TanStack Query for data management. |
| [useClientPhone](functions/useClientPhone.md) | Provides functionalities to manage a client's phone, leveraging an XState machine. This composable handles phone data, validation, saving, and interaction states. It's designed for use in contexts like client profile management or checkout phone selection. |
| [useClientPhones](functions/useClientPhones.md) | Composable function for managing client phones. It handles fetching, displaying, filtering, and performing actions on client phones, leveraging an underlying service and TanStack Query for data management. |
| [useClientSlots](functions/useClientSlots.md) | Composable function to provide reactive state and methods to manage and interact with client area templates (slots). This includes state management for query meta-information, error handling, data retrieval, and operational methods such as fetching and invalidating data. |
| [useClientTemplate](functions/useClientTemplate.md) | Composable function to manage the query, the state, and the context for client area templates. Allows fetching, monitoring, and refreshing the data for client area templates. |
| [useDataLayer](functions/useDataLayer.md) | Composable for managing the data layer for tracking and analytics. |
| [useDomain](functions/useDomain.md) | Composable for managing domain selection and search logic using XState and Vue. Provides state, context, and helpers for domain-related flows (DAC, existing, basket). |
| [useFeedback](functions/useFeedback.md) | Composable function to manage feedback messages using an XState state machine. Provides methods for adding, dismissing, and displaying different types of messages such as errors, successes, warnings, and system notifications. This uses a global instance of the feedback machine. |
| [useI18n](functions/useI18n.md) | Composable function to provide functionality for initialising and managing internationalisation (i18n) in an application. The `useI18n` variable offers methods to configure the i18n instance, load locale messages, and set the active locale. |
| [useInvoice](functions/useInvoice.md) | Composable function to manage the state and data for a single invoice. Provides methods to load, access, and invalidate invoice data. |
| [useLocale](functions/useLocale.md) | Composable function to provide locale-related utilities and state management for internationalisation (i18n). |
| [useLocalisation](functions/useLocalisation.md) | Composable function to manage and initialise localisation settings in headless with an associated i18n instance and optionally globbed messages. Provides utilities to configure, load locale messages, and manage the application's locale state. |
| [useMessage](functions/useMessage.md) | Extracts the message from an actor item. It is used to simplify the extraction of message properties from the feedback machine. |
| [useOrder](functions/useOrder.md) | Composable function to manage a single order. This is an alias for useInvoice, as orders are considered a type of invoice in this context. Provides access to the same data and methods as `useInvoice`. |
| [useOrderFlows](functions/useOrderFlows.md) | Composable function to provide a mechanism to manage and retrieve order-related navigation flows used within the routing engine of an application. It defines and organises flow rules that enforce navigation guards and targets based on specific conditions, such as order validation and query parameters. |
| [usePayment](functions/usePayment.md) | A composable function that manages payment state, context, and actions using a state machine implementation. Provides tools for orchestrating payment flow, including meta-information, error handling, and event triggers like pay and refresh. |
| [usePaymentDetail](functions/usePaymentDetail.md) | A composable function that provides access to the payment gateway actor. in the PAY context |
| [usePaymentGateway](functions/usePaymentGateway.md) | A composable function that provides access to the payment gateway actor. |
| [usePlaces](functions/usePlaces.md) | Composable function to provide utility methods and state for integrating with the Google Places API. It initialises the Places API, manages its readiness state, and offers features for searching address predictions, retrieving place details, and accessing prediction results. |
| [useProductCatalogue](functions/useProductCatalogue.md) | A composable function that manages the product catalogue. It provides methods to filter, sort, and retrieve products from the catalogue. |
| [useProductCategories](functions/useProductCategories.md) | A composable function that manages and interacts with product categories. Provides reactive state and utilities for handling hierarchical category structures. The primary use case is to interact with category data via query operations. |
| [useProductConfig](functions/useProductConfig.md) | A composable function that provides functionality and state management for product configuration. It integrates various aspects of product customisation, such as quantity, terms, attributes, and options, while managing the underlying state using an actor-based state management system. |
| [useProductFlows](functions/useProductFlows.md) | Composable function to provide functionality to manage and execute product flows used in e-commerce applications. |
| [useProductRecommendations](functions/useProductRecommendations.md) | A composable function that manages the product recommendations for a specific product. It uses the recommendation engine to fetch and manage the recommendations. NB: Only recommendations that originate from the specified product will be available. This is useful for displaying recommendations on the product detail page, or after adding to the basket |
| [useProductsRequiringAction](functions/useProductsRequiringAction.md) | Composable function to provide methods and properties related to products requiring action. |
| [useQuery](functions/useQuery.md) | A composable function that provides utilities for making HTTP requests with advanced functionalities like pagination, sorting, filtering, currency handling, and caching using TanStack Query. It provides methods for sending requests and handling responses in a reactive way. |
| [useQueryParams](functions/useQueryParams.md) | Composable function to manage query parameters from a specified or current route. |
| [useRecaptcha](functions/useRecaptcha.md) | Composable function to provide functionality for managing reCAPTCHA services. It includes methods for initialising, generating tokens, checking readiness, and handling reCAPTCHA state. |
| [useRecommendations](functions/useRecommendations.md) | A composable function that manages recommendations engine functionalities. |
| [useRecommendationsFlows](functions/useRecommendationsFlows.md) | Composable function to provide functionality to manage and register recommendation flows for a routing engine. |
| [useRouteQueryParams](functions/useRouteQueryParams.md) | Parses and retrieves query parameters and route parameters from a given route object. This utility allows for flexible handling of parameters, offering functionality to consume, retrieve, and parse structured data from query and route parameters. |
| [useRouteRequiresAction](functions/useRouteRequiresAction.md) | Provides utilities to determine if any basket products require user action, such as completing pending actions, fixing invalid products, or addressing related items. |
| [useRoutingEngine](functions/useRoutingEngine.md) | Composable function to provide a routing engine to handle route management, navigation, and state control within the application. |
| [useRoutingFlows](functions/useRoutingFlows.md) | Composable function to provide a centralised setup and registration mechanism for routing flows within the application. |
| [useSession](functions/useSession.md) | Composable function to manage session-related logic using Vue. It provides state, context and helpers for session, login and registration processes. |
| [useSessionFlows](functions/useSessionFlows.md) | Composable function to manage session-related flow configurations and provides methods for interaction with the routing engine. |
| [useSystem](functions/useSystem.md) | The `useSystem` composable provides a simple interface to interact with the system API and includes utility methods for fetching data. |
| [useTermsAndConditions](functions/useTermsAndConditions.md) | Composable to get the current terms and conditions. |
| [useTheming](functions/useTheming.md) | Composable for consolidating brand theme information with any provided themes through the upmind initialisation |
| [useTracking](functions/useTracking.md) | Composable function to handle user tracking data. The `useTracking` hook provides mechanisms for initialising, retrieving, and managing tracking data from cookies. This may include generating and storing tracking data based on query parameters and providing methods to retrieve or clear this data. |
| [useTransfer](functions/useTransfer.md) | Composable function to manage session-related logic using Vue. It provides state, context and helpers for session, login and registration processes. |
| [useUpload](functions/useUpload.md) | Composable function to manage file uploads, providing state, context, and methods for handling the upload process. |
