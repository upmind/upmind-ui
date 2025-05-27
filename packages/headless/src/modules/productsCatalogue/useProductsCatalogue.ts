// --- internal
import service from "./services";
import { useSession } from "../session";

// --- types
import type { User } from "../session";
import type { LoadProductsParams } from "./types";

export const useProductsCatalogue = () => {
  const { isAuthenticated } = useSession();

  /**
   * Determines whether the user is ready by checking authentication.
   *
   * @return {Promise<User>} A promise that resolves to a User object if authentication is successful.
   */
  async function isReady(): Promise<User> {
    return isAuthenticated();
  }

  /**
   * Retrieves all products by invoking the `loadProducts` method from the service module.
   */
  async function getProducts(params: LoadProductsParams = {}) {
    return service.loadProducts(params);
  }

  return {
    queryOptions: {
      queryFn: getProducts,
      queryKey: service.queryKey,
      staleTime: 0,
    },
    isReady,
    getProducts,
  };
};
