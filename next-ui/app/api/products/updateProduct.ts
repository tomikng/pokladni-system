import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const updateProduct = async (
  productId: string,
  updatedProduct: ApiTypes.Product,
  accessToken: string,
): Promise<void> => {
  try {
    await api.patch(`api/product/${productId}/`, updatedProduct, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};
