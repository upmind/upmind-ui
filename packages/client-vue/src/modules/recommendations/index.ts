// -----------------------------------------------------------------------------

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmRecommendationsView = import("./Recommendations.vue");

// --- Export Components

// --- Export Types
